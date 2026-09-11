// Media resolution. A real file dropped into public/ always wins; until one exists a
// deterministic SVG stands in at the exact slot size, so swapping in a photograph later
// changes no layout. Nothing here is decorative-only by accident: every slot names the
// photograph it is waiting for, and that name is what the alt text and the caption use.
import { existsSync, readFileSync, statSync } from 'node:fs';
import { extname } from 'node:path';

export const PUBLIC = new URL('./public/', import.meta.url).pathname;

const TYPES = {
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp',
  '.avif': 'image/avif', '.svg': 'image/svg+xml', '.gif': 'image/gif',
  '.mp4': 'video/mp4', '.webm': 'video/webm', '.ico': 'image/x-icon',
};
const IMG_EXT = ['.avif', '.webp', '.jpg', '.jpeg', '.png', '.svg'];
const VID_EXT = ['.mp4', '.webm'];

/* stable 32-bit hash so a slug always draws the same placeholder */
const hash = (s) => { let h = 2166136261; for (const c of String(s)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
const rng = (seed) => { let s = seed || 1; return () => (s = Math.imul(s ^ (s >>> 15), 2246822507) ^ Math.imul(s ^ (s >>> 13), 3266489909), ((s >>> 0) % 10000) / 10000); };

/* Placeholder palettes. All four stops in each ramp are dark enough that cream text on a
   scrim over them still clears AAA 7:1 - the same reason the hero bands are near-black. */
const PALETTES = {
  sea: ['#021319', '#08222B', '#0E4B52', '#2F7C82'],
  island: ['#0A1A21', '#16302C', '#3F5330', '#8C7C46'],
  under: ['#01161C', '#04323F', '#0B5A63', '#1B8A8A'],
  sand: ['#241A10', '#4A320C', '#8A6C3A', '#C4AE84'],
  night: ['#01080C', '#05161E', '#102B36', '#274C5C'],
  interior: ['#140F0A', '#2A2116', '#54432A', '#8E7A50'],
  reef: ['#02141B', '#0A3540', '#125F5A', '#6C2B29'],
};
export const TONES = Object.keys(PALETTES);

/* the tone a slug gets when it does not ask for one */
const toneFor = (slug) => {
  const s = String(slug);
  if (/dive|snorkel|manta|reef|batu|siaba|under|coral/.test(s)) return 'under';
  if (/cabin|room|suite|interior|dining|galley/.test(s)) return 'interior';
  if (/kalong|star|night|sunset|bat/.test(s)) return 'night';
  if (/pink|taka|sand|beach|kanawa/.test(s)) return 'sand';
  if (/padar|kelor|komodo|trek|hike|island|pempeng|penga/.test(s)) return 'island';
  if (/crew|team|guest|family|couple|solo|group/.test(s)) return 'reef';
  return 'sea';
};

/* ---------- the generated stand-in ---------- */
export function placeholderSVG(slug, w = 1600, h = 900, tone = null, label = '') {
  const pal = PALETTES[tone] || PALETTES[toneFor(slug)];
  const r = rng(hash(slug));
  const [c0, c1, c2, c3] = pal;
  const horizon = h * (0.42 + r() * 0.16);
  const sunX = w * (0.18 + r() * 0.64);
  const sunR = Math.min(w, h) * (0.05 + r() * 0.05);

  const band = (y, amp, freq, phase, fill, op) => {
    const step = Math.max(6, w / 72);
    let d = `M0,${h.toFixed(1)} L0,${y.toFixed(1)}`;
    for (let x = 0; x <= w; x += step) d += ` L${x.toFixed(1)},${(y + Math.sin((x / w) * Math.PI * 2 * freq + phase) * amp).toFixed(1)}`;
    return `<path d="${d} L${w},${h} Z" fill="${fill}" opacity="${op}"/>`;
  };

  const waves = [];
  for (let i = 0; i < 4; i++) {
    const t = i / 3;
    waves.push(band(
      horizon + (h - horizon) * (0.08 + t * 0.66),
      (h - horizon) * (0.03 + r() * 0.05),
      1 + Math.floor(r() * 3),
      r() * Math.PI * 2,
      i < 2 ? c2 : c1,
      (0.9 - t * 0.28).toFixed(2),
    ));
  }

  // a few horizon silhouettes so island and sea tones read as landscape, not abstract noise
  const hills = [];
  const nHills = 2 + Math.floor(r() * 3);
  for (let i = 0; i < nHills; i++) {
    const cx = w * r(), rw = w * (0.12 + r() * 0.2), rh = (h - horizon) * (0.18 + r() * 0.5);
    hills.push(`<path d="M${(cx - rw).toFixed(1)},${horizon.toFixed(1)} Q${cx.toFixed(1)},${(horizon - rh).toFixed(1)} ${(cx + rw).toFixed(1)},${horizon.toFixed(1)} Z" fill="${c1}" opacity="0.85"/>`);
  }

  const cap = label || String(slug).replace(/[-/]/g, ' ');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="${esc(cap)}">
<defs>
  <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="${c0}"/><stop offset="0.62" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/>
  </linearGradient>
  <radialGradient id="glow" cx="${(sunX / w).toFixed(3)}" cy="${(horizon / h).toFixed(3)}" r="0.55">
    <stop offset="0" stop-color="${c3}" stop-opacity="0.55"/><stop offset="1" stop-color="${c3}" stop-opacity="0"/>
  </radialGradient>
</defs>
<rect width="${w}" height="${h}" fill="url(#sky)"/>
<rect width="${w}" height="${h}" fill="url(#glow)"/>
<circle cx="${sunX.toFixed(1)}" cy="${(horizon - sunR * 1.1).toFixed(1)}" r="${sunR.toFixed(1)}" fill="${c3}" opacity="0.5"/>
${hills.join('')}
<rect y="${horizon.toFixed(1)}" width="${w}" height="${(h - horizon).toFixed(1)}" fill="${c2}" opacity="0.5"/>
${waves.join('')}
<rect width="${w}" height="${h}" fill="${c0}" opacity="0.12"/>
<!-- centred at 80% height so object-fit:cover cropping on either axis leaves it readable -->
<text x="${(w / 2).toFixed(1)}" y="${(h * 0.8).toFixed(1)}" text-anchor="middle" fill="#FFFEF2" opacity="0.5"
  font-family="Inter,system-ui,sans-serif" font-size="${Math.max(10, Math.round(w / 88))}"
  letter-spacing="${(w / 480).toFixed(1)}">PHOTOGRAPH - ${esc(cap.toUpperCase())}</text>
</svg>`;
}

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* ---------- resolution ---------- */
const findReal = (slug, exts) => {
  for (const e of exts) { const p = `${PUBLIC}${slug}${e}`; if (existsSync(p) && statSync(p).isFile()) return `/public/${slug}${e}`; }
  return null;
};

/** URL for an image slot. Returns a real file when one has been dropped in, else the stand-in.
 *  The separator is &amp; because every caller interpolates this straight into an HTML attribute. */
export const img = (slug, w = 1600, h = 900, tone = '') =>
  findReal(slug, IMG_EXT) || `/m/${encodeURIComponent(slug)}.svg?w=${w}&amp;h=${h}${tone ? `&amp;t=${tone}` : ''}`;

/** URL for a background video, or null when none has been supplied yet. */
export const video = (slug) => findReal(slug, VID_EXT);

/** True once any real media exists, so copy can stop apologising for placeholders. */
export const hasRealMedia = () => existsSync(PUBLIC) && IMG_EXT.concat(VID_EXT).some((e) =>
  ['hero-home', 'andalucia-2-hero'].some((s) => existsSync(`${PUBLIC}${s}${e}`)));

/* ---------- routes ---------- */
export default function registerMedia({ get }) {
  // generated stand-in
  get(/^\/m\/([\w %.-]+)\.svg$/, (ctx, raw) => {
    const slug = decodeURIComponent(raw);
    const q = ctx.url.searchParams;
    const w = Math.min(3200, Math.max(16, Number(q.get('w')) || 1600));
    const h = Math.min(3200, Math.max(16, Number(q.get('h')) || 900));
    const tone = TONES.includes(q.get('t')) ? q.get('t') : null;
    ctx.res.writeHead(200, { 'content-type': 'image/svg+xml; charset=utf-8', 'cache-control': 'public, max-age=3600' });
    ctx.res.end(placeholderSVG(slug, w, h, tone, q.get('label') || ''));
  });

  // real files, once they exist. No traversal: the resolved path must stay under public/.
  get(/^\/public\/([\w./-]+)$/, (ctx, rel) => {
    const p = `${PUBLIC}${rel}`;
    if (rel.includes('..') || !p.startsWith(PUBLIC) || !existsSync(p) || !statSync(p).isFile()) return null;
    ctx.res.writeHead(200, { 'content-type': TYPES[extname(p).toLowerCase()] || 'application/octet-stream', 'cache-control': 'public, max-age=3600' });
    ctx.res.end(readFileSync(p));
  });
}
