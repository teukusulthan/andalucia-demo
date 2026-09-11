import { idr } from './core.js';
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const money = idr;

/* Design tokens. Reference: pacifichighcruise.com — cream paper, near-black teal, rust accent,
   wide-tracked uppercase micro-labels, 2px radii, light editorial display type.
   Every foreground/background pair below is asserted at >= 7:1 (WCAG 2.2 AAA 1.4.6) by test.js. */
export const TOKENS = {
  paper: '#FFFEF2', card: '#FFFFFF', deep: '#021319', band: '#0C1F26', sky: '#D9EDF2', shell: '#F4EDDD',
  ink: '#0A1A21', muted: '#3A4A54', line: '#DED6C4', line2: '#8F8770',
  brand: '#0E4B52', brandHi: '#0A3A40', rust: '#6C2B29', good: '#1F5233', warn: '#663D0D',
  onDeep: '#FFFEF2', mutedDeep: '#A9BEC4',
  tagBg: '#EAE3D2', tagGood: '#DCEBE1', tagWarn: '#F6E9D2', tagBad: '#F5DFDC',
  focus: '#FFB000',
};

/* Pairs the AAA contrast test enforces. Add a colour, add its pair. */
export const CONTRAST_PAIRS = [
  ['ink', 'paper'], ['ink', 'card'], ['ink', 'shell'], ['ink', 'sky'], ['ink', 'tagBg'],
  ['ink', 'tagGood'], ['ink', 'tagWarn'], ['ink', 'tagBad'],
  ['muted', 'paper'], ['muted', 'card'], ['muted', 'shell'],
  ['brand', 'paper'], ['brand', 'card'], ['brandHi', 'paper'],
  ['rust', 'paper'], ['rust', 'card'], ['rust', 'tagBad'],
  ['good', 'paper'], ['good', 'card'], ['good', 'tagGood'],
  ['warn', 'paper'], ['warn', 'card'], ['warn', 'tagWarn'],
  ['onDeep', 'deep'], ['onDeep', 'band'], ['onDeep', 'brand'], ['onDeep', 'rust'],
  ['onDeep', 'good'], ['onDeep', 'warn'], ['onDeep', 'brandHi'],
  ['mutedDeep', 'deep'], ['mutedDeep', 'band'],
];

const vars = Object.entries(TOKENS).map(([k, v]) => `--${k}:${v}`).join(';');

