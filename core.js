// All reservation, pricing and synchronisation rules. Every channel (web, agent, staff) calls in here.
import { randomUUID } from 'node:crypto';
import { db, setting, setSetting, audit } from './db.js';
import * as sheets from './sheets.js';
import * as gw from './midtrans.js';

export const now = () => new Date().toISOString();
export const nights = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 864e5);
export const addDays = (d, n) => new Date(Date.parse(d) + n * 864e5).toISOString().slice(0, 10);
export const idr = (n) => 'IDR ' + Number(n || 0).toLocaleString('en-US');
const one = (sql, ...a) => db.prepare(sql).get(...a);
const all = (sql, ...a) => db.prepare(sql).all(...a);
const run = (sql, ...a) => db.prepare(sql).run(...a);

/* ---------- holds ---------- */
export function expireHolds() {
  const t = now();
  const dead = all(`SELECT id FROM bookings WHERE status='held' AND hold_expires_at < ?`, t);
  for (const b of dead) {
    run(`UPDATE bookings SET status='expired', sync_status='pending', version=version+1 WHERE id=?`, b.id);
    run(`UPDATE allocations SET active=0 WHERE booking_id=?`, b.id);
    for (const p of all(`SELECT order_id FROM payments WHERE booking_id=? AND status IN ('pending','created')`, b.id)) gw.expireOrder(p.order_id);
    enqueueSync(b.id);
    audit('system', 'hold_expired', b.id);
  }
  return dead.length;
}

/* ---------- shared conflict calendar (PC01/PC04/AT03) ---------- */
export function shipConflicts(shipId, start, end, { ignoreBookingId = null, ignoreEventId = null } = {}) {
  const ship = one(`SELECT * FROM ships WHERE id=?`, shipId);
  const buf = ship?.turnaround_days ?? 1;
  const s = addDays(start, -buf), e = addDays(end, buf);
  const events = all(
    `SELECT id, kind, start_date, end_date, ref_id, note FROM schedule_events
      WHERE ship_id=? AND status='accepted' AND start_date <= ? AND end_date >= ?`, shipId, e, s)
    .filter((x) => x.id !== ignoreEventId);
  const holds = all(
    `SELECT a.id, b.ref, b.status, a.start_date, a.end_date FROM allocations a JOIN bookings b ON b.id=a.booking_id
      WHERE a.kind='ship_interval' AND a.active=1 AND a.ship_id=? AND a.start_date <= ? AND a.end_date >= ? AND b.id != ?`,
    shipId, e, s, ignoreBookingId || '');
  return [...events.map((x) => ({ type: x.kind, from: x.start_date, to: x.end_date, ref: x.ref_id || x.note || x.id })),
          ...holds.map((x) => ({ type: 'booking', from: x.start_date, to: x.end_date, ref: x.ref }))];
}

/* ---------- pricing (PR01/PR03/PR05) ---------- */
export function pickRate({ rate_class, product_id, ship_id = null, departure_id = null, nights: n = null, cabin_category = null, sale_mode = null, travel_date }) {
  const rows = all(`SELECT * FROM rates WHERE rate_class=? AND product_id=? AND valid_from <= ? AND valid_to >= ?`,
    rate_class, product_id, travel_date, travel_date)
    .filter((r) => (r.ship_id ? r.ship_id === ship_id : true))
    .filter((r) => (r.departure_id ? r.departure_id === departure_id : true))
    .filter((r) => (r.nights != null ? r.nights === n : true))
    .filter((r) => (r.cabin_category ? r.cabin_category === cabin_category : true))
    .filter((r) => (r.sale_mode ? r.sale_mode === sale_mode : true));
  if (!rows.length) return null;
  const score = (r) => (r.departure_id ? 8 : 0) + (r.ship_id ? 4 : 0) + (r.nights != null ? 2 : 0) + (r.cabin_category ? 1 : 0);
  const top = Math.max(...rows.map(score));
  const best = rows.filter((r) => score(r) === top);
  if (best.length > 1) throw new Error(`Ambiguous rate match (${best.map((b) => b.id).join(', ')}) — resolve in administration`);
  return best[0];
}

export const rateClassFor = (user) =>
  user?.role === 'agent' && one(`SELECT status FROM agent_orgs WHERE id=?`, user.agent_org_id)?.status === 'approved' ? 'agent' : 'retail';

function depositSplit(total, travelStart) {
  const pct = Number(setting('deposit_percent', 30));
  const cut = Number(setting('balance_days_before', 30));
  const daysOut = Math.round((Date.parse(travelStart) - Date.now()) / 864e5);
  if (pct <= 0 || pct >= 100 || daysOut <= cut) return { due_now: total, balance: 0, balance_due_date: null, reason: daysOut <= cut ? 'inside balance deadline — full payment required' : 'full payment' };
  const due = Math.round((total * pct) / 100 / 1e5) * 1e5; // round to the nearest IDR 100,000
  return { due_now: due, balance: total - due, balance_due_date: addDays(travelStart.slice(0, 10), -cut), reason: `${pct}% deposit` };
}

/* ---------- private charter (U01/PC01-PC04) ---------- */
// U03: any published private product is sellable; its minimum can be longer than 3D2N, never shorter (PC02)
export const privateProducts = () => all(`SELECT * FROM products WHERE mode='private' AND status='published' ORDER BY title`);
const minNights = (p) => Math.max(2, p?.min_nights ?? 2);
function privateProduct(id) {
  const p = one(`SELECT * FROM products WHERE id=? AND mode='private'`, id ?? privateProducts()[0]?.id);
  if (!p || p.status !== 'published') throw new Error('This private charter is not on sale');
  return p;
}

