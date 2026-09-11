import { createServer } from 'node:http';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { db, seed, setting, setSetting, audit, checkPw } from './db.js';
import * as core from './core.js';
import * as gw from './midtrans.js';
import * as sheets from './sheets.js';
import { page, esc, money, req, field, crumbs, can, flash, chatLog, chatForm, chatClient } from './views.js';
import * as chat from './chat.js';
import registerAdmin, { passengerForm } from './admin.js';
import registerCatalog from './catalog.js';

seed();
const one = (s, ...a) => db.prepare(s).get(...a);
const all = (s, ...a) => db.prepare(s).all(...a);
const SECRET = process.env.SESSION_SECRET || 'prototype-secret';
const sign = (v) => v + '.' + createHmac('sha256', SECRET).update(v).digest('hex').slice(0, 24);
function unsign(c) {
  if (!c) return null;
  const i = c.lastIndexOf('.');
  const v = c.slice(0, i), m = sign(v);
  try { return timingSafeEqual(Buffer.from(m), Buffer.from(c)) ? v : null; } catch { return null; }
}
const userFrom = (rq) => {
  const raw = Object.fromEntries((rq.headers.cookie || '').split(';').map((p) => p.trim().split('=').map(decodeURIComponent)));
  const email = unsign(raw.sid);
  return email ? one(`SELECT * FROM users WHERE email=? AND active=1`, email) : null;
};
const body = (rq) => new Promise((res) => { let d = ''; rq.on('data', (c) => (d += c)); rq.on('end', () => res(d)); });
const form = async (rq) => Object.fromEntries(new URLSearchParams(await body(rq)));

/* alerts are announced, not just coloured (AAA 1.4.1 / 4.1.3) */
const alert = (msg, kind = 'bad') => `<div class="notice ${kind}" role="alert"><p><strong>${kind === 'bad' ? 'Cannot continue: ' : ''}</strong>${msg}</p></div>`;
const table = (caption, head, rows) => `<div class="scroll"><table><caption>${esc(caption)}</caption>
  <thead><tr>${head.map((h) => `<th scope="col">${h}</th>`).join('')}</tr></thead>
  <tbody>${rows.join('') || `<tr><td colspan="${head.length}">Nothing to show.</td></tr>`}</tbody></table></div>`;

const routes = [];
const get = (re, fn) => routes.push({ m: 'GET', re, fn });
const post = (re, fn) => routes.push({ m: 'POST', re, fn });

const shipCard = (s) => `<a class="card pad0" href="/ship/${s.id}">
  <div class="thumb" style="background:${esc(s.photo)}"><span>${esc(s.embarkation)}</span></div>
  <div style="padding:20px"><h3>${esc(s.name)}</h3>
  <p class="muted">${esc(s.description)}</p>
  <p class="muted">Up to ${s.capacity} guests · ${one(`SELECT count(*) c FROM cabins WHERE ship_id=?`, s.id).c} cabins</p></div></a>`;

/* ================= public ================= */
get(/^\/favicon\.ico$/, (ctx) => { ctx.res.writeHead(204); ctx.res.end(); });

get(/^\/$/, (ctx) => {
  const deps = all(`SELECT d.*, s.name ship FROM departures d JOIN ships s ON s.id=d.ship_id JOIN products p ON p.id=d.product_id
                    WHERE d.status='published' AND p.status='published' AND d.end_date >= date('now') ORDER BY d.start_date LIMIT 3`);
  return page({ title: 'Phinisi charters in Komodo', user: ctx.user, path: '/',
    hero: `<div class="hero"><div class="in"><p class="eyebrow">Labuan Bajo &amp; Benoa</p>
      <h1>Two ways to sail Komodo</h1>
      <p>Charter a whole phinisi for your own group, or join a scheduled departure. One fleet, one calendar, one set of reservation rules.</p>
      <p class="actions" style="margin-top:26px"><a class="btn ghost" href="/charter">Search private charters</a>
      <a class="btn ghost" href="/trips">See open trip departures</a></p></div></div>`,
    body: `<div class="grid g2" style="margin-top:36px">
      <div class="card"><h2 style="margin-top:0">Private charter${req('U01')}</h2>
        <p class="muted">Exclusive use of one ship for the full interval, minimum 3 days and 2 nights. Priced as a whole-ship package by duration and ship.</p>
        <p><a href="/charter">Search private charter dates</a></p></div>
      <div class="card"><h2 style="margin-top:0">Open trip${req('U02')}</h2>
        <p class="muted">Book a berth in a shared cabin, or take a whole cabin on a scheduled departure. Both draw on the same physical capacity.</p>
        <p><a href="/trips">See open trip departures</a></p></div></div>
    <h2>Next departures</h2><div class="grid g3">${deps.map((d) => `<a class="card" href="/departure/${d.id}">
      <h3>${esc(d.ship)}, ${d.start_date}</h3><p class="muted">${d.start_date} to ${d.end_date}</p>
      <p>${d.guaranteed ? '<span class="tag ok">Guaranteed departure</span>' : `<span class="tag warn">Conditional · minimum ${d.min_pax} guests</span>`}</p></a>`).join('')}</div>
    <h2>The fleet${req('U04')}</h2><div class="grid g3">${all(`SELECT * FROM ships WHERE status='active'`).map(shipCard).join('')}</div>` });
});

get(/^\/fleet$/, (ctx) => page({ title: 'Fleet', user: ctx.user, path: '/fleet',
  trail: [{ label: 'Home', href: '/' }, { label: 'Fleet' }],
  body: `<h1>Fleet</h1><p class="lede">Ships are independent records. The same ship sells under private charter and open trips and shares one conflict calendar.${req('U04 · CAT03')}</p>
  <h2>All ships</h2><div class="grid g3">${all(`SELECT * FROM ships`).map(shipCard).join('')}</div>` }));

