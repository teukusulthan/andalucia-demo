// Reservation store. SQLite is the transactional authority; Sheets is a projection.
import { DatabaseSync } from 'node:sqlite';
import { scryptSync, randomBytes } from 'node:crypto';
import { mkdirSync } from 'node:fs';

export const DATA_DIR = process.env.DATA_DIR || new URL('./data/', import.meta.url).pathname;
mkdirSync(DATA_DIR, { recursive: true });
export const db = new DatabaseSync(`${DATA_DIR}/app.db`);
// busy_timeout lets competing processes queue on BEGIN IMMEDIATE instead of failing (AT04)
db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 8000;');

db.exec(`
CREATE TABLE IF NOT EXISTS ships (
  id TEXT PRIMARY KEY, name TEXT, description TEXT, photo TEXT,
  capacity INTEGER, embarkation TEXT, timezone TEXT DEFAULT 'Asia/Makassar',
  turnaround_days INTEGER DEFAULT 1, status TEXT DEFAULT 'active');

CREATE TABLE IF NOT EXISTS cabins (
  id TEXT PRIMARY KEY, ship_id TEXT REFERENCES ships(id), name TEXT,
  category TEXT, beds INTEGER, max_guests INTEGER, facilities TEXT);

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY, mode TEXT, title TEXT, summary TEXT, itinerary TEXT,
  inclusions TEXT, exclusions TEXT, min_nights INTEGER, terms_version INTEGER DEFAULT 1,
  status TEXT DEFAULT 'published');

CREATE TABLE IF NOT EXISTS product_ships (product_id TEXT, ship_id TEXT, PRIMARY KEY (product_id, ship_id));

CREATE TABLE IF NOT EXISTS departures (
  id TEXT PRIMARY KEY, product_id TEXT, ship_id TEXT,
  start_date TEXT, end_date TEXT, cutoff_at TEXT,
  min_pax INTEGER DEFAULT 0, guaranteed INTEGER DEFAULT 0, status TEXT DEFAULT 'published');

-- one pool per cabin: berth sales and whole-cabin sales draw down the same counter (OT02/AT05)
CREATE TABLE IF NOT EXISTS departure_cabins (
  id TEXT PRIMARY KEY, departure_id TEXT, cabin_id TEXT,
  berths INTEGER, allow_berth INTEGER DEFAULT 1, allow_whole INTEGER DEFAULT 1);

-- shared conflict calendar for every channel (PC01/AT03)
CREATE TABLE IF NOT EXISTS schedule_events (
  id TEXT PRIMARY KEY, ship_id TEXT, kind TEXT, start_date TEXT, end_date TEXT,
  ref_id TEXT, source TEXT, revision INTEGER DEFAULT 1,
  status TEXT DEFAULT 'accepted', note TEXT, updated_at TEXT);

CREATE TABLE IF NOT EXISTS rates (
  id TEXT PRIMARY KEY, rate_class TEXT, product_id TEXT, ship_id TEXT,
  departure_id TEXT, nights INTEGER, cabin_category TEXT, sale_mode TEXT,
  amount_idr INTEGER, valid_from TEXT, valid_to TEXT);

CREATE TABLE IF NOT EXISTS agent_orgs (id TEXT PRIMARY KEY, name TEXT, status TEXT DEFAULT 'approved');

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY, email TEXT UNIQUE, pw TEXT, role TEXT, agent_org_id TEXT, name TEXT);

CREATE TABLE IF NOT EXISTS bookings (
  id TEXT PRIMARY KEY, ref TEXT UNIQUE, token TEXT, service_type TEXT,
  product_id TEXT, ship_id TEXT, departure_id TEXT,
  start_date TEXT, end_date TEXT, guests INTEGER,
  contact_name TEXT, contact_email TEXT, rate_class TEXT, agent_org_id TEXT,
  status TEXT, payment_status TEXT DEFAULT 'unpaid', sync_status TEXT DEFAULT 'pending',
  hold_expires_at TEXT, quote_json TEXT, total_idr INTEGER, due_now_idr INTEGER,
  paid_idr INTEGER DEFAULT 0, version INTEGER DEFAULT 1, created_at TEXT, conditional INTEGER DEFAULT 0);

CREATE TABLE IF NOT EXISTS allocations (
  id TEXT PRIMARY KEY, booking_id TEXT, kind TEXT, ship_id TEXT,
  start_date TEXT, end_date TEXT, departure_cabin_id TEXT, units INTEGER,
  active INTEGER DEFAULT 1);

CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY, booking_id TEXT, order_id TEXT UNIQUE, kind TEXT,
  amount_idr INTEGER, status TEXT, fraud_status TEXT, channel TEXT,
  created_at TEXT, settled_at TEXT);

CREATE TABLE IF NOT EXISTS payment_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT, order_id TEXT, status TEXT,
  signature TEXT, body TEXT, received_at TEXT, applied INTEGER DEFAULT 0);

CREATE TABLE IF NOT EXISTS refunds (
  id TEXT PRIMARY KEY, booking_id TEXT, amount_idr INTEGER, reason TEXT,
  method TEXT, status TEXT, reference TEXT, created_at TEXT);

CREATE TABLE IF NOT EXISTS outbox (
  id INTEGER PRIMARY KEY AUTOINCREMENT, booking_id TEXT, version INTEGER,
  payload TEXT, status TEXT DEFAULT 'pending', attempts INTEGER DEFAULT 0,
  last_error TEXT, created_at TEXT, next_at TEXT);

CREATE TABLE IF NOT EXISTS audit (
  id INTEGER PRIMARY KEY AUTOINCREMENT, at TEXT, actor TEXT, action TEXT, entity TEXT, detail TEXT);

CREATE TABLE IF NOT EXISTS settings (k TEXT PRIMARY KEY, v TEXT);

-- visitor <-> staff support chat
CREATE TABLE IF NOT EXISTS conversations (
  id TEXT PRIMARY KEY, token TEXT UNIQUE, name TEXT, email TEXT, user_id TEXT, booking_ref TEXT,
  subject TEXT, status TEXT DEFAULT 'open', assigned_to TEXT,
  created_at TEXT, updated_at TEXT, staff_read_at TEXT, visitor_read_at TEXT);
CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT, conversation_id TEXT, sender TEXT, author TEXT,
  body TEXT, created_at TEXT);
CREATE INDEX IF NOT EXISTS messages_conv ON messages(conversation_id, id);

-- membership: newsletter subscribers, and the news the gate protects
CREATE TABLE IF NOT EXISTS newsletter (
  id TEXT PRIMARY KEY, name TEXT, email TEXT, interest TEXT, source TEXT, created_at TEXT);
CREATE INDEX IF NOT EXISTS newsletter_email ON newsletter(email);

CREATE TABLE IF NOT EXISTS articles (
  id TEXT PRIMARY KEY, slug TEXT UNIQUE, title TEXT, excerpt TEXT, body TEXT,
  published_at TEXT, members_only INTEGER DEFAULT 1);

CREATE TABLE IF NOT EXISTS passengers (
  id TEXT PRIMARY KEY, booking_id TEXT, full_name TEXT, nationality TEXT, birth_year INTEGER,
  dietary TEXT, emergency_contact TEXT, created_at TEXT);
`);