const CSS = `
:root{${vars};
  --display:"Iowan Old Style","Palatino Linotype",Palatino,Georgia,"Times New Roman",serif;
  --ui:Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;
  --tap:44px}
*{box-sizing:border-box}
html{-webkit-text-size-adjust:100%;scrollbar-gutter:stable}
body{margin:0;background:var(--paper);color:var(--ink);
  font:400 17px/1.6 var(--ui);text-align:left;
  /* AAA 1.4.8 text spacing */ letter-spacing:.01em;word-spacing:.02em}
p{margin:0 0 1.6em;max-width:74ch}
h1,h2,h3,h4{font-family:var(--display);font-weight:400;letter-spacing:-.02em;line-height:1.2;max-width:26ch}
h1{font-size:clamp(2.1rem,1.4rem + 2.6vw,3.1rem);margin:0 0 .35em}
h2{font-size:clamp(1.5rem,1.2rem + 1.1vw,2rem);margin:2.2rem 0 .8rem}
h3{font-size:1.2rem;margin:0 0 .5rem}
a{color:var(--brand);text-underline-offset:.22em;text-decoration-thickness:.08em}
a:hover{color:var(--brandHi);text-decoration-thickness:.16em}

/* AAA 2.4.13 focus appearance: two-tone ring stays visible on cream and on the dark bands */
:focus-visible{outline:3px solid var(--focus);outline-offset:2px;box-shadow:0 0 0 6px var(--ink);border-radius:2px}
.skip{position:absolute;left:-9999px;top:0;z-index:99;background:var(--ink);color:var(--onDeep);
  padding:0 22px;min-height:var(--tap);display:inline-flex;align-items:center;font:600 15px/1 var(--ui);text-decoration:underline}
.skip:focus{left:8px;top:8px}
/* screen-reader-only text. The positioned ancestors below keep it inside its scroll container,
   otherwise it resolves against the viewport and drags the whole page sideways (1.4.10). */
.vh{position:absolute!important;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap;border:0}

/* masthead */
.top{background:var(--deep);color:var(--onDeep)}
.bar{max-width:1120px;margin:auto;display:flex;gap:6px;align-items:center;flex-wrap:wrap;padding:10px 20px}
.bar a{color:var(--onDeep);text-decoration:none;font-size:14px;letter-spacing:.06em;
  min-height:var(--tap);display:inline-flex;align-items:center;padding:0 12px}
.bar a:hover,.bar a[aria-current]{text-decoration:underline;text-decoration-thickness:.14em;color:var(--onDeep)}
.bar a[aria-current]{text-decoration-color:var(--focus)}
.brand{font-family:var(--display);font-size:20px;letter-spacing:.2em;text-transform:uppercase;margin-right:auto;
  padding-left:0!important;flex-direction:column;align-items:flex-start;justify-content:center;line-height:1.2}
.brand span{display:block;font:400 10px/1.6 var(--ui);letter-spacing:.34em;color:var(--mutedDeep)}

main{max-width:1120px;margin:0 auto;padding:8px 20px 96px}
.crumbs{font-size:14px;color:var(--muted);padding:4px 0}
.crumbs a,.crumbs span{min-height:var(--tap);display:inline-flex;align-items:center}
.crumbs a{color:var(--brand)}
.crumbs li{display:inline-flex;align-items:center}
.crumbs ol{list-style:none;margin:0;padding:0}
.crumbs li+li::before{content:"/";padding:0 .5em;color:var(--line2)}

.hero{background:var(--deep);color:var(--onDeep);padding:64px 20px 68px}
.hero .in{max-width:1120px;margin:auto}
.hero h1{max-width:15ch;margin:0 0 .4em}
.hero p{color:var(--mutedDeep);max-width:58ch;font-size:19px}
.hero a{color:var(--onDeep)}

.eyebrow{font:500 12px/1.4 var(--ui);letter-spacing:.24em;text-transform:uppercase;color:var(--muted);margin:0 0 10px}
.hero .eyebrow{color:var(--mutedDeep)}
.lede{font-size:19px;color:var(--muted);max-width:70ch}

.grid{display:grid;gap:20px;margin:8px 0}
.grid > *,.split > *{min-width:0}
.g2{grid-template-columns:repeat(auto-fit,minmax(min(320px,100%),1fr))}
.g3{grid-template-columns:repeat(auto-fit,minmax(min(268px,100%),1fr))}
.card{background:var(--card);border:1px solid var(--line);border-radius:2px;padding:22px}
.card.pad0{padding:0;overflow:hidden}
.card h3{margin-top:0}
.card > :last-child{margin-bottom:0}
a.card{display:block;text-decoration:none;color:inherit}
a.card:hover{border-color:var(--brand);box-shadow:0 0 0 1px var(--brand)}
a.card h3{text-decoration:underline;text-underline-offset:.2em;color:var(--brand)}
.thumb{height:150px;display:flex;align-items:flex-end;padding:14px;color:var(--onDeep);
  font:500 12px/1 var(--ui);letter-spacing:.2em;text-transform:uppercase}

/* forms — every control is labelled and at least 44px tall */
fieldset{border:1px solid var(--line);border-radius:2px;margin:0 0 20px;padding:18px 20px 22px;background:var(--card)}
legend{font-family:var(--display);font-size:1.2rem;padding:0 8px}
.field{margin:0 0 18px}
label,.lbl{position:relative;display:block;font:500 12px/1.4 var(--ui);letter-spacing:.16em;text-transform:uppercase;color:var(--muted);margin-bottom:6px}
.hint{font-size:14px;color:var(--muted);margin:6px 0 0;max-width:62ch}
input,select,textarea{font:400 17px/1.4 var(--ui);color:var(--ink);background:var(--card);
  border:1px solid var(--line2);border-radius:2px;padding:11px 12px;min-height:var(--tap);width:100%;max-width:34rem}
input[type=checkbox]{width:26px;height:26px;min-height:26px;accent-color:var(--brand);margin:0 12px 0 0;flex:0 0 auto}
/* the label is the pointer target, so it carries the 44px minimum (AAA 2.5.5) */
.check{display:flex;align-items:center;gap:2px;min-height:var(--tap);padding:9px 0;font-size:16px;line-height:1.5;text-transform:none;letter-spacing:normal;color:var(--ink);max-width:62ch;cursor:pointer}
input:hover,select:hover{border-color:var(--ink)}
button,.btn{position:relative;font:500 16px/1 var(--ui);letter-spacing:.04em;background:var(--brand);color:var(--onDeep);
  border:1px solid var(--brand);min-height:var(--tap);padding:12px 22px;border-radius:2px;cursor:pointer;
  text-decoration:none;display:inline-flex;align-items:center;justify-content:center;gap:8px}
button:hover,.btn:hover{background:var(--brandHi);border-color:var(--brandHi);color:var(--onDeep)}
.btn.ghost,button.ghost{background:var(--card);color:var(--brand);border-color:var(--brand)}
.btn.ghost:hover,button.ghost:hover{background:var(--sky);color:var(--brandHi)}
.btn.bad,button.bad{background:var(--rust);border-color:var(--rust);color:var(--onDeep)}
.btn.warn,button.warn{background:var(--warn);border-color:var(--warn);color:var(--onDeep)}
button[disabled]{background:var(--shell);color:var(--muted);border-color:var(--line2);cursor:not-allowed}
.filters{background:var(--card);border:1px solid var(--line);border-radius:2px;padding:20px;
  display:flex;gap:20px;flex-wrap:wrap;align-items:flex-end;margin:0 0 26px}
.filters .field{margin:0;min-width:11rem;flex:1 1 11rem}
.filters input,.filters select{max-width:none}
.filters button{flex:0 0 auto}
.actions{display:flex;gap:10px;flex-wrap:wrap;align-items:center}

/* tables */
.scroll{position:relative;overflow-x:auto;max-width:100%;border:1px solid var(--line);border-radius:2px;background:var(--card);margin:0 0 20px}
table{width:100%;border-collapse:collapse;font-size:16px}
caption{text-align:left;font:500 12px/1.4 var(--ui);letter-spacing:.18em;text-transform:uppercase;
  color:var(--muted);padding:14px 16px;border-bottom:1px solid var(--line)}
th,td{padding:12px 16px;border-bottom:1px solid var(--line);vertical-align:top;text-align:left}
thead th{font:500 12px/1.4 var(--ui);letter-spacing:.16em;text-transform:uppercase;color:var(--muted);background:var(--shell)}
tbody th{font-weight:600;font-size:16px}
tbody tr:last-child th,tbody tr:last-child td{border-bottom:0}

.tag{display:inline-block;font:500 12px/1.5 var(--ui);letter-spacing:.14em;text-transform:uppercase;
  padding:4px 9px;border-radius:2px;background:var(--tagBg);color:var(--ink)}
.tag.ok{background:var(--tagGood);color:var(--good)}
.tag.bad{background:var(--tagBad);color:var(--rust)}
.tag.warn{background:var(--tagWarn);color:var(--warn)}

.notice{padding:16px 18px;border-left:4px solid var(--brand);background:var(--sky);margin:0 0 22px;max-width:78ch}
.notice > :last-child{margin-bottom:0}
.notice.bad{border-color:var(--rust);background:var(--tagBad)}
.notice.ok{border-color:var(--good);background:var(--tagGood)}
.notice.warn{border-color:var(--warn);background:var(--tagWarn)}
.notice h2,.notice h3{margin-top:0}

.money{font-variant-numeric:tabular-nums;white-space:nowrap}
.big{font-family:var(--display);font-size:clamp(1.35rem,1.05rem + 1.1vw,1.75rem);line-height:1.2;white-space:normal}
.muted{color:var(--muted);font-size:16px}
hr{border:0;border-top:1px solid var(--line);margin:24px 0}
.split{display:grid;grid-template-columns:minmax(0,1fr) 360px;gap:28px;align-items:start}
@media(max-width:820px){.split{grid-template-columns:1fr}}
.kv{display:flex;justify-content:space-between;gap:16px;padding:9px 0;border-bottom:1px solid var(--line)}
.kv:last-child{border-bottom:0}
.kv dt{color:var(--muted);flex:1 1 auto;min-width:0}
.kv dd{flex:0 0 auto;margin:0;text-align:right}
dl{margin:0}
code{font:400 14px/1.5 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;background:var(--shell);
  padding:2px 6px;border-radius:2px;color:var(--ink)}
.req{font:500 12px/1.4 var(--ui);letter-spacing:.14em;color:var(--muted);white-space:nowrap}
footer{background:var(--deep);color:var(--mutedDeep);font-size:15px;padding:36px 20px}
footer .in{max-width:1120px;margin:auto;max-width:80ch}
footer a{color:var(--onDeep)}

/* AAA 2.5.5: links and controls standing alone in tables and action rows get a full 44px target */
td a,th a,.actions a,.row-actions a{display:inline-flex;align-items:center;min-height:var(--tap);min-width:var(--tap)}
.cellcheck{display:inline-flex;align-items:center;justify-content:center;min-width:var(--tap);min-height:var(--tap);cursor:pointer}
.cellcheck input{margin:0}
.subnav{margin:0 0 22px;border-bottom:1px solid var(--line)}
.subnav ul{list-style:none;margin:0;padding:0;display:flex;flex-wrap:wrap;gap:2px}
.subnav a{display:inline-flex;align-items:center;gap:8px;min-height:var(--tap);padding:0 14px;color:var(--ink);
  text-decoration:none;border-bottom:3px solid transparent;font-size:15px}
.subnav a:hover{text-decoration:underline}
.subnav a[aria-current]{border-bottom-color:var(--brand);font-weight:600}
.count{display:inline-block;min-width:1.6em;padding:1px 7px;border-radius:2px;background:var(--rust);color:var(--onDeep);font-size:13px;text-align:center}
textarea{min-height:7rem;resize:vertical;max-width:100%}
.log{list-style:none;margin:0 0 18px;padding:18px;background:var(--card);border:1px solid var(--line);border-radius:2px;
  max-height:60vh;overflow-y:auto;display:flex;flex-direction:column;gap:14px}
.msg{max-width:min(46ch,88%);padding:12px 14px;border-radius:2px;border:1px solid var(--line);background:var(--shell)}
.msg.mine{align-self:flex-end;background:var(--sky);border-color:var(--line2)}
.msg p{margin:0;white-space:pre-wrap;overflow-wrap:anywhere}
.msg .who{display:block;font:500 12px/1.4 var(--ui);letter-spacing:.12em;text-transform:uppercase;color:var(--muted);margin-bottom:4px}
.row-actions{display:flex;flex-wrap:wrap;gap:8px}
@media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important;scroll-behavior:auto!important}}
@media (prefers-contrast:more){:root{--muted:#22333B;--line:#8C8674;--line2:#5E5849;--mutedDeep:#E4EFF1}}
@media print{.top,footer,.actions{display:none}body{background:#fff}}
`;