get(/^\/ship\/([\w-]+)$/, (ctx, id) => {
  const s = one(`SELECT * FROM ships WHERE id=?`, id);
  if (!s) return null;
  const cal = all(`SELECT * FROM schedule_events WHERE ship_id=? AND status='accepted' AND end_date >= date('now') ORDER BY start_date`, id);
  const bk = all(`SELECT a.start_date,a.end_date,b.ref,b.status FROM allocations a JOIN bookings b ON b.id=a.booking_id
                  WHERE a.kind='ship_interval' AND a.active=1 AND a.ship_id=?`, id);
  const merged = [...cal.map((e) => [e.start_date, e.end_date, e.kind.replace(/_/g, ' '), e.ref_id || e.note || e.id]),
                  ...bk.map((b) => [b.start_date, b.end_date, 'private booking', `${b.ref} (${b.status})`])].sort((a, b) => a[0].localeCompare(b[0]));
  return page({ title: s.name, user: ctx.user, trail: [{ label: 'Home', href: '/' }, { label: 'Fleet', href: '/fleet' }, { label: s.name }],
    body: `<h1>${esc(s.name)}</h1>
    <p class="lede">${esc(s.description)} Embarkation ${esc(s.embarkation)}, up to ${s.capacity} guests, ${s.turnaround_days} day turnaround between trips.</p>
    <div class="split"><div>
      ${table(`Cabins aboard ${s.name}`, ['Cabin', 'Category', 'Berths', 'Maximum guests'],
        all(`SELECT * FROM cabins WHERE ship_id=?`, id).map((c) => `<tr><th scope="row">${esc(c.name)}<span class="muted"> — ${esc(c.id)}</span></th>
          <td>${esc(c.category)}</td><td>${c.beds}</td><td>${c.max_guests}</td></tr>`))}
      <h2>Shared calendar${req('PC01 · AT03')}</h2>
      <p class="muted">Private charters, open departures, maintenance and external bookings all appear here. Every service checks this one calendar before inventory is committed.</p>
      ${table(`Committed intervals for ${s.name}`, ['From', 'To', 'Type', 'Reference'],
        merged.map((r) => `<tr><th scope="row">${r[0]}</th><td>${r[1]}</td><td>${esc(r[2])}</td><td class="muted">${esc(r[3])}</td></tr>`))}
    </div><div class="card"><h2 style="margin-top:0">Book ${esc(s.name)}</h2>
      <p class="actions"><a class="btn" href="/charter">Search private charter dates</a></p>
      <p class="actions"><a class="btn ghost" href="/trips">See open trip departures</a></p></div></div>` });
});

/* ---------- private charter ---------- */
get(/^\/charter$/, (ctx) => {
  const q = ctx.url.searchParams;
  const start_date = q.get('start_date') || '';
  const n = Number(q.get('nights') || 2);
  const guests = Number(q.get('guests') || 2);
  const products = core.privateProducts();
  const product_id = q.get('product') || products[0]?.id || '';
  const searched = !!start_date;
  const r = searched ? core.searchPrivate({ product_id, start_date, nights: n, guests, user: ctx.user }) : { errors: [], results: [] };
  return page({ title: 'Private charter search', user: ctx.user, path: '/charter',
    trail: [{ label: 'Home', href: '/' }, { label: 'Private charter' }],
    body: `<h1>Private charter</h1>
    <p class="lede">Exclusive use of one phinisi. The minimum of 3 days and 2 nights is enforced on the server, not only in this form.${req('U01 · PC02 · AT02')}</p>
    ${r.errors.length ? alert(r.errors.map(esc).join(' ')) : ''}
    <form class="filters" method="get" action="/charter">
      <h2 class="vh">Search the fleet</h2>
      ${products.length > 1 ? field({ label: 'Charter', name: 'product', value: product_id, options: products.map((p) => ({ v: p.id, t: p.title })) })
        : `<input type="hidden" name="product" value="${esc(product_id)}">`}
      ${field({ label: 'Departure date', name: 'start_date', type: 'date', value: start_date, required: true })}
      ${field({ label: 'Duration', name: 'nights', value: String(n),
        options: [1, 2, 3, 4, 5, 6].map((v) => ({ v: String(v), t: `${v + 1} days, ${v} night${v > 1 ? 's' : ''}` })),
        hint: 'Three days and two nights is the shortest private charter.' })}
      ${field({ label: 'Guests', name: 'guests', type: 'number', value: String(guests), required: true, attrs: 'min="1" max="30"' })}
      <div class="field"><button>Search fleet</button></div>
      ${ctx.user?.role === 'agent' ? '<p class="field"><span class="tag ok">Agent net rates</span></p>' : ''}
    </form>
    ${searched && !r.errors.length ? `<h2>Ships for ${start_date} to ${r.end_date} — ${n + 1} days, ${n} nights</h2>
      <div class="grid g3">${r.results.map((x) => `<div class="card"><h3>${esc(x.ship.name)}</h3>
        <p class="muted">Up to ${x.ship.capacity} guests, from ${esc(x.ship.embarkation)}</p>
        ${x.available ? `<p class="big"><span class="money">${money(x.rate.amount_idr)}</span></p>
            <p class="muted">Whole ship, ${n + 1} days. Price rule <code>${esc(x.rate.id)}</code>.</p>
            <p><a class="btn" href="/checkout?type=private&amp;product=${esc(product_id)}&amp;ship=${x.ship.id}&amp;start=${start_date}&amp;nights=${n}&amp;guests=${guests}">Review and hold ${esc(x.ship.name)}</a></p>`
          : `<p class="notice bad" style="margin:14px 0"><strong>Not available.</strong> ${esc(x.error || x.reason)}</p>
             ${x.conflicts.length ? `<p class="muted">Calendar: ${x.conflicts.map((c) => `${esc(c.type.replace(/_/g, ' '))} ${c.from} to ${c.to}`).join('; ')}.</p>` : ''}`}
      </div>`).join('')}</div>` : ''}` });
});