export function searchPrivate({ product_id, start_date, nights: n, guests, user }) {
  const errors = [];
  let product;
  try { product = privateProduct(product_id); } catch (e) { return { errors: [e.message], results: [] }; }
  const min = minNights(product);
  if (!start_date) errors.push('Departure date is required.');
  if (!(n >= min)) errors.push(`Private charter requires a minimum of ${min + 1} days and ${min} nights.`); // PC02/AT02
  if (!(guests >= 1)) errors.push('Party size is required.');
  if (errors.length) return { errors, results: [] };
  const end_date = addDays(start_date, n);
  const rc = rateClassFor(user);
  const results = [];
  for (const ship of all(`SELECT s.* FROM ships s JOIN product_ships ps ON ps.ship_id=s.id
                           WHERE ps.product_id=? AND s.status='active' ORDER BY s.name`, product.id)) {
    const conflicts = shipConflicts(ship.id, start_date, end_date);
    let rate = null, err = null;
    try { rate = pickRate({ rate_class: rc, product_id: product.id, ship_id: ship.id, nights: n, travel_date: start_date }); }
    catch (e) { err = e.message; }
    results.push({
      ship, end_date, conflicts, rate, error: err,
      available: conflicts.length === 0 && guests <= ship.capacity && !!rate,
      reason: conflicts.length ? `Ship not free ${start_date} → ${end_date} (${conflicts[0].type})`
        : guests > ship.capacity ? `Maximum ${ship.capacity} guests`
        : !rate ? (rc === 'agent' ? 'No agent rate configured — request a quote' : 'No published rate for this duration') : null,
    });
  }
  return { errors, results, end_date, rate_class: rc, product };
}

export function quotePrivate({ product_id, ship_id, start_date, nights: n, guests, user }) {
  const product = privateProduct(product_id);
  const min = minNights(product);
  if (!(n >= min)) throw new Error(`Private charter requires a minimum of ${min + 1} days and ${min} nights.`);
  const ship = one(`SELECT * FROM ships WHERE id=? AND status='active'`, ship_id);
  if (!ship) throw new Error('Unknown ship');
  if (!one(`SELECT 1 FROM product_ships WHERE product_id=? AND ship_id=?`, product.id, ship_id))
    throw new Error(`${ship.name} is not offered for ${product.title}`); // CAT05
  if (guests > ship.capacity) throw new Error(`${ship.name} carries a maximum of ${ship.capacity} guests`);
  const rc = rateClassFor(user);
  const rate = pickRate({ rate_class: rc, product_id: product.id, ship_id, nights: n, travel_date: start_date });
  if (!rate) throw new Error(rc === 'agent' ? 'No agent rate for this duration — request a quote' : 'No published rate for this duration');
  const end_date = addDays(start_date, n);
  const lines = [{ label: `${ship.name} — whole ship, ${n + 1}D${n}N`, qty: 1, unit: rate.amount_idr, amount: rate.amount_idr, rule: rate.id }];
  return finishQuote({ service_type: 'private', product_id: product.id, ship_id, departure_id: null, start_date, end_date, guests, rate_class: rc, lines });
}

/* ---------- open trip (U02/OT01-OT07) ---------- */
export function departureCabins(departure_id, user) {
  expireHolds();
  const dep = one(`SELECT * FROM departures WHERE id=?`, departure_id);
  if (!dep) return null;
  const rc = rateClassFor(user);
  const rows = all(
    `SELECT dc.*, c.name, c.category, c.max_guests, c.facilities,
      COALESCE((SELECT SUM(units) FROM allocations a WHERE a.departure_cabin_id=dc.id AND a.active=1),0) AS taken
     FROM departure_cabins dc JOIN cabins c ON c.id=dc.cabin_id WHERE dc.departure_id=? ORDER BY c.category, c.name`, departure_id)
    .map((r) => {
      const remaining = r.berths - r.taken;
      const price = (mode) => { try { return pickRate({ rate_class: rc, product_id: dep.product_id, departure_id, cabin_category: r.category, sale_mode: mode, travel_date: dep.start_date }); } catch { return null; } };
      return { ...r, remaining,
        berth_rate: r.allow_berth ? price('berth') : null,
        whole_rate: r.allow_whole && remaining === r.berths ? price('whole') : null };
    });
  const capacity = rows.reduce((s, r) => s + r.berths, 0);
  const sold = rows.reduce((s, r) => s + r.taken, 0);
  return { dep, ship: one(`SELECT * FROM ships WHERE id=?`, dep.ship_id), rows, capacity, sold, rate_class: rc,
    closed: dep.status !== 'published' || Date.parse(dep.cutoff_at) < Date.now() || sold >= capacity };
}

