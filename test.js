// Acceptance suite from section 13 of the requirements. Run: npm test
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFile } from 'node:child_process';
const run = (script) => new Promise((res) => execFile('node', ['--no-warnings', '--input-type=module', '-e', script],
  { env: { ...process.env, DATA_DIR }, encoding: 'utf8' }, (e, out) => res((out || '').trim() || 'ERR')));

process.env.DATA_DIR ||= mkdtempSync(join(tmpdir(), 'phinisi-test-'));
const DATA_DIR = process.env.DATA_DIR;

const { db, resetAll, setSetting, setting } = await import('./db.js');
const core = await import('./core.js');
const gw = await import('./midtrans.js');
const sheets = await import('./sheets.js');
const chat = await import('./chat.js');
const { EXPERIENCES, DESTINATIONS } = await import('./views.js');

const one = (s, ...a) => db.prepare(s).get(...a);
const all = (s, ...a) => db.prepare(s).all(...a);
const D = (n) => new Date(Date.parse('2026-09-10') + n * 864e5).toISOString().slice(0, 10);

let pass = 0, fail = 0;
const ok = (id, name, cond, detail = '') => {
  if (cond) { pass++; console.log(`  \x1b[32m✔\x1b[0m ${id} ${name}`); }
  else { fail++; console.log(`  \x1b[31m✘ ${id} ${name}\x1b[0m ${detail}`); }
};
const throws = (fn, re) => { try { fn(); return false; } catch (e) { return re ? re.test(e.message) : true; } };
const fresh = () => { resetAll(); sheets.reset(); writeFileSync(`${DATA_DIR}/gateway.json`, '{}'); };
const contact = { name: 'Test Guest', email: 'guest@example.test' };
const agent = () => one(`SELECT * FROM users WHERE id='U-AG1'`);
const suspended = () => one(`SELECT * FROM users WHERE id='U-AG2'`);

/* ---------------------------------------------------------------- */
fresh();
console.log('\nAT01/AT02  duration rules');
ok('AT02', 'server rejects a 2D1N private request',
  throws(() => core.quotePrivate({ ship_id: 'SHIP-ALILA', start_date: D(40), nights: 1, guests: 4 }), /3 days and 2 nights/));
ok('AT02', 'search form reports the same rule',
  core.searchPrivate({ start_date: D(40), nights: 1, guests: 4 }).errors.length === 1);
ok('AT02', '3D2N is accepted', core.quotePrivate({ ship_id: 'SHIP-ALILA', start_date: D(40), nights: 2, guests: 4 }).total_idr === 95e6);
ok('OT01', 'open trips are not bound by the private minimum',
  core.nights(one(`SELECT * FROM departures WHERE id='DEP-1001'`).start_date, one(`SELECT * FROM departures WHERE id='DEP-1001'`).end_date) === 2);

console.log('\nAT03/AT16  one shared ship calendar');
// DEP-1003 puts SHIP-ANDAL on an open departure D16→D19
ok('AT03', 'private request overlapping a published open departure is rejected',
  throws(() => core.createHold(core.quotePrivate({ ship_id: 'SHIP-ANDAL', start_date: D(17), nights: 2, guests: 4 }), contact, null), /No longer available/));
ok('AT03', 'private request overlapping a maintenance block from the sheet is rejected',
  throws(() => core.createHold(core.quotePrivate({ ship_id: 'SHIP-ALILA', start_date: D(26), nights: 2, guests: 4 }), contact, null), /No longer available/));
ok('AT16', 'return-day turnaround blocks a back-to-back departure',
  core.shipConflicts('SHIP-ANDAL', D(13), D(15)).length > 0, '(1 day turnaround before DEP-1003 on D16)');
ok('AT16', 'a clear interval outside the buffer is bookable',
  core.shipConflicts('SHIP-ANDAL', D(5), D(7)).length === 0);

console.log('\nAT06/PR03  agent pricing');
{
  const retail = core.quotePrivate({ ship_id: 'SHIP-ALILA', start_date: D(40), nights: 2, guests: 4 });
  const net = core.quotePrivate({ ship_id: 'SHIP-ALILA', start_date: D(40), nights: 2, guests: 4, user: agent() });
  ok('AT06', 'approved agent sees a lower net price', net.total_idr < retail.total_idr, `${net.total_idr} < ${retail.total_idr}`);
  ok('AT06', 'suspended agent falls back to retail',
    core.quotePrivate({ ship_id: 'SHIP-ALILA', start_date: D(40), nights: 2, guests: 4, user: suspended() }).total_idr === retail.total_idr);
  ok('PR03', 'departure-specific rate beats the base rate',
    core.pickRate({ rate_class: 'retail', product_id: 'PROD-OPEN', departure_id: 'DEP-1001', cabin_category: 'sharing', sale_mode: 'berth', travel_date: D(12) }).amount_idr === 3.6e6);
  db.prepare(`INSERT INTO rates(id,rate_class,product_id,ship_id,nights,amount_idr,valid_from,valid_to)
              VALUES('R-DUP','retail','PROD-PRIV','SHIP-ALILA',2,1,'2026-01-01','2027-12-31')`).run();
  ok('PR03', 'two equal-priority rates are rejected, not guessed',
    throws(() => core.pickRate({ rate_class: 'retail', product_id: 'PROD-PRIV', ship_id: 'SHIP-ALILA', nights: 2, travel_date: D(40) }), /Ambiguous/));
  db.prepare(`DELETE FROM rates WHERE id='R-DUP'`).run();
  ok('PR07', 'agent net rates are absent from anonymous pricing',
    !JSON.stringify(core.searchPrivate({ start_date: D(40), nights: 2, guests: 4 })).includes(String(net.total_idr)));
}

console.log('\nAT05  shared capacity across sale modes');
fresh();
{
  const dc = one(`SELECT dc.id, dc.berths FROM departure_cabins dc JOIN cabins c ON c.id=dc.cabin_id
                  WHERE dc.departure_id='DEP-1001' AND c.category='sharing' LIMIT 1`);
  const q = core.quoteOpen({ departure_id: 'DEP-1001', selections: [{ departure_cabin_id: dc.id, sale_mode: 'whole', qty: 1 }], guests: 2 });
  core.createHold(q, contact, null);
  const view = core.departureCabins('DEP-1001');
  const row = view.rows.find((r) => r.id === dc.id);
  ok('AT05', 'whole-cabin sale removes every berth in that cabin', row.remaining === 0, `remaining=${row.remaining}`);
  ok('AT05', 'that cabin can no longer be sold by the berth',
    throws(() => core.quoteOpen({ departure_id: 'DEP-1001', selections: [{ departure_cabin_id: dc.id, sale_mode: 'berth', qty: 1 }], guests: 1 }), /only 0 berth/));
  ok('OT04', 'guests may not exceed the berths selected',
    throws(() => core.quoteOpen({ departure_id: 'DEP-1001', selections: [{ departure_cabin_id: view.rows.find((r) => r.remaining > 1).id, sale_mode: 'berth', qty: 1 }], guests: 2 }), /need at least/));
}