/* ---------- open trips ---------- */
get(/^\/trips$/, (ctx) => {
  const deps = all(`SELECT d.*, s.name ship FROM departures d JOIN ships s ON s.id=d.ship_id JOIN products p ON p.id=d.product_id
                    WHERE d.status='published' AND p.status='published' AND d.end_date >= date('now') ORDER BY d.start_date`);
  return page({ title: 'Open trip departures', user: ctx.user, path: '/trips',
    trail: [{ label: 'Home', href: '/' }, { label: 'Open trips' }],
    body: `<h1>Open trip departures</h1>
    <p class="lede">Fixed departures with their own duration rules. The 3 day / 2 night private minimum does not apply here.${req('U02 · OT01')}</p>
    <h2>Scheduled departures</h2><div class="grid g3">${deps.map((d) => {
      const v = core.departureCabins(d.id, ctx.user);
      const from = v.rows.filter((r) => r.berth_rate && r.remaining > 0).map((r) => r.berth_rate.amount_idr);
      const nts = core.nights(d.start_date, d.end_date);
      return `<a class="card" href="/departure/${d.id}"><h3>${esc(d.ship)}, ${d.start_date}</h3>
        <p class="muted">${d.start_date} to ${d.end_date} · ${nts + 1} days, ${nts} nights</p>
        <p class="big">${from.length ? `From <span class="money">${money(Math.min(...from))}</span>` : 'Sold out'}</p>
        <p class="muted">${v.capacity - v.sold} of ${v.capacity} berths remaining</p>
        <p>${d.guaranteed ? '<span class="tag ok">Guaranteed departure</span>' : `<span class="tag warn">Conditional · minimum ${d.min_pax} guests</span>`}</p></a>`;
    }).join('')}</div>` });
});

get(/^\/departure\/([\w-]+)$/, (ctx, id) => {
  const v = core.departureCabins(id, ctx.user);
  if (!v) return null;
  const nts = core.nights(v.dep.start_date, v.dep.end_date);
  const rows = v.rows.map((r) => {
    const opts = [{ v: '', t: 'No space in this cabin' }]
      .concat(r.berth_rate ? Array.from({ length: r.remaining }, (_, i) => ({ v: `berth:${i + 1}`, t: `${i + 1} berth${i ? 's' : ''}` })) : [])
      .concat(r.whole_rate ? [{ v: 'whole:1', t: `Whole cabin (${r.berths} berths)` }] : []);
    return `<tr><th scope="row">${esc(r.name)} <span class="tag">${esc(r.category)}</span>
        <span class="muted">${r.berths} berths · ${esc(r.facilities)}</span></th>
      <td>${r.remaining} of ${r.berths}</td>
      <td class="money">${r.berth_rate ? money(r.berth_rate.amount_idr) : 'Not sold by the berth'}</td>
      <td class="money">${r.whole_rate ? money(r.whole_rate.amount_idr) : (r.remaining < r.berths ? 'Partly sold' : 'Not available')}</td>
      <td>${r.remaining <= 0 ? '<span class="tag bad">Full</span>'
        : `<label class="vh" for="sel-${r.id}">Space to take in ${esc(r.name)}</label>
           <select id="sel-${r.id}" name="sel_${r.id}">${opts.map((o) => `<option value="${o.v}">${esc(o.t)}</option>`).join('')}</select>`}</td></tr>`;
  });
  return page({ title: `Departure ${v.dep.start_date}`, user: ctx.user,
    trail: [{ label: 'Home', href: '/' }, { label: 'Open trips', href: '/trips' }, { label: `${v.ship.name}, ${v.dep.start_date}` }],
    body: `<h1>${esc(v.ship.name)}, ${v.dep.start_date} to ${v.dep.end_date}</h1>
    <p class="lede">${nts + 1} days and ${nts} nights from ${esc(v.ship.embarkation)}. Booking closes ${v.dep.cutoff_at.slice(0, 10)} at ${v.dep.cutoff_at.slice(11, 16)} UTC.</p>
    ${v.dep.guaranteed ? '' : `<div class="notice warn"><p><strong>Conditional departure.</strong> This trip runs when at least ${v.dep.min_pax} guests are booked. The condition stays on your confirmation until operations declares the departure.${req('OT06')}</p></div>`}
    ${v.closed ? alert('This departure is closed for sale.') : ''}
    <form method="get" action="/checkout"><div class="split">
      <input type="hidden" name="type" value="open"><input type="hidden" name="departure" value="${id}">
      <div>${table('Cabins and berths on this departure', ['Cabin', 'Berths left', 'Price per berth', 'Price whole cabin', 'Take'], rows)}
        <p class="muted">A whole-cabin sale removes every berth in that cabin from availability. Both sale modes draw down one pool.${req('OT02 · AT05')}</p></div>
      <fieldset><legend>Your party</legend>
        ${field({ label: 'Guests', name: 'guests', type: 'number', value: '2', required: true, attrs: 'min="1" max="16"',
          hint: 'A child at a reduced price still occupies a berth, so guests may not exceed the berths you select.' })}
        <p class="actions"><button ${v.closed ? 'disabled' : ''}>Price this selection</button></p>
        ${v.rate_class === 'agent' ? '<p><span class="tag ok">Agent net rates</span></p>' : ''}
      </fieldset></div></form>` });
});

/* ---------- checkout ---------- */
function quoteFromQuery(q, user) {
  if (q.get('type') === 'private')
    return core.quotePrivate({ product_id: q.get('product') || undefined, ship_id: q.get('ship'), start_date: q.get('start'), nights: Number(q.get('nights')), guests: Number(q.get('guests')), user });
  const selections = [...q.entries()].filter(([k, v]) => k.startsWith('sel_') && v)
    .map(([k, v]) => ({ departure_cabin_id: k.slice(4), sale_mode: v.split(':')[0], qty: Number(v.split(':')[1]) }));
  return core.quoteOpen({ departure_id: q.get('departure'), selections, guests: Number(q.get('guests') || 1), user });
}

const quoteBox = (q, heading = 'Your quote') => `<section class="card" aria-label="${esc(heading)}"><h2 style="margin-top:0">${esc(heading)}${req('PR05')}</h2>
  <dl>${q.lines.map((l) => `<div class="kv"><dt>${esc(l.label)}<br><span class="muted">Price rule ${esc(l.rule)}</span></dt><dd class="money">${money(l.amount)}</dd></div>`).join('')}
  <div class="kv"><dt><strong>Total</strong></dt><dd class="money"><strong>${money(q.total_idr)}</strong></dd></div>
  <div class="kv"><dt>Due now <span class="muted">(${esc(q.reason)})</span></dt><dd class="money"><strong>${money(q.due_now)}</strong></dd></div>
  ${q.balance ? `<div class="kv"><dt>Balance, due by ${q.balance_due_date}</dt><dd class="money">${money(q.balance)}</dd></div>` : ''}
  <div class="kv"><dt>Rate class</dt><dd><span class="tag ${q.rate_class === 'agent' ? 'ok' : ''}">${esc(q.rate_class)}</span></dd></div>
  <div class="kv"><dt>Terms version</dt><dd>Version ${q.terms_version}</dd></div></dl></section>`;

