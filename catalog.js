// Admin catalogue: ships & cabins, products, departures, rates, agents, users (U03, U04, U06, CAT01-CAT08, BR01).
import { db, audit, hashPw, checkPw } from './db.js';
import * as core from './core.js';
import { esc, money, req, field, can, TOKENS } from './views.js';
import { shell, back, act, tag } from './admin.js';

const one = (s, ...a) => db.prepare(s).get(...a);
const all = (s, ...a) => db.prepare(s).all(...a);
const run = (s, ...a) => db.prepare(s).run(...a);
const txt = (v, n = 200) => String(v ?? '').trim().slice(0, n);
const int = (v, min, max, label) => {
  const n = Number(v);
  if (!Number.isInteger(n) || n < min || n > max) throw new Error(`${label} must be a whole number from ${min} to ${max}`);
  return n;
};
const slug = (prefix, s) => `${prefix}-${String(s).toUpperCase().replace(/[^A-Z0-9]+/g, '').slice(0, 10) || Date.now().toString(36).toUpperCase()}`;
const lum = (h) => h.replace('#', '').match(/../g).map((x) => parseInt(x, 16) / 255)
  .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)).reduce((s, v, i) => s + v * [0.2126, 0.7152, 0.0722][i], 0);
const contrast = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const checkbox = (id, name, label, checked, attrs = '') => `<div class="field"><label class="check" for="${id}">
  <input type="checkbox" id="${id}" name="${name}" value="1"${checked ? ' checked' : ''} ${attrs}><span>${esc(label)}</span></label></div>`;