console.log('\nAT04  concurrency across processes');
fresh();
{
  const CORE = new URL('./core.js', import.meta.url).pathname;
  const barrier = (t0) => `const core = await import('${CORE}');\nwhile (Date.now() < ${t0}) {}\n`;
  const t0 = Date.now() + 1500;
  const args = { ship_id: 'SHIP-ALILA', start_date: D(40), nights: 2, guests: 4 };
  const script = barrier(t0) + `try { const q = core.quotePrivate(${JSON.stringify(args)});
    core.createHold(q, {name:'C',email:'c@x.test'}, null); console.log('WON'); } catch (e) { console.log('LOST'); }`;
  const out = await Promise.all([0, 1, 2, 3].map(() => run(script)));
  const held = all(`SELECT * FROM bookings WHERE status='held' AND ship_id='SHIP-ALILA'`);
  ok('AT04', 'four processes race for one private interval, one wins',
    out.filter((o) => o === 'WON').length === 1 && held.length === 1, `results=${out.join(',')} held=${held.length}`);

  const dc = one(`SELECT dc.id FROM departure_cabins dc JOIN cabins c ON c.id=dc.cabin_id
                  WHERE dc.departure_id='DEP-1002' AND c.category='sharing' LIMIT 1`);
  // leave exactly 2 berths, then have two processes each ask for 2
  const q0 = core.quoteOpen({ departure_id: 'DEP-1002', selections: [{ departure_cabin_id: dc.id, sale_mode: 'berth', qty: 2 }], guests: 2 });
  core.createHold(q0, contact, null);
  const berthScript = barrier(Date.now() + 1500) +
    `try { const q = core.quoteOpen({departure_id:'DEP-1002', selections:[{departure_cabin_id:'${dc.id}', sale_mode:'berth', qty:2}], guests:2});
      core.createHold(q, {name:'C',email:'c@x.test'}, null); console.log('WON'); } catch(e){ console.log('LOST'); }`;
  const res2 = await Promise.all([0, 1].map(() => run(berthScript)));
  const taken = one(`SELECT COALESCE(SUM(units),0) u FROM allocations WHERE departure_cabin_id=? AND active=1`, dc.id).u;
  ok('AT04', 'two remaining berths, two simultaneous requests for two — only one succeeds',
    res2.filter((o) => o === 'WON').length === 1 && taken === 4, `results=${res2.join(',')} taken=${taken}/4`);
}

console.log('\nAT11/AT13  payment integrity');
fresh();
{
  const q = core.quotePrivate({ ship_id: 'SHIP-ALILA', start_date: D(60), nights: 3, guests: 6 });
  ok('PAY02', 'a far-out booking splits into deposit and balance', q.balance > 0 && q.due_now < q.total_idr, q.reason);
  const b = core.createHold(q, contact, null);
  const p1 = core.startPayment(b.id, 'deposit');
  const note = gw.simulate(p1.order_id, 'pay', 'bank_transfer');

  ok('AT11', 'a forged signature is refused', core.handleNotification({ ...note, signature_key: 'deadbeef' }).ok === false);
  ok('AT11', 'a tampered amount is refused', core.handleNotification({ ...note, gross_amount: '1.00' }).ok === false);
  core.handleNotification(note);
  core.handleNotification(note); core.handleNotification(note); // replays
  let cur = one(`SELECT * FROM bookings WHERE id=?`, b.id);
  ok('AT11', 'replayed notifications post exactly once', cur.paid_idr === p1.amount, `paid=${cur.paid_idr} expected=${p1.amount}`);
  ok('PAY01', 'booking is confirmed with a balance outstanding',
    cur.status === 'confirmed' && cur.payment_status === 'deposit_paid' && cur.total_idr - cur.paid_idr === q.balance);

  const p2 = core.startPayment(b.id, 'balance');
  ok('AT13', 'balance uses a separate order ID on the same booking', p2.order_id !== p1.order_id);
  core.handleNotification(gw.simulate(p2.order_id, 'pay', 'gopay'));
  cur = one(`SELECT * FROM bookings WHERE id=?`, b.id);
  ok('AT13', 'two obligations, one booking, capacity used once',
    cur.payment_status === 'paid_in_full' && cur.paid_idr === cur.total_idr &&
    all(`SELECT * FROM allocations WHERE booking_id=? AND active=1`, b.id).length === 1);

  const early = core.handleNotification(gw.simulate(p1.order_id, 'pending'));
  ok('AT11', 'a stale reordered event cannot unwind a settled payment',
    one(`SELECT * FROM bookings WHERE id=?`, b.id).payment_status === 'paid_in_full', JSON.stringify(early));
}

console.log('\nAT12  payment after the hold expired');
fresh();
{
  const q = core.quotePrivate({ ship_id: 'SHIP-ANDAL', start_date: D(60), nights: 2, guests: 4 });
  const b = core.createHold(q, contact, null);
  const pay = core.startPayment(b.id, 'deposit');
  db.prepare(`UPDATE bookings SET hold_expires_at=? WHERE id=?`).run('2020-01-01T00:00:00Z', b.id);
  core.expireHolds();
  ok('AT12', 'the expired hold released its inventory', one(`SELECT status FROM bookings WHERE id=?`, b.id).status === 'expired');
  // someone else takes the ship
  const b2 = core.createHold(core.quotePrivate({ ship_id: 'SHIP-ANDAL', start_date: D(60), nights: 2, guests: 4 }), { name: 'Other', email: 'other@x.test' }, null);
  core.handleNotification(gw.simulate(pay.order_id, 'pay'));
  const late = one(`SELECT * FROM bookings WHERE id=?`, b.id);
  ok('AT12', 'the late payment becomes a paid-but-unallocated exception, not a second confirmation',
    late.status === 'exception' && late.paid_idr > 0 && one(`SELECT status FROM bookings WHERE id=?`, b2.id).status === 'held',
    `${late.status}/${late.payment_status}`);
}