// selections: [{departure_cabin_id, sale_mode, qty}]
export function quoteOpen({ departure_id, selections, guests, user }) {
  const view = departureCabins(departure_id, user);
  if (!view) throw new Error('Unknown departure');
  if (view.closed) throw new Error('This departure is closed for sale');
  const lines = [];
  let units = 0;
  for (const sel of selections) {
    const row = view.rows.find((r) => r.id === sel.departure_cabin_id);
    if (!row) throw new Error('Unknown cabin');
    const qty = Number(sel.qty);
    if (!(qty > 0)) continue;
    if (sel.sale_mode === 'whole') {
      if (!row.whole_rate) throw new Error(`${row.name} is not available as a whole cabin`);
      lines.push({ label: `${row.name} — whole cabin (${row.berths} berths)`, qty: 1, unit: row.whole_rate.amount_idr,
        amount: row.whole_rate.amount_idr, rule: row.whole_rate.id, departure_cabin_id: row.id, units: row.berths, sale_mode: 'whole' });
      units += row.berths;
    } else {
      if (!row.berth_rate) throw new Error(`${row.name} has no berth rate — request a quote`);
      if (qty > row.remaining) throw new Error(`${row.name} has only ${row.remaining} berth(s) left`);
      lines.push({ label: `${row.name} — ${qty} berth(s)`, qty, unit: row.berth_rate.amount_idr,
        amount: row.berth_rate.amount_idr * qty, rule: row.berth_rate.id, departure_cabin_id: row.id, units: qty, sale_mode: 'berth' });
      units += qty;
    }
  }
  if (!lines.length) throw new Error('Select at least one cabin or berth');
  // OT04: a discounted guest still occupies a berth
  if (guests > units) throw new Error(`${guests} guests need at least ${guests} berths; ${units} selected`);
  return finishQuote({ service_type: 'open', product_id: view.dep.product_id, ship_id: view.dep.ship_id,
    departure_id, start_date: view.dep.start_date, end_date: view.dep.end_date, guests, rate_class: view.rate_class, lines,
    conditional: view.dep.guaranteed ? 0 : 1 });
}

function finishQuote(q) {
  const total = q.lines.reduce((s, l) => s + l.amount, 0);
  const split = depositSplit(total, q.start_date);
  return { ...q, total_idr: total, ...split, quoted_at: now(),
    terms_version: one(`SELECT terms_version FROM products WHERE id=?`, q.product_id)?.terms_version ?? 1,
    expires_at: new Date(Date.now() + 20 * 60000).toISOString() };
}

/* ---------- gates before any money moves (SYNC02) ---------- */
export function salesGate(ship_id) {
  if (setting('stop_sales') === '1') return 'Sales are temporarily stopped by operations.';
  const blocked = JSON.parse(setting('blocked_ships', '[]'));
  if (blocked.includes(ship_id)) return 'This ship is on hold while schedule synchronisation recovers.';
  const age = (Date.now() - Date.parse(setting('last_sync_at', '1970-01-01'))) / 1000;
  if (age > Number(setting('stale_seconds', 120))) return `Schedule data is ${Math.round(age)}s old — refreshing, please retry.`;
  return null;
}
const blockShip = (id, on) => {
  const s = new Set(JSON.parse(setting('blocked_ships', '[]')));
  on ? s.add(id) : s.delete(id);
  setSetting('blocked_ships', JSON.stringify([...s]));
};

/* ---------- hold: the only place inventory is committed (AT04/AT05/SYNC03) ---------- */
export function createHold(quote, contact, user, source = 'web') {
  expireHolds();
  const gate = salesGate(quote.ship_id);
  if (gate) throw new Error(gate);
  const id = randomUUID();
  const ref = 'PH' + String(Date.now()).slice(-7) + Math.floor(Math.random() * 90 + 10);
  const holdMin = Number(setting('hold_minutes', 15));
  const expires = new Date(Date.now() + holdMin * 60000).toISOString();

  db.exec('BEGIN IMMEDIATE'); // serialises competing checkouts across processes
  try {
    if (quote.service_type === 'private') {
      const c = shipConflicts(quote.ship_id, quote.start_date, quote.end_date);
      if (c.length) throw new Error(`No longer available: ${c[0].type} ${c[0].from} → ${c[0].to}`);
    } else {
      for (const l of quote.lines.filter((x) => x.departure_cabin_id)) {
        const r = one(`SELECT dc.berths, COALESCE((SELECT SUM(units) FROM allocations a WHERE a.departure_cabin_id=dc.id AND a.active=1),0) taken
                        FROM departure_cabins dc WHERE dc.id=?`, l.departure_cabin_id);
        if (r.berths - r.taken < l.units) throw new Error('No longer available: another guest just took that space');
      }
    }
    run(`INSERT INTO bookings(id,ref,token,service_type,product_id,ship_id,departure_id,start_date,end_date,guests,
          contact_name,contact_email,rate_class,agent_org_id,status,payment_status,sync_status,hold_expires_at,
          quote_json,total_idr,due_now_idr,created_at,conditional,source)
         VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,'held','unpaid','pending',?,?,?,?,?,?,?)`,
      id, ref, randomUUID(), quote.service_type, quote.product_id, quote.ship_id, quote.departure_id,
      quote.start_date, quote.end_date, quote.guests, contact.name, contact.email, quote.rate_class,
      user?.agent_org_id ?? null, expires, JSON.stringify(quote), quote.total_idr, quote.due_now, now(), quote.conditional || 0, source);

    if (quote.service_type === 'private')
      run(`INSERT INTO allocations(id,booking_id,kind,ship_id,start_date,end_date,units) VALUES(?,?,'ship_interval',?,?,?,1)`,
        randomUUID(), id, quote.ship_id, quote.start_date, quote.end_date);
    else for (const l of quote.lines.filter((x) => x.departure_cabin_id))
      run(`INSERT INTO allocations(id,booking_id,kind,ship_id,departure_cabin_id,units) VALUES(?,?,'inventory',?,?,?)`,
        randomUUID(), id, quote.ship_id, l.departure_cabin_id, l.units);
    db.exec('COMMIT');
  } catch (e) { db.exec('ROLLBACK'); throw e; }

  audit(contact.email, 'hold_created', ref, { total: quote.total_idr, due: quote.due_now });
  // SYNC03: the hold must be acknowledged by Sheets before a payment page opens
  enqueueSync(id);
  const res = flushOutbox();
  if (res.failed) {
    releaseHold(id, 'sheets_unacknowledged');
    throw new Error('Could not confirm the schedule write — please retry.');
  }
  return one(`SELECT * FROM bookings WHERE id=?`, id);
}