// additive migrations for databases created before these columns existed
for (const [t, c, ddl] of [
  ['users', 'active', 'INTEGER DEFAULT 1'],
  ['bookings', 'source', "TEXT DEFAULT 'web'"],
  ['cabins', 'active', 'INTEGER DEFAULT 1'],
  ['products', 'destination', "TEXT DEFAULT 'Komodo'"],
  // members are ordinary users with role='member'; these three columns are theirs alone
  ['users', 'phone', 'TEXT'],
  ['users', 'preferred_name', 'TEXT'],
  ['users', 'interest', 'TEXT'],
]) if (!db.prepare(`PRAGMA table_info(${t})`).all().some((r) => r.name === c)) db.exec(`ALTER TABLE ${t} ADD COLUMN ${c} ${ddl}`);

export const setting = (k, d = null) => db.prepare('SELECT v FROM settings WHERE k=?').get(k)?.v ?? d;
export const setSetting = (k, v) => db.prepare('INSERT INTO settings(k,v) VALUES(?,?) ON CONFLICT(k) DO UPDATE SET v=excluded.v').run(k, String(v));
export const audit = (actor, action, entity, detail = '') =>
  db.prepare('INSERT INTO audit(at,actor,action,entity,detail) VALUES(?,?,?,?,?)')
    .run(new Date().toISOString(), actor, action, entity, typeof detail === 'string' ? detail : JSON.stringify(detail));