/* Accessible field helper — guarantees a <label for> / id pair on every control. */
let n = 0;
export const field = ({ label, name, type = 'text', value = '', hint = '', required = false, autocomplete, attrs = '', options }) => {
  const id = `f${++n}-${name}`;
  const hintId = hint ? `${id}-h` : '';
  const common = `id="${id}" name="${esc(name)}"${required ? ' required aria-required="true"' : ''}` +
    `${hintId ? ` aria-describedby="${hintId}"` : ''}${autocomplete ? ` autocomplete="${autocomplete}"` : ''} ${attrs}`;
  const control = options
    ? `<select ${common}>${options.map((o) => `<option value="${esc(o.v)}"${String(o.v) === String(value) ? ' selected' : ''}>${esc(o.t)}</option>`).join('')}</select>`
    : type === 'textarea' ? `<textarea ${common}>${esc(value)}</textarea>`
    : `<input type="${type}" value="${esc(value)}" ${common}>`;
  return `<div class="field"><label for="${id}">${esc(label)}${required ? ' <span class="vh">(required)</span>' : ''}</label>
    ${control}${hint ? `<p class="hint" id="${hintId}">${hint}</p>` : ''}</div>`;
};

export const crumbs = (trail) => `<nav class="crumbs" aria-label="Breadcrumb"><ol>${trail.map((t, i) =>
  `<li>${t.href && i < trail.length - 1 ? `<a href="${t.href}">${esc(t.label)}</a>` : `<span aria-current="page">${esc(t.label)}</span>`}</li>`).join('')}</ol></nav>`;