get(/^\/checkout$/, (ctx) => {
  let q;
  try { q = quoteFromQuery(ctx.url.searchParams, ctx.user); }
  catch (e) {
    return page({ title: 'Checkout', user: ctx.user, trail: [{ label: 'Home', href: '/' }, { label: 'Checkout' }],
      body: `<h1>Checkout</h1>${alert(esc(e.message))}<p><a href="/">Return to the home page and start again</a></p>` });
  }
  const gate = core.salesGate(q.ship_id);
  const ship = one(`SELECT * FROM ships WHERE id=?`, q.ship_id);
  const hold = setting('hold_minutes', 15);
  return page({ title: 'Review and confirm', user: ctx.user,
    trail: [{ label: 'Home', href: '/' }, { label: q.service_type === 'private' ? 'Private charter' : 'Open trips', href: q.service_type === 'private' ? '/charter' : '/trips' }, { label: 'Review and confirm' }],
    body: `<h1>Review and confirm</h1>
    <p class="lede">${esc(ship.name)}, ${q.start_date} to ${q.end_date}, ${q.guests} guests. Check every line before you continue — prices are recalculated on the server and the accepted quote is frozen onto your booking.${req('PR05 · PR08')}</p>
    ${gate ? alert(esc(gate)) : ''}
    <div class="notice warn"><h2 style="margin-top:0;font-size:1.1rem">Before you continue${req('AAA 2.2.6 · 3.3.6')}</h2>
      <ul><li>Confirming places a <strong>${esc(hold)} minute hold</strong> on this space. If you do not pay within ${esc(hold)} minutes the hold is released and the space returns to sale.</li>
      <li>Nothing is charged until you complete payment on the next page, and you can leave this page without reserving anything.</li>
      <li>A confirmed booking can be cancelled under the published policy; refunds follow the cancellation terms in version ${q.terms_version} of the terms.</li></ul></div>
    <div class="split"><form method="post" action="/checkout">
      <fieldset><legend>Booking contact</legend>
        ${[...ctx.url.searchParams.entries()].map(([k, v]) => `<input type="hidden" name="${esc(k)}" value="${esc(v)}">`).join('')}
        ${field({ label: 'Full name', name: 'name', required: true, autocomplete: 'name', value: ctx.user?.name || '' })}
        ${field({ label: 'Email address', name: 'email', type: 'email', required: true, autocomplete: 'email', value: ctx.user?.email || '',
          hint: 'We send your confirmation and booking link here. The booking contact, the travellers and the payer are stored separately.' })}
        <div class="field"><label class="check" for="terms"><input type="checkbox" id="terms" name="terms" required aria-required="true">
          <span>I have reviewed the quote and accept the itinerary, terms and cancellation policy (version ${q.terms_version}).</span></label></div>
        <p class="actions"><button ${gate ? 'disabled' : ''}>Confirm and hold for ${esc(hold)} minutes</button></p>
        <p class="hint">The hold is written to the operations schedule and acknowledged before the payment page opens.${req('SYNC03')}</p>
      </fieldset></form>${quoteBox(q)}</div>` });
});

post(/^\/checkout$/, async (ctx) => {
  const f = await form(ctx.rq);
  try {
    const quote = quoteFromQuery(new URLSearchParams(f), ctx.user);
    const source = can(ctx.user, 'bookings') ? `staff:${ctx.user.email}` : ctx.user?.role === 'agent' ? 'agent' : 'web';
    const b = core.createHold(quote, { name: f.name, email: f.email }, ctx.user, source);
    const p = core.startPayment(b.id, quote.balance ? 'deposit' : 'full');
    return ctx.redirect(`/pay/${p.order_id}`);
  } catch (e) {
    return page({ title: 'Could not hold that space', user: ctx.user,
      body: `<h1>Could not hold that space</h1>${alert(esc(e.message))}
      <p>Nothing has been charged and no space has been reserved. Your details were not saved.</p>
      <p class="actions"><a class="btn" href="/charter">Search private charter dates</a> <a class="btn ghost" href="/trips">See open trip departures</a></p>` });
  }
});