export function releaseHold(booking_id, reason) {
  run(`UPDATE bookings SET status='expired', version=version+1 WHERE id=? AND status='held'`, booking_id);
  run(`UPDATE allocations SET active=0 WHERE booking_id=?`, booking_id);
  audit('system', 'hold_released', booking_id, reason);
  enqueueSync(booking_id);
  flushOutbox();
}

/* ---------- payments (PAY01-PAY06/AT11-AT13) ---------- */
export function startPayment(booking_id, kind) {
  const b = one(`SELECT * FROM bookings WHERE id=?`, booking_id);
  if (!b) throw new Error('Unknown booking');
  const amount = kind === 'balance' ? b.total_idr - b.paid_idr : b.due_now_idr;
  if (amount <= 0) throw new Error('Nothing due');
  const order_id = `${b.ref}-${kind.toUpperCase()}-${Date.now().toString(36)}`; // unique per attempt (PAY01)
  const minutes = kind === 'balance' ? 60 : Number(setting('hold_minutes', 15));
  const snap = gw.createTransaction({ order_id, amount_idr: amount, expiry_minutes: minutes, customer: b.contact_email });
  run(`INSERT INTO payments(id,booking_id,order_id,kind,amount_idr,status,created_at) VALUES(?,?,?,?,?,'created',?)`,
    randomUUID(), b.id, order_id, kind, amount, now());
  run(`UPDATE bookings SET payment_status=CASE WHEN payment_status='unpaid' THEN 'pending' ELSE payment_status END WHERE id=?`, b.id);
  audit(b.contact_email, 'payment_started', b.ref, { order_id, amount });
  return { ...snap, order_id, amount };
}

// idempotent, signature-checked, tolerant of reordered and replayed events (PAY03)
export function handleNotification(body) {
  run(`INSERT INTO payment_events(order_id,status,signature,body,received_at) VALUES(?,?,?,?,?)`,
    body?.order_id ?? null, body?.transaction_status ?? null, body?.signature_key ?? null, JSON.stringify(body), now());
  if (!gw.verify(body)) { audit('midtrans', 'notification_rejected', body?.order_id ?? '?', 'bad signature'); return { ok: false, error: 'invalid signature' }; }

  const pay = one(`SELECT * FROM payments WHERE order_id=?`, body.order_id);
  if (!pay) return { ok: false, error: 'unknown order' };
  const truth = gw.status(body.order_id); // never trust the event alone (PAY03)
  if (Math.round(Number(body.gross_amount)) !== pay.amount_idr) return { ok: false, error: 'amount mismatch' };
  const st = truth.status;
  if (pay.status === 'settlement') return { ok: true, note: 'already applied' }; // replay
  if (!['settlement', 'capture'].includes(st)) {
    run(`UPDATE payments SET status=?, channel=? WHERE order_id=?`, st, truth.channel ?? null, body.order_id);
    if (['expire', 'deny', 'cancel'].includes(st)) {
      const b = one(`SELECT * FROM bookings WHERE id=?`, pay.booking_id);
      if (b && b.paid_idr === 0) run(`UPDATE bookings SET payment_status='failed' WHERE id=?`, b.id);
    }
    return { ok: true, status: st };
  }
  if (body.fraud_status && body.fraud_status !== 'accept') return { ok: false, error: 'fraud review' };

  db.exec('BEGIN IMMEDIATE');
  try {
    run(`UPDATE payments SET status='settlement', fraud_status=?, channel=?, settled_at=? WHERE order_id=? AND status!='settlement'`,
      body.fraud_status ?? null, truth.channel ?? body.payment_type ?? null, now(), body.order_id);
    const b = one(`SELECT * FROM bookings WHERE id=?`, pay.booking_id);
    const paid = b.paid_idr + pay.amount_idr;
    const full = paid >= b.total_idr;
    if (b.status === 'held' || b.status === 'confirmed') {
      run(`UPDATE bookings SET paid_idr=?, payment_status=?, status='confirmed', hold_expires_at=NULL, version=version+1 WHERE id=?`,
        paid, full ? 'paid_in_full' : 'deposit_paid', b.id);
    } else {
      // PAY05/AT12: money arrived after the hold was released
      const free = inventoryStillFree(b);
      if (free) {
        run(`UPDATE allocations SET active=1 WHERE booking_id=?`, b.id);
        run(`UPDATE bookings SET paid_idr=?, payment_status=?, status='confirmed', hold_expires_at=NULL, version=version+1 WHERE id=?`,
          paid, full ? 'paid_in_full' : 'deposit_paid', b.id);
        audit('system', 'late_payment_reacquired', b.ref);
      } else {
        run(`UPDATE bookings SET paid_idr=?, payment_status=?, status='exception', version=version+1 WHERE id=?`, paid, full ? 'paid_in_full' : 'deposit_paid', b.id);
        audit('system', 'paid_but_unallocated', b.ref, 'inventory gone — finance review');
      }
    }
    db.exec('COMMIT');
  } catch (e) { db.exec('ROLLBACK'); throw e; }
  run(`UPDATE payment_events SET applied=1 WHERE order_id=?`, body.order_id);
  enqueueSync(pay.booking_id);
  flushOutbox();
  return { ok: true, status: 'settlement' };
}

