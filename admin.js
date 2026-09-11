// Admin: dashboard, bookings, support inbox, schedule, settings, audit. Catalogue screens live in catalog.js.
import { db, setting, setSetting, audit } from './db.js';
import * as core from './core.js';
import * as chat from './chat.js';
import * as sheets from './sheets.js';
import { page, esc, money, req, field, can, flash, adminNav, chatLog, chatForm, chatClient } from './views.js';

const one = (s, ...a) => db.prepare(s).get(...a);
const all = (s, ...a) => db.prepare(s).all(...a);
export const back = (ctx, path, msg, err = false) =>
  ctx.redirect(`${path}${path.includes('?') ? '&' : '?'}${err ? 'err' : 'ok'}=${encodeURIComponent(msg)}`);
export const hiddens = (o) => Object.entries(o).map(([k, v]) => `<input type="hidden" name="${esc(k)}" value="${esc(v)}">`).join('');
export const act = (path, label, cls = 'ghost', hidden = {}, sr = '') =>
  `<form method="post" action="${path}" style="display:inline">${hiddens(hidden)}<button class="${cls}">${label}${sr ? `<span class="vh"> ${esc(sr)}</span>` : ''}</button></form>`;
export const tag = (s) => `<span class="tag ${/confirmed|synchronized|settlement|completed|paid_in_full|approved|active|published|open|refunded/.test(s) ? 'ok'
  : /exception|failed|cancelled|suspended|archived|disputed|manual/.test(s) ? 'bad' : /held|pending|retrying|deposit|draft|closed|inactive/.test(s) ? 'warn' : ''}">${esc(String(s).replace(/_/g, ' '))}</span>`;
export const shell = (ctx, { title, active, body, crumbs = [], script = '' }) => page({
  title: `${title} · Admin`, user: ctx.user, admin: active, script,
  trail: [{ label: 'Home', href: '/' }, { label: 'Admin', href: '/admin' }, ...crumbs, { label: title }],
  body: `<h1>${esc(title)}</h1>${flash(ctx.url)}${body}` });