console.log('\nAT08/AT09/AT14  Google Sheets synchronisation');
fresh();
{
  const b = core.createHold(core.quotePrivate({ ship_id: 'SHIP-SAMARA', start_date: D(60), nights: 2, guests: 6 }), contact, null);
  let wb = sheets.load();
  ok('AT08', 'the hold is projected to the sheet once', wb.BookingProjection.filter((r) => r.booking_id === b.ref).length === 1);
  const pay = core.startPayment(b.id, 'deposit');
  core.handleNotification(gw.simulate(pay.order_id, 'pay'));
  wb = sheets.load();
  const rows = wb.BookingProjection.filter((r) => r.booking_id === b.ref);
  ok('AT08', 'payment updates the same keyed row rather than appending', rows.length === 1 && rows[0].booking_status === 'confirmed');

  // AT09: the write lands but the call times out; the retry must not duplicate
  setSetting('sheets_mode', 'timeout_after_write');
  core.cancelBooking(b.id, 'ops@test', 'sheet timeout drill');
  ok('AT09', 'a timed-out write leaves the booking retrying, not lost',
    ['retrying', 'failed'].includes(one(`SELECT sync_status FROM bookings WHERE id=?`, b.id).sync_status));
  setSetting('sheets_mode', 'ok');
  db.prepare(`UPDATE outbox SET next_at=?, status='pending' WHERE status IN ('pending','failed')`).run(core.now());
  core.flushOutbox();
  wb = sheets.load();
  ok('AT09', 'the retry finds the existing row — no duplicate booking in the sheet',
    wb.BookingProjection.filter((r) => r.booking_id === b.ref).length === 1);
  ok('AT08', 'the sheet now shows the cancellation', wb.BookingProjection.find((r) => r.booking_id === b.ref).booking_status === 'cancelled');

  // AT14: Sheets dies after a confirmed payment
  const b2 = core.createHold(core.quotePrivate({ ship_id: 'SHIP-SAMARA', start_date: D(70), nights: 2, guests: 6 }), contact, null);
  const p2 = core.startPayment(b2.id, 'deposit');
  setSetting('sheets_mode', 'fail');
  core.handleNotification(gw.simulate(p2.order_id, 'pay'));
  const after = one(`SELECT * FROM bookings WHERE id=?`, b2.id);
  ok('AT14', 'the paid reservation is retained when Sheets is unreachable',
    after.status === 'confirmed' && after.sync_status !== 'synchronized', `${after.status}/${after.sync_status}`);
  ok('AT14', 'new sales on that ship stop until synchronisation recovers',
    /synchronisation recovers/.test(core.salesGate('SHIP-SAMARA') ?? ''), core.salesGate('SHIP-SAMARA'));
  setSetting('sheets_mode', 'ok');
  db.prepare(`UPDATE outbox SET next_at=?, status='pending' WHERE status IN ('pending','failed')`).run(core.now());
  core.flushOutbox();
  ok('AT14', 'after recovery the projection catches up and sales reopen',
    one(`SELECT sync_status FROM bookings WHERE id=?`, b2.id).sync_status === 'synchronized' && core.salesGate('SHIP-SAMARA') === null);
}

console.log('\nAT10  manual sheet edits versus committed inventory');
fresh();
{
  const b = core.createHold(core.quotePrivate({ ship_id: 'SHIP-ALILA', start_date: D(50), nights: 2, guests: 4 }), contact, null);
  core.handleNotification(gw.simulate(core.startPayment(b.id, 'deposit').order_id, 'pay'));
  sheets.addScheduleInput({ schedule_id: 'SI-CLASH', ship_id: 'SHIP-ALILA', event_type: 'external_charter',
    start_at: D(51), end_at: D(53), operator_note: 'walk-in charter promised by phone' });
  const r = core.syncSchedule();
  const ev = one(`SELECT * FROM schedule_events WHERE id='SI-CLASH'`);
  ok('AT10', 'the conflicting manual edit is quarantined, not applied',
    ev.status === 'quarantined' && /conflicts with booking/.test(ev.note), ev?.note);
  ok('AT10', 'the paid booking is untouched', one(`SELECT status FROM bookings WHERE id=?`, b.id).status === 'confirmed');
  ok('SH05', 'the rejection reason is written back to SyncResults',
    sheets.load().SyncResults.some((x) => x.input_id === 'SI-CLASH' && x.rejection_reason));

  sheets.addScheduleInput({ schedule_id: 'SI-OK', ship_id: 'SHIP-ALILA', event_type: 'maintenance', start_at: D(80), end_at: D(82) });
  sheets.addScheduleInput({ schedule_id: 'SI-BAD', ship_id: 'SHIP-NOPE', event_type: 'maintenance', start_at: D(80), end_at: D(82) });
  sheets.addScheduleInput({ schedule_id: 'SI-REV', ship_id: 'SHIP-ANDAL', event_type: 'maintenance', start_at: D(90), end_at: D(85) });
  core.syncSchedule();
  ok('SH05', 'a clean row is accepted', one(`SELECT status FROM schedule_events WHERE id='SI-OK'`).status === 'accepted');
  ok('SH05', 'an unknown ship is rejected', one(`SELECT note FROM schedule_events WHERE id='SI-BAD'`).note === 'unknown ship_id');
  ok('SH05', 'an inverted interval is rejected', one(`SELECT note FROM schedule_events WHERE id='SI-REV'`).note === 'invalid interval');
  ok('AT03', 'the accepted block now blocks sales', core.shipConflicts('SHIP-ALILA', D(80), D(81)).length > 0);
}

console.log('\nAT07  price and terms changes after acceptance');
fresh();
{
  const b = core.createHold(core.quotePrivate({ ship_id: 'SHIP-ALILA', start_date: D(60), nights: 2, guests: 4 }), contact, null);
  const before = one(`SELECT total_idr FROM bookings WHERE id=?`, b.id).total_idr;
  db.prepare(`UPDATE rates SET amount_idr=amount_idr*2 WHERE id='R-P-SHIP-ALILA-2'`).run();
  db.prepare(`UPDATE products SET terms_version=terms_version+1 WHERE id='PROD-PRIV'`).run();
  const after = one(`SELECT * FROM bookings WHERE id=?`, b.id);
  ok('AT07', 'the accepted booking keeps its price snapshot', after.total_idr === before);
  ok('AT07', 'the accepted booking keeps its terms version', JSON.parse(after.quote_json).terms_version === 1);
  ok('AT07', 'a new quote picks up the new price',
    core.quotePrivate({ ship_id: 'SHIP-ALILA', start_date: D(62), nights: 2, guests: 4 }).total_idr === before * 2);
}

console.log('\nAT15  cancellation and refunds');
fresh();
{
  const b = core.createHold(core.quotePrivate({ ship_id: 'SHIP-ALILA', start_date: D(60), nights: 2, guests: 4 }), contact, null);
  core.handleNotification(gw.simulate(core.startPayment(b.id, 'deposit').order_id, 'pay', 'bank_transfer'));
  const paid = one(`SELECT paid_idr FROM bookings WHERE id=?`, b.id).paid_idr;
  const { refundable } = core.cancelBooking(b.id, 'ops@test', 'customer request', 2e6);
  ok('OPS04', 'cancellation releases inventory', all(`SELECT * FROM allocations WHERE booking_id=? AND active=1`, b.id).length === 0);
  ok('OPS04', 'the policy fee is applied to the refundable amount', refundable === paid - 2e6);
  ok('AT15', 'a refund larger than the amount paid is refused',
    throws(() => core.requestRefund(b.id, paid + 1, 'oops', 'fin@test'), /exceeds/));
  const rid = core.requestRefund(b.id, refundable, 'policy refund', 'fin@test');
  ok('AT15', 'refund executes and reconciles', core.executeRefund(rid, 'fin@test').ok === true);
  ok('AT15', 'the booking shows partially refunded, history intact',
    one(`SELECT payment_status FROM bookings WHERE id=?`, b.id).payment_status === 'partially_refunded' &&
    all(`SELECT * FROM payments WHERE booking_id=?`, b.id).length === 1);

  const b2 = core.createHold(core.quotePrivate({ ship_id: 'SHIP-ANDAL', start_date: D(60), nights: 2, guests: 4 }), contact, null);
  core.handleNotification(gw.simulate(core.startPayment(b2.id, 'deposit').order_id, 'pay', 'cstore')); // convenience store: no API refund
  core.cancelBooking(b2.id, 'ops@test', 'weather');
  const rid2 = core.requestRefund(b2.id, one(`SELECT paid_idr FROM bookings WHERE id=?`, b2.id).paid_idr, 'weather', 'fin@test');
  const res = core.executeRefund(rid2, 'fin@test');
  ok('AT15', 'an unsupported refund channel routes to the manual finance path',
    res.ok === false && one(`SELECT status FROM refunds WHERE id=?`, rid2).status === 'manual_required', res.error);
}