function inventoryStillFree(b) {
  if (b.service_type === 'private') return shipConflicts(b.ship_id, b.start_date, b.end_date, { ignoreBookingId: b.id }).length === 0;
  return all(`SELECT departure_cabin_id, units FROM allocations WHERE booking_id=?`, b.id).every((a) => {
    const r = one(`SELECT dc.berths, COALESCE((SELECT SUM(units) FROM allocations x WHERE x.departure_cabin_id=dc.id AND x.active=1),0) taken
                    FROM departure_cabins dc WHERE dc.id=?`, a.departure_cabin_id);
    return r.berths - r.taken >= a.units;
  });
}

/* ---------- cancellation & refunds (OPS04/OPS05/AT15) ---------- */
// ponytail: fee is passed in rather than derived from a versioned policy table (D08 undecided)
export function cancelBooking(booking_id, actor, reason, fee_idr = 0) {
  const b = one(`SELECT * FROM bookings WHERE id=?`, booking_id);
  if (!b) throw new Error('Unknown booking');
  run(`UPDATE bookings SET status='cancelled', version=version+1 WHERE id=?`, booking_id);
  run(`UPDATE allocations SET active=0 WHERE booking_id=?`, booking_id);
  audit(actor, 'booking_cancelled', b.ref, reason);
  enqueueSync(booking_id);
  flushOutbox();
  const refundable = Math.max(0, b.paid_idr - fee_idr);
  return { booking: one(`SELECT * FROM bookings WHERE id=?`, booking_id), refundable };
}

export function requestRefund(booking_id, amount_idr, reason, actor) {
  const b = one(`SELECT * FROM bookings WHERE id=?`, booking_id);
  const already = all(`SELECT amount_idr FROM refunds WHERE booking_id=? AND status IN ('completed','pending')`, booking_id)
    .reduce((s, r) => s + r.amount_idr, 0);
  if (amount_idr + already > b.paid_idr) throw new Error('Refund exceeds the amount actually paid');
  const id = randomUUID();
  run(`INSERT INTO refunds(id,booking_id,amount_idr,reason,status,created_at) VALUES(?,?,?,?,'pending',?)`, id, booking_id, amount_idr, reason, now());
  audit(actor, 'refund_requested', b.ref, { amount_idr, reason });
  return id;
}

export function executeRefund(refund_id, actor) {
  const r = one(`SELECT * FROM refunds WHERE id=?`, refund_id);
  if (!r || r.status !== 'pending') throw new Error('Refund not pending');
  const pays = all(`SELECT * FROM payments WHERE booking_id=? AND status='settlement' ORDER BY created_at`, r.booking_id);
  let left = r.amount_idr, ref = [], manual = null;
  for (const p of pays) {
    if (left <= 0) break;
    const take = Math.min(left, p.amount_idr);
    const res = gw.refund(p.order_id, take);
    if (res.ok) { ref.push(res.reference); left -= take; } else manual = res.error;
  }
  if (left > 0) { // OPS05: channel cannot refund — hand to finance with the reason recorded
    run(`UPDATE refunds SET status='manual_required', method='manual', reference=? WHERE id=?`, manual ?? 'no settled payment', refund_id);
    audit(actor, 'refund_manual_required', r.booking_id, manual ?? '');
    return { ok: false, error: manual ?? 'manual refund required' };
  }
  run(`UPDATE refunds SET status='completed', method='gateway', reference=? WHERE id=?`, ref.join(','), refund_id);
  const total = all(`SELECT amount_idr FROM refunds WHERE booking_id=? AND status='completed'`, r.booking_id).reduce((s, x) => s + x.amount_idr, 0);
  const b = one(`SELECT * FROM bookings WHERE id=?`, r.booking_id);
  run(`UPDATE bookings SET payment_status=?, version=version+1 WHERE id=?`, total >= b.paid_idr ? 'refunded' : 'partially_refunded', r.booking_id);
  audit(actor, 'refund_completed', b.ref, { amount: r.amount_idr });
  enqueueSync(r.booking_id);
  flushOutbox();
  return { ok: true };
}

