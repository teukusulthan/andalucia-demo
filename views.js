import { idr } from './core.js';
import { img as mediaImg, video as mediaVideo } from './media.js';
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const money = idr;

/* Design tokens. Reference: pacifichighcruise.com - cream paper, near-black teal, rust accent,
   wide-tracked uppercase micro-labels, 2px radii, light editorial display type.
   Every foreground/background pair below is asserted at >= 7:1 (WCAG 2.2 AAA 1.4.6) by test.js. */
/* Neutral monochrome, one accent. The photography carries every other colour on the page,
   which is why the interface itself holds none: a warm-paper-plus-oxblood palette made the
   brand invisible behind its own decoration. Greys are cool-neutral, never cream. */
export const TOKENS = {
  paper: '#FAFAFA', card: '#FFFFFF', shell: '#F1F1EF', sky: '#EDEFF4',
  deep: '#111113', band: '#1C1C20',
  ink: '#111113', muted: '#4E4E55', line: '#E6E6E4', line2: '#8E8E95',
  /* the single accent: a deep navy-cobalt, 66% saturation, used only for links and primaries */
  brand: '#1D3E8F', brandHi: '#16306F',
  /* functional status colours. Not brand colours - they appear only in the operations console. */
  rust: '#6C2B29', good: '#1F5233', warn: '#663D0D',
  onDeep: '#FAFAFA', mutedDeep: '#ADADB5',
  tagBg: '#ECECEA', tagGood: '#E3EFE7', tagWarn: '#F3EAD9', tagBad: '#F4E4E2',
  /* focus is a signal, not a brand colour; it is the one warm value and it only ever
     appears while an element has keyboard focus. */
  focus: '#FFB000',
  /* star ratings, the one place the brief asks for gold. One value for light grounds and
     one for dark, because a single gold cannot clear 7:1 against both (1.4.6). */
  gold: '#6B4A00', goldDeep: '#E8B84B',
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
  ['gold', 'paper'], ['gold', 'card'], ['goldDeep', 'deep'], ['goldDeep', 'band'],
];

/* Cinematic sections put cream text over photography. Rather than hope a photograph is dark
   enough, the text always sits on a scrim of --deep at this alpha. At >= 0.85 the composite
   luminance is within a rounding error of --deep itself, so the declared onDeep/deep pair
   still describes what a reader actually sees (1.4.6). test.js asserts the floor. */
export const SCRIM_ALPHA = 0.88;

const vars = Object.entries(TOKENS).map(([k, v]) => `--${k}:${v}`).join(';');