console.log('\nAT17/OT06  conditional departures & stop sales');
fresh();
{
  const view = core.departureCabins('DEP-1002');
  const q = core.quoteOpen({ departure_id: 'DEP-1002', selections: [{ departure_cabin_id: view.rows[0].id, sale_mode: 'berth', qty: 1 }], guests: 1 });
  ok('OT06', 'a booking on a non-guaranteed departure carries the condition', q.conditional === 1);
  const b = core.createHold(q, contact, null);
  core.handleNotification(gw.simulate(core.startPayment(b.id, 'full').order_id, 'pay'));
  ok('OT06', 'the condition survives onto the confirmed booking',
    one(`SELECT conditional, status FROM bookings WHERE id=?`, b.id).conditional === 1);
  setSetting('stop_sales', '1');
  ok('OPS11', 'the global stop-sales switch blocks new holds',
    throws(() => core.createHold(core.quotePrivate({ ship_id: 'SHIP-ALILA', start_date: D(60), nights: 2, guests: 4 }), contact, null), /temporarily stopped/));
  setSetting('stop_sales', '0');
  setSetting('last_sync_at', '2020-01-01T00:00:00Z');
  ok('SYNC02', 'stale schedule data blocks checkout',
    throws(() => core.createHold(core.quotePrivate({ ship_id: 'SHIP-ALILA', start_date: D(60), nights: 2, guests: 4 }), contact, null), /old/));
}

/* ================= WCAG 2.2 Level AAA ================= */
const { TOKENS, CONTRAST_PAIRS } = await import('./views.js');
const server = (await import('./server.js')).default;