/* ---------- mock Snap ---------- */
get(/^\/pay\/([\w.-]+)$/, (ctx, order_id) => {
  const p = one(`SELECT * FROM payments WHERE order_id=?`, order_id);
  if (!p) return null;
  const b = one(`SELECT * FROM bookings WHERE id=?`, p.booking_id);
  const t = gw.status(order_id);
  return page({ title: `Payment for ${b.ref}`, user: ctx.user,
    trail: [{ label: 'Home', href: '/' }, { label: `Booking ${b.ref}` }, { label: 'Payment' }],
    body: `<h1>Payment <span class="tag warn">Simulated gateway</span></h1>
    <p class="lede">This stands in for the hosted Midtrans Snap page. Choose what the gateway does; each outcome sends a signed notification to the backend. The browser redirect never confirms a booking.${req('PAY03 · AT11')}</p>
    <div class="split"><div class="card">
      <h2 style="margin-top:0">Amount due now</h2>
      <p class="big"><span class="money">${money(p.amount_idr)}</span></p>
      <dl><div class="kv"><dt>Order reference</dt><dd><code>${esc(order_id)}</code></dd></div>
      <div class="kv"><dt>Booking reference</dt><dd><strong>${esc(b.ref)}</strong></dd></div>
      <div class="kv"><dt>This payment page expires</dt><dd>${esc(t.expires_at?.slice(11, 16) ?? '')} UTC</dd></div></dl>
      <hr>
      <form method="post" action="/pay/${esc(order_id)}">
        <fieldset><legend>Simulate the gateway</legend>
        ${field({ label: 'Payment channel', name: 'channel',
          options: ['bank_transfer', 'gopay', 'credit_card', 'cstore'].map((c) => ({ v: c, t: c.replace(/_/g, ' ') })),
          hint: 'Convenience store (cstore) payments cannot be refunded through the API — pick it to exercise the manual finance path.' })}
        <div class="actions">
          <button name="outcome" value="pay">Pay ${money(p.amount_idr)} now</button>
          <button class="ghost" name="outcome" value="pending">Leave payment pending</button>
          <button class="warn" name="outcome" value="expire">Let the payment expire</button>
          <button class="bad" name="outcome" value="deny">Payment denied</button>
        </div></fieldset></form>
      <hr>
      <form method="post" action="/dev/replay"><input type="hidden" name="order_id" value="${esc(order_id)}">
        <button class="ghost">Replay the last notification twice</button>
        <p class="hint">Proves the webhook posts the payment exactly once.</p></form>
    </div>
    <section class="card" aria-label="Booking state"><h2 style="margin-top:0">Booking state${req('three independent dimensions')}</h2>
      <dl><div class="kv"><dt>Booking</dt><dd><span class="tag">${esc(b.status)}</span></dd></div>
      <div class="kv"><dt>Payment</dt><dd><span class="tag">${esc(b.payment_status)}</span></dd></div>
      <div class="kv"><dt>Schedule sync</dt><dd><span class="tag">${esc(b.sync_status)}</span></dd></div>
      <div class="kv"><dt>Hold expires</dt><dd>${esc(b.hold_expires_at?.slice(11, 16) ?? 'Not held')}</dd></div></dl></section></div>` });
});

post(/^\/pay\/([\w.-]+)$/, async (ctx, order_id) => {
  const f = await form(ctx.rq);
  const r = core.handleNotification(gw.simulate(order_id, f.outcome, f.channel));
  const p = one(`SELECT * FROM payments WHERE order_id=?`, order_id);
  const b = one(`SELECT * FROM bookings WHERE id=?`, p.booking_id);
  return ctx.redirect(r.status === 'settlement' ? `/booking/${b.ref}?t=${b.token}` : `/pay/${order_id}`);
});

post(/^\/webhooks\/midtrans$/, async (ctx) => {
  let payload; try { payload = JSON.parse(await body(ctx.rq)); } catch { payload = null; }
  const r = core.handleNotification(payload);
  return ctx.json(r.ok ? 200 : 400, r);
});

post(/^\/dev\/replay$/, async (ctx) => {
  const f = await form(ctx.rq);
  const last = one(`SELECT body FROM payment_events WHERE order_id=? ORDER BY id DESC`, f.order_id);
  if (last) { core.handleNotification(JSON.parse(last.body)); core.handleNotification(JSON.parse(last.body)); }
  return ctx.redirect(`/pay/${f.order_id}`);
});

/* ---------- booking ---------- */
get(/^\/retrieve$/, (ctx) => page({ title: 'Retrieve a booking', user: ctx.user, path: '/retrieve',
  trail: [{ label: 'Home', href: '/' }, { label: 'My booking' }],
  body: `<h1>Retrieve a booking</h1>
  <p class="lede">Enter the reference from your confirmation email together with the email address you booked with.${req('SEC01')}</p>
  <form class="filters" method="get" action="/booking">
    ${field({ label: 'Booking reference', name: 'ref', required: true, attrs: 'placeholder="PH1234567"', hint: 'Shown at the top of your confirmation, for example PH123456789.' })}
    ${field({ label: 'Email address', name: 'email', type: 'email', required: true, autocomplete: 'email' })}
    <div class="field"><button>Open my booking</button></div></form>` }));

get(/^\/booking$/, (ctx) => {
  const b = one(`SELECT * FROM bookings WHERE ref=? AND lower(contact_email)=lower(?)`,
    ctx.url.searchParams.get('ref') ?? '', ctx.url.searchParams.get('email') ?? '');
  return b ? ctx.redirect(`/booking/${b.ref}?t=${b.token}`)
    : page({ title: 'Booking not found', user: ctx.user, body: `<h1>Booking not found</h1>
        ${alert('No booking matches that reference and email address. Check the reference on your confirmation, or that you used the same email address when booking.')}
        <p><a href="/retrieve">Try retrieving your booking again</a></p>` });
});

