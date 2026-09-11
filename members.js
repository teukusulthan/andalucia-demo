// Membership: the Voyage Club sign-up, the newsletter list, and the gate in front of the
// Island Dispatch. Members are ordinary rows in `users` with role='member' - which means
// views.can() already refuses them every admin permission without a special case.
import { db, audit, hashPw } from './db.js';
import { page, esc, field, flash, cine, ctaBand, photoTiles } from './views.js';
import { img } from './media.js';

const one = (s, ...a) => db.prepare(s).get(...a);
const all = (s, ...a) => db.prepare(s).all(...a);
const now = () => new Date().toISOString();
const id = (p) => `${p}-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;

const INTERESTS = [{ v: 'both', t: 'Both' }, { v: 'private', t: 'Private charter' }, { v: 'open', t: 'Open trip' }];
const interestLabel = (v) => INTERESTS.find((i) => i.v === v)?.t ?? 'Both';

const validEmail = (e) => /^[^@\s]+@[^@\s.]+\.[^@\s]+$/.test(String(e || '').trim());

/* ---------- the gate ----------
   A signed-out visitor sees real headlines, blurred, and is told plainly what signing in buys.
   The blurred copy is inert (aria-hidden, no tab stops) so a screen reader is not read teasers
   it cannot open - the lock message carries the whole meaning. */
export function newsPreview(user) {
  const rows = all(`SELECT * FROM articles ORDER BY published_at DESC LIMIT 4`);
  if (!rows.length) return '';
  const cards = (blurred) => `<div class="grid g2"${blurred ? ' aria-hidden="true"' : ''}>${rows.map((a) => `
    <article class="phone"><div class="screen">
      <img src="${img(`news-${a.slug}`, 700, 420)}" alt="" loading="lazy"></div>
      <div class="meta"><h3>${esc(a.title)}</h3><p>${esc(a.excerpt)}</p>
      ${blurred ? '' : `<p style="margin-top:10px"><a href="/news/${esc(a.slug)}">Read the dispatch</a></p>`}</div>
    </article>`).join('')}</div>`;

  if (user) return cards(false);
  return `<div class="gated">
    <div class="peek">${cards(true)}</div>
    <div class="lock">
      <p class="eyebrow" style="margin:0">Members only</p>
      <p class="big" style="margin:0">The Island Dispatch</p>
      <p class="muted" style="margin:0">Sailing schedules, destination notes and members-only invitations.
      Sign in to read in full, or join the Voyage Club - it is free.</p>
      <p class="actions" style="justify-content:center">
        <a class="btn" href="/membership/join">Join the Voyage Club</a>
        <a class="btn ghost" href="/login">Sign in</a></p>
    </div></div>`;
}

export default function registerMembers({ get, post, form, signIn }) {
  /* ================= membership index ================= */
  get(/^\/membership$/, (ctx) => page({
    title: 'Membership - the Voyage Club', user: ctx.user, path: '/membership', wide: true, float: true,
    trail: [{ label: 'Home', href: '/' }, { label: 'Membership Program' }],
    hero: cine({ slug: 'membership-hero', alt: 'Guests on deck at sunset', short: true,
      eyebrow: 'Membership program', h1: 'The Voyage Club',
      tagline: 'Sail with us more than once, and we will make it worth your while.' }),
    body: `<section style="padding:64px 20px"><div class="inner">
      <div class="grid g2">
        <a class="card" href="/membership/newsletter"><h2 style="margin-top:0;font-size:1.25rem">Newsletter</h2>
          <p class="muted">The Island Dispatch - schedules, destinations and travel notes, free.</p></a>
        <a class="card" href="/membership/special-offer"><h2 style="margin-top:0;font-size:1.25rem">Special offer</h2>
          <p class="muted">Seasonal discounts and priority access to private trip dates.</p></a>
        <a class="card" href="/membership/benefits"><h2 style="margin-top:0;font-size:1.25rem">Membership benefits</h2>
          <p class="muted">Everything a member gets, in one list.</p></a>
        <a class="card" href="/membership/join"><h2 style="margin-top:0;font-size:1.25rem">Sign up</h2>
          <p class="muted">Join the Voyage Club. Takes a minute, costs nothing.</p></a>
      </div></div></section>
    ${ctaBand({ line: 'Join the Voyage Club and read the Dispatch in full.', label: 'Become a member', href: '/membership/join', slug: 'membership-cta' })}`,
  }));

  /* ================= newsletter ================= */
  const newsletterPage = (ctx) => page({
    title: 'Subscribe to the Island Dispatch', user: ctx.user, path: '/membership', wide: true, float: true,
    trail: [{ label: 'Home', href: '/' }, { label: 'Membership Program', href: '/membership' }, { label: 'Newsletter' }],
    hero: cine({ slug: 'newsletter-hero', alt: 'Morning light over the Komodo archipelago', short: true,
      eyebrow: 'Membership program', h1: 'Subscribe for free to Our Island Dispatch',
      tagline: 'New sailing schedules, destination highlights, travel insight and members-only invitations.' }),
    body: `<section style="padding:64px 20px"><div class="inner">${flash(ctx.url)}
      <div class="split"><form method="post" action="/membership/newsletter">
        <fieldset><legend>Subscribe</legend>
          ${field({ label: 'Full name', name: 'name', required: true, autocomplete: 'name' })}
          ${field({ label: 'Email address', name: 'email', type: 'email', required: true, autocomplete: 'email',
            hint: 'We send roughly one dispatch a month. Unsubscribe from any of them.' })}
          ${field({ label: 'What interests you', name: 'interest', options: INTERESTS, value: 'both' })}
          <p class="actions"><button>Subscribe</button></p></fieldset></form>
      <section class="card" aria-label="Recent dispatches">
        <h2 style="margin-top:0;font-size:1.2rem">Recent dispatches</h2>
        ${all(`SELECT * FROM articles ORDER BY published_at DESC LIMIT 2`).map((a) =>
          `<div class="kv" style="display:block;padding:12px 0"><dt style="font-weight:600;color:var(--ink)">${esc(a.title)}</dt>
           <dd style="margin:6px 0 0;text-align:left;color:var(--muted);font-size:15px">${esc(a.excerpt)}</dd></div>`).join('')}
        <p class="muted" style="margin-top:14px">Full issues are open to Voyage Club members.
        <a href="/membership/join">Join for free</a>.</p></section></div>
    </div></section>`,
  });
  get(/^\/membership\/newsletter$/, newsletterPage);

  post(/^\/membership\/newsletter$/, async (ctx) => {
    const f = await form(ctx.rq);
    const email = String(f.email || '').trim().toLowerCase();
    if (!String(f.name || '').trim() || !validEmail(email))
      return ctx.redirect('/membership/newsletter?err=' + encodeURIComponent('Enter your name and a valid email address.'));
    // one subscription per address; re-subscribing updates the preference rather than duplicating
    const existing = one(`SELECT id FROM newsletter WHERE lower(email)=?`, email);
    if (existing) {
      db.prepare(`UPDATE newsletter SET name=?, interest=? WHERE id=?`).run(f.name.trim(), f.interest || 'both', existing.id);
    } else {
      db.prepare(`INSERT INTO newsletter(id,name,email,interest,source,created_at) VALUES(?,?,?,?,?,?)`)
        .run(id('NL'), f.name.trim(), email, f.interest || 'both', 'newsletter', now());
    }
    audit(email, 'newsletter.subscribe', 'newsletter', interestLabel(f.interest));
    return ctx.redirect('/membership/newsletter?ok=' + encodeURIComponent('You are subscribed. The next dispatch will reach you at ' + email + '.'));
  });

  /* ================= special offer ================= */
  get(/^\/membership\/special-offer$/, (ctx) => page({
    title: 'Special offers for members', user: ctx.user, path: '/membership', wide: true, float: true,
    trail: [{ label: 'Home', href: '/' }, { label: 'Membership Program', href: '/membership' }, { label: 'Special offer' }],
    hero: cine({ slug: 'offer-hero', alt: 'A private dinner set on the beach', short: true,
      eyebrow: 'Membership program', h1: 'Member Offers',
      tagline: 'The things we keep for people who sail with us more than once.' }),
    body: `<section style="padding:64px 20px"><div class="inner">
      <div class="grid g2">
        <div class="card"><h2 style="margin-top:0;font-size:1.2rem">An onboard souvenir gift</h2>
          <p class="muted">Waiting in your cabin when you board. Arranged by the crew, not billed to you.</p></div>
        <div class="card"><h2 style="margin-top:0;font-size:1.2rem">Early notice of seasonal discounts</h2>
          <p class="muted">Members hear about shoulder-season pricing before it reaches the public schedule.</p></div>
        <div class="card"><h2 style="margin-top:0;font-size:1.2rem">Priority access to special deals</h2>
          <p class="muted">Limited cabins on high-demand departures are released to members first.</p></div>
        <div class="card"><h2 style="margin-top:0;font-size:1.2rem">Invitations to private voyage dates</h2>
          <p class="muted">Occasional closed departures and exclusive voyage experiences, by invitation.</p></div>
      </div>
      <p class="actions" style="margin-top:32px"><a class="btn" href="/membership/join">Unlock member perks</a></p>
      <div class="notice warn" style="margin-top:24px"><p><strong>Operationally manual for now:</strong> the
      souvenir gift is a note to staff on the booking, not an automated fulfilment. Discounts and priority
      release are not yet wired into the rates engine.</p></div>
    </div></section>
    ${ctaBand({ line: 'Join once. Benefit every voyage after.', label: 'Become a member', href: '/membership/join', slug: 'offer-cta' })}`,
  }));

  /* ================= benefits ================= */
  get(/^\/membership\/benefits$/, (ctx) => page({
    title: 'Membership benefits', user: ctx.user, path: '/membership', wide: true, float: true,
    trail: [{ label: 'Home', href: '/' }, { label: 'Membership Program', href: '/membership' }, { label: 'Benefits' }],
    hero: cine({ slug: 'benefits-hero', alt: 'Guests aboard Andalucía II', short: true,
      eyebrow: 'Membership program', h1: 'Membership Benefits',
      tagline: 'Everything the Voyage Club includes.' }),
    body: `<section style="padding:64px 20px"><div class="inner narrow">
      <p class="lede">Membership is free. It exists so that people who come back get treated like people
      who came back.</p>
      <dl>
        <div class="kv"><dt>The Island Dispatch, in full</dt><dd>Every issue, not just the headline.</dd></div>
        <div class="kv"><dt>Onboard souvenir gift</dt><dd>On every voyage you take with us.</dd></div>
        <div class="kv"><dt>Early notice of seasonal discounts</dt><dd>Before they reach the public schedule.</dd></div>
        <div class="kv"><dt>Priority access to special deals</dt><dd>First refusal on limited cabins.</dd></div>
        <div class="kv"><dt>Invitations to private voyage dates</dt><dd>Closed departures and exclusive experiences.</dd></div>
        <div class="kv"><dt>One place for your bookings</dt><dd>Your trips and enquiries in a single account.</dd></div>
      </dl>
      <p class="actions" style="margin-top:28px"><a class="btn" href="/membership/join">Join the Voyage Club</a></p>
    </div></section>`,
  }));

  /* ================= sign up ================= */
  const joinPage = (ctx, values = {}) => page({
    title: 'Join the Voyage Club', user: ctx.user, path: '/membership', wide: true, float: true,
    trail: [{ label: 'Home', href: '/' }, { label: 'Membership Program', href: '/membership' }, { label: 'Sign up' }],
    hero: cine({ slug: 'join-hero', alt: 'Andalucía II at anchor at golden hour', short: true,
      eyebrow: 'Membership program', h1: 'Join the Voyage Club',
      tagline: 'Free to join. Takes about a minute.' }),
    body: `<section style="padding:64px 20px"><div class="inner">${flash(ctx.url)}
      <div class="split"><form method="post" action="/membership/join">
        <fieldset><legend>Your details</legend>
          ${field({ label: 'Full name', name: 'name', required: true, autocomplete: 'name', value: values.name })}
          ${field({ label: 'Preferred name', name: 'preferred_name', autocomplete: 'nickname', value: values.preferred_name,
            hint: 'What the crew should call you.' })}
          ${field({ label: 'Email address', name: 'email', type: 'email', required: true, autocomplete: 'email', value: values.email })}
          ${field({ label: 'Phone', name: 'phone', type: 'tel', autocomplete: 'tel', value: values.phone })}
          ${field({ label: 'Travel interest', name: 'interest', options: INTERESTS, value: values.interest || 'both' })}
          ${field({ label: 'Choose a password', name: 'pw', type: 'password', required: true, autocomplete: 'new-password',
            hint: 'At least 8 characters. You will use this to read the Dispatch and find your bookings.' })}
          <p class="actions"><button>Become a member</button></p></fieldset></form>
      <section class="card" aria-label="What membership includes">
        <h2 style="margin-top:0;font-size:1.2rem">What you get</h2>
        <ul><li>The Island Dispatch in full</li><li>An onboard souvenir gift</li>
        <li>Early notice of seasonal discounts</li><li>Priority access to special deals</li>
        <li>Invitations to private voyage dates</li></ul>
        <p class="muted">Already a member? <a href="/login">Sign in</a>.</p></section></div>
    </div></section>`,
  });
  get(/^\/membership\/join$/, (ctx) => joinPage(ctx));

  post(/^\/membership\/join$/, async (ctx) => {
    const f = await form(ctx.rq);
    const email = String(f.email || '').trim().toLowerCase();
    const fail = (m) => ctx.redirect('/membership/join?err=' + encodeURIComponent(m));
    if (!String(f.name || '').trim()) return fail('Enter your full name.');
    if (!validEmail(email)) return fail('Enter a valid email address.');
    if (String(f.pw || '').length < 8) return fail('Choose a password of at least 8 characters.');
    if (one(`SELECT id FROM users WHERE lower(email)=?`, email))
      return fail('That email address already has an account. Sign in instead.');

    const uid = id('U-MEM');
    db.prepare(`INSERT INTO users(id,email,pw,role,name,preferred_name,phone,interest,active)
                VALUES(?,?,?,'member',?,?,?,?,1)`)
      .run(uid, email, hashPw(f.pw), f.name.trim(), (f.preferred_name || '').trim() || null,
        (f.phone || '').trim() || null, f.interest || 'both');
    // the club and the mailing list are the same intent; record both so neither has to be inferred
    if (!one(`SELECT id FROM newsletter WHERE lower(email)=?`, email))
      db.prepare(`INSERT INTO newsletter(id,name,email,interest,source,created_at) VALUES(?,?,?,?,?,?)`)
        .run(id('NL'), f.name.trim(), email, f.interest || 'both', 'membership', now());
    audit(email, 'member.join', uid, interestLabel(f.interest));
    signIn(ctx.res, email);
    return ctx.redirect('/account?ok=' + encodeURIComponent('Welcome aboard. Your membership is active.'));
  });

  /* ================= member account ================= */
  get(/^\/account$/, (ctx) => {
    const u = ctx.user;
    if (!u) return ctx.redirect('/login?next=/account');
    if (u.role !== 'member') return ctx.redirect(u.role === 'agent' ? '/agent' : '/admin');
    const bookings = all(`SELECT * FROM bookings WHERE lower(contact_email)=lower(?) ORDER BY created_at DESC`, u.email);
    return page({
      title: 'My account', user: u, path: '/membership',
      trail: [{ label: 'Home', href: '/' }, { label: 'My account' }],
      body: `<h1>${esc(u.preferred_name || u.name)}</h1>${flash(ctx.url)}
      <p class="lede">Voyage Club member · ${esc(u.email)}${u.phone ? ` · ${esc(u.phone)}` : ''}<br>
      Interested in ${esc(interestLabel(u.interest)).toLowerCase()}.</p>
      <div class="split"><div>
        <h2>Your bookings</h2>
        ${bookings.length ? `<div class="scroll"><table><caption>Bookings made with this email address</caption>
          <thead><tr><th scope="col">Reference</th><th scope="col">Dates</th><th scope="col">Status</th><th scope="col">Open</th></tr></thead>
          <tbody>${bookings.map((b) => `<tr><th scope="row">${esc(b.ref)}</th>
            <td>${b.start_date} to ${b.end_date}</td><td><span class="tag">${esc(b.status)}</span></td>
            <td><a href="/booking/${esc(b.ref)}">Open booking ${esc(b.ref)}</a></td></tr>`).join('')}
          </tbody></table></div>`
        : `<p class="muted">No bookings yet under this email address. If you booked with a different one,
           <a href="/retrieve">look it up by reference</a>.</p>`}
        <h2>The Island Dispatch</h2>
        ${newsPreview(u)}
      </div>
      <div class="card"><h2 style="margin-top:0">Member benefits</h2>
        <ul><li>The Dispatch in full</li><li>Onboard souvenir gift</li><li>Early discount notice</li>
        <li>Priority access to deals</li><li>Private voyage invitations</li></ul>
        <p class="actions"><a class="btn" href="/trips">See departures</a></p></div></div>`,
    });
  });

  /* ================= a dispatch ================= */
  get(/^\/news$/, (ctx) => page({
    title: 'The Island Dispatch', user: ctx.user, path: '/membership',
    trail: [{ label: 'Home', href: '/' }, { label: 'The Island Dispatch' }],
    body: `<h1>The Island Dispatch</h1>
    <p class="lede">Sailing schedules, destination notes and news from the crew.</p>
    <h2>Recent dispatches</h2>
    ${newsPreview(ctx.user)}`,
  }));

  get(/^\/news\/([\w-]+)$/, (ctx, slug) => {
    const a = one(`SELECT * FROM articles WHERE slug=?`, slug);
    if (!a) return null;
    if (a.members_only && !ctx.user) return page({
      title: a.title, user: null, path: '/membership',
      trail: [{ label: 'Home', href: '/' }, { label: 'The Island Dispatch', href: '/news' }, { label: a.title }],
      body: `<h1>${esc(a.title)}</h1>
      <div class="notice" role="status"><p><strong>This dispatch is for members.</strong>
      Joining the Voyage Club is free and takes about a minute.</p>
      <p class="actions"><a class="btn" href="/membership/join">Join the Voyage Club</a>
      <a class="btn ghost" href="/login">Sign in</a></p></div>
      <p class="lede">${esc(a.excerpt)}</p>`,
    });
    return page({
      title: a.title, user: ctx.user, path: '/membership',
      trail: [{ label: 'Home', href: '/' }, { label: 'The Island Dispatch', href: '/news' }, { label: a.title }],
      body: `<h1>${esc(a.title)}</h1>
      <p class="muted">Published ${esc(a.published_at)}</p>
      <p class="lede">${esc(a.excerpt)}</p><p>${esc(a.body)}</p>
      <p><a href="/news">All dispatches</a></p>`,
    });
  });
}