const CSS = `
/* One typeface, hierarchy from weight, scale and tracking rather than from a second family.
   The serif display face read as heritage-brochure; this reads as now. One radius for the
   whole page, and it is zero: every corner on the site is square. */
:root{${vars};
  --ui:ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;
  --display:var(--ui);
  --tap:44px;--r:0;
  --gap:clamp(72px,9vw,136px)}
*{box-sizing:border-box}
html{-webkit-text-size-adjust:100%;scrollbar-gutter:stable}
body{margin:0;background:var(--paper);color:var(--ink);
  font:400 17px/1.6 var(--ui);text-align:left;
  -webkit-font-smoothing:antialiased;
  /* AAA 1.4.8 text spacing */ letter-spacing:.005em;word-spacing:.02em}
p{margin:0 0 1.5em;max-width:74ch}
h1,h2,h3,h4{font-family:var(--display);font-weight:600;letter-spacing:-.025em;line-height:1.12}
h1{font-size:clamp(2.3rem,1.5rem + 3.1vw,3.7rem);letter-spacing:-.038em;line-height:1.04;margin:0 0 .4em;max-width:19ch}
h2{font-size:clamp(1.55rem,1.2rem + 1.5vw,2.3rem);letter-spacing:-.032em;margin:0 0 1rem;max-width:26ch}
h3,h4{max-width:34ch}
h3{font-size:1.08rem;letter-spacing:-.012em;margin:0 0 .5rem}
h4{font-size:.95rem}
a{color:var(--brand);text-underline-offset:.24em;text-decoration-thickness:.07em}
a:hover{color:var(--brandHi);text-decoration-thickness:.14em}

/* AAA 2.4.13 focus appearance: two-tone ring stays visible on cream and on the dark bands */
:focus-visible{outline:3px solid var(--focus);outline-offset:2px;box-shadow:0 0 0 6px var(--ink);border-radius:var(--r)}
.skip{position:absolute;left:-9999px;top:0;z-index:99;background:var(--ink);color:var(--onDeep);
  padding:0 22px;min-height:var(--tap);display:inline-flex;align-items:center;font:600 15px/1 var(--ui);text-decoration:underline}
.skip:focus{left:8px;top:8px}
/* screen-reader-only text. The positioned ancestors below keep it inside its scroll container,
   otherwise it resolves against the viewport and drags the whole page sideways (1.4.10). */
.vh{position:absolute!important;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap;border:0}

/* ---------- masthead ----------
   Sticky, and it hides itself on the way down and returns on the way up. That is the brief's
   behaviour and it is also what keeps AAA 2.4.12 honest: a bar that is always pinned can cover
   the element that just took focus. scroll-padding-top below does the rest for keyboard users. */
.top{position:sticky;top:0;z-index:40;background:var(--deep);color:var(--onDeep);
  transition:transform .32s ease,background-color .32s ease}
.top.is-hidden{transform:translateY(-100%)}
/* On pages that open with a hero the bar overlays it, so it must leave the flow entirely.
   Fixed from the start rather than swapped on scroll - swapping would jump the layout. */
.floathead .top{position:fixed;left:0;right:0}
/* floating over a hero: a gradient scrim, never bare text on photography */
.top.is-float{background:linear-gradient(to bottom,rgba(2,19,25,.96),rgba(2,19,25,.78) 58%,rgba(2,19,25,0))}
.topin{max-width:1280px;margin:auto;display:flex;gap:10px;align-items:center;padding:6px 24px}
.bar{flex:1 1 auto;min-width:0}
.bar a,.topcta a,.lang summary{color:var(--onDeep);text-decoration:none;font-size:14px;letter-spacing:0;
  min-height:var(--tap);display:inline-flex;align-items:center;padding:0 14px}
.bar a{opacity:.82;transition:opacity .18s ease}
.bar a:hover,.bar a[aria-current]{opacity:1;color:var(--onDeep)}
.bar a[aria-current]{text-decoration:underline;text-decoration-thickness:.07em;text-underline-offset:.5em}
/* the wordmark is the only letter-spaced element left in the interface */
.brand{font-family:var(--display);font-size:16px;font-weight:600;letter-spacing:.2em;text-transform:uppercase;
  color:var(--onDeep);text-decoration:none;padding:0 18px 0 0;display:inline-flex;
  align-items:center;line-height:1;min-height:var(--tap);flex:0 0 auto}
.brand span{display:none}

/* language selector - a disclosure, so it works with no JavaScript at all */
.lang{position:relative;flex:0 0 auto}
.lang summary{list-style:none;cursor:pointer;font:500 13px/1 var(--ui);letter-spacing:.1em;gap:6px}
.lang summary::-webkit-details-marker{display:none}
.lang summary::after{content:"";border:4px solid transparent;border-top-color:currentColor;margin-top:4px}
.lang[open] summary::after{transform:rotate(180deg);margin-top:-4px}
.lang ul{position:absolute;left:0;top:100%;z-index:50;margin:0;padding:6px;list-style:none;
  background:var(--deep);border:1px solid var(--line2);border-radius:var(--r);min-width:13rem}
.lang li a{display:flex;min-height:var(--tap);align-items:center;padding:0 12px;font-size:15px;letter-spacing:.02em}
.lang li a:hover{background:var(--band);text-decoration:underline}
.lang li a[aria-current]{color:var(--focus)}

/* primary nav + hover/focus mega panels */
.mainnav{list-style:none;margin:0;padding:0;display:flex;gap:2px;justify-content:center;flex-wrap:wrap}
.mainnav > li{position:static}
.mega{position:absolute;left:0;right:0;top:100%;background:var(--deep);border-top:1px solid var(--line2);
  box-shadow:0 18px 40px rgba(2,19,25,.45);opacity:0;visibility:hidden;transform:translateY(-6px);
  transition:opacity .18s ease,transform .18s ease,visibility .18s;z-index:45}
.has-mega:hover > .mega,.has-mega:focus-within > .mega{opacity:1;visibility:visible;transform:none}
.megain{max-width:1280px;margin:auto;display:grid;gap:28px;padding:26px 20px 32px;
  grid-template-columns:repeat(auto-fit,minmax(min(230px,100%),1fr))}
/* deliberately a <p>, not a heading: the first heading on every page must be its h1 (1.3.1) */
.mega-t{font:500 11px/1.4 var(--ui);letter-spacing:.1em;text-transform:uppercase;color:var(--mutedDeep);
  margin:0 0 14px;padding-bottom:12px;border-bottom:1px solid rgba(250,250,250,.16);max-width:none}
.mega ul{list-style:none;margin:0;padding:0}
.mega li a{display:flex;align-items:center;min-height:var(--tap);padding:0;color:var(--onDeep);
  text-decoration:none;font-size:15px;opacity:.78;transition:opacity .15s ease}
.mega li a:hover{opacity:1;text-decoration:underline;text-underline-offset:.3em;text-decoration-thickness:.07em}
.mega .soon{color:var(--mutedDeep);font-size:11px;letter-spacing:.1em;text-transform:uppercase;margin-left:10px}
.topcta{display:flex;gap:6px;align-items:center;flex:0 0 auto}
.topcta .btn{min-height:38px;padding:0 18px;font-size:14px;letter-spacing:0;
  background:var(--onDeep);border-color:var(--onDeep);color:var(--ink)}
.topcta .btn:hover{background:transparent;border-color:var(--onDeep);color:var(--onDeep)}
/* The menu button is a mobile affordance and a progressive enhancement: with no JavaScript the
   panel simply stays open and the nav stacks, which is why it is a button and not a <details>
   (a closed <details> is not laid out at all, so it cannot be re-shown with CSS on desktop). */
.navwrap{flex:1 1 auto;min-width:0}
.navtoggle{display:none;background:transparent;border:1px solid var(--line2);color:var(--onDeep);
  min-height:var(--tap);padding:0 16px;font:500 13px/1 var(--ui);letter-spacing:.1em;text-transform:uppercase}
.navtoggle:hover{background:var(--band);border-color:var(--onDeep);color:var(--onDeep)}
.navwrap.js .navpanel{display:none}
.navwrap.js.open .navpanel{display:block}
@media(max-width:1080px){
  .topin{flex-wrap:wrap;padding:8px 16px}
  .navwrap{flex:1 0 100%;order:5}
  .navtoggle{display:inline-flex;align-items:center;margin:4px 0}
  .mainnav{flex-direction:column;gap:0;align-items:stretch}
  .mega{position:static;opacity:1;visibility:visible;transform:none;box-shadow:none;border-top:0;background:var(--band)}
  .megain{padding:12px 8px;gap:14px}
  .brand{margin-right:auto}
}
@media(min-width:1081px){
  /* desktop always lays the nav out, whatever the toggle last did on a narrow screen */
  .navwrap.js .navpanel{display:block}
}

main{max-width:1120px;margin:0 auto;padding:8px 20px 96px}
/* marketing pages run full-bleed and each band sets its own measure, so nothing needs a
   100vw breakout (which would fight scrollbar-gutter and scroll sideways - 1.4.10) */
main.full{max-width:none;padding:0}
main.full > .crumbs{max-width:1120px;margin:0 auto;padding:22px 20px}
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

.eyebrow{font:500 12px/1.4 var(--ui);letter-spacing:.1em;text-transform:uppercase;color:var(--muted);margin:0 0 14px}
.hero .eyebrow{color:var(--mutedDeep)}
.lede{font-size:20px;line-height:1.55;color:var(--muted);max-width:62ch;letter-spacing:-.008em}
.deepband .lede{color:var(--mutedDeep)}

.grid{display:grid;gap:20px;margin:8px 0}
.grid > *,.split > *{min-width:0}
.g2{grid-template-columns:repeat(auto-fit,minmax(min(320px,100%),1fr))}
.g3{grid-template-columns:repeat(auto-fit,minmax(min(268px,100%),1fr))}
/* Cards earn a box only where elevation means something. On the editorial pages a "card" is
   a hairline above the content and nothing else, which is what makes the pages read as quiet. */
.card{background:transparent;border:0;border-top:1px solid var(--line);border-radius:var(--r);padding:22px 0 0}
.card.pad0{padding:0;overflow:hidden;border-top:0}
.card h3{margin-top:0}
.card > :last-child{margin-bottom:0}
a.card{display:block;text-decoration:none;color:inherit;transition:border-color .2s ease}
a.card:hover{border-top-color:var(--ink)}
a.card h3{color:var(--ink)}
a.card:hover h3{text-decoration:underline;text-underline-offset:.2em}
/* the boxed variant, kept for the operations console where a panel is real hierarchy */
.panel,fieldset{background:var(--card);border:1px solid var(--line);border-radius:var(--r);padding:24px}
.panel > :last-child{margin-bottom:0}
.thumb{height:150px;display:flex;align-items:flex-end;padding:14px;color:var(--onDeep);
  font:500 12px/1 var(--ui);letter-spacing:.1em;text-transform:uppercase}

/* forms - every control is labelled and at least 44px tall */
fieldset{border:1px solid var(--line);border-radius:var(--r);margin:0 0 20px;padding:18px 20px 22px;background:var(--card)}
legend{font-family:var(--display);font-size:1.2rem;padding:0 8px}
.field{margin:0 0 18px}
label,.lbl{position:relative;display:block;font:500 12px/1.4 var(--ui);letter-spacing:.1em;text-transform:uppercase;color:var(--muted);margin-bottom:6px}
.hint{font-size:14px;color:var(--muted);margin:6px 0 0;max-width:62ch}
input,select,textarea{font:400 17px/1.4 var(--ui);color:var(--ink);background:var(--card);
  border:1px solid var(--line2);border-radius:var(--r);padding:11px 12px;min-height:var(--tap);width:100%;max-width:34rem}
input[type=checkbox]{width:26px;height:26px;min-height:26px;accent-color:var(--brand);margin:0 12px 0 0;flex:0 0 auto}
/* the label is the pointer target, so it carries the 44px minimum (AAA 2.5.5) */
.check{display:flex;align-items:center;gap:2px;min-height:var(--tap);padding:9px 0;font-size:16px;line-height:1.5;text-transform:none;letter-spacing:normal;color:var(--ink);max-width:62ch;cursor:pointer}
input:hover,select:hover{border-color:var(--ink)}
/* Primary is near-black and turns to the accent on hover; ghost is a hairline. Square, both. */
button,.btn{position:relative;font:500 15px/1 var(--ui);letter-spacing:.01em;background:var(--ink);color:var(--paper);
  border:1px solid var(--ink);min-height:var(--tap);padding:13px 26px;border-radius:var(--r);cursor:pointer;
  text-decoration:none;display:inline-flex;align-items:center;justify-content:center;gap:8px;
  transition:background-color .18s ease,border-color .18s ease,transform .18s ease}
button:hover,.btn:hover{background:var(--brand);border-color:var(--brand);color:var(--paper)}
button:active,.btn:active{transform:translateY(1px)}
.btn.ghost,button.ghost{background:transparent;color:var(--ink);border-color:var(--line2)}
.btn.ghost:hover,button.ghost:hover{background:var(--ink);color:var(--paper);border-color:var(--ink)}
.btn.bad,button.bad{background:var(--rust);border-color:var(--rust);color:var(--onDeep)}
.btn.warn,button.warn{background:var(--warn);border-color:var(--warn);color:var(--onDeep)}
button[disabled]{background:var(--shell);color:var(--muted);border-color:var(--line2);cursor:not-allowed}
/* Align on the top of each field, not the bottom: a field carrying a hint is taller than its
   neighbours, and aligning bottoms pushed its control out of line with the rest of the row. */
.filters{background:var(--card);border:1px solid var(--line);border-radius:var(--r);padding:22px;
  display:flex;gap:20px;flex-wrap:wrap;align-items:flex-start;margin:0 0 26px}
.filters .field{margin:0;min-width:11rem;flex:1 1 11rem}
.filters input,.filters select{max-width:none}
.filters button{flex:0 0 auto;margin-top:23px}
.actions{display:flex;gap:10px;flex-wrap:wrap;align-items:center}

/* tables */
.scroll{position:relative;overflow-x:auto;max-width:100%;border:1px solid var(--line);border-radius:var(--r);background:var(--card);margin:0 0 20px}
table{width:100%;border-collapse:collapse;font-size:16px}
caption{text-align:left;font:500 12px/1.4 var(--ui);letter-spacing:.1em;text-transform:uppercase;
  color:var(--muted);padding:14px 16px;border-bottom:1px solid var(--line)}
th,td{padding:12px 16px;border-bottom:1px solid var(--line);vertical-align:top;text-align:left}
thead th{font:500 12px/1.4 var(--ui);letter-spacing:.1em;text-transform:uppercase;color:var(--muted);background:var(--shell)}
tbody th{font-weight:600;font-size:16px}
tbody tr:last-child th,tbody tr:last-child td{border-bottom:0}

.tag{display:inline-block;font:500 11px/1.5 var(--ui);letter-spacing:.1em;text-transform:uppercase;
  padding:5px 10px;border-radius:var(--r);background:var(--tagBg);color:var(--ink)}
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
  padding:2px 6px;border-radius:var(--r);color:var(--ink)}
.req{font:500 12px/1.4 var(--ui);letter-spacing:.1em;color:var(--muted);white-space:nowrap}
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
.count{display:inline-block;min-width:1.6em;padding:1px 7px;border-radius:var(--r);background:var(--rust);color:var(--onDeep);font-size:13px;text-align:center}
textarea{min-height:7rem;resize:vertical;max-width:100%}
.log{list-style:none;margin:0 0 18px;padding:18px;background:var(--card);border:1px solid var(--line);border-radius:var(--r);
  max-height:60vh;overflow-y:auto;display:flex;flex-direction:column;gap:14px}
.msg{max-width:min(46ch,88%);padding:12px 14px;border-radius:var(--r);border:1px solid var(--line);background:var(--shell)}
.msg.mine{align-self:flex-end;background:var(--sky);border-color:var(--line2)}
.msg p{margin:0;white-space:pre-wrap;overflow-wrap:anywhere}
.msg .who{display:block;font:500 12px/1.4 var(--ui);letter-spacing:.12em;text-transform:uppercase;color:var(--muted);margin-bottom:4px}
.row-actions{display:flex;flex-wrap:wrap;gap:8px}
/* ================= cinematic marketing sections =================
   Full-bleed photography, but every piece of text sits on a scrim of --deep so the declared
   onDeep/deep pair still describes the contrast a reader gets (AAA 1.4.6). */
html{scroll-padding-top:96px}                 /* the sticky bar never lands on the focused element */
.wide{max-width:none;width:100%}
.shellband{background:var(--shell);margin:0;padding:var(--gap) 20px}
.deepband{background:var(--deep);color:var(--onDeep);padding:var(--gap) 20px}
.plainband{padding:var(--gap) 20px}
/* ghost buttons on dark grounds need their own stroke, or they vanish into the photograph */
.cine .btn.ghost,.deepband .btn.ghost,.ctaband .btn.ghost{color:var(--onDeep);border-color:rgba(250,250,250,.45);background:transparent}
.cine .btn.ghost:hover,.deepband .btn.ghost:hover,.ctaband .btn.ghost:hover{background:var(--onDeep);color:var(--ink);border-color:var(--onDeep)}
.deepband h2,.deepband h3{color:var(--onDeep)}
.deepband p{color:var(--mutedDeep)}
.deepband a{color:var(--onDeep)}
.inner{max-width:1120px;margin:auto}
.inner.narrow{max-width:760px}
.center{text-align:center}
.center p{margin-left:auto;margin-right:auto}
.center h1,.center h2,.center h3{max-width:22ch;margin-left:auto;margin-right:auto}
.display{font-family:var(--display);font-weight:400;letter-spacing:-.02em;line-height:1.12}

/* hero: media underneath, scrim over it, content on top */
.cine{position:relative;isolation:isolate;min-height:min(92vh,860px);display:flex;align-items:flex-end;
  background:var(--deep);color:var(--onDeep);overflow:hidden}
.cine.short{min-height:min(64vh,560px)}
.cine > .bg{position:absolute;inset:0;z-index:-2}
.cine > .bg img,.cine > .bg video{width:100%;height:100%;object-fit:cover;display:block}
.cine > .scrim{position:absolute;inset:0;z-index:-1;
  background:linear-gradient(to bottom,rgba(2,19,25,.92) 0%,rgba(2,19,25,.70) 34%,rgba(2,19,25,.${String(SCRIM_ALPHA).slice(2)}) 100%)}
/* Same 1120 measure as every section below, so the hero headline sits on the page grid rather
   than against the viewport edge. Top padding stays under the cap so copy never floats. */
.cine .in{position:relative;max-width:1160px;margin:auto;width:100%;padding:96px 20px 88px}
.cine h1{max-width:15ch;color:var(--onDeep);font-size:clamp(2.5rem,1.2rem + 4.4vw,4.4rem);
  letter-spacing:-.04em;line-height:1.02;margin:0 0 .32em}
.cine p{color:var(--onDeep);max-width:50ch;font-size:18px;line-height:1.55}
.cine .eyebrow{color:var(--mutedDeep)}
/* The title settles in rather than snapping. The visible state is the default and the animation
   is the enhancement, so hero copy can never be stranded at opacity:0 anywhere animations do not
   run - print, reduced motion, or a renderer that never starts the clock. */
@media (prefers-reduced-motion:no-preference){
  .fade-up{animation:fadeUp 1.1s cubic-bezier(.22,.61,.36,1) both}
  .fade-up.d1{animation-delay:.25s}
  .fade-up.d2{animation-delay:.5s}
}
@keyframes fadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:none}}

/* The brief asked for a scroll indicator. It is gone deliberately: a reader looking at a hero
   already knows the page scrolls, and the label was the loudest thing in an otherwise quiet
   composition. The hero simply runs short of the fold instead, which does the same job. */

/* testimonials - scroll-snap, so swipe and the arrow keys both work with no JavaScript.
   position:relative for the same reason .scroll carries it: a .vh span inside is absolutely
   positioned, and without a positioned ancestor *here* it resolves against the page instead,
   lands at its un-scrolled x, and drags the document sideways (1.4.10). */
.rail-wrap{position:relative}
.hscroll{position:relative;display:grid;grid-auto-flow:column;grid-auto-columns:minmax(min(340px,86%),1fr);gap:20px;
  overflow-x:auto;scroll-snap-type:x mandatory;padding:4px 4px 20px;margin:0;list-style:none;
  scrollbar-width:thin;overscroll-behavior-x:contain}
.hscroll > *{scroll-snap-align:start;min-width:0}
/* Quote bodies are trimmed to a glance, so no card and no inner scrollbar: a hairline above,
   the words, the name. */
.quote{background:transparent;border:0;border-top:1px solid var(--line);border-radius:var(--r);
  padding:22px 0 0;display:flex;flex-direction:column;gap:16px;height:100%}
.quote blockquote{margin:0;font-size:17px;line-height:1.55;letter-spacing:-.01em}
.quote blockquote p{max-width:none;margin:0}
.quote figcaption{margin-top:auto;font-size:14px;color:var(--muted)}
.quote .who{font-weight:500;color:var(--ink);display:block;margin-bottom:2px}
.stars{color:var(--gold);letter-spacing:.1em;font-size:17px}
.deepband .stars{color:var(--goldDeep)}
.railnav{display:flex;gap:10px;justify-content:flex-end;margin:0 0 8px}
.railnav button{background:var(--card);color:var(--brand);border:1px solid var(--brand);min-width:var(--tap);padding:0 14px}

/* gated news preview */
.gated{position:relative}
.gated .peek{filter:blur(5px);opacity:.55;pointer-events:none;user-select:none}
.gated .lock{position:absolute;inset:auto 0 0 0;top:0;display:flex;flex-direction:column;
  align-items:center;justify-content:center;gap:14px;text-align:center;padding:24px;
  background:linear-gradient(to bottom,rgba(255,254,242,.35),var(--paper) 72%)}
.gated .lock > *{max-width:44ch}
.phone{border:1px solid var(--line);border-radius:var(--r);background:var(--card);padding:12px;box-shadow:0 10px 30px rgba(10,26,33,.08)}
.phone .screen{border-radius:var(--r);overflow:hidden;background:var(--shell)}
.phone .screen img{display:block;width:100%;height:150px;object-fit:cover}
.phone .meta{padding:12px 6px 4px}
.phone h3{font-size:1.05rem;margin:0 0 6px}
.phone p{font-size:15px;margin:0;color:var(--muted)}

/* Selling point, Plan A. Two tall rectangles, not the circles that were here before: the round
   motif fought every other square edge on the page and cropped the photograph badly. */
.doorband{padding:0}
.doors{display:grid;gap:2px;grid-template-columns:repeat(auto-fit,minmax(min(320px,100%),1fr))}
/* width:100% + justify-self, never margin:auto - auto margins cancel the grid item's stretch,
   the box then shrink-wraps its absolutely positioned content, and aspect-ratio collapses it to 0. */
.door{position:relative;display:block;text-decoration:none;color:var(--onDeep);border-radius:var(--r);
  overflow:hidden;aspect-ratio:4/5;width:100%;margin:0;isolation:isolate}
.door img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:-2;transition:transform .7s cubic-bezier(.22,.61,.36,1)}
.door::before{content:"";position:absolute;inset:0;z-index:-1;
  background:linear-gradient(to top,rgba(17,17,19,.82) 0%,rgba(17,17,19,.34) 52%,rgba(17,17,19,.18) 100%)}
.door:hover img{transform:scale(1.04)}
.door .doorin{position:absolute;inset:auto 0 0 0;display:flex;flex-direction:column;
  gap:8px;padding:40px 36px}
.door h3{color:var(--onDeep);font-size:clamp(1.5rem,1.1rem + 1.4vw,2.1rem);margin:0;max-width:14ch;letter-spacing:-.03em}
.door p{color:var(--onDeep);font-size:15px;margin:0;max-width:32ch;opacity:.86}
.door .more{font:500 13px/1 var(--ui);color:var(--onDeep);margin-top:10px;
  display:inline-flex;align-items:center;gap:8px}
.door .more::after{content:"";width:22px;height:1px;background:currentColor;transition:width .3s ease}
.door:hover .more::after{width:38px}
@media(max-width:700px){.door{aspect-ratio:3/2}.door .doorin{padding:28px 24px}}

/* why us */
.why{display:grid;gap:36px 32px;grid-template-columns:repeat(auto-fit,minmax(min(230px,100%),1fr))}
.why .item{padding-top:24px;border-top:1px solid var(--line)}
.why .ic{display:block;width:26px;height:26px;margin:0 0 22px;color:var(--ink)}
.why h3{margin-bottom:10px}
.why p{font-size:15px;line-height:1.6}
.deepband .why .ic{color:var(--onDeep)}
.deepband .why .item{border-top-color:rgba(250,250,250,.2)}

/* horizontal gallery strip */
.strip{position:relative;display:grid;grid-auto-flow:column;grid-auto-columns:minmax(min(300px,80%),1fr);gap:14px;
  overflow-x:auto;scroll-snap-type:x mandatory;padding:0 0 18px;margin:0;list-style:none;overscroll-behavior-x:contain}
.strip li{scroll-snap-align:start;min-width:0}
.strip figure{margin:0}
.strip img{display:block;width:100%;height:250px;object-fit:cover;border-radius:var(--r)}
.strip figcaption{font-size:14px;color:var(--muted);padding:10px 2px 0;max-width:40ch}
.deepband .strip figcaption{color:var(--mutedDeep)}

/* masonry-ish destination gallery */
.tiles{display:grid;gap:14px;grid-template-columns:repeat(auto-fit,minmax(min(260px,100%),1fr))}
.tiles figure{margin:0;position:relative;overflow:hidden;border-radius:var(--r)}
.tiles img{display:block;width:100%;height:220px;object-fit:cover;transition:transform .5s ease}
.tiles figure:hover img{transform:scale(1.04)}
.tiles figcaption{font-size:14px;color:var(--muted);padding:8px 2px 0}
.tiles .tall img{height:330px}

/* room showcase */
.room{padding:64px 0;border-top:1px solid var(--line)}
.room:first-of-type{border-top:0;padding-top:24px}
/* The brief asked for wide-tracked capitals here. Sentence case with tight tracking instead:
   the capitals were the last piece of heritage-brochure styling left on the page. */
.roomname{font-family:var(--display);font-weight:600;text-transform:none;letter-spacing:-.03em;
  text-align:center;font-size:clamp(1.5rem,1.1rem + 1.6vw,2.2rem);max-width:none;margin:0 0 14px}
.roomlead{text-align:center;margin:0 auto 32px;color:var(--muted);max-width:58ch;font-size:16px}
.roomfacts{display:grid;gap:0;grid-template-columns:repeat(auto-fit,minmax(min(190px,100%),1fr));
  border:1px solid var(--line);background:var(--card);margin:22px 0 0}
.roomfacts div{padding:16px 18px;border-right:1px solid var(--line)}
.roomfacts div:last-child{border-right:0}
.roomfacts dt{font:500 11px/1.4 var(--ui);letter-spacing:.1em;text-transform:uppercase;color:var(--muted);margin:0 0 6px}
.roomfacts dd{margin:0;font-size:16px}

/* specification table */
.spectable{max-width:820px;margin:auto}
.spectable caption{text-align:center;font-family:var(--display);font-size:1.5rem;letter-spacing:normal;
  text-transform:none;color:var(--ink);padding:0 0 20px;border-bottom:0}
.spectable th[scope=row]{width:44%;color:var(--muted);font-weight:400}
.pending{color:var(--muted);font-style:italic}

/* Key tags: a quiet wrapped row. No rule between items - a separator drawn with ::before
   lands at the start of any line the list wraps onto, which looks like a bug. Space does it. */
.chips{display:flex;flex-wrap:wrap;gap:10px 28px;list-style:none;margin:0 0 36px;padding:0}
.chips li{font:400 13px/1.5 var(--ui);letter-spacing:.02em;color:var(--muted);padding:0}

/* fact chart used by the trek and hike pages */
.facts{display:grid;gap:1px;background:var(--line);border:1px solid var(--line);
  grid-template-columns:repeat(auto-fit,minmax(min(170px,100%),1fr));margin:0 0 28px}
.facts div{background:var(--card);padding:18px}
.facts dt{font:500 11px/1.4 var(--ui);letter-spacing:.1em;text-transform:uppercase;color:var(--muted);margin:0 0 6px}
.facts dd{margin:0;font-family:var(--display);font-size:1.25rem}

/* closing call to action */
.ctaband{position:relative;isolation:isolate;overflow:hidden;text-align:center;
  padding:112px 20px;color:var(--onDeep);background:var(--deep)}
.ctaband img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:-2}
.ctaband::before{content:"";position:absolute;inset:0;z-index:-1;background:rgba(2,19,25,.${String(SCRIM_ALPHA).slice(2)})}
.ctaband p.line{font-family:var(--display);font-weight:600;letter-spacing:-.035em;
  font-size:clamp(1.7rem,1.1rem + 2.6vw,3.1rem);line-height:1.14;
  max-width:18ch;margin:0 auto 38px;color:var(--onDeep)}
.ctaband .btn{background:var(--onDeep);border-color:var(--onDeep);color:var(--ink);
  padding:0 30px;min-height:52px;font-size:15px;letter-spacing:0;text-transform:none}
.ctaband .btn:hover{background:transparent;color:var(--onDeep);border-color:var(--onDeep)}

/* crew */
.crew{display:grid;gap:28px;grid-template-columns:repeat(auto-fit,minmax(min(250px,100%),1fr))}
.crew figure{margin:0}
.crew img{display:block;width:100%;height:300px;object-fit:cover;border-radius:var(--r);margin:0 0 16px}
.crew .role{font:500 11px/1.4 var(--ui);letter-spacing:.1em;text-transform:uppercase;color:var(--brand);margin:0 0 8px}
.crew h3{margin:0 0 8px}
.crew p{font-size:16px;color:var(--muted)}

/* big number metrics - dt is the label and dd the figure, flipped visually so the number leads */
.metrics{display:grid;gap:24px;grid-template-columns:repeat(auto-fit,minmax(min(180px,100%),1fr));
  text-align:center;margin:40px 0 0}
.metrics > div{min-width:0;display:flex;flex-direction:column-reverse;gap:10px}
.metrics .n{font-family:var(--display);font-size:clamp(2.4rem,1.6rem + 3vw,4rem);line-height:1;margin:0}
.metrics dt{font:500 11px/1.5 var(--ui);letter-spacing:.1em;text-transform:uppercase;color:var(--muted)}

/* the vessel name returning, larger, dissolving into the deep-sea gradient.
   aria-hidden: it repeats the page h1 purely as a visual passage. */
.dissolveband{padding:56px 20px 72px;overflow:hidden}
.vesselname{font-family:var(--display);font-weight:600;text-align:center;line-height:.92;
  margin:0 0 24px;max-width:none;
  font-size:clamp(3rem,.2rem + 11.5vw,9.5rem);letter-spacing:-.045em;color:var(--mutedDeep)}
@supports (-webkit-background-clip:text) or (background-clip:text){
  .vesselname{background:linear-gradient(to bottom,var(--onDeep) 26%,rgba(255,254,242,.07) 94%);
    -webkit-background-clip:text;background-clip:text;color:transparent}
}

/* ---------- marketing footer ---------- */
.foot{background:var(--deep);color:var(--mutedDeep);padding:70px 20px 30px}
.footin{max-width:1280px;margin:auto;display:grid;gap:40px;
  grid-template-columns:repeat(auto-fit,minmax(min(230px,100%),1fr))}
.foot h2{font:500 11px/1.4 var(--ui);letter-spacing:.1em;text-transform:uppercase;color:var(--onDeep);
  margin:0 0 18px;max-width:none}
.foot ul{list-style:none;margin:0;padding:0}
.foot li a,.foot .contact a{display:inline-flex;align-items:center;min-height:var(--tap);color:var(--onDeep);font-size:15px}
.foot p{max-width:34ch;font-size:15px;margin:0 0 12px}
.foot .mark{font-family:var(--display);font-size:22px;letter-spacing:.1em;text-transform:uppercase;
  color:var(--mutedDeep);display:block;margin:0 0 18px}
.foot .contact{margin:0 0 18px}
.foot .contact div{margin:0 0 2px}
.foot .todo{color:var(--mutedDeep);font-size:13px;font-style:italic}
.social{display:flex;gap:10px;flex-wrap:wrap}
.social a{width:var(--tap);height:var(--tap);border:1px solid var(--line2);border-radius:var(--r);
  display:inline-flex;align-items:center;justify-content:center;color:var(--onDeep);
  transition:transform .2s ease,background-color .2s ease}
.social a:hover{background:var(--band);transform:scale(1.08)}
.social svg{width:20px;height:20px}
.footend{max-width:1280px;margin:44px auto 0;padding-top:22px;border-top:1px solid var(--line2);
  display:flex;gap:14px;flex-wrap:wrap;justify-content:space-between;font-size:14px}
.footend a{color:var(--onDeep)}
.footend p{max-width:70ch;margin:0}

@media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important;scroll-behavior:auto!important}}
@media (prefers-contrast:more){:root{--muted:#22333B;--line:#8C8674;--line2:#5E5849;--mutedDeep:#E4EFF1}}
@media print{.top,footer,.actions{display:none}body{background:#fff}
  .fade-up{animation:none;opacity:1}}
`;