const NAV = [['/charter', 'Private charter'], ['/trips', 'Open trips'], ['/fleet', 'Fleet'], ['/retrieve', 'My booking'], ['/support', 'Chat with us']];

export const page = ({ title, user, body, hero = '', path = '', trail = null, admin = null, script = '' }) => `<!doctype html><html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)} · Andalusia Phinisi Charters</title><style>${CSS}</style></head><body>
<a class="skip" href="#main">Skip to main content</a>
<header class="top"><nav class="bar" aria-label="Primary">
  <a class="brand" href="/"${path === '/' ? ' aria-current="page"' : ''}>Andalusia<span>Phinisi Charters</span></a>
  ${NAV.map(([h, t]) => `<a href="${h}"${path === h ? ' aria-current="page"' : ''}>${t}</a>`).join('')}
  ${user ? `<a href="${user.role === 'agent' ? '/agent' : '/admin'}">${esc(user.role === 'agent' ? 'Agent portal' : 'Admin')}</a>
            <a href="/logout">Sign out<span class="vh"> — ${esc(user.name)}</span></a>`
         : `<a href="/login"${path === '/login' ? ' aria-current="page"' : ''}>Agent &amp; staff sign in</a>`}
</nav></header>
${hero}
<main id="main">${trail ? crumbs(trail) : ''}${admin ? adminNav(user, admin) : ''}${body}</main>
<footer><div class="in"><p>Prototype built to the business rules in <cite>Phinisi Booking Platform — Business Requirements v1.0</cite>.
No real payments are taken and no real vessel is reserved.</p>
<p>Targets WCAG 2.2 Level AAA. Found a barrier? <a href="/retrieve">Contact us through your booking page</a>.</p></div></footer>
${script}</body></html>`;