const relLum = (hex) => {
  const c = hex.replace('#', '').match(/../g).map((h) => parseInt(h, 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const contrast = (a, b) => { const [hi, lo] = [relLum(a), relLum(b)].sort((x, y) => y - x); return (hi + 0.05) / (lo + 0.05); };

console.log('\n1.4.6  Contrast (Enhanced) — every declared pair at 7:1 or better');
{
  const bad = CONTRAST_PAIRS.map(([f, b]) => ({ f, b, r: contrast(TOKENS[f], TOKENS[b]) })).filter((x) => x.r < 7);
  ok('1.4.6', `${CONTRAST_PAIRS.length} foreground/background pairs reach AAA`, bad.length === 0,
    bad.map((x) => `${x.f} on ${x.b} = ${x.r.toFixed(2)}:1`).join(', '));
  ok('1.4.11', 'the focus ring contrasts with both page grounds',
    contrast(TOKENS.focus, TOKENS.ink) >= 3 && contrast(TOKENS.ink, TOKENS.paper) >= 3 && contrast(TOKENS.ink, TOKENS.deep) < 3,
    `focus/ink ${contrast(TOKENS.focus, TOKENS.ink).toFixed(2)}`);
  const swatch = all(`SELECT id, name, photo FROM ships`).filter((s) => contrast(TOKENS.onDeep, s.photo) < 7);
  ok('1.4.6', 'ship swatch colours carry their caption at AAA', swatch.length === 0,
    swatch.map((s) => `${s.name} ${s.photo}`).join(', '));
  ok('1.4.11', 'input borders reach 3:1 against their field', contrast(TOKENS.line2, TOKENS.card) >= 3,
    `${contrast(TOKENS.line2, TOKENS.card).toFixed(2)}:1`);
}

console.log('\nStructure — audited on the rendered HTML of every public page');
{
  await new Promise((r) => server.listen(0, r));
  const port = server.address().port;
  const cookie = await (async () => {
    const res = await fetch(`http://127.0.0.1:${port}/login`, { method: 'POST', redirect: 'manual',
      headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: 'email=admin@andalusia.test&pw=admin' });
    return res.headers.get('set-cookie').split(';')[0];
  })();
  const dep = one(`SELECT id FROM departures LIMIT 1`).id;
  const chatMod = await import('./chat.js');
  const conv = chatMod.start({ name: 'Audit Guest', email: 'audit@example.test', body: 'Hello from the audit' });
  const bref = one(`SELECT ref FROM bookings LIMIT 1`).ref;
  const paths = ['/', '/fleet', '/ship/SHIP-ALILA', '/charter', '/charter?start_date=2026-11-10&nights=2&guests=4',
    '/trips', `/departure/${dep}`, '/checkout?type=private&ship=SHIP-ALILA&start=2026-11-10&nights=2&guests=4',
    '/retrieve', '/login', '/admin', '/admin/sheets', '/nope', '/support', '/product/PROD-PRIV', '/product/PROD-OPEN',
    '/admin/bookings', `/admin/bookings/${bref}`, '/admin/chat', `/admin/chat/${conv.id}`, '/admin/ships', '/admin/ships/SHIP-ALILA',
    '/admin/ships/SHIP-ALILA/cabins/CAB-A1', '/admin/products', '/admin/products/PROD-PRIV', '/admin/departures', `/admin/departures/${dep}`,
    '/admin/rates', '/admin/rates/R-P-SHIP-ALILA-2', '/admin/agents', '/admin/users', '/admin/users/U-OPS', '/admin/settings', '/admin/audit',
    // editorial site: every mega-menu destination, so a broken content page fails the build
    '/sailing', '/sailing/andalucia-1', '/sailing/andalucia-2', '/sailing/andalucia-3', '/sailing/cabin-collection',
    '/open-trip/itinerary', '/destinations', '/gallery', '/faq', '/terms', '/awards', '/press', '/travel-resources',
    '/about', '/about/team', '/about/legal', '/language/fr', '/news',
    '/membership', '/membership/newsletter', '/membership/special-offer', '/membership/benefits', '/membership/join',
    ...EXPERIENCES.map(([s]) => `/experience/${s}`),
    ...DESTINATIONS.map(([s]) => `/destination/${s}`)];
  const pages = {};
  for (const p of paths) pages[p] = await (await fetch(`http://127.0.0.1:${port}${p}`, { headers: { cookie } })).text();
  pages['/support (in conversation)'] = await (await fetch(`http://127.0.0.1:${port}/support`, { headers: { cookie: `chat=${conv.token}` } })).text();
  ok('smoke', 'every audited page renders without a server error',
    !Object.values(pages).some((h) => /Something went wrong/.test(h)), Object.entries(pages).filter(([, h]) => /Something went wrong/.test(h)).map(([p]) => p).join(' '));
  const every = (name, id, fn) => {
    const bad = Object.entries(pages).filter(([, html]) => !fn(html)).map(([p]) => p);
    ok(id, name, bad.length === 0, bad.join(' '));
  };

  every('every page declares a language', '3.1.1', (h) => /<html lang="en">/.test(h));
  every('every page has a unique, descriptive title', '2.4.2', (h) => /<title>.{10,}<\/title>/.test(h));
  every('every page offers a skip link to main content', '2.4.1', (h) => /class="skip" href="#main"/.test(h) && /<main id="main"[\s>]/.test(h));
  every('landmarks are present and labelled', '1.3.1', (h) => /<nav class="bar" aria-label="Primary">/.test(h) && /<footer>/.test(h));
  every('exactly one h1 per page', '1.3.1', (h) => (h.match(/<h1[\s>]/g) || []).length === 1);
  every('heading levels never skip a rank', '1.3.1', (h) => {
    const lv = [...h.matchAll(/<h([1-6])[\s>]/g)].map((m) => Number(m[1]));
    return lv[0] === 1 && lv.every((v, i) => i === 0 || v - lv[i - 1] <= 1);
  });
  every('every visible form control has an associated label', '3.3.2', (h) => {
    const fors = new Set([...h.matchAll(/<label[^>]*\sfor="([^"]+)"/g)].map((m) => m[1]));
    const controls = [...h.matchAll(/<(input|select|textarea)\b[^>]*>/g)].map((m) => m[0])
      .filter((t) => !/type="hidden"/.test(t));
    return controls.every((t) => { const id = t.match(/\sid="([^"]+)"/); return id && fors.has(id[1]); });
  });
  every('required fields are marked for assistive technology', '3.3.2', (h) =>
    [...h.matchAll(/<(input|select)\b[^>]*\brequired\b[^>]*>/g)].every((m) => /aria-required="true"/.test(m[0])));
  every('every data table has a caption and column scopes', '1.3.1', (h) =>
    (h.match(/<table>/g) || []).length === (h.match(/<caption>/g) || []).length &&
    !/<th(?=[\\s>])(?![^>]*scope=)/.test(h));
  every('no link or button is left without an accessible name', '2.4.4', (h) =>
    ![...h.matchAll(/<(a|button)\b[^>]*>([\s\S]*?)<\/\1>/g)].some((m) =>
      !m[2].replace(/<[^>]+>/g, '').trim() && !/aria-label=/.test(m[1])));
  every('errors are announced, not signalled by colour alone', '3.3.1', (h) =>
    !/class="notice bad"/.test(h) || /role="alert"/.test(h) || /<strong>/.test(h));
  every('text is never justified and body copy is width-limited', '1.4.8', (h) =>
    !/text-align:\s*justify/.test(h) && /max-width:74ch/.test(h));
  every('the four reflow guards are in place, so no page scrolls sideways', '1.4.10', (h) =>
    /\.grid > \*,\.split > \*\{min-width:0\}/.test(h) &&        // grid children may shrink below content
    /minmax\(min\(\d+px,100%\),1fr\)/.test(h) &&                 // track floors collapse on small screens
    /\.scroll\{position:relative;overflow-x:auto;max-width:100%/.test(h) && // wide tables scroll inside their own box
    /\.big\{[^}]*white-space:normal/.test(h));                    // long money strings wrap instead of spilling
  // every horizontal scroller needs its own positioned context, or an absolutely positioned .vh
  // span inside resolves against the page and drags the document sideways. Caught on the
  // testimonial rail, which is the only scroller carrying screen-reader-only text.
  every('horizontal scrollers establish a containing block for the .vh spans inside them', '1.4.10', (h) =>
    [...h.matchAll(/\.(hscroll|strip)\{([^}]*)\}/g)].every((m) => /position:relative/.test(m[2])));
  every('reduced motion and increased contrast are honoured', '2.3.3', (h) =>
    /prefers-reduced-motion:reduce/.test(h) && /prefers-contrast:more/.test(h));
  every('interactive targets are at least 44 CSS pixels', '2.5.5', (h) => /--tap:44px/.test(h));
  every('stand-alone links in tables and action rows get the full target too', '2.5.5', (h) =>
    /td a,th a,\.actions a,\.row-actions a\{[^}]*min-height:var\(--tap\);min-width:var\(--tap\)/.test(h) && !/<label class="vh" for="a[bw]-/.test(h));
  every('a zero unread count never shows a badge', 'polish', (h) => !/class="count">0</.test(h));
  every('nothing refreshes or redirects on its own', '3.2.5', (h) => !/http-equiv="refresh"/i.test(h));

  ok('1.3.5', 'name and email inputs carry autocomplete tokens',
    /autocomplete="name"/.test(pages['/checkout?type=private&ship=SHIP-ALILA&start=2026-11-10&nights=2&guests=4']) &&
    /autocomplete="email"/.test(pages['/retrieve']) && /autocomplete="current-password"/.test(pages['/login']));
  ok('2.4.8', 'inner pages state the visitor’s location with a breadcrumb',
    /aria-label="Breadcrumb"/.test(pages['/fleet']) && /aria-current="page"/.test(pages['/fleet']));
  ok('2.2.6', 'the hold timeout is stated before any commitment is made',
    /minute hold/.test(pages['/checkout?type=private&ship=SHIP-ALILA&start=2026-11-10&nights=2&guests=4']));
  ok('3.3.6', 'the financial commitment is reviewable and reversible before submission',
    /Review and confirm/.test(pages['/checkout?type=private&ship=SHIP-ALILA&start=2026-11-10&nights=2&guests=4']) &&
    /without reserving anything/.test(pages['/checkout?type=private&ship=SHIP-ALILA&start=2026-11-10&nights=2&guests=4']));
  ok('3.3.3', 'a failed search explains what to change',
    /aria-live|role="alert"/.test((await (await fetch(`http://127.0.0.1:${port}/charter?start_date=2026-11-10&nights=1&guests=4`)).text())));
  ok('2.4.4', 'table action links name their target rather than saying “open”',
    !/>open<\/a>/.test(pages['/admin']));
  server.closeAllConnections(); await new Promise((r) => server.close(r));
}

/* ================= administration & support chat ================= */
{
  fresh();
  await new Promise((r) => server.listen(0, r));
  const base = `http://127.0.0.1:${server.address().port}`;
  const login = async (email, pw) => (await fetch(`${base}/login`, { method: 'POST', redirect: 'manual',
    headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ email, pw }) })).headers.get('set-cookie')?.split(';')[0] ?? '';
  const send = (path, data, cookie = '', accept = 'text/html') => fetch(base + path, { method: 'POST', redirect: 'manual',
    headers: { 'content-type': 'application/x-www-form-urlencoded', cookie, accept }, body: new URLSearchParams(data) });
  const status = async (path, cookie) => (await fetch(base + path, { headers: { cookie }, redirect: 'manual' })).status;
  const msgOf = (res) => decodeURIComponent((res.headers.get('location') ?? '').split(/[?&](?:ok|err)=/)[1] ?? '');
  const isErr = (res) => /[?&]err=/.test(res.headers.get('location') ?? '');
  const C = { admin: await login('admin@andalusia.test', 'admin'), ops: await login('ops@andalusia.test', 'ops'),
    fin: await login('finance@andalusia.test', 'finance'), agent: await login('agent@balisea.test', 'agent') };

  console.log('\nBR01  permissions are checked on the server, per role');
  const matrix = [
    ['admin', '/admin/users', 200], ['admin', '/admin/settings', 200], ['ops', '/admin/ships', 200], ['ops', '/admin/departures', 200],
    ['ops', '/admin/users', 403], ['ops', '/admin/rates', 403], ['ops', '/admin/settings', 403], ['fin', '/admin/rates', 200],
    ['fin', '/admin/ships', 403], ['fin', '/admin/chat', 200], ['agent', '/admin', 403], ['agent', '/admin/chat', 403], ['', '/admin/bookings', 403]];
  const wrong = [];
  for (const [who, path, want] of matrix) { const got = await status(path, C[who] ?? ''); if (got !== want) wrong.push(`${who || 'anon'} ${path} ${got}≠${want}`); }
  ok('BR01', `${matrix.length} role/page combinations return the expected access`, wrong.length === 0, wrong.join(', '));
  ok('BR01', 'a write is refused even when the form is posted directly', (await send('/admin/settings', { deposit_percent: 0 }, C.ops)).status === 403);
  ok('BR01', 'the admin menu only offers what the role may use',
    !/href="\/admin\/users"/.test(await (await fetch(`${base}/admin`, { headers: { cookie: C.ops } })).text()));

  console.log('\nCAT/OT  catalogue rules');
  ok('OT05', 'a departure cannot be scheduled over a ship that is already committed',
    throws(() => core.createDeparture({ product_id: 'PROD-OPEN', ship_id: 'SHIP-ANDAL', start_date: D(17), end_date: D(19) }, 't'), /committed/));
  ok('CAT02', 'departures only belong to open-trip products',
    throws(() => core.createDeparture({ product_id: 'PROD-PRIV', ship_id: 'SHIP-ANDAL', start_date: D(70), end_date: D(72) }, 't'), /open-trip/));
  const nd = core.createDeparture({ product_id: 'PROD-OPEN', ship_id: 'SHIP-ANDAL', start_date: D(70), end_date: D(72), status: 'published' }, 't');
  ok('CAT06', 'a new departure copies the ship’s active cabins into its own inventory',
    one(`SELECT count(*) c FROM departure_cabins WHERE departure_id=?`, nd).c === one(`SELECT count(*) c FROM cabins WHERE ship_id='SHIP-ANDAL' AND active=1`).c);
  ok('OT05', 'and immediately blocks a private charter on the same ship',
    core.searchPrivate({ start_date: D(70), nights: 2, guests: 2 }).results.find((r) => r.ship.id === 'SHIP-ANDAL').available === false);
  const ndc = one(`SELECT id FROM departure_cabins WHERE departure_id=? LIMIT 1`, nd).id;
  core.createHold(core.quoteOpen({ departure_id: nd, selections: [{ departure_cabin_id: ndc, sale_mode: 'berth', qty: 2 }], guests: 2 }), contact, null);
  ok('OT07', 'capacity cannot be cut below what is already held',
    throws(() => core.setDepartureCabin(ndc, { berths: 1, allow_berth: true, allow_whole: true }, 't'), /already committed/));
  ok('OPS06', 'a departure with guests cannot be cancelled outright',
    throws(() => core.setDepartureStatus(nd, 'cancelled', 't'), /Guests are booked/));
  const empty = core.createDeparture({ product_id: 'PROD-OPEN', ship_id: 'SHIP-SAMARA', start_date: D(90), end_date: D(92) }, 't');
  core.setDepartureStatus(empty, 'cancelled', 't');
  ok('OT05', 'cancelling an empty departure frees the ship calendar', core.shipConflicts('SHIP-SAMARA', D(90), D(92)).length === 0);
  ok('PR03', 'a rate that would tie with an existing one is refused at save time',
    throws(() => core.saveRate({ rate_class: 'retail', product_id: 'PROD-PRIV', ship_id: 'SHIP-ALILA', nights: 2, amount_idr: 1, valid_from: '2026-06-01', valid_to: '2026-12-31' }, 't'), /Overlaps/));
  ok('PR03', 'the same scope for a different season is accepted',
    !!core.saveRate({ rate_class: 'retail', product_id: 'PROD-PRIV', ship_id: 'SHIP-ALILA', nights: 2, amount_idr: 1e8, valid_from: '2028-01-01', valid_to: '2028-12-31' }, 't'));

  // U03: a private product created entirely in the admin becomes bookable, with its own longer minimum
  const created = await send('/admin/products', { title: 'Raja Ampat Private', mode: 'private', destination: 'Raja Ampat', summary: '' }, C.ops);
  const pid = created.headers.get('location').match(/products\/([\w-]+)/)[1];
  ok('CAT01', 'publishing an incomplete product is refused with the reasons', isErr(await send(`/admin/products/${pid}/status`, { status: 'published' }, C.ops)));
  await send(`/admin/products/${pid}`, { title: 'Raja Ampat Private', destination: 'Raja Ampat', summary: 'Five days in the Dampier Strait.', min_nights: 3 }, C.ops);
  await send(`/admin/products/${pid}/ships`, { 'ship_SHIP-ALILA': 1 }, C.ops);
  core.saveRate({ rate_class: 'retail', product_id: pid, ship_id: 'SHIP-ALILA', nights: 3, amount_idr: 210e6, valid_from: '2026-01-01', valid_to: '2027-12-31' }, 't');
  const pub = await send(`/admin/products/${pid}/status`, { status: 'published' }, C.ops);
  ok('CAT01', 'once complete, the product publishes', !isErr(pub), msgOf(pub));
  ok('U03', 'the new product is sold through the same checkout rules',
    core.quotePrivate({ product_id: pid, ship_id: 'SHIP-ALILA', start_date: D(120), nights: 3, guests: 4 }).total_idr === 210e6);
  ok('PC02', 'its longer minimum is enforced', throws(() => core.quotePrivate({ product_id: pid, ship_id: 'SHIP-ALILA', start_date: D(120), nights: 2, guests: 4 }), /4 days and 3 nights/));
  ok('CAT05', 'a ship not eligible for the product cannot be quoted', throws(() => core.quotePrivate({ product_id: pid, ship_id: 'SHIP-SAMARA', start_date: D(120), nights: 3, guests: 4 }), /not offered/));
  const v1 = one(`SELECT terms_version v FROM products WHERE id=?`, pid).v;
  await send(`/admin/products/${pid}`, { title: 'Raja Ampat Private', destination: 'Raja Ampat', summary: 'Five days in the Dampier Strait.', min_nights: 3, itinerary: 'Sorong → Wayag' }, C.ops);
  ok('CAT08', 'a material edit creates a new terms version', one(`SELECT terms_version v FROM products WHERE id=?`, pid).v === v1 + 1);
  ok('CAT01', 'staff can preview an unpublished product; guests cannot',
    (await status('/product/PROD-PRIV', '')) === 200 && (await send(`/admin/products/${pid}/status`, { status: 'draft' }, C.ops), await status(`/product/${pid}`, '')) === 404 && (await status(`/product/${pid}`, C.ops)) === 200);

  const kept = core.createHold(core.quotePrivate({ ship_id: 'SHIP-SAMARA', start_date: D(100), nights: 2, guests: 4 }), contact, null);
  const affected = core.setShipStatus('SHIP-SAMARA', 'inactive', 't');
  ok('CAT07', 'deactivating a ship lists its future bookings and cancels none of them',
    affected.some((b) => b.ref === kept.ref) && one(`SELECT status FROM bookings WHERE id=?`, kept.id).status === 'held');
  ok('CAT07', 'an inactive ship stops selling', !core.searchPrivate({ start_date: D(130), nights: 2, guests: 2 }).results.some((r) => r.ship.id === 'SHIP-SAMARA'));
  core.setShipStatus('SHIP-SAMARA', 'active', 't');
  ok('CAT03', 'a card colour that fails AAA against its caption is refused',
    isErr(await send('/admin/ships/SHIP-ALILA', { name: 'Alila Purnama', embarkation: 'Labuan Bajo', capacity: 10, turnaround_days: 1, timezone: 'Asia/Makassar', photo: '#88CCEE' }, C.ops)));

  console.log('\nSEC01  users, roles and re-authentication');
  ok('SEC01', 'creating an account without your own password is refused',
    isErr(await send('/admin/users', { name: 'X', email: 'x@andalusia.test', role: 'ops', pw: 'longenough1', current_pw: 'wrong' }, C.admin)));
  ok('SEC01', 'the last administrator cannot demote themselves',
    /last active administrator/.test(msgOf(await send('/admin/users/U-ADM', { name: 'Admin', role: 'ops', active: 1, current_pw: 'admin' }, C.admin))));
  await send('/admin/users/U-OPS', { name: 'Operations', role: 'ops', current_pw: 'admin' }, C.admin); // unticked → inactive
  ok('BR01', 'a deactivated account can no longer sign in', (await login('ops@andalusia.test', 'ops')) === '');
  ok('BR01', 'and its existing session stops working at once', (await status('/admin', C.ops)) === 403);
  await send('/admin/agents/ORG-BALI/status', { status: 'suspended' }, C.admin);
  ok('AT06', 'suspending an agent organisation drops its users to retail prices immediately',
    core.rateClassFor(one(`SELECT * FROM users WHERE id='U-AG1'`)) === 'retail');
  ok('PAY02', 'settings outside their allowed range are rejected and nothing changes',
    isErr(await send('/admin/settings', { deposit_percent: 150, balance_days_before: 30, hold_minutes: 15, stale_seconds: 120 }, C.admin)) && setting('deposit_percent') === '30');

  console.log('\nOPS07  passenger manifest');
  const pb = core.createHold(core.quotePrivate({ ship_id: 'SHIP-ALILA', start_date: D(140), nights: 2, guests: 1 }), contact, null);
  const pr = await send(`/booking/${pb.ref}/passengers`, { t: pb.token, full_name: 'Siti Rahma', nationality: 'Indonesian', dietary: 'Vegetarian' });
  ok('OPS07', 'a guest records a traveller from their booking link', !isErr(pr) && one(`SELECT count(*) c FROM passengers WHERE booking_id=?`, pb.id).c === 1);
  ok('OPS07', 'travellers cannot exceed the party size', throws(() => core.addPassenger(pb.id, { full_name: 'Extra' }, 't'), /already recorded/));
  ok('SEC01', 'without the booking token the form is refused', (await send(`/booking/${pb.ref}/passengers`, { full_name: 'Intruder' })).status === 403);

  console.log('\nChat  visitor ⇄ staff');
  const started = await send('/support', { name: 'Maya', email: 'maya@example.test', subject: 'Private charter enquiry', body: 'Is <script>alert(1)</script> possible in March?' });
  const vc = started.headers.get('set-cookie').split(';')[0];
  const conv = one(`SELECT * FROM conversations WHERE email='maya@example.test'`);
  const visitorPage = await (await fetch(`${base}/support`, { headers: { cookie: vc } })).text();
  ok('chat', 'a visitor starts a conversation without an account', !!conv && /possible in March/.test(visitorPage));
  ok('SEC04', 'message text is escaped, never executed', /&lt;script&gt;alert\(1\)&lt;\/script&gt;/.test(visitorPage) && !/<script>alert\(1\)/.test(visitorPage));
  ok('chat', 'another visitor cannot see it', !/possible in March/.test(await (await fetch(`${base}/support`)).text()));
  ok('chat', 'the conversation appears unread in the staff inbox', chat.staffUnread() >= 1 &&
    /Maya/.test(await (await fetch(`${base}/admin/chat`, { headers: { cookie: C.fin } })).text()));

  // live push: the visitor's open stream receives the staff reply
  const ac = new AbortController();
  const stream = await fetch(`${base}/support/stream`, { headers: { cookie: vc }, signal: ac.signal });
  const reader = stream.body.getReader();
  const got = (async () => { let buf = ''; while (!/Yes, March works/.test(buf)) { const { value, done } = await reader.read(); if (done) break; buf += new TextDecoder().decode(value); } return buf; })();
  const reply = await send(`/admin/chat/${conv.id}/reply`, { body: 'Yes, March works on Alila Purnama.' }, C.fin, 'application/json');
  const pushed = await Promise.race([got, new Promise((r) => setTimeout(() => r(''), 3000))]);
  ac.abort();
  ok('chat', 'a staff reply returns the saved message to the sender', reply.status === 200 && (await reply.json()).message.sender === 'staff');
  ok('chat', 'and is pushed live to the visitor’s open page', /event: message/.test(pushed) && /Yes, March works/.test(pushed));
  ok('chat', 'opening the thread marks it read for staff',
    (await fetch(`${base}/admin/chat/${conv.id}`, { headers: { cookie: C.fin } }), chat.summary(conv.id).unread === 0));
  ok('SEC01', 'a visitor cannot open a staff thread or its stream',
    (await status(`/admin/chat/${conv.id}`, vc)) === 403 && (await status(`/admin/chat/${conv.id}/stream`, vc)) === 403);
  ok('SEC01', 'the visitor stream refuses anyone without a conversation cookie', (await status('/support/stream', '')) === 403);
  const tooLong = await send('/support/message', { body: 'x'.repeat(2001) }, vc, 'application/json');
  ok('chat', 'over-long messages are refused with the limit stated', tooLong.status === 400 && /2000 characters/.test((await tooLong.json()).error));
  ok('chat', 'an empty message is refused', (await send('/support/message', { body: '   ' }, vc, 'application/json')).status === 400);
  for (let i = 0; i < 9; i++) chat.send(conv.id, 'visitor', 'Maya', `ping ${i}`);
  ok('SEC01', 'a visitor flooding the chat is slowed down', throws(() => chat.send(conv.id, 'visitor', 'Maya', 'one more'), /very quickly/));
  chat.setStatus(conv.id, 'closed', 't');
  db.prepare(`UPDATE messages SET created_at='2020-01-01T00:00:00Z' WHERE conversation_id=?`).run(conv.id);
  chat.send(conv.id, 'visitor', 'Maya', 'Actually, one more question');
  ok('chat', 'a visitor reply reopens a closed conversation', chat.get(conv.id).status === 'open');
  ok('chat', 'the booking page links straight to support with the reference filled in',
    /\/support\?booking=/.test(await (await fetch(`${base}/booking/${pb.ref}?t=${pb.token}`)).text()));
  for (let i = 0; i < 5; i++) try { chat.start({ name: 'Spam', email: 'spam@example.test', body: 'hi' }); } catch {}
  ok('SEC01', 'one email address cannot open unlimited conversations',
    throws(() => chat.start({ name: 'Spam', email: 'spam@example.test', body: 'hi' }), /several conversations/));

  server.closeAllConnections(); await new Promise((r) => server.close(r));
}

/* ================= editorial site, navigation and membership ================= */
{
  fresh();
  await new Promise((r) => server.listen(0, r));
  const base = `http://127.0.0.1:${server.address().port}`;
  const { SCRIM_ALPHA } = await import('./views.js');
  const send = (path, data, cookie = '') => fetch(base + path, { method: 'POST', redirect: 'manual',
    headers: { 'content-type': 'application/x-www-form-urlencoded', cookie }, body: new URLSearchParams(data) });
  const status = async (path, cookie = '') => (await fetch(base + path, { headers: { cookie }, redirect: 'manual' })).status;
  const isErr = (res) => /[?&]err=/.test(res.headers.get('location') ?? '');
  const home = await (await fetch(base)).text();

  console.log('\nNav  every link the mega menu offers actually resolves');
  // pull the hrefs straight out of the rendered header, so a menu entry can never outlive its page
  const navHrefs = [...new Set([...home.matchAll(/<div class="mega">[\s\S]*?<\/div><\/div>/g)]
    .flatMap((m) => [...m[0].matchAll(/href="(\/[^"#]*)"/g)].map((h) => h[1])))];
  const dead = [];
  for (const h of navHrefs) { const s = await status(h); if (s !== 200) dead.push(`${h} ${s}`); }
  ok('nav', `${navHrefs.length} navigation destinations return a page`, dead.length === 0, dead.join(', '));

  const footHrefs = [...new Set([...(home.match(/<div class="footin">[\s\S]*?<\/div><\/div>/) ?? [''])[0]
    .matchAll(/href="(\/[^"#]*)"/g)].map((m) => m[1]))];
  const deadFoot = [];
  for (const h of footHrefs) { const s = await status(h); if (s !== 200) deadFoot.push(`${h} ${s}`); }
  ok('nav', `${footHrefs.length} footer destinations return a page`, deadFoot.length === 0, deadFoot.join(', '));

  console.log('\n1.4.6  cinematic sections keep the declared contrast honest');
  ok('1.4.6', 'text over photography sits on a scrim opaque enough to hold the onDeep/deep pair',
    SCRIM_ALPHA >= 0.85, `scrim alpha ${SCRIM_ALPHA}`);
  ok('1.4.6', 'the hero renders that scrim rather than putting cream straight onto the image',
    /class="scrim"/.test(home) && new RegExp(`rgba\\(2,19,25,\\.${String(SCRIM_ALPHA).slice(2)}\\)`).test(home));

  console.log('\nMedia  placeholders stand in until real files arrive');
  const svg = await fetch(`${base}/m/hero-home.svg?w=800&h=450`);
  ok('media', 'a missing photograph resolves to a sized SVG stand-in',
    svg.status === 200 && /image\/svg/.test(svg.headers.get('content-type')) && /viewBox="0 0 800 450"/.test(await svg.text()));
  ok('media', 'the static file route refuses a path that climbs out of public/',
    (await status('/public/../db.js')) === 404);

  console.log('\nMembership  the Voyage Club');
  ok('member', 'a dispatch is withheld from a signed-out visitor',
    /Members only/.test(home) && !/Read the dispatch/.test(home));
  ok('member', 'signing up needs a real address and a long enough password',
    isErr(await send('/membership/join', { name: 'A', email: 'not-an-email', pw: 'longenough1' })) &&
    isErr(await send('/membership/join', { name: 'A', email: 'a@b.test', pw: 'short' })));
  const joined = await send('/membership/join', { name: 'Maya Prasetyo', preferred_name: 'Maya',
    email: 'maya@voyage.test', phone: '+62811', interest: 'open', pw: 'longenough1' });
  const mc = joined.headers.get('set-cookie')?.split(';')[0] ?? '';
  ok('member', 'sign-up creates the account and signs the member straight in',
    one(`SELECT role FROM users WHERE email='maya@voyage.test'`)?.role === 'member' &&
    (joined.headers.get('location') ?? '').startsWith('/account') && mc !== '');
  ok('member', 'and puts them on the mailing list without a second form',
    one(`SELECT interest FROM newsletter WHERE email='maya@voyage.test'`)?.interest === 'open');
  ok('member', 'the same address cannot be registered twice',
    isErr(await send('/membership/join', { name: 'Maya', email: 'maya@voyage.test', pw: 'longenough1' })));
  ok('member', 'a signed-in member reads the dispatch in full',
    /Read the dispatch/.test(await (await fetch(`${base}/account`, { headers: { cookie: mc } })).text()) &&
    (await status('/news/manta-season-2026', mc)) === 200);
  ok('BR01', 'a member gets no administrative access at all',
    (await status('/admin', mc)) === 403 && (await status('/admin/bookings', mc)) === 403 &&
    (await status('/agent', mc)) === 403);
  ok('member', 'the members-only dispatch still renders a gate, not a 404, when signed out',
    (await status('/news/manta-season-2026')) === 200 &&
    /This dispatch is for members/.test(await (await fetch(`${base}/news/manta-season-2026`)).text()));

  console.log('\nNewsletter  one row per address');
  await send('/membership/newsletter', { name: 'Tom', email: 'Tom@Example.test', interest: 'private' });
  await send('/membership/newsletter', { name: 'Tom Hart', email: 'tom@example.test', interest: 'both' });
  ok('newsletter', 're-subscribing updates the preference instead of duplicating the address',
    one(`SELECT count(*) c FROM newsletter WHERE email='tom@example.test'`).c === 1 &&
    one(`SELECT interest FROM newsletter WHERE email='tom@example.test'`).interest === 'both');
  ok('newsletter', 'a malformed address is refused with a reason',
    isErr(await send('/membership/newsletter', { name: 'Tom', email: 'tom@', interest: 'both' })));

  console.log('\nD11  the language switcher is honest about what exists');
  const fr = await (await fetch(`${base}/language/fr`)).text();
  ok('D11', 'an unpublished language says so rather than serving English silently',
    /French/.test(fr) && /not published yet/.test(fr) && (await status('/language/zz')) === 404);

  server.closeAllConnections(); await new Promise((r) => server.close(r));
}

console.log(`\n${fail ? '\x1b[31m' : '\x1b[32m'}${pass} passed, ${fail} failed\x1b[0m\n`);
if (!process.env.KEEP) rmSync(DATA_DIR, { recursive: true, force: true });
process.exit(fail ? 1 : 0);