/* Accessible field helper - guarantees a <label for> / id pair on every control. */
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

/* ---------- primary navigation ----------
   Column headings inside the panels are <p class="mega-t">, never <hN>: the accessibility
   suite requires the first heading in the document to be the page's own h1 (1.3.1). */
export const DESTINATIONS = [
  ['komodo-village', 'Komodo &amp; Rinca Island'], ['padar-island', 'Padar Island'], ['kelor-island', 'Kelor Island'],
  ['kalong-island', 'Kalong Island'], ['taka-makassar', 'Taka Makassar'], ['manta-point', 'Manta Point'],
  ['penga-island', 'Penga Island'], ['pink-beach', 'Pink Beach'], ['pempeng-island', 'Pempeng Island'],
  ['manjarite-island', 'Manjarite Island'], ['siaba-besar', 'Siaba Besar'], ['kanawa-island', 'Kanawa Island'],
  ['batu-bolong', 'Dive Site Batu Bolong'], ['sebayur-kecil', 'Sebayur Kecil'],
];

export const EXPERIENCES = [
  ['komodo-trekking', 'Komodo trekking'], ['sunrise-hike', 'Sunrise hike'], ['sunset-hike', 'Sunset hike'],
  ['snorkeling', 'Snorkelling spots'], ['diving', 'Diving spots'], ['paddling-kayaking', 'Paddling &amp; kayaking'],
  ['stargazer-dinner', 'Private stargazer dinner'],
];