export default function register({ get, post, form, table }) {
  adminNav.unread = chat.staffUnread;
  const guard = (perm, fn) => (ctx, ...a) => (can(ctx.user, perm) ? fn(ctx, ...a) : ctx.deny());

  /* ---------- dashboard (OPS10: value, cash, balances and refunds are separate measures) ---------- */
  get(/^\/admin$/, guard('dashboard', (ctx) => {
    core.expireHolds();
    const k = {
      value: one(`SELECT COALESCE(SUM(total_idr),0) v FROM bookings WHERE status IN ('confirmed','completed')`).v,
      cash: one(`SELECT COALESCE(SUM(amount_idr),0) v FROM payments WHERE status='settlement'`).v,
      balance: one(`SELECT COALESCE(SUM(total_idr-paid_idr),0) v FROM bookings WHERE status='confirmed' AND paid_idr < total_idr`).v,
      refunds: one(`SELECT COALESCE(SUM(amount_idr),0) v FROM refunds WHERE status='completed'`).v,
      held: one(`SELECT count(*) c FROM bookings WHERE status='held'`).c,
      exceptions: one(`SELECT count(*) c FROM bookings WHERE status='exception' OR sync_status IN ('failed','retrying')`).c,
      chats: one(`SELECT count(*) c FROM conversations WHERE status='open'`).c, unread: chat.staffUnread(),
    };
    const lag = Math.round((Date.now() - Date.parse(setting('last_sync_at', '1970-01-01'))) / 1000);
    const stopped = setting('stop_sales') === '1';
    const blocked = JSON.parse(setting('blocked_ships', '[]'));
    const quarantined = all(`SELECT * FROM schedule_events WHERE status='quarantined' ORDER BY updated_at DESC`);
    const kpi = (label, v, note = '') => `<section class="card" aria-label="${esc(label)}"><h2 style="margin-top:0;font-size:1.05rem">${label}</h2><p class="big">${v}</p>${note ? `<p class="muted">${note}</p>` : ''}</section>`;
    return shell(ctx, { title: 'Dashboard', active: '/admin', body: `
      ${k.exceptions ? `<div class="notice bad" role="alert"><p><strong>${k.exceptions} booking exception${k.exceptions > 1 ? 's' : ''} need attention</strong> — paid but unallocated, or failed schedule synchronisation. <a href="/admin/bookings?status=attention">Review exceptions</a>${req('OPS11')}</p></div>` : ''}
      <h2>Money${req('OPS10')}</h2><div class="grid g3">
        ${kpi('Confirmed booking value', `<span class="money">${money(k.value)}</span>`, 'Contracted value, not recognised revenue.')}
        ${kpi('Cash collected', `<span class="money">${money(k.cash)}</span>`, 'Verified settlements only.')}
        ${kpi('Balances outstanding', `<span class="money">${money(k.balance)}</span>`, 'Confirmed bookings with a deposit paid.')}
        ${kpi('Refunds completed', `<span class="money">${money(k.refunds)}</span>`)}
        ${kpi('Active holds', k.held, 'Unpaid, counting down.')}
        ${kpi('Open conversations', `${k.chats}`, k.unread ? `<a href="/admin/chat">${k.unread} unread message${k.unread > 1 ? 's' : ''} in the inbox</a>` : 'Nothing unread.')}</div>
      <h2>Operations</h2><div class="grid g3">
        <section class="card" aria-label="Schedule synchronisation"><h3>Schedule sync${req('SYNC02')}</h3>
          <p class="big">${lag} seconds</p><p class="muted">Since the last accepted read. Checkout stops above ${esc(setting('stale_seconds', 120))} seconds.</p>
          ${can(ctx.user, 'schedule') ? act('/admin/sync', 'Synchronise the schedule now') : ''}</section>
        <section class="card" aria-label="Sales status"><h3>Sales</h3>
          <p>${stopped ? tag('sales stopped').replace('warn', 'bad') : '<span class="tag ok">Sales open</span>'}</p>
          <p class="muted">${blocked.length ? 'Ships blocked pending sync: ' + esc(blocked.join(', ')) : 'No ship-level blocks in place.'}</p>
          ${can(ctx.user, 'schedule') ? act('/admin/stopsales', stopped ? 'Resume all sales' : 'Stop all sales', stopped ? 'ghost' : 'bad') : ''}</section>
        <section class="card" aria-label="Sheets connection"><h3>Sheets connection</h3>
          ${can(ctx.user, 'schedule') ? `<form method="post" action="/admin/sheetsmode">
            ${field({ label: 'Simulated connection state', name: 'mode', value: setting('sheets_mode', 'ok'),
              options: [{ v: 'ok', t: 'Healthy' }, { v: 'fail', t: 'Unreachable' }, { v: 'timeout_after_write', t: 'Times out after writing' }],
              hint: 'Fault injection for acceptance tests AT09 and AT14.' })}
            <button class="ghost">Apply connection state</button></form>` : '<p class="muted">Operations manage the connection.</p>'}
          ${act('/admin/flush', 'Retry the sync queue')}</section></div>
      ${quarantined.length ? `<h2>Quarantined schedule edits${req('SYNC06 · AT10')}</h2>
        ${table('Manual sheet edits that collide with committed inventory', ['Schedule ID', 'Ship', 'Requested interval', 'Reason'],
          quarantined.map((q) => `<tr><th scope="row"><code>${esc(q.id)}</code></th><td>${esc(q.ship_id)}</td><td>${q.start_date} to ${q.end_date}</td><td>${esc(q.note)}</td></tr>`))}` : ''}
      <h2>Latest bookings</h2>${bookingTable(all(`SELECT b.*, s.name ship FROM bookings b JOIN ships s ON s.id=b.ship_id ORDER BY b.created_at DESC LIMIT 8`), table)}
      <p><a href="/admin/bookings">See all bookings</a></p>` });
  }));

  post(/^\/admin\/sync$/, guard('schedule', (ctx) => { core.syncSchedule(); core.flushOutbox(); return back(ctx, '/admin', 'Schedule synchronised.'); }));
  post(/^\/admin\/flush$/, guard('dashboard', (ctx) => {
    db.prepare(`UPDATE outbox SET status='pending', next_at=? WHERE status='failed'`).run(core.now());
    const r = core.flushOutbox();
    return back(ctx, '/admin', `Sync queue retried: ${r.sent} sent, ${r.failed} still failing.`, r.failed > 0);
  }));
  post(/^\/admin\/stopsales$/, guard('schedule', (ctx) => {
    setSetting('stop_sales', setting('stop_sales') === '1' ? '0' : '1');
    audit(ctx.user.email, 'stop_sales', 'settings', setting('stop_sales'));
    return back(ctx, '/admin', setting('stop_sales') === '1' ? 'All sales stopped.' : 'Sales resumed.');
  }));
  post(/^\/admin\/sheetsmode$/, guard('schedule', async (ctx) => {
    const mode = (await form(ctx.rq)).mode;
    if (!['ok', 'fail', 'timeout_after_write'].includes(mode)) return back(ctx, '/admin', 'Unknown connection state', true);
    setSetting('sheets_mode', mode); audit(ctx.user.email, 'sheets_mode', 'settings', mode);
    return back(ctx, '/admin', `Sheets connection set to ${mode.replace(/_/g, ' ')}.`);
  }));

  /* ---------- bookings (OPS01) ---------- */
  get(/^\/admin\/bookings$/, guard('bookings', (ctx) => {
    core.expireHolds();
    const q = Object.fromEntries(ctx.url.searchParams);
    const where = [], args = [];
    if (q.q) { where.push(`(b.ref LIKE ? OR b.contact_email LIKE ? OR b.contact_name LIKE ?)`); args.push(`%${q.q}%`, `%${q.q}%`, `%${q.q}%`); }
    if (q.status === 'attention') where.push(`(b.status='exception' OR b.sync_status IN ('failed','retrying'))`);
    else if (q.status) { where.push('b.status=?'); args.push(q.status); }
    for (const k of ['payment_status', 'sync_status', 'service_type', 'ship_id', 'agent_org_id']) if (q[k]) { where.push(`b.${k}=?`); args.push(q[k]); }
    if (q.from) { where.push('b.start_date >= ?'); args.push(q.from); }
    if (q.to) { where.push('b.start_date <= ?'); args.push(q.to); }
    const rows = all(`SELECT b.*, s.name ship FROM bookings b JOIN ships s ON s.id=b.ship_id ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
                      ORDER BY b.created_at DESC LIMIT 200`, ...args);
    const opt = (list) => [{ v: '', t: 'Any' }, ...list.map((x) => (typeof x === 'string' ? { v: x, t: x.replace(/_/g, ' ') } : x))];
    return shell(ctx, { title: 'Bookings', active: '/admin/bookings', body: `
      <p class="lede">Search by reference, guest, dates, ship, service, agent, payment state or synchronisation status.${req('OPS01')}</p>
      <form class="filters" method="get" action="/admin/bookings"><h2 class="vh">Filter bookings</h2>
        ${field({ label: 'Reference, name or email', name: 'q', type: 'search', value: q.q ?? '' })}
        ${field({ label: 'Booking status', name: 'status', value: q.status ?? '', options: opt([{ v: 'attention', t: 'Needs attention' }, 'held', 'confirmed', 'exception', 'cancelled', 'expired', 'completed']) })}
        ${field({ label: 'Payment', name: 'payment_status', value: q.payment_status ?? '', options: opt(['unpaid', 'pending', 'deposit_paid', 'paid_in_full', 'failed', 'partially_refunded', 'refunded']) })}
        ${field({ label: 'Sheets sync', name: 'sync_status', value: q.sync_status ?? '', options: opt(['pending', 'synchronized', 'retrying', 'failed']) })}
        ${field({ label: 'Service', name: 'service_type', value: q.service_type ?? '', options: opt([{ v: 'private', t: 'Private charter' }, { v: 'open', t: 'Open trip' }]) })}
        ${field({ label: 'Ship', name: 'ship_id', value: q.ship_id ?? '', options: opt(all(`SELECT id v, name t FROM ships ORDER BY name`)) })}
        ${field({ label: 'Agent', name: 'agent_org_id', value: q.agent_org_id ?? '', options: opt(all(`SELECT id v, name t FROM agent_orgs ORDER BY name`)) })}
        ${field({ label: 'Departing from', name: 'from', type: 'date', value: q.from ?? '' })}
        ${field({ label: 'Departing to', name: 'to', type: 'date', value: q.to ?? '' })}
        <div class="field actions"><button>Apply filters</button><a href="/admin/bookings">Clear filters</a></div></form>
      <p role="status">${rows.length} booking${rows.length === 1 ? '' : 's'} found.</p>
      ${bookingTable(rows, table)}` });
  }));

  get(/^\/admin\/bookings\/([\w-]+)$/, guard('bookings', (ctx, ref) => {
    const b = one(`SELECT b.*, s.name ship FROM bookings b JOIN ships s ON s.id=b.ship_id WHERE b.ref=?`, ref);
    if (!b) return null;
    const q = JSON.parse(b.quote_json);
    const refunds = all(`SELECT * FROM refunds WHERE booking_id=? ORDER BY created_at`, b.id);
    const refunded = refunds.filter((r) => ['completed', 'pending'].includes(r.status)).reduce((s, r) => s + r.amount_idr, 0);
    const pax = all(`SELECT * FROM passengers WHERE booking_id=? ORDER BY created_at`, b.id);
    const convs = all(`SELECT id, name, subject, status, updated_at FROM conversations WHERE booking_ref=? ORDER BY updated_at DESC`, b.ref);
    const closed = ['cancelled', 'expired'].includes(b.status);
    return shell(ctx, { title: `Booking ${b.ref}`, active: '/admin/bookings', crumbs: [{ label: 'Bookings', href: '/admin/bookings' }], body: `
      <p>${tag(b.status)} ${tag(b.payment_status)} ${tag(b.sync_status)}</p>
      <div class="split"><div>
        <section class="card"><h2 style="margin-top:0">Trip</h2><dl>
          <div class="kv"><dt>Ship</dt><dd>${esc(b.ship)}</dd></div>
          <div class="kv"><dt>Service</dt><dd>${b.service_type === 'private' ? 'Private charter' : `Open trip · <a href="/admin/departures/${esc(b.departure_id)}">${esc(b.departure_id)}</a>`}</dd></div>
          <div class="kv"><dt>Dates</dt><dd>${b.start_date} to ${b.end_date}</dd></div>
          <div class="kv"><dt>Guests</dt><dd>${b.guests}</dd></div>
          <div class="kv"><dt>Contact</dt><dd>${esc(b.contact_name)}<br>${esc(b.contact_email)}</dd></div>
          <div class="kv"><dt>Channel</dt><dd>${esc(b.source ?? 'web')}${b.agent_org_id ? ` · agent ${esc(b.agent_org_id)}` : ''}</dd></div>
          <div class="kv"><dt>Rate class</dt><dd>${esc(b.rate_class)} · terms v${q.terms_version}</dd></div></dl></section>
        <h2>Payments</h2>${table(`Payments for ${b.ref}`, ['Order reference', 'Kind', 'Amount', 'Status', 'Channel'],
          all(`SELECT * FROM payments WHERE booking_id=? ORDER BY created_at`, b.id).map((p) => `<tr><th scope="row"><code>${esc(p.order_id)}</code></th>
            <td>${esc(p.kind)}</td><td class="money">${money(p.amount_idr)}</td><td>${tag(p.status)}</td><td>${esc(p.channel ?? '—')}</td></tr>`))}
        <h2>Refunds${req('OPS05')}</h2>${table(`Refunds for ${b.ref}`, ['Requested', 'Amount', 'Reason', 'Status', 'Reference', 'Action'],
          refunds.map((r) => `<tr><th scope="row">${r.created_at.slice(0, 16).replace('T', ' ')}</th><td class="money">${money(r.amount_idr)}</td>
            <td>${esc(r.reason)}</td><td>${tag(r.status)}</td><td class="muted">${esc(r.reference ?? '—')}</td>
            <td>${r.status === 'pending' && can(ctx.user, 'refunds') ? act(`/admin/bookings/${b.ref}/refunds/${r.id}/execute`, 'Execute', 'ghost', {}, `refund of ${money(r.amount_idr)}`) : ''}</td></tr>`))}
        <h2>Passenger manifest${req('OPS07')}</h2>
        <p class="muted">${pax.length} of ${b.guests} traveller${b.guests > 1 ? 's' : ''} recorded. Booking contact and travellers are kept separately.</p>
        ${table(`Travellers on ${b.ref}`, ['Name', 'Nationality', 'Birth year', 'Dietary needs', 'Emergency contact', 'Action'],
          pax.map((p) => `<tr><th scope="row">${esc(p.full_name)}</th><td>${esc(p.nationality)}</td><td>${esc(p.birth_year ?? '')}</td>
            <td>${esc(p.dietary)}</td><td>${esc(p.emergency_contact)}</td>
            <td>${can(ctx.user, 'cancel') ? act(`/admin/bookings/${b.ref}/passengers/${p.id}/remove`, 'Remove', 'ghost', {}, p.full_name) : ''}</td></tr>`))}
        ${can(ctx.user, 'cancel') && pax.length < b.guests ? passengerForm(`/admin/bookings/${b.ref}/passengers`) : ''}
        <h2>Timeline${req('DATA01')}</h2>${table(`Audited events for ${b.ref}`, ['When', 'Actor', 'Action', 'Detail'],
          all(`SELECT * FROM audit WHERE entity IN (?,?) ORDER BY id`, b.ref, b.id).map((a) => `<tr><th scope="row">${a.at.slice(0, 19).replace('T', ' ')}</th>
            <td>${esc(a.actor)}</td><td>${esc(a.action.replace(/_/g, ' '))}</td><td class="muted">${esc(a.detail)}</td></tr>`))}
      </div><div>
        <section class="card" aria-label="Balance"><h2 style="margin-top:0">Money</h2><dl>
          <div class="kv"><dt>Total</dt><dd class="money">${money(b.total_idr)}</dd></div>
          <div class="kv"><dt>Paid</dt><dd class="money">${money(b.paid_idr)}</dd></div>
          <div class="kv"><dt>Outstanding</dt><dd class="money">${money(Math.max(0, b.total_idr - b.paid_idr))}</dd></div>
          <div class="kv"><dt>Refunded or pending</dt><dd class="money">${money(refunded)}</dd></div></dl></section>
        ${!closed && can(ctx.user, 'cancel') ? `<form method="post" action="/admin/bookings/${b.ref}/cancel" style="margin-top:20px"><fieldset><legend>Cancel booking${req('OPS04')}</legend>
          <p class="hint">Releases the inventory. Money is returned separately through a refund.</p>
          ${field({ label: 'Reason', name: 'reason', required: true })}
          ${field({ label: 'Cancellation fee (IDR)', name: 'fee_idr', type: 'number', value: '0', attrs: 'min="0" step="1"' })}
          <button class="bad">Cancel ${esc(b.ref)}</button></fieldset></form>` : ''}
        ${b.paid_idr - refunded > 0 && can(ctx.user, 'refunds') ? `<form method="post" action="/admin/bookings/${b.ref}/refund" style="margin-top:20px"><fieldset><legend>Request a refund</legend>
          ${field({ label: 'Amount (IDR)', name: 'amount_idr', type: 'number', value: String(b.paid_idr - refunded), required: true, attrs: `min="1" max="${b.paid_idr - refunded}" step="1"`,
            hint: `At most ${money(b.paid_idr - refunded)} — the amount paid less refunds already made.` })}
          ${field({ label: 'Reason', name: 'reason', required: true })}
          <button class="warn">Request refund</button></fieldset></form>` : ''}
        <section class="card" style="margin-top:20px" aria-label="Conversations"><h2 style="margin-top:0">Conversations</h2>
          ${convs.length ? `<ul>${convs.map((c) => `<li><a href="/admin/chat/${c.id}">${esc(c.subject)} — ${esc(c.name)}</a> ${tag(c.status)}</li>`).join('')}</ul>` : '<p class="muted">No chat about this booking.</p>'}</section>
        <p class="actions" style="margin-top:20px"><a class="btn ghost" href="/booking/${b.ref}">Open the guest view</a>
          ${act(`/admin/bookings/${b.ref}/resync`, 'Re-send to schedule sheet')}</p>
      </div></div>` });
  }));

  const bookingPost = (path, perm, fn) => post(new RegExp(`^/admin/bookings/([\\w-]+)${path}$`), guard(perm, async (ctx, ref, extra) => {
    const b = one(`SELECT * FROM bookings WHERE ref=?`, ref);
    if (!b) return null;
    try { return back(ctx, `/admin/bookings/${ref}`, await fn(ctx, b, await form(ctx.rq), extra)); }
    catch (e) { return back(ctx, `/admin/bookings/${ref}`, e.message, true); }
  }));
  bookingPost('/cancel', 'cancel', (ctx, b, f) => {
    if (!String(f.reason ?? '').trim()) throw new Error('Give a reason for the cancellation');
    const fee = Math.max(0, Math.round(Number(f.fee_idr || 0)));
    const { refundable } = core.cancelBooking(b.id, ctx.user.email, f.reason, fee);
    return `Booking cancelled and inventory released. ${money(refundable)} is refundable under that fee.`;
  });
  bookingPost('/refund', 'refunds', (ctx, b, f) => {
    if (!String(f.reason ?? '').trim()) throw new Error('Give a reason for the refund');
    core.requestRefund(b.id, Math.round(Number(f.amount_idr)), f.reason, ctx.user.email);
    return 'Refund requested. Execute it once approved.';
  });
  bookingPost('/refunds/([\\w-]+)/execute', 'refunds', (ctx, b, f, id) => {
    const r = core.executeRefund(id, ctx.user.email);
    if (!r.ok) throw new Error(`Gateway refused: ${r.error}. Marked for manual refund by finance.`);
    return 'Refund completed and reconciled.';
  });
  bookingPost('/passengers', 'cancel', (ctx, b, f) => { core.addPassenger(b.id, f, ctx.user.email); return 'Traveller added.'; });
  bookingPost('/passengers/([\\w-]+)/remove', 'cancel', (ctx, b, f, id) => { core.removePassenger(b.id, id, ctx.user.email); return 'Traveller removed.'; });
  bookingPost('/resync', 'bookings', (ctx, b) => {
    core.enqueueSync(b.id);
    const r = core.flushOutbox();
    if (r.failed) throw new Error('The sheet is still unreachable; the update stays queued for retry.');
    return 'Booking re-sent to the schedule sheet.';
  });

  /* ---------- support inbox ---------- */
  get(/^\/admin\/chat\/stream$/, guard('chat', (ctx) => { chat.subscribe('staff', ctx.res); }));

  get(/^\/admin\/chat$/, guard('chat', (ctx) => {
    const status = ctx.url.searchParams.get('status') || 'open', q = ctx.url.searchParams.get('q') || '';
    const rows = chat.inbox({ status, q });
    return shell(ctx, { title: 'Support inbox', active: '/admin/chat', body: `
      <p class="lede">Conversations started from the site's <a href="/support">Chat with us</a> page and from booking pages.</p>
      <form class="filters" method="get" action="/admin/chat"><h2 class="vh">Filter conversations</h2>
        ${field({ label: 'Show', name: 'status', value: status, options: [{ v: 'open', t: 'Open' }, { v: 'closed', t: 'Closed' }, { v: 'all', t: 'All' }] })}
        ${field({ label: 'Name, email, subject or booking', name: 'q', type: 'search', value: q })}
        <div class="field"><button>Filter</button></div></form>
      <p id="inbox-live" role="status" class="muted"></p>
      ${table(`${rows.length} conversation${rows.length === 1 ? '' : 's'}`, ['Visitor', 'Subject', 'Latest message', 'Booking', 'Assigned', 'Updated', 'Unread'],
        rows.map((c) => `<tr><th scope="row"><a href="/admin/chat/${c.id}">${esc(c.name)}</a><br><span class="muted">${esc(c.email)}</span></th>
          <td>${esc(c.subject)} ${tag(c.status)}</td><td class="muted">${esc((c.last ?? '').slice(0, 80))}</td>
          <td>${c.booking_ref ? `<a href="/admin/bookings/${esc(c.booking_ref)}">${esc(c.booking_ref)}</a>` : '—'}</td>
          <td>${esc(c.assigned_to ?? 'Unassigned')}</td><td>${c.updated_at.slice(0, 16).replace('T', ' ')}</td>
          <td>${c.unread ? `<span class="count">${c.unread}</span>` : '0'}</td></tr>`))}`,
      // announces activity instead of reshuffling the table under the reader (3.2.5 change on request)
      script: `<script>(() => { if (!window.EventSource) return; const s = document.getElementById('inbox-live');
        new EventSource('/admin/chat/stream').addEventListener('conversation', (e) => { const c = JSON.parse(e.data);
          s.innerHTML = 'New activity from ' + c.name.replace(/[<>&]/g, '') + '. <a href="">Refresh the inbox</a>'; }); })();</script>` });
  }));

  const convRoute = (suffix) => new RegExp(`^/admin/chat/([0-9a-f-]{36})${suffix}$`);
  get(convRoute('/stream'), guard('chat', (ctx, id) => { if (!chat.get(id)) return null; chat.subscribe(`conv:${id}`, ctx.res); }));

  get(convRoute(''), guard('chat', (ctx, id) => {
    const c = chat.get(id);
    if (!c) return null;
    chat.markRead(id, 'staff');
    const staff = all(`SELECT email, name FROM users WHERE role IN ('admin','ops','finance') AND active=1 ORDER BY name`);
    return shell(ctx, { title: `Chat with ${c.name}`, active: '/admin/chat', crumbs: [{ label: 'Inbox', href: '/admin/chat' }],
      script: chatClient({ stream: `/admin/chat/${id}/stream`, post: `/admin/chat/${id}/reply`, mine: 'staff' }), body: `
      <div class="split"><div>
        ${chatLog(chat.messages(id), 'staff', `Conversation with ${c.name}`)}
        ${c.status === 'closed' ? '<p class="notice warn">This conversation is closed. Replying reopens it.</p>' : ''}
        ${chatForm({ action: `/admin/chat/${id}/reply`, label: `Reply to ${c.name}` })}
      </div><div>
        <section class="card" aria-label="Visitor"><h2 style="margin-top:0">${esc(c.name)}</h2><dl>
          <div class="kv"><dt>Email</dt><dd><a href="mailto:${esc(c.email)}">${esc(c.email)}</a></dd></div>
          <div class="kv"><dt>Subject</dt><dd>${esc(c.subject)}</dd></div>
          <div class="kv"><dt>Booking</dt><dd>${c.booking_ref ? `<a href="/admin/bookings/${esc(c.booking_ref)}">${esc(c.booking_ref)}</a>` : 'None linked'}</dd></div>
          <div class="kv"><dt>Signed in</dt><dd>${c.user_id ? esc(one(`SELECT name FROM users WHERE id=?`, c.user_id)?.name ?? c.user_id) : 'Guest'}</dd></div>
          <div class="kv"><dt>Status</dt><dd>${tag(c.status)}</dd></div>
          <div class="kv"><dt>Started</dt><dd>${c.created_at.slice(0, 16).replace('T', ' ')} UTC</dd></div></dl></section>
        <form method="post" action="/admin/chat/${id}/assign" style="margin-top:20px"><fieldset><legend>Assignment</legend>
          ${field({ label: 'Assigned to', name: 'email', value: c.assigned_to ?? '', options: [{ v: '', t: 'Unassigned' }, ...staff.map((s) => ({ v: s.email, t: s.name }))] })}
          <button class="ghost">Save assignment</button></fieldset></form>
        <p class="actions" style="margin-top:20px">${c.status === 'open'
          ? act(`/admin/chat/${id}/status`, 'Close conversation', 'ghost', { status: 'closed' })
          : act(`/admin/chat/${id}/status`, 'Reopen conversation', 'ghost', { status: 'open' })}</p>
      </div></div>` });
  }));

  post(convRoute('/reply'), guard('chat', async (ctx, id) => {
    const json = /application\/json/.test(ctx.rq.headers.accept ?? '');
    try {
      const message = chat.send(id, 'staff', ctx.user.name, (await form(ctx.rq)).body);
      return json ? ctx.json(200, { message }) : ctx.redirect(`/admin/chat/${id}`);
    } catch (e) { return json ? ctx.json(400, { error: e.message }) : back(ctx, `/admin/chat/${id}`, e.message, true); }
  }));
  post(convRoute('/status'), guard('chat', async (ctx, id) => {
    try { chat.setStatus(id, (await form(ctx.rq)).status, ctx.user.email); return back(ctx, `/admin/chat/${id}`, 'Status updated.'); }
    catch (e) { return back(ctx, `/admin/chat/${id}`, e.message, true); }
  }));
  post(convRoute('/assign'), guard('chat', async (ctx, id) => {
    const email = (await form(ctx.rq)).email || '';
    if (email && !one(`SELECT 1 FROM users WHERE email=? AND role IN ('admin','ops','finance')`, email)) return back(ctx, `/admin/chat/${id}`, 'Not a staff member', true);
    chat.assign(id, email, ctx.user.email);
    return back(ctx, `/admin/chat/${id}`, email ? `Assigned to ${email}.` : 'Unassigned.');
  }));

  /* ---------- schedule workbook (U07) ---------- */
  get(/^\/admin\/sheets$/, guard('schedule', (ctx) => {
    const wb = sheets.load();
    const tab = (name, rows, caption) => `<h2>${esc(name)} <span class="muted">${rows.length} row${rows.length === 1 ? '' : 's'}</span></h2>` +
      (rows.length ? table(caption, Object.keys(rows[0]).map(esc), rows.slice(0, 25).map((r) => `<tr>${Object.keys(rows[0]).map((k, i) => i === 0
        ? `<th scope="row">${esc(r[k] ?? '')}</th>` : `<td class="muted">${esc(r[k] ?? '')}</td>`).join('')}</tr>`)) : '<p class="muted">This tab is empty.</p>');
    return shell(ctx, { title: 'Schedule workbook', active: '/admin/sheets', body: `
      <p class="lede">Operations edit <strong>ScheduleInputs</strong>; the application validates each revision and writes back the result. <strong>BookingProjection</strong> is machine-written.${req('U07 · SH01–SH05')}</p>
      <form method="post" action="/admin/sheets/add"><fieldset><legend>Write a schedule request row</legend>
        <div class="filters" style="border:0;padding:0;background:transparent">
        ${field({ label: 'Schedule ID', name: 'schedule_id', value: `SI-${Math.floor(Math.random() * 9000 + 1000)}`, required: true })}
        ${field({ label: 'Ship', name: 'ship_id', options: all(`SELECT id v, name t FROM ships`) })}
        ${field({ label: 'Event type', name: 'event_type', options: ['maintenance', 'external_charter'].map((t) => ({ v: t, t: t.replace(/_/g, ' ') })) })}
        ${field({ label: 'Start date', name: 'start_at', type: 'date', required: true })}
        ${field({ label: 'End date', name: 'end_at', type: 'date', required: true })}
        ${field({ label: 'Operator note', name: 'operator_note' })}
        <div class="field"><button>Write the row to the sheet</button></div></div>
        <p class="hint">Then synchronise from the dashboard. A row that collides with a paid booking is quarantined, never applied.${req('AT10')}</p>
      </fieldset></form>
      ${tab('ScheduleInputs', wb.ScheduleInputs, 'Schedule requests entered by operations')}
      ${tab('BookingProjection', wb.BookingProjection, 'Protected booking projection')}
      ${tab('SyncResults', wb.SyncResults, 'Accepted revisions and rejection reasons')}
      ${tab('AvailabilityView', wb.AvailabilityView, 'Derived remaining inventory')}` });
  }));
  post(/^\/admin\/sheets\/add$/, guard('schedule', async (ctx) => {
    sheets.addScheduleInput(await form(ctx.rq));
    return back(ctx, '/admin/sheets', 'Row written. Synchronise to validate it.');
  }));

  /* ---------- settings ---------- */
  const SETTINGS = [
    ['deposit_percent', 'Deposit percentage', 0, 90, 'Set 0 to always take full payment (PAY02).'],
    ['balance_days_before', 'Balance due, days before departure', 0, 180, 'Bookings made inside this window pay in full.'],
    ['hold_minutes', 'Hold length in minutes', 5, 60, 'Stated to guests before they commit (2.2.6).'],
    ['stale_seconds', 'Stale schedule threshold in seconds', 30, 600, 'Checkout stops when the schedule is older than this (SYNC02).'],
  ];
  get(/^\/admin\/settings$/, guard('settings', (ctx) => shell(ctx, { title: 'Settings', active: '/admin/settings', body: `
    <p class="lede">Commercial and integration policy. Every change is audited. Decisions D07 and D10 remain for finance to confirm.</p>
    <form method="post" action="/admin/settings"><fieldset><legend>Booking policy</legend>
      ${SETTINGS.map(([k, label, min, max, hint]) => field({ label, name: k, type: 'number', value: setting(k, ''), required: true,
        attrs: `min="${min}" max="${max}" step="1"`, hint: `${hint} Allowed ${min}–${max}.` })).join('')}
      <button>Save settings</button></fieldset></form>` })));
  post(/^\/admin\/settings$/, guard('settings', async (ctx) => {
    const f = await form(ctx.rq);
    for (const [k, label, min, max] of SETTINGS) {
      const n = Number(f[k]);
      if (!Number.isInteger(n) || n < min || n > max) return back(ctx, '/admin/settings', `${label} must be a whole number from ${min} to ${max}`, true);
    }
    for (const [k] of SETTINGS) if (String(setting(k)) !== String(Number(f[k]))) { audit(ctx.user.email, 'setting_changed', k, `${setting(k)} → ${Number(f[k])}`); setSetting(k, Number(f[k])); }
    return back(ctx, '/admin/settings', 'Settings saved.');
  }));

  /* ---------- audit ---------- */
  get(/^\/admin\/audit$/, guard('audit', (ctx) => {
    const q = ctx.url.searchParams.get('q') || '';
    const rows = all(`SELECT * FROM audit WHERE ?='' OR actor LIKE ? OR action LIKE ? OR entity LIKE ? OR detail LIKE ? ORDER BY id DESC LIMIT 200`,
      q, `%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`);
    return shell(ctx, { title: 'Audit log', active: '/admin/audit', body: `
      <p class="lede">Every significant change with its actor, time and detail. Read-only.${req('DATA01 · DATA02')}</p>
      <form class="filters" method="get" action="/admin/audit"><h2 class="vh">Search the audit log</h2>
        ${field({ label: 'Actor, action, entity or detail', name: 'q', type: 'search', value: q })}<div class="field"><button>Search</button></div></form>
      ${table(`${rows.length} most recent matching events`, ['When (UTC)', 'Actor', 'Action', 'Entity', 'Detail'],
        rows.map((a) => `<tr><th scope="row">${a.at.slice(0, 19).replace('T', ' ')}</th><td>${esc(a.actor)}</td>
          <td>${esc(a.action.replace(/_/g, ' '))}</td><td><code>${esc(a.entity)}</code></td><td class="muted">${esc(a.detail)}</td></tr>`))}` });
  }));
}