get(/^\/booking\/([\w-]+)$/, (ctx, ref) => {
  const b = one(`SELECT * FROM bookings WHERE ref=?`, ref);
  if (!b) return null;
  const staff = ['admin', 'ops', 'finance'].includes(ctx.user?.role);
  const owner = ctx.user?.agent_org_id && ctx.user.agent_org_id === b.agent_org_id;
  if (!(staff || owner || ctx.url.searchParams.get('t') === b.token)) return ctx.deny();
  const q = JSON.parse(b.quote_json);
  const pays = all(`SELECT * FROM payments WHERE booking_id=? ORDER BY created_at`, b.id);
  const balance = b.total_idr - b.paid_idr;
  const ship = one(`SELECT * FROM ships WHERE id=?`, b.ship_id);
  const showNet = b.rate_class === 'retail' || staff || owner;
  const kind = b.status === 'confirmed' ? 'ok' : b.status === 'held' ? 'warn' : 'bad';
  const pax = all(`SELECT full_name, dietary FROM passengers WHERE booking_id=? ORDER BY created_at`, b.id);
  const alloc = all(`SELECT departure_cabin_id, units, active FROM allocations WHERE booking_id=?`, b.id)
    .map((a) => `${a.departure_cabin_id ? one(`SELECT c.name FROM departure_cabins dc JOIN cabins c ON c.id=dc.cabin_id WHERE dc.id=?`, a.departure_cabin_id).name + ' × ' + a.units : 'Whole ship'}${a.active ? '' : ' (released)'}`).join('; ');
  return page({ title: `Booking ${b.ref}`, user: ctx.user,
    trail: [{ label: 'Home', href: '/' }, { label: 'My booking', href: '/retrieve' }, { label: b.ref }],
    body: `<h1>Booking ${esc(b.ref)}</h1>
    <div class="notice ${kind}"><p><strong>${esc(b.status.replace(/_/g, ' ').toUpperCase())}.</strong>
      Payment: ${esc(b.payment_status.replace(/_/g, ' '))}. Schedule sync: ${esc(b.sync_status)}.
      ${b.conditional && b.status === 'confirmed' ? ' This is a <strong>conditional departure</strong> and remains subject to the minimum number of guests.' : ''}
      ${b.status === 'exception' ? ' Your payment arrived after the hold expired. Operations will contact you with an alternative or a refund; no space has been taken from another guest.' : ''}</p></div>
    <div class="split"><div>
      <section class="card"><h2 style="margin-top:0">${esc(ship.name)}</h2>
        <dl><div class="kv"><dt>Service</dt><dd>${b.service_type === 'private' ? 'Private charter' : 'Open trip'}</dd></div>
        <div class="kv"><dt>Dates</dt><dd>${b.start_date} to ${b.end_date} (${core.nights(b.start_date, b.end_date) + 1} days, ${core.nights(b.start_date, b.end_date)} nights)</dd></div>
        <div class="kv"><dt>Guests</dt><dd>${b.guests}</dd></div>
        <div class="kv"><dt>Allocation</dt><dd>${esc(alloc)}</dd></div>
        <div class="kv"><dt>Terms accepted</dt><dd>Version ${q.terms_version}, frozen at booking${req('CAT08 · PR08')}</dd></div></dl></section>
      <h2>Payments</h2>
      ${table(`Payment attempts for booking ${b.ref}`, ['Order reference', 'Kind', 'Amount', 'Status', 'Channel'],
        pays.map((p) => `<tr><th scope="row"><code>${esc(p.order_id)}</code></th><td>${esc(p.kind)}</td>
          <td class="money">${money(p.amount_idr)}</td>
          <td><span class="tag ${p.status === 'settlement' ? 'ok' : ''}">${esc(p.status)}</span></td>
          <td>${esc(p.channel ?? 'Not selected')}</td></tr>`))}
      ${balance > 0 && b.status === 'confirmed' ? `<form method="post" action="/booking/${b.ref}/balance">
        <input type="hidden" name="t" value="${esc(b.token)}">
        <button>Pay the remaining balance of ${money(balance)}</button>
        <p class="hint">A separate order reference on the same booking. Your reserved space is not affected.${req('PAY01 · AT13')}</p></form>` : ''}
    </div>
      <h2>Travellers${req('OPS07')}</h2>
      ${flash(ctx.url)}
      <p class="muted">${pax.length} of ${b.guests} traveller${b.guests > 1 ? 's' : ''} recorded. The crew uses these for the manifest and meals.</p>
      ${pax.length ? `<ul>${pax.map((p) => `<li>${esc(p.full_name)}${p.dietary ? ` — ${esc(p.dietary)}` : ''}</li>`).join('')}</ul>` : ''}
      ${pax.length < b.guests && !['cancelled', 'expired'].includes(b.status)
        ? passengerForm(`/booking/${b.ref}/passengers`).replace('<fieldset>', `<fieldset><input type="hidden" name="t" value="${esc(b.token)}">`) : ''}
    </div>
    <div>${showNet ? quoteBox(q, 'Accepted quote') : `<section class="card" aria-label="Voucher"><h2 style="margin-top:0">Traveller voucher</h2>
        <p class="muted">Confidential agent pricing is not shown on traveller documents.${req('PR07 · OPS09')}</p></section>`}
      <section class="card" style="margin-top:20px" aria-label="Payment summary"><h2 style="margin-top:0">Paid to date</h2>
        <p class="big"><span class="money">${money(b.paid_idr)}</span></p>
        ${balance > 0 ? `<p class="muted">Balance of ${money(balance)} due by ${esc(q.balance_due_date ?? 'the published deadline')}.</p>`
                      : '<p><span class="tag ok">Settled in full</span></p>'}</section>
      <section class="card" style="margin-top:20px" aria-label="Help"><h2 style="margin-top:0">Questions?</h2>
        <p><a class="btn ghost" href="/support?booking=${esc(b.ref)}">Chat with us about booking ${esc(b.ref)}</a></p></section></div></div>` });
});

post(/^\/booking\/([\w-]+)\/balance$/, async (ctx, ref) => {
  const f = await form(ctx.rq);
  const b = one(`SELECT * FROM bookings WHERE ref=?`, ref);
  if (!b || (f.t !== b.token && !['admin', 'ops', 'finance'].includes(ctx.user?.role))) return ctx.deny();
  return ctx.redirect(`/pay/${core.startPayment(b.id, 'balance').order_id}`);
});


post(/^\/booking\/([\w-]+)\/passengers$/, async (ctx, ref) => {
  const f = await form(ctx.rq);
  const b = one(`SELECT * FROM bookings WHERE ref=?`, ref);
  if (!b || f.t !== b.token) return ctx.deny();
  const to = `/booking/${b.ref}?t=${b.token}`;
  try { core.addPassenger(b.id, f, b.contact_email); return ctx.redirect(`${to}&ok=${encodeURIComponent('Traveller added.')}`); }
  catch (e) { return ctx.redirect(`${to}&err=${encodeURIComponent(e.message)}`); }
});