const MEGA = {
  Sailing: {
    href: '/sailing', cols: [
      ['Our Voyage', [['/sailing/andalucia-1', 'Andalucía I', 'Retired'], ['/sailing/andalucia-2', 'Andalucía II'],
        ['/sailing/andalucia-3', 'Andalucía III', 'Coming soon']]],
      ['Private Charter', EXPERIENCES.map(([s, t]) => [`/experience/${s}`, t]).concat([['/charter', 'Search charter dates']])],
      ['Open Trip', [['/open-trip/itinerary', 'Itinerary'], ['/sailing/cabin-collection', 'Cabin collection'],
        ['/trips', 'Schedule'], ['/retrieve', 'Manage my booking']]],
    ],
  },
  Destination: {
    href: '/destinations', cols: [
      ['Islands &amp; Beaches', DESTINATIONS.slice(0, 5).map(([s, t]) => [`/destination/${s}`, t])],
      ['Reefs &amp; Dive Sites', DESTINATIONS.slice(5, 10).map(([s, t]) => [`/destination/${s}`, t])],
      ['More of the Archipelago', DESTINATIONS.slice(10).map(([s, t]) => [`/destination/${s}`, t])],
    ],
  },
  'Membership Program': {
    href: '/membership', cols: [
      ['Stay in Touch', [['/membership/newsletter', 'Newsletter'], ['/membership/special-offer', 'Special offer']]],
      ['Join', [['/membership/join', 'Sign up'], ['/membership/benefits', 'Membership benefits']]],
    ],
  },
  'About Us': {
    href: '/about', cols: [
      ['The Company', [['/about', 'About Andalucía Charter'], ['/about/legal', 'Legal information'], ['/about/team', 'Our team']]],
      ['The Fleet', [['/fleet', 'Fleet &amp; calendars'], ['/gallery', 'Gallery'], ['/faq', 'Frequently asked questions']]],
    ],
  },
};