export const hashPw = (pw, salt = randomBytes(8).toString('hex')) => `${salt}:${scryptSync(pw, salt, 32).toString('hex')}`;
export const checkPw = (pw, stored) => stored && hashPw(pw, stored.split(':')[0]) === stored;

const day = (n) => { const d = new Date('2026-09-10T00:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };

export function seed() {
  if (db.prepare('SELECT count(*) c FROM ships').get().c) return;
  const ins = (t, o) => db.prepare(`INSERT INTO ${t}(${Object.keys(o)}) VALUES(${Object.keys(o).map(() => '?')})`).run(...Object.values(o));

  // swatch colours carry cream text, so each must clear AAA 7:1 against --onDeep (checked in test.js)
  const ships = [
    { id: 'SHIP-ALILA', name: 'Alila Purnama', capacity: 10, embarkation: 'Labuan Bajo', turnaround_days: 1,
      description: 'Traditional two-masted phinisi, teak decks, five suites.', photo: '#143F45' },
    { id: 'SHIP-ANDAL', name: 'Andalusia', capacity: 12, embarkation: 'Labuan Bajo', turnaround_days: 1,
      description: 'Flagship phinisi with sundeck jacuzzi and diving platform.', photo: '#5A3A0E' },
    { id: 'SHIP-SAMARA', name: 'Samara Nusa', capacity: 16, embarkation: 'Benoa', turnaround_days: 0,
      description: 'Open-trip workhorse, mixed cabin categories, fast turnaround.', photo: '#22405F' },
  ];
  ships.forEach((s) => ins('ships', s));

  const cabins = [
    ['CAB-A1', 'SHIP-ALILA', 'Master Suite', 'master', 2, 2], ['CAB-A2', 'SHIP-ALILA', 'Ocean Suite', 'deluxe', 2, 2],
    ['CAB-A3', 'SHIP-ALILA', 'Sea View', 'deluxe', 2, 3], ['CAB-A4', 'SHIP-ALILA', 'Lower Deck 1', 'standard', 2, 2],
    ['CAB-A5', 'SHIP-ALILA', 'Lower Deck 2', 'standard', 2, 2],
    ['CAB-N1', 'SHIP-ANDAL', 'Owner Suite', 'master', 2, 2], ['CAB-N2', 'SHIP-ANDAL', 'Deluxe Aft', 'deluxe', 2, 2],
    ['CAB-N3', 'SHIP-ANDAL', 'Deluxe Fore', 'deluxe', 2, 2], ['CAB-N4', 'SHIP-ANDAL', 'Twin A', 'standard', 2, 2],
    ['CAB-N5', 'SHIP-ANDAL', 'Twin B', 'standard', 2, 2], ['CAB-N6', 'SHIP-ANDAL', 'Twin C', 'standard', 2, 2],
    ['CAB-S1', 'SHIP-SAMARA', 'Master', 'master', 2, 2], ['CAB-S2', 'SHIP-SAMARA', 'Deluxe 1', 'deluxe', 2, 2],
    ['CAB-S3', 'SHIP-SAMARA', 'Deluxe 2', 'deluxe', 2, 2], ['CAB-S4', 'SHIP-SAMARA', 'Shared Bunk A', 'sharing', 4, 4],
    ['CAB-S5', 'SHIP-SAMARA', 'Shared Bunk B', 'sharing', 4, 4],
  ];
  cabins.forEach(([id, ship_id, name, category, beds, max_guests]) =>
    ins('cabins', { id, ship_id, name, category, beds, max_guests, facilities: 'AC, ensuite, storage' }));

  ins('products', { id: 'PROD-PRIV', mode: 'private', title: 'Private Phinisi Charter — Komodo',
    summary: 'Exclusive use of one phinisi for your group. Minimum 3 days / 2 nights.',
    itinerary: 'Labuan Bajo → Kelor → Padar → Pink Beach → Komodo → Manta Point → Labuan Bajo',
    inclusions: 'Cabins, full board, crew, guide, snorkelling gear, park entry coordination',
    exclusions: 'Flights, park & ranger fees, diving, alcohol, gratuities', min_nights: 2 });
  ins('products', { id: 'PROD-OPEN', mode: 'open', title: 'Komodo Open Trip — shared departure',
    summary: 'Join a scheduled departure. Book a berth in a shared cabin or take a whole cabin.',
    itinerary: 'Labuan Bajo → Padar → Pink Beach → Komodo → Kanawa → Labuan Bajo',
    inclusions: 'Berth, full board, crew, guide, snorkelling gear',
    exclusions: 'Flights, park & ranger fees, alcohol, gratuities', min_nights: 2 });

  [['PROD-PRIV', 'SHIP-ALILA'], ['PROD-PRIV', 'SHIP-ANDAL'], ['PROD-PRIV', 'SHIP-SAMARA'],
   ['PROD-OPEN', 'SHIP-SAMARA'], ['PROD-OPEN', 'SHIP-ANDAL']]
    .forEach(([product_id, ship_id]) => ins('product_ships', { product_id, ship_id }));

  const deps = [
    ['DEP-1001', 'SHIP-SAMARA', 12, 14, 8, 1], ['DEP-1002', 'SHIP-SAMARA', 20, 22, 8, 0],
    ['DEP-1003', 'SHIP-ANDAL', 16, 19, 6, 0],
  ];
  deps.forEach(([id, ship_id, s, e, min_pax, guaranteed]) => {
    ins('departures', { id, product_id: 'PROD-OPEN', ship_id, start_date: day(s), end_date: day(e),
      cutoff_at: day(s - 2) + 'T12:00:00Z', min_pax, guaranteed, status: 'published' });
    // publishing a departure claims the whole ship interval (OT05)
    ins('schedule_events', { id: 'SE-' + id, ship_id, kind: 'open_departure', start_date: day(s), end_date: day(e),
      ref_id: id, source: 'app', status: 'accepted', note: 'published departure', updated_at: new Date().toISOString() });
    db.prepare('SELECT id,beds,category FROM cabins WHERE ship_id=?').all(ship_id).forEach((c) =>
      ins('departure_cabins', { id: `DC-${id}-${c.id}`, departure_id: id, cabin_id: c.id,
        berths: c.beds, allow_berth: c.category === 'sharing' ? 1 : 1, allow_whole: 1 }));
  });

  // externally-sourced calendar blocks that arrive via the Sheets input tab
  ins('schedule_events', { id: 'SE-MAINT-1', ship_id: 'SHIP-ALILA', kind: 'maintenance', start_date: day(25),
    end_date: day(29), source: 'sheet', status: 'accepted', note: 'annual slipway', updated_at: new Date().toISOString() });

  const rate = (o) => ins('rates', { valid_from: '2026-01-01', valid_to: '2027-12-31', ...o });
  // private: whole-ship package by nights
  const priv = { 'SHIP-ALILA': [95e6, 132e6, 168e6], 'SHIP-ANDAL': [78e6, 108e6, 138e6], 'SHIP-SAMARA': [55e6, 76e6, 96e6] };
  for (const [ship_id, amts] of Object.entries(priv))
    amts.forEach((a, i) => {
      rate({ id: `R-P-${ship_id}-${i + 2}`, rate_class: 'retail', product_id: 'PROD-PRIV', ship_id, nights: i + 2, amount_idr: a });
      rate({ id: `R-A-${ship_id}-${i + 2}`, rate_class: 'agent', product_id: 'PROD-PRIV', ship_id, nights: i + 2, amount_idr: Math.round(a * 0.88) });
    });
  // open trip: per cabin category, per sale mode
  const open = { master: [9.5e6, 17e6], deluxe: [7.5e6, 13.5e6], standard: [6e6, 11e6], sharing: [4.2e6, 15e6] };
  for (const [cat, [berth, whole]] of Object.entries(open)) {
    rate({ id: `R-OB-${cat}`, rate_class: 'retail', product_id: 'PROD-OPEN', cabin_category: cat, sale_mode: 'berth', amount_idr: berth });
    rate({ id: `R-OW-${cat}`, rate_class: 'retail', product_id: 'PROD-OPEN', cabin_category: cat, sale_mode: 'whole', amount_idr: whole });
    rate({ id: `R-AB-${cat}`, rate_class: 'agent', product_id: 'PROD-OPEN', cabin_category: cat, sale_mode: 'berth', amount_idr: Math.round(berth * 0.85) });
    rate({ id: `R-AW-${cat}`, rate_class: 'agent', product_id: 'PROD-OPEN', cabin_category: cat, sale_mode: 'whole', amount_idr: Math.round(whole * 0.85) });
  }
  // departure-specific rate wins over the seasonal/base rate (PR03)
  rate({ id: 'R-OB-DEP1001-sharing', rate_class: 'retail', product_id: 'PROD-OPEN', departure_id: 'DEP-1001',
    cabin_category: 'sharing', sale_mode: 'berth', amount_idr: 3.6e6 });

  ins('agent_orgs', { id: 'ORG-BALI', name: 'Bali Sea Travel', status: 'approved' });
  ins('agent_orgs', { id: 'ORG-JKT', name: 'Jakarta Voyages', status: 'suspended' });
  [['U-ADM', 'admin@andalusia.test', 'admin', 'admin', null, 'Admin'],
   ['U-OPS', 'ops@andalusia.test', 'ops', 'ops', null, 'Operations'],
   ['U-FIN', 'finance@andalusia.test', 'finance', 'finance', null, 'Finance'],
   ['U-AG1', 'agent@balisea.test', 'agent', 'agent', 'ORG-BALI', 'Bali Sea Travel'],
   ['U-AG2', 'agent@jktvoyages.test', 'agent', 'agent', 'ORG-JKT', 'Jakarta Voyages (suspended)']]
    .forEach(([id, email, pw, role, agent_org_id, name]) => ins('users', { id, email, pw: hashPw(pw), role, agent_org_id, name }));

  // Island Dispatch — the news the membership gate protects (D11: English only for now)
  [['AR-1', 'manta-season-2026', 'Manta season is running early this year',
    'Our guides have logged reliable aggregations at Manta Point three weeks ahead of the usual window.'],
   ['AR-2', 'andalucia-iii-keel', 'Andalucía III: the keel is laid',
    'The third vessel in the line has entered construction in South Sulawesi. First photographs from the yard.'],
   ['AR-3', 'padar-trail-repairs', 'Padar’s summit trail has been resurfaced',
    'The park authority has rebuilt the upper steps. The sunrise hike is easier underfoot than it was last season.'],
   ['AR-4', 'new-galley-menu', 'A new galley menu for the dry season',
    'Chef Nadhy has rebuilt the three-day menu around what the Labuan Bajo market actually lands each morning.']]
    .forEach(([id, slug, title, excerpt], i) => ins('articles', { id, slug, title, excerpt,
      body: excerpt + ' Full dispatch available to members.',
      published_at: day(-7 * i), members_only: 1 }));

  setSetting('deposit_percent', 30);
  setSetting('hold_minutes', 15);
  setSetting('balance_days_before', 30);
  setSetting('stop_sales', '0');
  setSetting('stale_seconds', 120);
  setSetting('last_sync_at', new Date().toISOString());
  audit('system', 'seed', 'db', 'initial dataset');
}

export function resetAll() {
  for (const t of ['messages', 'conversations', 'passengers', 'newsletter', 'articles', 'audit', 'outbox', 'refunds', 'payment_events', 'payments', 'allocations', 'bookings',
    'settings', 'users', 'agent_orgs', 'rates', 'departure_cabins', 'schedule_events', 'departures',
    'product_ships', 'products', 'cabins', 'ships']) db.exec(`DELETE FROM ${t}`);
  seed();
}

/**
 * Seed only when the catalogue is empty.
 *
 * A fresh deployment gets an empty volume: the tables are created on import but hold nothing, so
 * the engine boots with no ships, no products and no accounts to sign in with. `--reset` cannot
 * cover that case because it deletes everything first, which would wipe real bookings on every
 * redeploy. This fills a blank database and leaves a populated one alone.
 */
export function seedIfEmpty() {
  const empty = db.prepare('SELECT count(*) c FROM ships').get().c === 0;
  if (empty) seed();
  return empty;
}

if (process.argv.includes('--reset')) { resetAll(); console.log('seeded'); }
else if (process.argv.includes('--seed-if-empty')) {
  console.log(seedIfEmpty() ? 'seeded an empty database' : 'database already populated, left alone');
}