export default function register({ get, post, form, table }) {
  const guard = (perm, fn) => (ctx, ...a) => (can(ctx.user, perm) ? fn(ctx, ...a) : ctx.deny());
  // every catalogue POST: validate, audit inside the action, redirect back with a message
  const save = (re, perm, to, fn) => post(re, guard(perm, async (ctx, ...a) => {
    const f = await form(ctx.rq);
    const dest = typeof to === 'function' ? to(...a) : to;
    try { const r = await fn(ctx, f, ...a); return back(ctx, r?.to ?? dest, r?.msg ?? r); }
    catch (e) { return back(ctx, dest, e.message, true); }
  }));

  /* ================= ships & cabins (U04, CAT03, CAT04, CAT07) ================= */
  const shipFields = (s = {}) => `
    ${field({ label: 'Ship name', name: 'name', value: s.name ?? '', required: true })}
    ${field({ label: 'Description', name: 'description', type: 'textarea', value: s.description ?? '', attrs: 'rows="3"' })}
    ${field({ label: 'Embarkation port', name: 'embarkation', value: s.embarkation ?? 'Labuan Bajo', required: true })}
    ${field({ label: 'Permitted guest capacity', name: 'capacity', type: 'number', value: s.capacity ?? 10, required: true, attrs: 'min="1" max="60"',
      hint: 'The legal or operator-approved limit. Cabin capacity and this limit both constrain sales.' })}
    ${field({ label: 'Turnaround days between trips', name: 'turnaround_days', type: 'number', value: s.turnaround_days ?? 1, required: true, attrs: 'min="0" max="7"' })}
    ${field({ label: 'Timezone', name: 'timezone', value: s.timezone ?? 'Asia/Makassar', required: true })}
    ${field({ label: 'Card colour', name: 'photo', type: 'color', value: s.photo ?? '#143F45',
      hint: 'Carries cream text, so it must reach 7:1 contrast. Darker colours pass.' })}`;
  const readShip = (f) => {
    const s = { name: txt(f.name, 80), description: txt(f.description, 600), embarkation: txt(f.embarkation, 80),
      capacity: int(f.capacity, 1, 60, 'Capacity'), turnaround_days: int(f.turnaround_days, 0, 7, 'Turnaround'),
      timezone: txt(f.timezone, 40) || 'Asia/Makassar', photo: /^#[0-9a-f]{6}$/i.test(f.photo ?? '') ? f.photo : '#143F45' };
    if (!s.name) throw new Error('Give the ship a name');
    if (contrast(TOKENS.onDeep, s.photo) < 7) throw new Error(`That card colour gives ${contrast(TOKENS.onDeep, s.photo).toFixed(1)}:1 against its caption; choose a darker colour (7:1 needed)`);
    return s;
  };

  get(/^\/admin\/ships$/, guard('catalog', (ctx) => shell(ctx, { title: 'Ships', active: '/admin/ships', body: `
    <p class="lede">Ships are independent of services. A ship ID never changes; archive instead of deleting.${req('U04 · CAT03 · CAT07')}</p>
    ${table('Fleet', ['Ship', 'Port', 'Capacity', 'Cabins', 'Future bookings', 'Status'],
      all(`SELECT s.*, (SELECT count(*) FROM cabins c WHERE c.ship_id=s.id AND c.active=1) cabins FROM ships s ORDER BY s.status, s.name`)
        .map((s) => `<tr><th scope="row"><a href="/admin/ships/${s.id}">${esc(s.name)}</a><br><span class="muted">${esc(s.id)}</span></th>
          <td>${esc(s.embarkation)}</td><td>${s.capacity}</td><td>${s.cabins}</td><td>${core.futureBookingsForShip(s.id).length}</td><td>${tag(s.status)}</td></tr>`))}
    <form method="post" action="/admin/ships"><fieldset><legend>Add a ship</legend>
      ${field({ label: 'Ship ID', name: 'id', hint: 'Optional. Leave blank to generate one from the name. It cannot be changed later.' })}
      ${shipFields()}<button>Add ship</button></fieldset></form>` })));

  save(/^\/admin\/ships$/, 'catalog', '/admin/ships', (ctx, f) => {
    const s = readShip(f);
    const id = f.id ? txt(f.id, 30).toUpperCase().replace(/[^A-Z0-9-]/g, '') : slug('SHIP', s.name);
    if (one(`SELECT 1 FROM ships WHERE id=?`, id)) throw new Error(`Ship ID ${id} is already used`);
    run(`INSERT INTO ships(id,name,description,photo,capacity,embarkation,timezone,turnaround_days,status) VALUES(?,?,?,?,?,?,?,?,'inactive')`,
      id, s.name, s.description, s.photo, s.capacity, s.embarkation, s.timezone, s.turnaround_days);
    audit(ctx.user.email, 'ship_created', id, s);
    return { to: `/admin/ships/${id}`, msg: `${s.name} added as inactive. Add cabins, then activate it.` };
  });

  get(/^\/admin\/ships\/([\w-]+)$/, guard('catalog', (ctx, id) => {
    const s = one(`SELECT * FROM ships WHERE id=?`, id);
    if (!s) return null;
    const affected = core.futureBookingsForShip(id);
    const cabins = all(`SELECT * FROM cabins WHERE ship_id=? ORDER BY active DESC, category, name`, id);
    return shell(ctx, { title: s.name, active: '/admin/ships', crumbs: [{ label: 'Ships', href: '/admin/ships' }], body: `
      <p>${tag(s.status)} <code>${esc(s.id)}</code> · <a href="/ship/${s.id}">Public page</a></p>
      ${s.status !== 'active' && affected.length ? `<div class="notice warn"><p><strong>${affected.length} future booking${affected.length > 1 ? 's' : ''} still use this ship.</strong>
        They were not cancelled. Contact each guest and amend or cancel through the booking screen: ${affected.map((b) => `<a href="/admin/bookings/${b.ref}">${b.ref}</a>`).join(', ')}.${req('CAT07')}</p></div>` : ''}
      <div class="split"><div>
        <form method="post" action="/admin/ships/${id}"><fieldset><legend>Details</legend>${shipFields(s)}
          <p class="hint">Renaming updates future displays; accepted bookings keep their snapshot.${req('CAT05')}</p>
          <button>Save ship</button></fieldset></form>
        <h2>Cabins${req('CAT04')}</h2>
        ${table(`Cabins aboard ${s.name}`, ['Cabin', 'Category', 'Berths', 'Max guests', 'Facilities', 'Status', 'Edit'],
          cabins.map((c) => `<tr><th scope="row">${esc(c.name)}<br><span class="muted">${esc(c.id)}</span></th><td>${esc(c.category)}</td>
            <td>${c.beds}</td><td>${c.max_guests}</td><td class="muted">${esc(c.facilities)}</td><td>${tag(c.active ? 'active' : 'inactive')}</td>
            <td><a href="/admin/ships/${id}/cabins/${c.id}">Edit<span class="vh"> ${esc(c.name)}</span></a></td></tr>`))}
        <form method="post" action="/admin/ships/${id}/cabins"><fieldset><legend>Add a cabin</legend>${cabinFields()}<button class="ghost">Add cabin</button></fieldset></form>
      </div><div>
        <section class="card" aria-label="Status"><h2 style="margin-top:0">Status</h2>
          <p class="muted">Inactive or archived ships stop selling at once. Existing bookings are kept and listed for follow-up.</p>
          <div class="row-actions">${['active', 'inactive', 'archived'].filter((x) => x !== s.status)
            .map((x) => act(`/admin/ships/${id}/status`, x === 'active' ? 'Activate' : x === 'inactive' ? 'Deactivate' : 'Archive', x === 'archived' ? 'bad' : 'ghost', { status: x }, s.name)).join('')}</div></section>
        <section class="card" style="margin-top:20px" aria-label="Services"><h2 style="margin-top:0">Sold under</h2>
          <ul>${all(`SELECT p.id, p.title FROM product_ships ps JOIN products p ON p.id=ps.product_id WHERE ps.ship_id=?`, id)
            .map((p) => `<li><a href="/admin/products/${p.id}">${esc(p.title)}</a></li>`).join('') || '<li>No products yet</li>'}</ul></section>
      </div></div>` });
  }));

  save(/^\/admin\/ships\/([\w-]+)$/, 'catalog', (id) => `/admin/ships/${id}`, (ctx, f, id) => {
    const s = readShip(f);
    if (!one(`SELECT 1 FROM ships WHERE id=?`, id)) throw new Error('Unknown ship');
    run(`UPDATE ships SET name=?, description=?, photo=?, capacity=?, embarkation=?, timezone=?, turnaround_days=? WHERE id=?`,
      s.name, s.description, s.photo, s.capacity, s.embarkation, s.timezone, s.turnaround_days, id);
    audit(ctx.user.email, 'ship_updated', id, s);
    return 'Ship saved.';
  });
  save(/^\/admin\/ships\/([\w-]+)\/status$/, 'catalog', (id) => `/admin/ships/${id}`, (ctx, f, id) => {
    if (f.status === 'active' && !one(`SELECT 1 FROM cabins WHERE ship_id=? AND active=1`, id)) throw new Error('Add at least one active cabin before activating');
    const affected = core.setShipStatus(id, f.status, ctx.user.email);
    return `Ship is now ${f.status}.${affected.length ? ` ${affected.length} future booking(s) need follow-up — see the notice.` : ''}`;
  });

  const cabinFields = (c = {}) => `
    ${field({ label: 'Cabin name', name: 'name', value: c.name ?? '', required: true })}
    ${field({ label: 'Category', name: 'category', value: c.category ?? 'standard', options: ['master', 'deluxe', 'standard', 'sharing'].map((v) => ({ v, t: v })),
      hint: 'Rates are set per category.' })}
    ${field({ label: 'Berths', name: 'beds', type: 'number', value: c.beds ?? 2, required: true, attrs: 'min="1" max="8"' })}
    ${field({ label: 'Maximum guests', name: 'max_guests', type: 'number', value: c.max_guests ?? 2, required: true, attrs: 'min="1" max="8"' })}
    ${field({ label: 'Facilities', name: 'facilities', value: c.facilities ?? 'AC, ensuite', hint: 'Only facilities the operator has verified.' })}`;
  const readCabin = (f) => {
    const c = { name: txt(f.name, 60), category: ['master', 'deluxe', 'standard', 'sharing'].includes(f.category) ? f.category : 'standard',
      beds: int(f.beds, 1, 8, 'Berths'), max_guests: int(f.max_guests, 1, 8, 'Maximum guests'), facilities: txt(f.facilities, 200) };
    if (!c.name) throw new Error('Give the cabin a name');
    return c;
  };
  save(/^\/admin\/ships\/([\w-]+)\/cabins$/, 'catalog', (id) => `/admin/ships/${id}`, (ctx, f, ship) => {
    const c = readCabin(f);
    const id = `CAB-${ship.replace('SHIP-', '').slice(0, 4)}-${Date.now().toString(36).toUpperCase()}`;
    run(`INSERT INTO cabins(id,ship_id,name,category,beds,max_guests,facilities,active) VALUES(?,?,?,?,?,?,?,1)`, id, ship, c.name, c.category, c.beds, c.max_guests, c.facilities);
    audit(ctx.user.email, 'cabin_created', id, c);
    return `${c.name} added. It joins departures created from now on.`;
  });
  get(/^\/admin\/ships\/([\w-]+)\/cabins\/([\w-]+)$/, guard('catalog', (ctx, sid, cid) => {
    const c = one(`SELECT * FROM cabins WHERE id=? AND ship_id=?`, cid, sid);
    if (!c) return null;
    const ship = one(`SELECT name FROM ships WHERE id=?`, sid);
    return shell(ctx, { title: `Cabin ${c.name}`, active: '/admin/ships', crumbs: [{ label: 'Ships', href: '/admin/ships' }, { label: ship.name, href: `/admin/ships/${sid}` }], body: `
      <form method="post" action="/admin/ships/${sid}/cabins/${cid}"><fieldset><legend>Cabin details</legend>${cabinFields(c)}
        ${checkbox('cabin-active', 'active', 'Cabin is in service', c.active)}
        <p class="hint">Changes apply to departures created afterwards. Existing departures keep their own inventory, which you edit on the departure.${req('OT07')}</p>
        <button>Save cabin</button></fieldset></form>` });
  }));
  save(/^\/admin\/ships\/([\w-]+)\/cabins\/([\w-]+)$/, 'catalog', (sid) => `/admin/ships/${sid}`, (ctx, f, sid, cid) => {
    const c = readCabin(f);
    run(`UPDATE cabins SET name=?, category=?, beds=?, max_guests=?, facilities=?, active=? WHERE id=? AND ship_id=?`,
      c.name, c.category, c.beds, c.max_guests, c.facilities, f.active ? 1 : 0, cid, sid);
    audit(ctx.user.email, 'cabin_updated', cid, { ...c, active: !!f.active });
    return 'Cabin saved.';
  });

  /* ================= products (U03, CAT01, CAT02, CAT05, CAT08) ================= */
  get(/^\/admin\/products$/, guard('catalog', (ctx) => shell(ctx, { title: 'Products', active: '/admin/products', body: `
    <p class="lede">Services customers can buy. Two inventory behaviours exist — whole-ship private charter and scheduled open trip; every product uses one of them.${req('U03 · CAT01 · CAT02')}</p>
    ${table('Products', ['Product', 'Behaviour', 'Destination', 'Eligible ships', 'Rates', 'Terms', 'Status'],
      all(`SELECT p.*, (SELECT count(*) FROM product_ships ps WHERE ps.product_id=p.id) ships, (SELECT count(*) FROM rates r WHERE r.product_id=p.id) rates
           FROM products p ORDER BY p.status, p.title`).map((p) => `<tr><th scope="row"><a href="/admin/products/${p.id}">${esc(p.title)}</a><br><span class="muted">${esc(p.id)}</span></th>
        <td>${p.mode === 'private' ? 'Private charter' : 'Open trip'}</td><td>${esc(p.destination ?? '')}</td><td>${p.ships}</td><td>${p.rates}</td><td>v${p.terms_version}</td><td>${tag(p.status)}</td></tr>`))}
    <form method="post" action="/admin/products"><fieldset><legend>Create a product</legend>
      ${field({ label: 'Title', name: 'title', required: true })}
      ${field({ label: 'Inventory behaviour', name: 'mode', options: [{ v: 'private', t: 'Private charter — whole ship' }, { v: 'open', t: 'Open trip — scheduled departures' }],
        hint: 'Fixed once created. Renaming a product never changes how it sells.' })}
      ${field({ label: 'Destination', name: 'destination', value: 'Komodo' })}
      ${field({ label: 'Summary', name: 'summary', type: 'textarea', attrs: 'rows="2"' })}
      <button>Create as draft</button></fieldset></form>` })));

  save(/^\/admin\/products$/, 'catalog', '/admin/products', (ctx, f) => {
    const title = txt(f.title, 120);
    if (!title) throw new Error('Give the product a title');
    if (!['private', 'open'].includes(f.mode)) throw new Error('Choose an inventory behaviour');
    const id = slug('PROD', title) + '-' + Date.now().toString(36).slice(-3).toUpperCase();
    run(`INSERT INTO products(id,mode,title,summary,destination,min_nights,terms_version,status) VALUES(?,?,?,?,?,2,1,'draft')`,
      id, f.mode, title, txt(f.summary, 600), txt(f.destination, 80) || 'Komodo');
    audit(ctx.user.email, 'product_created', id, { title, mode: f.mode });
    return { to: `/admin/products/${id}`, msg: 'Draft created. Choose eligible ships and add rates before publishing.' };
  });

  get(/^\/admin\/products\/([\w-]+)$/, guard('catalog', (ctx, id) => {
    const p = one(`SELECT * FROM products WHERE id=?`, id);
    if (!p) return null;
    const eligible = new Set(all(`SELECT ship_id FROM product_ships WHERE product_id=?`, id).map((r) => r.ship_id));
    const blockers = publishBlockers(p);
    return shell(ctx, { title: p.title, active: '/admin/products', crumbs: [{ label: 'Products', href: '/admin/products' }], body: `
      <p>${tag(p.status)} ${p.mode === 'private' ? 'Private charter' : 'Open trip'} · terms version ${p.terms_version} · <a href="/product/${p.id}">Preview the public page</a></p>
      <div class="split"><div>
        <form method="post" action="/admin/products/${id}"><fieldset><legend>Content</legend>
          ${field({ label: 'Title', name: 'title', value: p.title, required: true })}
          ${field({ label: 'Destination', name: 'destination', value: p.destination ?? '' })}
          ${field({ label: 'Summary', name: 'summary', type: 'textarea', value: p.summary ?? '', attrs: 'rows="2"' })}
          ${field({ label: 'Itinerary', name: 'itinerary', type: 'textarea', value: p.itinerary ?? '', attrs: 'rows="3"' })}
          ${field({ label: 'Inclusions', name: 'inclusions', type: 'textarea', value: p.inclusions ?? '', attrs: 'rows="2"' })}
          ${field({ label: 'Exclusions', name: 'exclusions', type: 'textarea', value: p.exclusions ?? '', attrs: 'rows="2"' })}
          ${p.mode === 'private' ? field({ label: 'Minimum nights', name: 'min_nights', type: 'number', value: p.min_nights, required: true, attrs: 'min="2" max="14"',
            hint: 'Never below 2 — the 3 day, 2 night minimum is enforced whatever you set.' }) : ''}
          <p class="hint">Changing the itinerary, inclusions, exclusions or minimum creates a new terms version. Accepted bookings keep the version they accepted.${req('CAT08')}</p>
          <button>Save content</button></fieldset></form>
      </div><div>
        <section class="card" aria-label="Publishing"><h2 style="margin-top:0">Publishing</h2>
          ${blockers.length && p.status !== 'published' ? `<p class="muted">Before publishing:</p><ul>${blockers.map((b) => `<li>${esc(b)}</li>`).join('')}</ul>` : ''}
          <div class="row-actions">${[['published', 'Publish'], ['draft', 'Unpublish'], ['archived', 'Archive']].filter(([s]) => s !== p.status)
            .map(([s, l]) => act(`/admin/products/${id}/status`, l, s === 'archived' ? 'bad' : s === 'published' ? '' : 'ghost', { status: s }, p.title)).join('')}</div></section>
        <form method="post" action="/admin/products/${id}/ships" style="margin-top:20px"><fieldset><legend>Eligible ships${req('CAT05')}</legend>
          ${all(`SELECT id, name, status FROM ships ORDER BY name`).map((s) => checkbox(`el-${s.id}`, `ship_${s.id}`, `${s.name}${s.status !== 'active' ? ` (${s.status})` : ''}`, eligible.has(s.id))).join('')}
          <button class="ghost">Save eligibility</button></fieldset></form>
        <p style="margin-top:20px"><a href="/admin/rates?product_id=${p.id}">Manage rates for this product</a>${p.mode === 'open' ? ` · <a href="/admin/departures?product_id=${p.id}">Departures</a>` : ''}</p>
      </div></div>` });
  }));

  save(/^\/admin\/products\/([\w-]+)$/, 'catalog', (id) => `/admin/products/${id}`, (ctx, f, id) => {
    const p = one(`SELECT * FROM products WHERE id=?`, id);
    if (!p) throw new Error('Unknown product');
    const n = { title: txt(f.title, 120), destination: txt(f.destination, 80), summary: txt(f.summary, 600), itinerary: txt(f.itinerary, 1000),
      inclusions: txt(f.inclusions, 600), exclusions: txt(f.exclusions, 600), min_nights: p.mode === 'private' ? int(f.min_nights, 2, 14, 'Minimum nights') : p.min_nights };
    if (!n.title) throw new Error('Give the product a title');
    const material = ['itinerary', 'inclusions', 'exclusions', 'min_nights'].some((k) => String(n[k] ?? '') !== String(p[k] ?? ''));
    run(`UPDATE products SET title=?, destination=?, summary=?, itinerary=?, inclusions=?, exclusions=?, min_nights=?, terms_version=terms_version+? WHERE id=?`,
      n.title, n.destination, n.summary, n.itinerary, n.inclusions, n.exclusions, n.min_nights, material ? 1 : 0, id);
    audit(ctx.user.email, 'product_updated', id, { ...n, new_terms_version: material });
    return material ? `Saved as terms version ${p.terms_version + 1}. Existing bookings keep version ${p.terms_version}.` : 'Saved.';
  });

  save(/^\/admin\/products\/([\w-]+)\/status$/, 'catalog', (id) => `/admin/products/${id}`, (ctx, f, id) => {
    const p = one(`SELECT * FROM products WHERE id=?`, id);
    if (!['published', 'draft', 'archived'].includes(f.status)) throw new Error('Unknown status');
    if (f.status === 'published') { const b = publishBlockers(p); if (b.length) throw new Error(b.join('; ')); }
    run(`UPDATE products SET status=? WHERE id=?`, f.status, id);
    audit(ctx.user.email, 'product_status', id, f.status);
    const live = one(`SELECT count(*) c FROM bookings WHERE product_id=? AND status IN ('held','confirmed') AND end_date >= date('now')`, id).c;
    return `Product is now ${f.status}.${f.status !== 'published' && live ? ` ${live} existing booking(s) are unaffected.` : ''}`;
  });

  save(/^\/admin\/products\/([\w-]+)\/ships$/, 'catalog', (id) => `/admin/products/${id}`, (ctx, f, id) => {
    const want = new Set(Object.keys(f).filter((k) => k.startsWith('ship_')).map((k) => k.slice(5)));
    const had = all(`SELECT ship_id FROM product_ships WHERE product_id=?`, id).map((r) => r.ship_id);
    for (const s of had.filter((s) => !want.has(s))) {
      const d = one(`SELECT id FROM departures WHERE product_id=? AND ship_id=? AND status IN ('draft','published','closed') AND end_date >= date('now')`, id, s);
      if (d) throw new Error(`${s} still runs departure ${d.id} for this product; cancel or close it first`);
    }
    run(`DELETE FROM product_ships WHERE product_id=?`, id);
    for (const s of want) if (one(`SELECT 1 FROM ships WHERE id=?`, s)) run(`INSERT INTO product_ships(product_id, ship_id) VALUES(?,?)`, id, s);
    audit(ctx.user.email, 'eligibility_updated', id, [...want].join(','));
    return 'Eligible ships saved.';
  });

  /* ================= departures (CAT06, OT05-OT07, OPS06, OPS07) ================= */
  get(/^\/admin\/departures$/, guard('departures', (ctx) => {
    const pid = ctx.url.searchParams.get('product_id') || '';
    const openProducts = all(`SELECT id v, title t FROM products WHERE mode='open' AND status!='archived' ORDER BY title`);
    return shell(ctx, { title: 'Departures', active: '/admin/departures', body: `
      <p class="lede">Scheduled open-trip departures. Creating one claims the whole ship interval on the shared calendar.${req('CAT06 · OT05')}</p>
      ${table('Departures', ['Departure', 'Product', 'Ship', 'Dates', 'Sold', 'Minimum', 'Status'],
        all(`SELECT d.*, p.title, s.name ship, (SELECT SUM(berths) FROM departure_cabins WHERE departure_id=d.id) cap
             FROM departures d JOIN products p ON p.id=d.product_id JOIN ships s ON s.id=d.ship_id WHERE ?='' OR d.product_id=? ORDER BY d.start_date`, pid, pid)
          .map((d) => { const sold = core.departureCommitments(d.id); return `<tr><th scope="row"><a href="/admin/departures/${d.id}">${esc(d.id)}</a></th>
            <td>${esc(d.title)}</td><td>${esc(d.ship)}</td><td class="money">${d.start_date}<br><span class="muted">to ${d.end_date}</span></td>
            <td>${sold} of ${d.cap ?? 0}</td><td>${d.guaranteed ? 'Guaranteed' : `${d.min_pax} guests${sold < d.min_pax ? ' <span class="tag warn">below</span>' : ''}`}</td><td>${tag(d.status)}</td></tr>`; }))}
      <form method="post" action="/admin/departures"><fieldset><legend>Schedule a departure</legend>
        ${field({ label: 'Product', name: 'product_id', value: pid, options: openProducts, required: true })}
        ${field({ label: 'Ship', name: 'ship_id', options: all(`SELECT id v, name t FROM ships WHERE status='active' ORDER BY name`), required: true,
          hint: 'Must be eligible for the product and free, including turnaround days.' })}
        ${field({ label: 'Start date', name: 'start_date', type: 'date', required: true })}
        ${field({ label: 'End date', name: 'end_date', type: 'date', required: true })}
        ${field({ label: 'Sales close on', name: 'cutoff_date', type: 'date', hint: 'Defaults to two days before departure, at 12:00 UTC.' })}
        ${field({ label: 'Minimum guests to run', name: 'min_pax', type: 'number', value: '0', attrs: 'min="0" max="60"' })}
        ${checkbox('dep-guaranteed', 'guaranteed', 'Guaranteed departure — runs whatever the numbers', false)}
        ${field({ label: 'Initial status', name: 'status', options: [{ v: 'draft', t: 'Draft — not on sale' }, { v: 'published', t: 'Published — on sale now' }] })}
        <button>Schedule departure</button></fieldset></form>` });
  }));

  save(/^\/admin\/departures$/, 'departures', '/admin/departures', (ctx, f) => {
    const id = core.createDeparture({ ...f, cutoff_at: f.cutoff_date ? `${f.cutoff_date}T12:00:00Z` : null, guaranteed: !!f.guaranteed }, ctx.user.email);
    return { to: `/admin/departures/${id}`, msg: 'Departure scheduled. Review the cabin inventory before selling.' };
  });

  get(/^\/admin\/departures\/([\w-]+)$/, guard('departures', (ctx, id) => {
    const v = core.departureCabins(id, null);
    if (!v) return null;
    const sold = core.departureCommitments(id);
    const bookings = all(`SELECT * FROM bookings WHERE departure_id=? AND status IN ('held','confirmed','exception') ORDER BY created_at`, id);
    const manifest = all(`SELECT p.*, b.ref FROM passengers p JOIN bookings b ON b.id=p.booking_id WHERE b.departure_id=? AND b.status IN ('confirmed','held') ORDER BY b.ref, p.full_name`, id);
    return shell(ctx, { title: `Departure ${id}`, active: '/admin/departures', crumbs: [{ label: 'Departures', href: '/admin/departures' }], body: `
      <p>${tag(v.dep.status)} ${esc(v.ship.name)} · ${v.dep.start_date} to ${v.dep.end_date} · <a href="/departure/${id}">Public page</a></p>
      ${!v.dep.guaranteed && sold < v.dep.min_pax ? `<div class="notice warn"><p><strong>Below minimum:</strong> ${sold} of ${v.dep.min_pax} guests. Decide go, reschedule or cancel before the deadline; paid guests keep their booking until you resolve each one.${req('OT06 · OPS06')}</p></div>` : ''}
      <div class="split"><div>
        <h2>Cabin inventory${req('OT02 · OT07')}</h2>
        <p class="muted">Capacity cannot drop below what is sold or held. Whole-cabin sales need every berth free.</p>
        ${table('Inventory by cabin', ['Cabin', 'Taken', 'Berths on sale', 'Sell by berth', 'Sell whole', 'Save'],
          v.rows.map((r) => `<tr><th scope="row">${esc(r.name)} <span class="tag">${esc(r.category)}</span></th><td>${r.taken}</td>
            <td><label class="vh" for="b-${r.id}">Berths on sale in ${esc(r.name)}</label><input id="b-${r.id}" form="f-${r.id}" name="berths" type="number" min="${r.taken}" value="${r.berths}" style="width:6rem"></td>
            <td><label class="cellcheck" for="ab-${r.id}"><input id="ab-${r.id}" form="f-${r.id}" type="checkbox" name="allow_berth" value="1"${r.allow_berth ? ' checked' : ''}><span class="vh">Sell ${esc(r.name)} by the berth</span></label></td>
            <td><label class="cellcheck" for="aw-${r.id}"><input id="aw-${r.id}" form="f-${r.id}" type="checkbox" name="allow_whole" value="1"${r.allow_whole ? ' checked' : ''}><span class="vh">Sell ${esc(r.name)} as a whole cabin</span></label></td>
            <td><form id="f-${r.id}" method="post" action="/admin/departures/${id}/cabins/${r.id}"><button class="ghost">Save<span class="vh"> ${esc(r.name)}</span></button></form></td></tr>`))}
        <h2>Bookings</h2>${table('Bookings on this departure', ['Reference', 'Guest', 'Guests', 'Status', 'Payment'],
          bookings.map((b) => `<tr><th scope="row"><a href="/admin/bookings/${b.ref}">${b.ref}</a></th><td>${esc(b.contact_name)}</td><td>${b.guests}</td><td>${tag(b.status)}</td><td>${tag(b.payment_status)}</td></tr>`))}
        <h2>Manifest${req('OPS07')}</h2>
        <p class="muted">${manifest.length} of ${bookings.reduce((s, b) => s + b.guests, 0)} booked travellers have details recorded.</p>
        ${table('Passenger manifest', ['Traveller', 'Booking', 'Nationality', 'Dietary needs', 'Emergency contact'],
          manifest.map((p) => `<tr><th scope="row">${esc(p.full_name)}</th><td>${p.ref}</td><td>${esc(p.nationality)}</td><td>${esc(p.dietary)}</td><td>${esc(p.emergency_contact)}</td></tr>`))}
      </div><div>
        <section class="card" aria-label="Sales"><h2 style="margin-top:0">Sales</h2><dl>
          <div class="kv"><dt>Sold or held</dt><dd>${sold} of ${v.capacity}</dd></div>
          <div class="kv"><dt>Sales close</dt><dd>${v.dep.cutoff_at.slice(0, 16).replace('T', ' ')} UTC</dd></div>
          <div class="kv"><dt>Condition</dt><dd>${v.dep.guaranteed ? 'Guaranteed' : `Runs at ${v.dep.min_pax} guests`}</dd></div></dl>
          <div class="row-actions" style="margin-top:14px">${[['published', 'Open sales'], ['closed', 'Close sales'], ['draft', 'Back to draft'], ['cancelled', 'Cancel departure']]
            .filter(([s]) => s !== v.dep.status).map(([s, l]) => act(`/admin/departures/${id}/status`, l, s === 'cancelled' ? 'bad' : 'ghost', { status: s })).join('')}</div>
          <p class="hint">Cancelling is refused while guests are booked; close sales and resolve each booking first.</p></section>
      </div></div>` });
  }));

  save(/^\/admin\/departures\/([\w-]+)\/status$/, 'departures', (id) => `/admin/departures/${id}`, (ctx, f, id) => {
    core.setDepartureStatus(id, f.status, ctx.user.email);
    return `Departure is now ${f.status}.`;
  });
  save(/^\/admin\/departures\/([\w-]+)\/cabins\/([\w-]+)$/, 'departures', (id) => `/admin/departures/${id}`, (ctx, f, id, dc) => {
    core.setDepartureCabin(dc, { berths: f.berths, allow_berth: !!f.allow_berth, allow_whole: !!f.allow_whole }, ctx.user.email);
    return 'Inventory saved.';
  });

  /* ================= rates (U06, PR01, PR03, PR06) ================= */
  const rateForm = (r = {}) => {
    const products = all(`SELECT id v, title t FROM products WHERE status!='archived' ORDER BY title`);
    const opt = (rows) => [{ v: '', t: 'Any' }, ...rows];
    return `<form method="post" action="/admin/rates"><fieldset><legend>${r.id ? `Edit rate ${esc(r.id)}` : 'Add a rate'}</legend>
      ${r.id ? `<input type="hidden" name="id" value="${esc(r.id)}">` : ''}
      ${field({ label: 'Rate class', name: 'rate_class', value: r.rate_class ?? 'retail', options: [{ v: 'retail', t: 'Retail (public)' }, { v: 'agent', t: 'Agent net (B2B)' }] })}
      ${field({ label: 'Product', name: 'product_id', value: r.product_id ?? '', options: products, required: true })}
      ${field({ label: 'Ship', name: 'ship_id', value: r.ship_id ?? '', options: opt(all(`SELECT id v, name t FROM ships ORDER BY name`)), hint: 'Private charters are priced per ship.' })}
      ${field({ label: 'Nights', name: 'nights', type: 'number', value: r.nights ?? '', attrs: 'min="2" max="14"', hint: 'Private charter package length. Leave blank for open trips.' })}
      ${field({ label: 'Departure', name: 'departure_id', value: r.departure_id ?? '', options: opt(all(`SELECT id v, id || ' · ' || start_date t FROM departures ORDER BY start_date`)), hint: 'A departure-specific rate beats the general rate.' })}
      ${field({ label: 'Cabin category', name: 'cabin_category', value: r.cabin_category ?? '', options: opt(['master', 'deluxe', 'standard', 'sharing'].map((v) => ({ v, t: v }))) })}
      ${field({ label: 'Sale mode', name: 'sale_mode', value: r.sale_mode ?? '', options: opt([{ v: 'berth', t: 'Per berth' }, { v: 'whole', t: 'Whole cabin' }]) })}
      ${field({ label: 'Amount (IDR)', name: 'amount_idr', type: 'number', value: r.amount_idr ?? '', required: true, attrs: 'min="1" step="1"' })}
      ${field({ label: 'Valid for travel from', name: 'valid_from', type: 'date', value: r.valid_from ?? '2026-01-01', required: true })}
      ${field({ label: 'Valid for travel until', name: 'valid_to', type: 'date', value: r.valid_to ?? '2027-12-31', required: true })}
      <p class="hint">A rate that would tie with another of the same scope and dates is refused.${req('PR03')} Accepted bookings keep their price.${req('PR08')}</p>
      <button>${r.id ? 'Save rate' : 'Add rate'}</button></fieldset></form>`;
  };
  get(/^\/admin\/rates$/, guard('rates', (ctx) => {
    const pid = ctx.url.searchParams.get('product_id') || '', rc = ctx.url.searchParams.get('rate_class') || '';
    const rows = all(`SELECT r.*, p.title FROM rates r JOIN products p ON p.id=r.product_id WHERE (?='' OR r.product_id=?) AND (?='' OR r.rate_class=?)
                      ORDER BY p.title, r.rate_class, r.ship_id, r.nights, r.cabin_category, r.sale_mode`, pid, pid, rc, rc);
    return shell(ctx, { title: 'Rates', active: '/admin/rates', body: `
      <p class="lede">Retail and agent rates are kept apart. Agent rates are visible only to approved, signed-in agents.${req('U06 · PR01 · PR07')}</p>
      <form class="filters" method="get" action="/admin/rates"><h2 class="vh">Filter rates</h2>
        ${field({ label: 'Product', name: 'product_id', value: pid, options: [{ v: '', t: 'All products' }, ...all(`SELECT id v, title t FROM products ORDER BY title`)] })}
        ${field({ label: 'Rate class', name: 'rate_class', value: rc, options: [{ v: '', t: 'Both' }, { v: 'retail', t: 'Retail' }, { v: 'agent', t: 'Agent' }] })}
        <div class="field"><button>Filter</button></div></form>
      ${table(`${rows.length} rate${rows.length === 1 ? '' : 's'}`, ['Rate', 'Class', 'Scope', 'Amount', 'Valid', 'Actions'],
        rows.map((r) => `<tr><th scope="row"><code>${esc(r.id)}</code><br><span class="muted">${esc(r.title)}</span></th><td>${tag(r.rate_class === 'agent' ? 'agent' : 'retail')}</td>
          <td>${[r.ship_id, r.nights != null ? `${r.nights} nights` : '', r.departure_id, r.cabin_category, r.sale_mode].filter(Boolean).map(esc).join(' · ') || 'Base'}</td>
          <td class="money">${money(r.amount_idr)}</td><td class="money">${r.valid_from}<br><span class="muted">to ${r.valid_to}</span></td>
          <td class="row-actions"><a href="/admin/rates/${r.id}">Edit<span class="vh"> ${esc(r.id)}</span></a>
            ${act(`/admin/rates/${r.id}/delete`, 'Remove', 'ghost', {}, r.id)}</td></tr>`))}
      ${rateForm({ product_id: pid, rate_class: rc || 'retail' })}` });
  }));
  get(/^\/admin\/rates\/([\w-]+)$/, guard('rates', (ctx, id) => {
    const r = one(`SELECT * FROM rates WHERE id=?`, id);
    return r ? shell(ctx, { title: `Rate ${id}`, active: '/admin/rates', crumbs: [{ label: 'Rates', href: '/admin/rates' }], body: rateForm(r) }) : null;
  }));
  save(/^\/admin\/rates$/, 'rates', '/admin/rates', (ctx, f) => ({ to: `/admin/rates?product_id=${encodeURIComponent(f.product_id)}`, msg: `Rate ${core.saveRate(f, ctx.user.email)} saved.` }));
  save(/^\/admin\/rates\/([\w-]+)\/delete$/, 'rates', '/admin/rates', (ctx, f, id) => {
    const r = one(`SELECT * FROM rates WHERE id=?`, id);
    if (!r) throw new Error('Rate not found');
    run(`DELETE FROM rates WHERE id=?`, id);
    audit(ctx.user.email, 'rate_removed', id, r);
    return `Rate ${id} removed. Bookings that used it keep their accepted price.`;
  });

  /* ================= agents (U06, BR01, AT06) ================= */
  get(/^\/admin\/agents$/, guard('agents', (ctx) => shell(ctx, { title: 'Agents', active: '/admin/agents', body: `
    <p class="lede">Approved agent organisations buy at net rates. Suspension blocks new agent purchases immediately and never touches existing bookings.${req('BR01 · PR02')}</p>
    ${table('Agent organisations', ['Organisation', 'Users', 'Bookings', 'Booking value', 'Status', 'Action'],
      all(`SELECT o.*, (SELECT count(*) FROM users u WHERE u.agent_org_id=o.id) users,
             (SELECT count(*) FROM bookings b WHERE b.agent_org_id=o.id) bookings,
             (SELECT COALESCE(SUM(total_idr),0) FROM bookings b WHERE b.agent_org_id=o.id AND b.status IN ('confirmed','completed')) value
           FROM agent_orgs o ORDER BY o.name`).map((o) => `<tr><th scope="row">${esc(o.name)}<br><span class="muted">${esc(o.id)}</span></th>
        <td><a href="/admin/users?org=${o.id}">${o.users}<span class="vh"> users at ${esc(o.name)}</span></a></td>
        <td><a href="/admin/bookings?agent_org_id=${o.id}">${o.bookings}<span class="vh"> bookings by ${esc(o.name)}</span></a></td>
        <td class="money">${money(o.value)}</td><td>${tag(o.status)}</td>
        <td>${o.status === 'approved' ? act(`/admin/agents/${o.id}/status`, 'Suspend', 'bad', { status: 'suspended' }, o.name)
          : act(`/admin/agents/${o.id}/status`, 'Approve', '', { status: 'approved' }, o.name)}</td></tr>`))}
    <form method="post" action="/admin/agents"><fieldset><legend>Register an agent organisation</legend>
      ${field({ label: 'Organisation name', name: 'name', required: true })}
      <p class="hint">Created as pending. Approve it once the agreement is signed, then add its users.</p>
      <button>Register organisation</button></fieldset></form>` })));
  save(/^\/admin\/agents$/, 'agents', '/admin/agents', (ctx, f) => {
    const name = txt(f.name, 120);
    if (!name) throw new Error('Enter the organisation name');
    const id = slug('ORG', name);
    if (one(`SELECT 1 FROM agent_orgs WHERE id=?`, id)) throw new Error(`An organisation with ID ${id} already exists`);
    run(`INSERT INTO agent_orgs(id,name,status) VALUES(?,?,'pending')`, id, name);
    audit(ctx.user.email, 'agent_org_created', id, name);
    return `${name} registered as pending.`;
  });
  save(/^\/admin\/agents\/([\w-]+)\/status$/, 'agents', '/admin/agents', (ctx, f, id) => {
    if (!['approved', 'suspended'].includes(f.status)) throw new Error('Unknown status');
    run(`UPDATE agent_orgs SET status=? WHERE id=?`, f.status, id);
    audit(ctx.user.email, 'agent_org_' + f.status, id);
    return f.status === 'approved' ? 'Organisation approved — its users now see net rates.' : 'Organisation suspended — its users now see retail prices only.';
  });

  /* ================= users & roles (BR01, SEC01) ================= */
  const ROLES = [{ v: 'admin', t: 'Administrator' }, { v: 'ops', t: 'Operations' }, { v: 'finance', t: 'Finance' }, { v: 'agent', t: 'Agent' }];
  const orgs = () => [{ v: '', t: 'None' }, ...all(`SELECT id v, name t FROM agent_orgs ORDER BY name`)];
  const reauth = (ctx, f) => { if (!checkPw(f.current_pw ?? '', one(`SELECT pw FROM users WHERE id=?`, ctx.user.id).pw)) throw new Error('Your own password was not recognised. Sensitive changes need it.'); };
  const reauthField = () => field({ label: 'Your password, to confirm', name: 'current_pw', type: 'password', required: true, autocomplete: 'current-password',
    hint: 'Role, access and password changes need you to confirm who you are.' });
  const readUser = (f) => {
    const u = { name: txt(f.name, 80), role: ROLES.some((r) => r.v === f.role) ? f.role : null, agent_org_id: f.agent_org_id || null };
    if (!u.name) throw new Error('Enter a name');
    if (!u.role) throw new Error('Choose a role');
    if (u.role === 'agent' && !u.agent_org_id) throw new Error('Agents must belong to an organisation');
    if (u.role !== 'agent') u.agent_org_id = null;
    return u;
  };
  const pwOk = (pw) => { if (String(pw ?? '').length < 10) throw new Error('Passwords need at least 10 characters'); return pw; };
  const adminsLeft = (exceptId) => one(`SELECT count(*) c FROM users WHERE role='admin' AND active=1 AND id!=?`, exceptId).c;

  get(/^\/admin\/users$/, guard('users', (ctx) => {
    const org = ctx.url.searchParams.get('org') || '';
    return shell(ctx, { title: 'Users', active: '/admin/users', body: `
      <p class="lede">One person, one account. Permissions follow the role and are checked on the server for every action.${req('BR01')}</p>
      ${table('Accounts', ['Name', 'Email', 'Role', 'Organisation', 'Access', 'Edit'],
        all(`SELECT u.*, o.name org FROM users u LEFT JOIN agent_orgs o ON o.id=u.agent_org_id WHERE ?='' OR u.agent_org_id=? ORDER BY u.active DESC, u.role, u.name`, org, org)
          .map((u) => `<tr><th scope="row">${esc(u.name)}</th><td>${esc(u.email)}</td><td>${esc(ROLES.find((r) => r.v === u.role)?.t ?? u.role)}</td>
            <td>${esc(u.org ?? '—')}</td><td>${tag(u.active ? 'active' : 'inactive')}</td><td><a href="/admin/users/${u.id}">Edit<span class="vh"> ${esc(u.name)}</span></a></td></tr>`))}
      <form method="post" action="/admin/users"><fieldset><legend>Create an account</legend>
        ${field({ label: 'Full name', name: 'name', required: true, autocomplete: 'off' })}
        ${field({ label: 'Email address', name: 'email', type: 'email', required: true, autocomplete: 'off' })}
        ${field({ label: 'Role', name: 'role', options: ROLES, value: org ? 'agent' : 'ops' })}
        ${field({ label: 'Agent organisation', name: 'agent_org_id', options: orgs(), value: org, hint: 'Required for agents; ignored for staff.' })}
        ${field({ label: 'Temporary password', name: 'pw', type: 'password', required: true, autocomplete: 'new-password', hint: 'At least 10 characters. Share it privately.' })}
        ${reauthField()}<button>Create account</button></fieldset></form>` });
  }));
  save(/^\/admin\/users$/, 'users', '/admin/users', (ctx, f) => {
    reauth(ctx, f);
    const u = readUser(f), email = txt(f.email, 200).toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Enter a valid email address');
    if (one(`SELECT 1 FROM users WHERE lower(email)=?`, email)) throw new Error('An account with that email already exists');
    const id = 'U-' + Date.now().toString(36).toUpperCase();
    run(`INSERT INTO users(id,email,pw,role,agent_org_id,name,active) VALUES(?,?,?,?,?,?,1)`, id, email, hashPw(pwOk(f.pw)), u.role, u.agent_org_id, u.name);
    audit(ctx.user.email, 'user_created', id, { email, role: u.role, org: u.agent_org_id });
    return `Account created for ${email}.`;
  });
  get(/^\/admin\/users\/([\w-]+)$/, guard('users', (ctx, id) => {
    const u = one(`SELECT * FROM users WHERE id=?`, id);
    if (!u) return null;
    return shell(ctx, { title: u.name, active: '/admin/users', crumbs: [{ label: 'Users', href: '/admin/users' }], body: `
      <p class="lede">${esc(u.email)}${u.id === ctx.user.id ? ' — this is your own account.' : ''}</p>
      <form method="post" action="/admin/users/${id}"><fieldset><legend>Role and access</legend>
        ${field({ label: 'Full name', name: 'name', value: u.name, required: true })}
        ${field({ label: 'Role', name: 'role', options: ROLES, value: u.role })}
        ${field({ label: 'Agent organisation', name: 'agent_org_id', options: orgs(), value: u.agent_org_id ?? '' })}
        ${checkbox('u-active', 'active', 'Account can sign in', u.active)}
        ${field({ label: 'New password', name: 'pw', type: 'password', autocomplete: 'new-password', hint: 'Leave blank to keep the current password.' })}
        ${reauthField()}<button>Save account</button></fieldset></form>` });
  }));
  save(/^\/admin\/users\/([\w-]+)$/, 'users', (id) => `/admin/users/${id}`, (ctx, f, id) => {
    reauth(ctx, f);
    const before = one(`SELECT * FROM users WHERE id=?`, id);
    if (!before) throw new Error('Unknown user');
    const u = readUser(f), active = f.active ? 1 : 0;
    // never lock the organisation out of its own admin
    if (before.role === 'admin' && (u.role !== 'admin' || !active) && adminsLeft(id) === 0) throw new Error('This is the last active administrator; add another before changing it');
    run(`UPDATE users SET name=?, role=?, agent_org_id=?, active=? WHERE id=?`, u.name, u.role, u.agent_org_id, active, id);
    if (f.pw) run(`UPDATE users SET pw=? WHERE id=?`, hashPw(pwOk(f.pw)), id);
    audit(ctx.user.email, 'user_updated', id, { from: { role: before.role, active: before.active }, to: { role: u.role, active }, password_reset: !!f.pw });
    return 'Account saved.';
  });
}

function publishBlockers(p) {
  const out = [];
  const ships = all(`SELECT s.id FROM product_ships ps JOIN ships s ON s.id=ps.ship_id WHERE ps.product_id=? AND s.status='active'`, p.id);
  if (!ships.length) out.push('Choose at least one active eligible ship');
  if (!one(`SELECT 1 FROM rates WHERE product_id=? AND rate_class='retail'`, p.id)) out.push('Add at least one retail rate');
  if (!p.summary) out.push('Write a summary');
  return out;
}