export const LANGS = [['en', 'English'], ['fr', 'Français'], ['cn', '中文'], ['id', 'Bahasa Indonesia']];

const megaPanel = (label, cols) => `<div class="mega"><div class="megain">${cols.map(([title, items], ci) => {
  const id = `mt-${label.replace(/\W+/g, '')}-${ci}`;
  return `<div><p class="mega-t" id="${id}">${title}</p>
    <ul aria-labelledby="${id}">${items.map(([h, t, note]) =>
      `<li><a href="${h}">${t}${note ? `<span class="soon">${esc(note)}</span>` : ''}</a></li>`).join('')}</ul></div>`;
}).join('')}</div></div>`;

const primaryNav = (path) => `<nav class="bar" aria-label="Primary"><ul class="mainnav">${
  Object.entries(MEGA).map(([label, { href, cols }]) => `<li class="has-mega">
    <a href="${href}"${path.startsWith(href) && href !== '/' ? ' aria-current="page"' : ''}>${label}</a>
    ${megaPanel(label, cols)}</li>`).join('')}</ul></nav>`;

const langMenu = (lang = 'en') => `<details class="lang">
  <summary>${esc(lang.toUpperCase())}<span class="vh"> - choose a language</span></summary>
  <ul>${LANGS.map(([c, n]) => `<li><a href="/language/${c}"${c === lang ? ' aria-current="true"' : ''}>${n}${
    c === lang ? '<span class="vh"> (current language)</span>' : ''}</a></li>`).join('')}</ul></details>`;