/* ---------- Sheets projection out (SYNC04/SYNC05/AT08/AT09) ---------- */
export function enqueueSync(booking_id) {
  const b = one(`SELECT * FROM bookings WHERE id=?`, booking_id);
  if (!b) return;
  const payload = {
    booking_id: b.ref, booking_version: b.version, ship_id: b.ship_id, departure_id: b.departure_id,
    service_type: b.service_type, interval: `${b.start_date}..${b.end_date}`,
    allocations: all(`SELECT departure_cabin_id, units, active FROM allocations WHERE booking_id=?`, b.id)
      .filter((a) => a.active).map((a) => `${a.departure_cabin_id ?? 'whole-ship'}:${a.units}`).join(' '),
    guests: b.guests, booking_status: b.status, hold_expires_at: b.hold_expires_at,
    payment_summary: `${b.payment_status} ${b.paid_idr}/${b.total_idr}`, synced_at: now(),
  };
  run(`INSERT INTO outbox(booking_id,version,payload,created_at,next_at) VALUES(?,?,?,?,?)`, b.id, b.version, JSON.stringify(payload), now(), now());
  run(`UPDATE bookings SET sync_status='pending' WHERE id=?`, b.id);
}

export function flushOutbox() {
  let sent = 0, failed = 0;
  for (const ev of all(`SELECT * FROM outbox WHERE status='pending' AND next_at <= ? ORDER BY id`, now())) {
    const payload = JSON.parse(ev.payload);
    try {
      const res = sheets.upsertBookingProjection(payload);
      run(`UPDATE outbox SET status='done' WHERE id=?`, ev.id);
      run(`UPDATE bookings SET sync_status='synchronized' WHERE id=? AND version<=?`, ev.booking_id, ev.version);
      sheets.writeSyncResult({ input_id: payload.booking_id, accepted_revision: ev.version, result: res });
      blockShip(one(`SELECT ship_id FROM bookings WHERE id=?`, ev.booking_id)?.ship_id, false);
      sent++;
    } catch (e) {
      const attempts = ev.attempts + 1;
      const backoff = Math.min(60, 2 ** attempts) * 1000 + Math.random() * 500; // capped exponential + jitter
      run(`UPDATE outbox SET attempts=?, last_error=?, next_at=?, status=? WHERE id=?`,
        attempts, e.message, new Date(Date.now() + backoff).toISOString(), attempts >= 5 ? 'failed' : 'pending', ev.id);
      const b = one(`SELECT * FROM bookings WHERE id=?`, ev.booking_id);
      run(`UPDATE bookings SET sync_status=? WHERE id=?`, attempts >= 5 ? 'failed' : 'retrying', ev.booking_id);
      // SYNC04: keep the paid reservation, stop new sales on that ship until sync recovers
      if (b && b.status === 'confirmed') blockShip(b.ship_id, true);
      failed++;
    }
  }
  return { sent, failed };
}

/* ---------- Sheets schedule in (SYNC03/SYNC06/SH05/AT10) ---------- */
export function syncSchedule() {
  let rows;
  try { rows = sheets.readScheduleInputs(); }
  catch (e) { audit('system', 'schedule_read_failed', 'sheets', e.message); return { error: e.message }; }
  const out = { accepted: 0, rejected: 0, unchanged: 0, details: [] };
  for (const r of rows) {
    const existing = one(`SELECT * FROM schedule_events WHERE id=?`, r.schedule_id);
    if (existing && (existing.revision ?? 1) >= (r.revision ?? 1) && existing.status === 'accepted') { out.unchanged++; continue; }
    const reject = (why) => {
      run(`INSERT INTO schedule_events(id,ship_id,kind,start_date,end_date,ref_id,source,revision,status,note,updated_at)
           VALUES(?,?,?,?,?,?,'sheet',?, 'quarantined',?,?)
           ON CONFLICT(id) DO UPDATE SET status='quarantined', note=excluded.note, updated_at=excluded.updated_at`,
        r.schedule_id, r.ship_id ?? null, r.event_type ?? 'unknown', r.start_at ?? null, r.end_at ?? null,
        r.external_reference ?? null, r.revision ?? 1, why, now());
      sheets.writeSyncResult({ input_id: r.schedule_id, rejection_reason: why });
      audit('sheet', 'schedule_quarantined', r.schedule_id, why);
      out.rejected++; out.details.push({ id: r.schedule_id, why });
    };
    if (!r.ship_id || !one(`SELECT id FROM ships WHERE id=?`, r.ship_id)) { reject('unknown ship_id'); continue; }
    if (!r.start_at || !r.end_at || r.end_at < r.start_at) { reject('invalid interval'); continue; }
    if (r.status_requested === 'cancelled') {
      run(`UPDATE schedule_events SET status='cancelled', revision=?, updated_at=? WHERE id=?`, r.revision ?? 1, now(), r.schedule_id);
      out.accepted++; continue;
    }
    // SYNC06/AT10: a manual edit never wins over committed inventory by timestamp
    const conflicts = shipConflicts(r.ship_id, r.start_at, r.end_at, { ignoreEventId: r.schedule_id })
      .filter((c) => c.type === 'booking' || c.type === 'open_departure');
    if (conflicts.length) { reject(`conflicts with ${conflicts[0].type} ${conflicts[0].ref} (${conflicts[0].from} → ${conflicts[0].to})`); continue; }
    run(`INSERT INTO schedule_events(id,ship_id,kind,start_date,end_date,ref_id,source,revision,status,note,updated_at)
         VALUES(?,?,?,?,?,?,'sheet',?, 'accepted',?,?)
         ON CONFLICT(id) DO UPDATE SET ship_id=excluded.ship_id, kind=excluded.kind, start_date=excluded.start_date,
           end_date=excluded.end_date, revision=excluded.revision, status='accepted', note=excluded.note, updated_at=excluded.updated_at`,
      r.schedule_id, r.ship_id, r.event_type ?? 'maintenance', r.start_at, r.end_at, r.external_reference ?? null,
      r.revision ?? 1, r.operator_note ?? '', now());
    sheets.writeSyncResult({ input_id: r.schedule_id, accepted_revision: r.revision ?? 1 });
    out.accepted++;
  }
  sheets.writeAvailabilityView(availabilityRows());
  return out;
}