/* ---------- product pages (CAT01 preview: staff can view drafts) ---------- */
get(/^\/product\/([\w-]+)$/, (ctx, id) => {
  const p = one(`SELECT * FROM products WHERE id=?`, id);
  if (!p || (p.status !== 'published' && !can(ctx.user, 'catalog'))) return null;
  const ships = all(`SELECT s.* FROM product_ships ps JOIN ships s ON s.id=ps.ship_id WHERE ps.product_id=? AND s.status='active' ORDER BY s.name`, id);
  const deps = all(`SELECT * FROM departures WHERE product_id=? AND status='published' AND end_date >= date('now') ORDER BY start_date`, id);
  return page({ title: p.title, user: ctx.user, trail: [{ label: 'Home', href: '/' }, { label: p.title }],
    body: `${p.status !== 'published' ? `<div class="notice warn"><p><strong>Preview.</strong> This product is ${esc(p.status)} and hidden from guests.</p></div>` : ''}
    <p class="eyebrow">${esc(p.destination ?? '')} · ${p.mode === 'private' ? 'Private charter' : 'Open trip'}</p>
    <h1>${esc(p.title)}</h1><p class="lede">${esc(p.summary)}</p>
    <div class="grid g2">
      <section class="card"><h2 style="margin-top:0">Itinerary</h2><p>${esc(p.itinerary || 'To be confirmed.')}</p></section>
      <section class="card"><h2 style="margin-top:0">Included</h2><p>${esc(p.inclusions || '—')}</p><h3>Not included</h3><p>${esc(p.exclusions || '—')}</p></section></div>
    <h2>Ships</h2><ul>${ships.map((s) => `<li><a href="/ship/${s.id}">${esc(s.name)}</a> — up to ${s.capacity} guests</li>`).join('') || '<li>No ships assigned yet.</li>'}</ul>
    ${p.mode === 'private' ? `<p class="actions"><a class="btn" href="/charter?product=${esc(p.id)}">Check dates for ${esc(p.title)}</a></p>
      <p class="muted">Minimum ${Math.max(2, p.min_nights) + 1} days and ${Math.max(2, p.min_nights)} nights.</p>`
      : `<h2>Departures</h2><ul>${deps.map((d) => `<li><a href="/departure/${d.id}">${d.start_date} to ${d.end_date}</a></li>`).join('') || '<li>No departures on sale.</li>'}</ul>`}
    <p class="muted">Terms version ${p.terms_version}.</p>` });
});

/* ---------- support chat (visitor side) ---------- */
const chatCookie = (rq) => Object.fromEntries((rq.headers.cookie || '').split(';').map((p) => p.trim().split('=').map(decodeURIComponent))).chat;
const setChatCookie = (res, token) => res.setHeader('Set-Cookie',
  token ? `chat=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 30}` : 'chat=; Path=/; Max-Age=0');

get(/^\/support$/, (ctx) => {
  const c = chat.byToken(chatCookie(ctx.rq));
  const ref = ctx.url.searchParams.get('booking') || '';
  const trail = [{ label: 'Home', href: '/' }, { label: 'Chat with us' }];
  if (!c) return page({ title: 'Chat with us', user: ctx.user, path: '/support', trail, body: `<h1>Chat with us</h1>
    <p class="lede">Ask about dates, ships, a booking or anything else. Our team replies here during office hours (08:00–20:00 WITA), and by email if you have left.</p>
    ${flash(ctx.url)}
    <form method="post" action="/support"><fieldset><legend>Start a conversation</legend>
      ${field({ label: 'Your name', name: 'name', required: true, autocomplete: 'name', value: ctx.user?.name ?? '' })}
      ${field({ label: 'Email address', name: 'email', type: 'email', required: true, autocomplete: 'email', value: ctx.user?.email ?? '',
        hint: 'So we can reply if you close this page.' })}
      ${field({ label: 'Topic', name: 'subject', value: ref ? 'Question about my booking' : 'General question',
        options: ['General question', 'Private charter enquiry', 'Open trip enquiry', 'Question about my booking', 'Agent partnership'].map((t) => ({ v: t, t })) })}
      ${field({ label: 'Booking reference', name: 'booking_ref', value: ref, hint: 'Optional. Helps us find your booking straight away.' })}
      ${field({ label: 'Your message', name: 'body', type: 'textarea', required: true, attrs: 'maxlength="2000" rows="5"',
        hint: 'Up to 2,000 characters. Please do not send card numbers or passport details here.' })}
      <button>Start conversation</button></fieldset></form>` });
  chat.markRead(c.id, 'visitor');
  return page({ title: 'Chat with us', user: ctx.user, path: '/support', trail,
    script: chatClient({ stream: '/support/stream', post: '/support/message', mine: 'visitor' }),
    body: `<h1>Chat with us</h1>
    <p class="lede">${esc(c.subject)}${c.booking_ref ? ` · booking ${esc(c.booking_ref)}` : ''}. Replies also go to ${esc(c.email)}.</p>
    ${flash(ctx.url)}
    ${c.status === 'closed' ? '<p class="notice warn">This conversation was closed by our team. Sending a message reopens it.</p>' : ''}
    ${chatLog(chat.messages(c.id), 'visitor', 'Conversation with Andalusia support')}
    ${chatForm({ action: '/support/message' })}
    <form method="post" action="/support/new"><button class="ghost">Start a separate conversation</button>
      <p class="hint">This conversation stays open for our team; you will no longer see it on this device.</p></form>` });
});

post(/^\/support$/, async (ctx) => {
  const f = await form(ctx.rq);
  try {
    const { token } = chat.start({ ...f, user: ctx.user, booking_ref: f.booking_ref?.trim() || null });
    setChatCookie(ctx.res, token);
    return ctx.redirect('/support');
  } catch (e) { return ctx.redirect(`/support?err=${encodeURIComponent(e.message)}`); }
});

post(/^\/support\/message$/, async (ctx) => {
  const json = /application\/json/.test(ctx.rq.headers.accept ?? '');
  const c = chat.byToken(chatCookie(ctx.rq));
  if (!c) return json ? ctx.json(403, { error: 'Your conversation has ended. Start a new one.' }) : ctx.redirect('/support');
  try {
    const message = chat.send(c.id, 'visitor', c.name, (await form(ctx.rq)).body);
    return json ? ctx.json(200, { message }) : ctx.redirect('/support');
  } catch (e) { return json ? ctx.json(400, { error: e.message }) : ctx.redirect(`/support?err=${encodeURIComponent(e.message)}`); }
});

// a visitor can only ever subscribe to the conversation their own cookie names
get(/^\/support\/stream$/, (ctx) => {
  const c = chat.byToken(chatCookie(ctx.rq));
  if (!c) return ctx.json(403, { error: 'No conversation' });
  chat.subscribe(`conv:${c.id}`, ctx.res);
});

post(/^\/support\/new$/, (ctx) => { setChatCookie(ctx.res, null); return ctx.redirect('/support'); });