const ICON = {
  instagram: '<path d="M12 2.2c3.2 0 3.6 0 4.9.07 1.2.06 1.8.25 2.2.42.6.22 1 .48 1.4.9.4.4.7.8.9 1.4.2.4.4 1 .4 2.2.1 1.3.1 1.7.1 4.9s0 3.6-.1 4.9c0 1.2-.2 1.8-.4 2.2-.2.6-.5 1-.9 1.4-.4.4-.8.7-1.4.9-.4.2-1 .4-2.2.4-1.3.1-1.7.1-4.9.1s-3.6 0-4.9-.1c-1.2 0-1.8-.2-2.2-.4-.6-.2-1-.5-1.4-.9-.4-.4-.7-.8-.9-1.4-.2-.4-.4-1-.4-2.2C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.9c0-1.2.2-1.8.4-2.2.2-.6.5-1 .9-1.4.4-.4.8-.7 1.4-.9.4-.2 1-.4 2.2-.4C8.4 2.2 8.8 2.2 12 2.2zm0 3.2A6.6 6.6 0 1 0 18.6 12 6.6 6.6 0 0 0 12 5.4zm0 10.9A4.3 4.3 0 1 1 16.3 12 4.3 4.3 0 0 1 12 16.3zm6.9-11.1a1.55 1.55 0 1 1-1.55-1.55A1.55 1.55 0 0 1 18.9 5.2z"/>',
  youtube: '<path d="M23 12s0-3.4-.4-5a2.9 2.9 0 0 0-2-2C18.8 4.5 12 4.5 12 4.5s-6.8 0-8.6.5a2.9 2.9 0 0 0-2 2C1 8.6 1 12 1 12s0 3.4.4 5a2.9 2.9 0 0 0 2 2c1.8.5 8.6.5 8.6.5s6.8 0 8.6-.5a2.9 2.9 0 0 0 2-2c.4-1.6.4-5 .4-5zM9.8 15.3V8.7l5.7 3.3z"/>',
  mail: '<path d="M2.5 5h19A1.5 1.5 0 0 1 23 6.5v11A1.5 1.5 0 0 1 21.5 19h-19A1.5 1.5 0 0 1 1 17.5v-11A1.5 1.5 0 0 1 2.5 5zm.9 2 8.6 5.7L20.6 7zM21 8.6l-8.4 5.6a1 1 0 0 1-1.1 0L3 8.6V17h18z"/>',
};
const socialLink = (href, name, key) => `<a href="${href}" rel="noopener">
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">${ICON[key]}</svg>
  <span class="vh">${esc(name)}</span></a>`;