export function availabilityRows() {
  return all(`SELECT d.id departure_id, d.ship_id, d.start_date, d.end_date,
      (SELECT SUM(berths) FROM departure_cabins dc WHERE dc.departure_id=d.id) capacity,
      COALESCE((SELECT SUM(a.units) FROM allocations a JOIN departure_cabins dc ON dc.id=a.departure_cabin_id
                 WHERE dc.departure_id=d.id AND a.active=1),0) sold
     FROM departures d`).map((r) => ({ ...r, remaining: r.capacity - r.sold }));
}

/* ---------- background loop (SYNC02) ---------- */
// ponytail: in-process interval worker; move to a separate worker process when >1 app instance runs
export function startWorkers() {
  const tick = () => { try { expireHolds(); syncSchedule(); flushOutbox(); } catch (e) { console.error('worker', e.message); } };
  tick();
  return setInterval(tick, 60_000).unref?.() ?? null;
}

/* ---------- catalogue management (CAT01-CAT08, OT05, OT07) ---------- */
const ACTIVE_BOOKING = `status IN ('held','confirmed','amendment_pending','cancellation_pending','exception')`;

// CAT07: deactivating never cancels — it reports who is affected so operations can act
export const futureBookingsForShip = (ship_id) =>
  all(`SELECT ref, status, start_date, end_date FROM bookings WHERE ship_id=? AND ${ACTIVE_BOOKING} AND end_date >= date('now') ORDER BY start_date`, ship_id);

export function setShipStatus(ship_id, status, actor) {
  if (!['active', 'inactive', 'archived'].includes(status)) throw new Error('Unknown ship status');
  run(`UPDATE ships SET status=? WHERE id=?`, status, ship_id);
  const affected = status === 'active' ? [] : futureBookingsForShip(ship_id);
  audit(actor, 'ship_status', ship_id, { status, affected: affected.map((b) => b.ref) });
  return affected;
}

export function createDeparture(d, actor) {
  const product = one(`SELECT * FROM products WHERE id=?`, d.product_id);
  if (product?.mode !== 'open') throw new Error('Departures belong to an open-trip product');
  if (!one(`SELECT 1 FROM product_ships WHERE product_id=? AND ship_id=?`, d.product_id, d.ship_id))
    throw new Error('That ship is not eligible for this product');
  if (!d.start_date || !d.end_date || d.end_date <= d.start_date) throw new Error('End date must be after the start date');
  const c = shipConflicts(d.ship_id, d.start_date, d.end_date);
  if (c.length) throw new Error(`Ship is committed: ${c[0].type} ${c[0].from} to ${c[0].to}`); // OT05
  const cabins = all(`SELECT * FROM cabins WHERE ship_id=? AND active=1`, d.ship_id);
  if (!cabins.length) throw new Error('That ship has no active cabins to sell');
  const id = 'DEP-' + Date.now().toString(36).toUpperCase();
  db.exec('BEGIN IMMEDIATE');
  try {
    run(`INSERT INTO departures(id,product_id,ship_id,start_date,end_date,cutoff_at,min_pax,guaranteed,status) VALUES(?,?,?,?,?,?,?,?,?)`,
      id, d.product_id, d.ship_id, d.start_date, d.end_date, d.cutoff_at || addDays(d.start_date, -2) + 'T12:00:00Z',
      Number(d.min_pax || 0), d.guaranteed ? 1 : 0, d.status || 'draft');
    run(`INSERT INTO schedule_events(id,ship_id,kind,start_date,end_date,ref_id,source,status,note,updated_at)
         VALUES(?,?,'open_departure',?,?,?,'app','accepted','created in admin',?)`, 'SE-' + id, d.ship_id, d.start_date, d.end_date, id, now());
    for (const cb of cabins) run(`INSERT INTO departure_cabins(id,departure_id,cabin_id,berths) VALUES(?,?,?,?)`, `DC-${id}-${cb.id}`, id, cb.id, cb.beds);
    db.exec('COMMIT');
  } catch (e) { db.exec('ROLLBACK'); throw e; }
  audit(actor, 'departure_created', id, d);
  return id;
}

export const departureCommitments = (departure_id) =>
  one(`SELECT COALESCE(SUM(a.units),0) u FROM allocations a JOIN departure_cabins dc ON dc.id=a.departure_cabin_id
       WHERE dc.departure_id=? AND a.active=1`, departure_id).u;

export function setDepartureStatus(id, status, actor) {
  if (!['draft', 'published', 'closed', 'cancelled'].includes(status)) throw new Error('Unknown departure status');
  // OPS06: paid guests are never displaced automatically — resolve them first
  if (status === 'cancelled' && departureCommitments(id) > 0)
    throw new Error('Guests are booked on this departure. Close sales and resolve each booking before cancelling.');
  run(`UPDATE departures SET status=? WHERE id=?`, status, id);
  run(`UPDATE schedule_events SET status=? WHERE id=?`, status === 'cancelled' ? 'cancelled' : 'accepted', 'SE-' + id);
  audit(actor, 'departure_status', id, status);
}