/* ---------- auth ---------- */
get(/^\/login$/, (ctx) => page({ title: 'Sign in', user: ctx.user, path: '/login',
  trail: [{ label: 'Home', href: '/' }, { label: 'Sign in' }],
  body: `<h1>Agent and staff sign in</h1>
  ${ctx.url.searchParams.get('e') ? alert('That email address and password combination was not recognised. Check both and try again.') : ''}
  <div class="split"><form method="post" action="/login">
    <fieldset><legend>Sign in</legend>
      ${field({ label: 'Email address', name: 'email', type: 'email', required: true, autocomplete: 'username' })}
      ${field({ label: 'Password', name: 'pw', type: 'password', required: true, autocomplete: 'current-password' })}
      <p class="actions"><button>Sign in</button></p></fieldset></form>
  <section class="card" aria-label="Demonstration accounts"><h2 style="margin-top:0">Demonstration accounts</h2>
    <p class="muted">The password is the role name.</p>
    <dl><div class="kv"><dt><code>agent@balisea.test</code></dt><dd>Approved agent, net rates</dd></div>
    <div class="kv"><dt><code>agent@jktvoyages.test</code></dt><dd>Suspended agent, retail rates</dd></div>
    <div class="kv"><dt><code>ops@andalusia.test</code></dt><dd>Operations</dd></div>
    <div class="kv"><dt><code>finance@andalusia.test</code></dt><dd>Finance, refunds</dd></div>
    <div class="kv"><dt><code>admin@andalusia.test</code></dt><dd>Administrator</dd></div></dl></section></div>` }));

post(/^\/login$/, async (ctx) => {
  const f = await form(ctx.rq);
  const u = one(`SELECT * FROM users WHERE lower(email)=lower(?)`, f.email ?? '');
  if (!u || !u.active || !checkPw(f.pw ?? '', u.pw)) return ctx.redirect('/login?e=1');
  audit(u.email, 'login', u.id);
  ctx.res.setHeader('Set-Cookie', `sid=${encodeURIComponent(sign(u.email))}; Path=/; HttpOnly; SameSite=Lax`);
  return ctx.redirect(u.role === 'agent' ? '/agent' : '/admin');

});

get(/^\/logout$/, (ctx) => { ctx.res.setHeader('Set-Cookie', 'sid=; Path=/; Max-Age=0'); return ctx.redirect('/'); });

/* ---------- agent portal ---------- */
get(/^\/agent$/, (ctx) => {
  if (ctx.user?.role !== 'agent') return ctx.deny();
  const org = one(`SELECT * FROM agent_orgs WHERE id=?`, ctx.user.agent_org_id);
  const rows = all(`SELECT * FROM bookings WHERE agent_org_id=? ORDER BY created_at DESC`, ctx.user.agent_org_id);
  return page({ title: 'Agent portal', user: ctx.user, trail: [{ label: 'Home', href: '/' }, { label: 'Agent portal' }],
    body: `<h1>${esc(org.name)}</h1>
    <p class="lede">Net purchase prices. You see only your own organisation's orders.${req('U06 · PR02 · PR07')}</p>
    ${org.status !== 'approved' ? alert('This agent account is suspended. New purchases fall back to retail pricing; existing bookings are unchanged.' + req('BR01 · AT06'), 'warn') : ''}
    ${table('Your organisation’s bookings', ['Reference', 'Ship', 'Dates', 'Status', 'Net total', 'Paid', 'Open'],
      rows.map((b) => `<tr><th scope="row">${esc(b.ref)}</th>
        <td>${esc(one(`SELECT name FROM ships WHERE id=?`, b.ship_id).name)}</td>
        <td>${b.start_date} to ${b.end_date}</td><td><span class="tag">${esc(b.status)}</span></td>
        <td class="money">${money(b.total_idr)}</td><td class="money">${money(b.paid_idr)}</td>
        <td><a href="/booking/${b.ref}">Open booking ${esc(b.ref)}</a></td></tr>`))}` });
});

/* ---------- administration ---------- */
registerAdmin({ get, post, form, table });
registerCatalog({ get, post, form, table });

/* ================= dispatcher ================= */
const server = createServer(async (rq, res) => {
  const url = new URL(rq.url, 'http://x');
  const ctx = {
    rq, res, url, user: userFrom(rq),
    redirect: (to) => { res.writeHead(302, { Location: to }); res.end(); },
    json: (code, o) => { res.writeHead(code, { 'content-type': 'application/json' }); res.end(JSON.stringify(o)); },
    deny: () => {
      res.writeHead(403, { 'content-type': 'text/html; charset=utf-8' });
      res.end(page({ title: 'Not permitted', user: ctx.user, body: `<h1>Not permitted</h1>
        ${alert('Your account does not have permission for this page.')}
        <p class="lede">Every sensitive action is checked on the server against the required permission, not against the pages you can reach.${req('BR01 · PR07')}</p>
        <p><a href="/">Return to the home page</a></p>` }));
    },
  };
  try {
    for (const r of routes) {
      if (r.m !== rq.method) continue;
      const m = url.pathname.match(r.re);
      if (!m) continue;
      const out = await r.fn(ctx, ...m.slice(1));
      if (out === undefined) return;
      if (out === null) break;
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store, private' });
      return res.end(out);
    }
    res.writeHead(404, { 'content-type': 'text/html; charset=utf-8' });
    res.end(page({ title: 'Page not found', user: ctx.user,
      body: `<h1>Page not found</h1><p class="lede">That address does not exist on this site.</p><p><a href="/">Return to the home page</a></p>` }));
  } catch (e) {
    console.error(e);
    res.writeHead(500, { 'content-type': 'text/html; charset=utf-8' });
    res.end(page({ title: 'Something went wrong', user: ctx.user,
      body: `<h1>Something went wrong</h1>${alert(esc(e.message))}<p><a href="/">Return to the home page</a></p>` }));
  }
});

if (process.argv[1]?.endsWith('server.js')) {
  core.startWorkers();
  const port = Number(process.env.PORT || 3000);
  server.listen(port, () => console.log(`Phinisi prototype → http://localhost:${port}`));
}
export default server;