export const passengerForm = (action) => `<form method="post" action="${action}"><fieldset><legend>Add a traveller</legend>
  ${field({ label: 'Full name as on passport', name: 'full_name', required: true, autocomplete: 'off' })}
  ${field({ label: 'Nationality', name: 'nationality', autocomplete: 'off' })}
  ${field({ label: 'Year of birth', name: 'birth_year', type: 'number', attrs: 'min="1900" max="2026" step="1"' })}
  ${field({ label: 'Dietary needs', name: 'dietary', hint: 'For example vegetarian, or a nut allergy.' })}
  ${field({ label: 'Emergency contact', name: 'emergency_contact', hint: 'Name and phone number of someone not travelling.' })}
  <button class="ghost">Add traveller</button></fieldset></form>`;

function bookingTable(rows, table) {
  return table('Bookings, most recent first', ['Reference', 'Ship', 'Departs', 'Booking', 'Payment', 'Sheets', 'Paid of total'],
    rows.map((b) => `<tr><th scope="row"><a href="/admin/bookings/${b.ref}">${esc(b.ref)}</a><br><span class="muted">${esc(b.contact_email)}</span></th>
      <td>${esc(b.ship)}<br><span class="muted">${b.service_type === 'private' ? 'Private' : 'Open trip'}</span></td>
      <td class="money">${b.start_date}</td><td>${tag(b.status)}</td><td>${tag(b.payment_status)}</td><td>${tag(b.sync_status)}</td>
      <td class="money">${money(b.paid_idr)}<br><span class="muted">of ${money(b.total_idr)}</span></td></tr>`));
}