export const req = (ids) => ` <span class="req">${esc(ids)}</span>`;

/* ---------- admin shell ---------- */
// BR01: one permission map; every admin route and every admin link checks it
export const PERMS = {
  dashboard: ['admin', 'ops', 'finance'], bookings: ['admin', 'ops', 'finance'], chat: ['admin', 'ops', 'finance'],
  catalog: ['admin', 'ops'], departures: ['admin', 'ops'], schedule: ['admin', 'ops'],
  cancel: ['admin', 'ops'], rates: ['admin', 'finance'], refunds: ['admin', 'finance'],
  agents: ['admin'], users: ['admin'], settings: ['admin'], audit: ['admin', 'finance'],
};
export const can = (user, perm) => !!user && user.active !== 0 && (PERMS[perm] ?? []).includes(user.role);

const ADMIN_NAV = [
  ['dashboard', '/admin', 'Dashboard'], ['bookings', '/admin/bookings', 'Bookings'], ['chat', '/admin/chat', 'Inbox'],
  ['catalog', '/admin/ships', 'Ships'], ['catalog', '/admin/products', 'Products'], ['departures', '/admin/departures', 'Departures'],
  ['rates', '/admin/rates', 'Rates'], ['agents', '/admin/agents', 'Agents'], ['users', '/admin/users', 'Users'],
  ['schedule', '/admin/sheets', 'Schedule'], ['settings', '/admin/settings', 'Settings'], ['audit', '/admin/audit', 'Audit'],
];
// only a real count earns a badge; "0" in rust is noise
const unreadBadge = () => { const n = adminNav.unread?.() ?? 0; return n > 0 ? ` <span class="count">${n}<span class="vh"> unread</span></span>` : ''; };
export const adminNav = (user, active) => `<nav class="subnav" aria-label="Administration"><ul>${ADMIN_NAV
  .filter(([p]) => can(user, p))
  .map(([, href, label]) => `<li><a href="${href}"${href === active ? ' aria-current="page"' : ''}>${label}${
    href === '/admin/chat' ? unreadBadge() : ''}</a></li>`)
  .join('')}</ul></nav>`;

/* ---------- post/redirect/get feedback ---------- */
export const flash = (url) => {
  const ok = url.searchParams.get('ok'), err = url.searchParams.get('err');
  return (ok ? `<div class="notice ok" role="status"><p>${esc(ok)}</p></div>` : '') +
    (err ? `<div class="notice bad" role="alert"><p><strong>Not saved:</strong> ${esc(err)}</p></div>` : '');
};