/* Contact details the brief asks for but has not supplied yet. One place to fill in. */
export const CONTACT = {
  phone: '+62 xxx xxxx xxxx', email: 'hello@andalucia-charter.test',
  address: 'Jl. Soekarno Hatta, Labuan Bajo, Manggarai Barat, Nusa Tenggara Timur 86554, Indonesia',
  instagram: 'https://www.instagram.com/', youtube: 'https://www.youtube.com/',
  pending: true, // flips to false once real details replace the placeholders above
};

const marketingFooter = () => `<footer><div class="foot"><div class="footin">
  <div><span class="mark">Andalucía</span>
    <div class="contact">
      <div><a href="tel:${esc(CONTACT.phone.replace(/\s/g, ''))}">${esc(CONTACT.phone)}</a></div>
      <div><a href="mailto:${esc(CONTACT.email)}">${esc(CONTACT.email)}</a></div>
    </div>
    <p>${esc(CONTACT.address)}</p>
    <p>Ask for Mr. Marco for in-person assistance.</p>
    ${CONTACT.pending ? '<p class="todo">Placeholder contact details - awaiting the real phone, email and address.</p>' : ''}
    <p><a href="/travel-resources">Travel Resources</a></p></div>

  <div><h2>Explore</h2><ul>
    <li><a href="/awards">Awards</a></li><li><a href="/press">Press</a></li>
    <li><a href="/about/team">Staff</a></li><li><a href="/faq">FAQ</a></li>
    <li><a href="/membership/newsletter">Subscription</a></li></ul></div>

  <div><h2>Legal &amp; Media</h2><ul>
    <li><a href="/terms">Terms &amp; Conditions</a></li><li><a href="/gallery">Gallery</a></li>
    <li><a href="/about/legal">Legal information</a></li><li><a href="/retrieve">Manage my booking</a></li></ul></div>

  <div><h2>Connect With Us</h2>
    <p>Voyage notes, new schedules and members-only invitations.</p>
    <div class="social">
      ${socialLink(CONTACT.instagram, 'Andalucía on Instagram', 'instagram')}
      ${socialLink(CONTACT.youtube, 'Andalucía on YouTube', 'youtube')}
      ${socialLink(`mailto:${CONTACT.email}`, `Email Andalucía at ${CONTACT.email}`, 'mail')}
    </div></div>
</div><div class="footend">
  <p>Prototype built to the business rules in <cite>Phinisi Booking Platform - Business Requirements v1.0</cite>.
  No real payments are taken and no real vessel is reserved.</p>
  <p>Targets WCAG 2.2 Level AAA. Found a barrier? <a href="/support">Tell us in the chat</a>.</p>
</div></div></footer>`;

