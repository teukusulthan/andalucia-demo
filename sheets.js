// Composio -> Google Sheets adapter. Deterministic tool calls, no LLM in the booking path (R07/SYNC01).
// The "workbook" is a local JSON file so the prototype runs offline; swap execCall() for
// composio.tools.execute('GOOGLESHEETS_...') with pinned tool versions.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { setting, setSetting, audit, DATA_DIR } from './db.js';

// ponytail: local JSON stands in for the real workbook; replace load/execCall with Composio tool calls
const FILE = `${DATA_DIR}/workbook.json`;
const blank = { ScheduleInputs: [], BookingProjection: [], SyncResults: [], AvailabilityView: [] };

export const load = () => (existsSync(FILE) ? JSON.parse(readFileSync(FILE, 'utf8')) : structuredClone(blank));
const save = (wb) => writeFileSync(FILE, JSON.stringify(wb, null, 2));

class SheetsError extends Error {}

// injected failure modes, driven from the admin page: ok | fail | timeout_after_write
const mode = () => process.env.SHEETS_MODE || setting('sheets_mode', 'ok');

function execCall(tool, fn) {
  const m = mode();
  if (m === 'fail') throw new SheetsError(`${tool}: connection refused (simulated)`);
  const out = fn();
  if (m === 'timeout_after_write' && tool !== 'read') throw new SheetsError(`${tool}: request timed out after apply (simulated)`);
  return out;
}

export function readScheduleInputs() {
  const wb = execCall('read', load);
  setSetting('last_sync_at', new Date().toISOString());
  return wb.ScheduleInputs;
}

// keyed upsert by booking_id; never blind-append after a timeout (SYNC05)
export function upsertBookingProjection(row) {
  return execCall('upsert', () => {
    const wb = load();
    const i = wb.BookingProjection.findIndex((r) => r.booking_id === row.booking_id);
    if (i >= 0) {
      if (wb.BookingProjection[i].booking_version > row.booking_version) return 'stale-ignored';
      wb.BookingProjection[i] = row;
    } else wb.BookingProjection.push(row);
    save(wb);
    return i >= 0 ? 'updated' : 'appended';
  });
}

export function writeSyncResult(row) {
  const wb = load();
  wb.SyncResults.unshift({ ...row, processed_at: new Date().toISOString() });
  wb.SyncResults = wb.SyncResults.slice(0, 200);
  save(wb);
}

export function addScheduleInput(row) {
  const wb = load();
  const i = wb.ScheduleInputs.findIndex((r) => r.schedule_id === row.schedule_id);
  if (i >= 0) wb.ScheduleInputs[i] = { ...wb.ScheduleInputs[i], ...row, revision: (wb.ScheduleInputs[i].revision || 1) + 1 };
  else wb.ScheduleInputs.push({ revision: 1, status_requested: 'requested', ...row });
  save(wb);
  audit('sheet', 'schedule_input', row.schedule_id, row.event_type || '');
}

// derived remaining-units view; humans read it, nobody edits it (SH03)
export function writeAvailabilityView(rows) {
  const wb = load();
  wb.AvailabilityView = rows;
  save(wb);
}

export const reset = () => save(structuredClone(blank));
if (!existsSync(FILE)) reset();