/* ---------- chat UI, shared by the visitor page and the staff inbox ---------- */
const hhmm = (iso) => `<time datetime="${esc(iso)}">${esc(iso.slice(0, 10))} ${esc(iso.slice(11, 16))} UTC</time>`;
export const renderMsg = (m, mine) => `<li class="msg${m.sender === mine ? ' mine' : ''}" data-id="${m.id}">
  <span class="who">${m.sender === mine ? 'You' : esc(m.author)}${m.sender === 'staff' && m.sender !== mine ? ' · staff' : ''} · ${hhmm(m.created_at)}</span>
  <p>${esc(m.body)}</p></li>`;

// role="log" is a polite live region; the toggle lets people suppress live updates (AAA 2.2.4 Interruptions)
export const chatLog = (msgs, mine, label) => `<ol id="log" class="log" role="log" aria-label="${esc(label)}">${
  msgs.length ? msgs.map((m) => renderMsg(m, mine)).join('') : '<li class="empty muted">No messages yet.</li>'}</ol>`;

export const chatForm = ({ action, label = 'Your message', hidden = '' }) => `<form id="chat-form" method="post" action="${action}">
  ${hidden}<p id="chat-error" class="notice bad" role="alert" hidden></p>
  ${field({ label, name: 'body', type: 'textarea', required: true, attrs: 'maxlength="2000" rows="4"',
    hint: 'Up to 2,000 characters. Please do not send card numbers or passport details here.' })}
  <div class="actions"><button>Send message</button>
    <label class="check" for="live" id="live-wrap" hidden><input type="checkbox" id="live" checked>
      <span>Show new messages as they arrive</span></label>
    <a href="">Check for new messages</a></div>
  <p id="chat-status" class="muted" role="status"></p></form>`;

export const chatClient = ({ stream, post, mine }) => `<script>
(() => {
  const log = document.getElementById('log'), form = document.getElementById('chat-form');
  const live = document.getElementById('live'), status = document.getElementById('chat-status');
  if (!log || !form || !window.EventSource || !window.fetch) return;
  document.getElementById('live-wrap').hidden = false;
  const seen = new Set([...log.querySelectorAll('[data-id]')].map((li) => li.dataset.id));
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const add = (m) => {
    if (seen.has(String(m.id))) return; seen.add(String(m.id));
    log.querySelector('.empty')?.remove();
    const li = document.createElement('li');
    li.className = 'msg' + (m.sender === '${mine}' ? ' mine' : ''); li.dataset.id = m.id;
    const who = m.sender === '${mine}' ? 'You' : esc(m.author) + (m.sender === 'staff' ? ' · staff' : '');
    li.innerHTML = '<span class="who">' + who + ' · <time datetime="' + esc(m.created_at) + '">' + esc(m.created_at.slice(0, 10)) + ' ' +
      esc(m.created_at.slice(11, 16)) + ' UTC</time></span><p>' + esc(m.body) + '</p>';
    log.appendChild(li); log.scrollTop = log.scrollHeight;
  };
  let es;
  const connect = () => {
    es = new EventSource('${stream}');
    es.addEventListener('message', (e) => add(JSON.parse(e.data)));
    es.addEventListener('status', (e) => { status.textContent = 'This conversation is now ' + JSON.parse(e.data).status + '.'; });
  };
  const toggle = () => { if (live.checked) connect(); else es && es.close(); try { localStorage.setItem('chat-live', live.checked ? '1' : '0'); } catch {} };
  try { if (localStorage.getItem('chat-live') === '0') live.checked = false; } catch {}
  live.addEventListener('change', toggle); toggle();
  log.scrollTop = log.scrollHeight;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const ta = form.elements.body, err = document.getElementById('chat-error');
    const r = await fetch('${post}', { method: 'POST', headers: { accept: 'application/json', 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(new FormData(form)) }).catch(() => null);
    const j = r ? await r.json().catch(() => ({})) : {};
    if (!r || !r.ok) { err.textContent = j.error || 'Could not send. Check your connection and try again.'; err.hidden = false;
      ta.setAttribute('aria-invalid', 'true'); ta.focus(); return; }
    err.hidden = true; ta.removeAttribute('aria-invalid'); ta.value = ''; add(j.message); ta.focus();
  });
})();
</script>`;