const slimFooter = () => `<footer><div class="in" style="background:var(--deep);color:var(--mutedDeep);padding:36px 20px">
  <div style="max-width:1120px;margin:auto">
  <p>Prototype built to the business rules in <cite>Phinisi Booking Platform - Business Requirements v1.0</cite>.
  No real payments are taken and no real vessel is reserved.</p>
  <p>Targets WCAG 2.2 Level AAA. Found a barrier? <a href="/support">Tell us in the chat</a>.</p></div></div></footer>`;

/* the bar hides going down and returns coming up, and turns solid once the hero is passed */
const HEADER_JS = `<script>
(() => {
  // collapse the mobile nav only once we know scripting works; without this it stays open
  const wrap = document.getElementById('navwrap'), btn = wrap && wrap.querySelector('.navtoggle');
  if (wrap && btn) {
    wrap.classList.add('js');
    btn.addEventListener('click', () => {
      const open = wrap.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }
  const top = document.getElementById('masthead'); if (!top) return;
  const float = top.classList.contains('is-float');
  let last = window.scrollY;
  const onScroll = () => {
    const y = window.scrollY;
    if (float) top.classList.toggle('is-float', y < 80);
    top.classList.toggle('is-hidden', y > last && y > 220 && !top.contains(document.activeElement));
    last = y;
  };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('focusin', () => top.classList.remove('is-hidden'));
})();
</script>`;

export const page = ({ title, user, body, hero = '', path = '', trail = null, admin = null, script = '', float = false, lang = 'en', wide = false }) => `<!doctype html><html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)} · Andalucía Phinisi Charters</title><style>${CSS}</style></head><body${float ? ' class="floathead"' : ''}>
<a class="skip" href="#main">Skip to main content</a>
<header class="top${float ? ' is-float' : ''}" id="masthead"><div class="topin">
  ${langMenu(lang)}
  <a class="brand" href="/"${path === '/' ? ' aria-current="page"' : ''}>Andalucía<span>Phinisi Charters</span></a>
  <div class="navwrap" id="navwrap">
    <button type="button" class="navtoggle" aria-expanded="false" aria-controls="navpanel">Menu<span class="vh"> - open the main navigation</span></button>
    <div class="navpanel" id="navpanel">${primaryNav(path)}</div>
  </div>
  <div class="topcta">
  ${user ? `<a href="${user.role === 'agent' ? '/agent' : user.role === 'member' ? '/account' : '/admin'}">${
              esc(user.role === 'agent' ? 'Agent portal' : user.role === 'member' ? 'My account' : 'Admin')}</a>
            <a href="/logout">Sign out<span class="vh"> - ${esc(user.name)}</span></a>`
         : `<a href="/login"${path === '/login' ? ' aria-current="page"' : ''}>Sign In</a>`}
    <a class="btn" href="/support">Contact Us</a>
  </div>
</div></header>
${hero}
<main id="main"${wide ? ' class="full"' : ''}>${trail ? crumbs(trail) : ''}${admin ? adminNav(user, admin) : ''}${body}</main>
${admin ? slimFooter() : marketingFooter()}
${HEADER_JS}${script}</body></html>`;

export const req = (ids) => ` <span class="req">${esc(ids)}</span>`;

/* ================= marketing building blocks ================= */

/** Fullscreen cinematic opener. Uses a real video or photograph the moment one exists in
 *  public/, otherwise the generated stand-in at the same aspect. Text always sits on the scrim. */
export const cine = ({ slug, alt, eyebrow = '', h1, tagline = '', actions = '', short = false, tone = '' }) => {
  const vid = mediaVideo(slug);
  const bg = vid
    ? `<video autoplay muted loop playsinline poster="${mediaImg(slug, 1920, 1080, tone)}"><source src="${vid}" type="video/mp4"></video>`
    : `<img src="${mediaImg(slug, 1920, 1080, tone)}" alt="${esc(alt || '')}" fetchpriority="high">`;
  return `<div class="cine${short ? ' short' : ''}">
    <div class="bg">${bg}</div><div class="scrim"></div>
    <div class="in">
      ${eyebrow ? `<p class="eyebrow fade-up">${eyebrow}</p>` : ''}
      <h1 class="fade-up d1">${h1}</h1>
      ${tagline ? `<p class="fade-up d2">${tagline}</p>` : ''}
      ${actions ? `<p class="actions fade-up d2" style="margin-top:32px">${actions}</p>` : ''}
    </div>
  </div>`;
};

/** Closing invitation band. */
export const ctaBand = ({ line, label, href, slug = 'cta-sail', alt = '' }) => `<section class="ctaband">
  <img src="${mediaImg(slug, 1920, 900, 'night')}" alt="${esc(alt)}">
  <p class="line">${line}</p>
  <p class="actions" style="justify-content:center"><a class="btn" href="${href}">${esc(label)}</a></p>
</section>`;

/** Horizontally scrollable photo strip. Items: [slug, caption, alt]. */
export const photoStrip = (items, label) => `<ul class="strip" aria-label="${esc(label)}" tabindex="0">
  ${items.map(([slug, caption, alt]) => `<li><figure>
    <img src="${mediaImg(slug, 800, 620)}" alt="${esc(alt || caption)}" loading="lazy">
    <figcaption>${esc(caption)}</figcaption></figure></li>`).join('')}</ul>`;

/** Gallery grid. Items: [slug, caption, tall?]. */
export const photoTiles = (items, label) => `<div class="tiles" role="group" aria-label="${esc(label)}">
  ${items.map(([slug, caption, tall]) => `<figure${tall ? ' class="tall"' : ''}>
    <img src="${mediaImg(slug, 760, tall ? 900 : 620)}" alt="${esc(caption)}" loading="lazy">
    <figcaption>${esc(caption)}</figcaption></figure>`).join('')}</div>`;

export const stars = (n) => `<span class="stars" aria-hidden="true">${'★'.repeat(n)}${'☆'.repeat(5 - n)}</span><span class="vh">${n} out of 5 stars</span>`;

/** Key-tag chips used by the destination pages. */
export const chips = (items, label) => `<ul class="chips" aria-label="${esc(label)}">${items.map((t) => `<li>${t}</li>`).join('')}</ul>`;

/** Definition strip for trail facts and room facts. */
export const factStrip = (pairs, cls = 'facts') => `<dl class="${cls}">${pairs.map(([k, v]) =>
  `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl>`;

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