// OT07: capacity can never be reduced below what is already sold or held
export function setDepartureCabin(dc_id, { berths, allow_berth, allow_whole }, actor) {
  const r = one(`SELECT dc.*, c.beds, COALESCE((SELECT SUM(units) FROM allocations a WHERE a.departure_cabin_id=dc.id AND a.active=1),0) taken
                 FROM departure_cabins dc JOIN cabins c ON c.id=dc.cabin_id WHERE dc.id=?`, dc_id);
  if (!r) throw new Error('Unknown cabin allocation');
  const b = Number(berths);
  if (!(b >= 0) || b > r.beds) throw new Error(`Berths must be between 0 and ${r.beds}`);
  if (b < r.taken) throw new Error(`${r.taken} berth(s) are already committed; capacity cannot drop below that`);
  run(`UPDATE departure_cabins SET berths=?, allow_berth=?, allow_whole=? WHERE id=?`, b, allow_berth ? 1 : 0, allow_whole ? 1 : 0, dc_id);
  audit(actor, 'departure_cabin', dc_id, { berths: b, allow_berth, allow_whole });
}

// PR03 at save time: refuse a rate that would tie with an existing one, instead of failing at checkout
export function saveRate(r, actor) {
  const f = { id: r.id || 'R-' + Date.now().toString(36).toUpperCase(), rate_class: r.rate_class, product_id: r.product_id,
    ship_id: r.ship_id || null, departure_id: r.departure_id || null, nights: r.nights === '' || r.nights == null ? null : Number(r.nights),
    cabin_category: r.cabin_category || null, sale_mode: r.sale_mode || null, amount_idr: Math.round(Number(r.amount_idr)),
    valid_from: r.valid_from, valid_to: r.valid_to };
  if (!['retail', 'agent'].includes(f.rate_class)) throw new Error('Rate class must be retail or agent');
  if (!one(`SELECT 1 FROM products WHERE id=?`, f.product_id)) throw new Error('Unknown product');
  if (!(f.amount_idr > 0)) throw new Error('Amount must be a positive whole number of rupiah');
  if (!f.valid_from || !f.valid_to || f.valid_to < f.valid_from) throw new Error('Validity end must be on or after its start');
  const same = all(`SELECT id FROM rates WHERE id!=? AND rate_class=? AND product_id=? AND ship_id IS ? AND departure_id IS ?
                    AND nights IS ? AND cabin_category IS ? AND sale_mode IS ? AND valid_from <= ? AND valid_to >= ?`,
    f.id, f.rate_class, f.product_id, f.ship_id, f.departure_id, f.nights, f.cabin_category, f.sale_mode, f.valid_to, f.valid_from);
  if (same.length) throw new Error(`Overlaps rate ${same[0].id} with the same scope — change the dates or edit that rate instead`);
  run(`INSERT INTO rates(id,rate_class,product_id,ship_id,departure_id,nights,cabin_category,sale_mode,amount_idr,valid_from,valid_to)
       VALUES(?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET rate_class=excluded.rate_class, product_id=excluded.product_id,
       ship_id=excluded.ship_id, departure_id=excluded.departure_id, nights=excluded.nights, cabin_category=excluded.cabin_category,
       sale_mode=excluded.sale_mode, amount_idr=excluded.amount_idr, valid_from=excluded.valid_from, valid_to=excluded.valid_to`,
    ...Object.values(f));
  audit(actor, 'rate_saved', f.id, f);
  return f.id;
}

/* ---------- passenger manifest (OPS07) ---------- */
export function addPassenger(booking_id, f, actor) {
  const b = one(`SELECT * FROM bookings WHERE id=?`, booking_id);
  if (!b || ['cancelled', 'expired'].includes(b.status)) throw new Error('This booking can no longer be changed');
  const name = String(f.full_name ?? '').trim();
  if (!name) throw new Error('Enter the traveller’s full name');
  if (one(`SELECT count(*) c FROM passengers WHERE booking_id=?`, booking_id).c >= b.guests)
    throw new Error(`All ${b.guests} travellers on this booking are already recorded`);
  const by = f.birth_year ? Number(f.birth_year) : null;
  if (by !== null && !(Number.isInteger(by) && by >= 1900 && by <= new Date().getUTCFullYear())) throw new Error('Year of birth must be a four-digit year');
  const cut = (v, n) => String(v ?? '').trim().slice(0, n);
  run(`INSERT INTO passengers(id,booking_id,full_name,nationality,birth_year,dietary,emergency_contact,created_at) VALUES(?,?,?,?,?,?,?,?)`,
    randomUUID(), booking_id, cut(name, 120), cut(f.nationality, 60), by, cut(f.dietary, 200), cut(f.emergency_contact, 200), now());
  audit(actor, 'passenger_added', b.ref, name);
}

export function removePassenger(booking_id, id, actor) {
  const p = one(`SELECT * FROM passengers WHERE id=? AND booking_id=?`, id, booking_id);
  if (!p) throw new Error('Traveller not found on this booking');
  run(`DELETE FROM passengers WHERE id=?`, id);
  audit(actor, 'passenger_removed', one(`SELECT ref FROM bookings WHERE id=?`, booking_id)?.ref ?? booking_id, p.full_name);
}
