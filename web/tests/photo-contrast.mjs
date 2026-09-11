/**
 * WCAG 2.2 AAA 1.4.6, measured on the composited page rather than on tokens.
 *
 * The token suite in a11y.mjs proves that every declared foreground/background pair reaches 7:1.
 * It cannot prove anything about the surfaces where cream text sits on a photograph: what a
 * reader actually sees there is the text colour over (scrim over photo), and the photograph is
 * not a token. Those surfaces were the ones that drifted — the hero taglines were rendering at
 * around 5:1 while every declared pair still passed.
 *
 * So this suite renders the real pages in headless Chrome and reads pixels:
 *
 *   1. scroll the target into view and record its box and its *computed* colour, which may be
 *      translucent (text-on-deep/90 is not on-deep);
 *   2. inject a stylesheet that paints every glyph transparent, leaving backgrounds, photos and
 *      scrims untouched, so the crop is the plate and nothing else;
 *   3. composite the element's colour over every plate pixel and take the worst ratio.
 *
 * Large text (1.4.6 relaxes to 4.5:1 at >= 24px, or >= 18.66px bold) is held to 4.5; everything
 * else to 7. Each case states which, so the threshold is a decision on the record rather than
 * something inferred from a measurement.
 *
 *   npm run test:contrast
 */
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PORT = Number(process.env.CONTRAST_PORT || 3124);
const CDP_PORT = Number(process.env.CONTRAST_CDP_PORT || 9422);
const CHROME = process.env.CHROME_BIN || "google-chrome";

/** Every surface where text is set over photography, with the size class that sets its floor. */
const CASES = [
  { path: "/", sel: "main h1", name: "home hero headline", large: true },
  { path: "/", sel: "main section:first-of-type p", name: "home hero tagline", large: false },
  /* keyed off a data attribute, not a utility class: the panels were circles once and the
     selectors silently stopped matching anything when that changed */
  { path: "/", sel: '[data-panel="trip"] h3', name: "trip panel title", large: true },
  { path: "/", sel: '[data-panel="trip"] p', name: "trip panel body", large: false },
  {
    path: "/",
    sel: '[data-panel="trip"] span:not([aria-hidden]):last-child',
    name: "trip panel call to action",
    large: false,
  },
  { path: "/sailing/andalucia-2", sel: "main h1", name: "vessel hero name", large: true },
  { path: "/sailing/andalucia-2", sel: "main h1 ~ p", name: "vessel hero tagline", large: false },
  { path: "/faq", sel: "section.bg-deep p", name: "short hero tagline", large: false },
  { path: "/destinations", sel: "main h1", name: "index hero headline", large: true },
  { path: "/enquire", sel: "section.bg-deep p", name: "enquiry hero tagline", large: false },
];

let pass = 0;
const failures = [];
const ok = (name, cond, detail = "") => {
  if (cond) {
    pass++;
    console.log(`  \x1b[32m✔\x1b[0m ${name} ${detail}`);
  } else {
    failures.push(`${name} ${detail}`);
    console.log(`  \x1b[31m✘ ${name}\x1b[0m ${detail}`);
  }
};

const lum = (r, g, b) => {
  const f = (c) => {
    c /= 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};
const contrast = (a, b) => {
  const [hi, lo] = a > b ? [a, b] : [b, a];
  return (hi + 0.05) / (lo + 0.05);
};

const server = spawn("node_modules/.bin/next", ["start", "-p", String(PORT)], {
  cwd: ROOT,
  stdio: "ignore",
});
const chrome = spawn(
  CHROME,
  [
    "--headless",
    "--disable-gpu",
    "--no-sandbox",
    "--hide-scrollbars",
    `--remote-debugging-port=${CDP_PORT}`,
    "about:blank",
  ],
  { stdio: "ignore" },
);

let ws;
const pending = new Map();
let msgId = 0;
const send = (method, params) =>
  new Promise((res, rej) => {
    const id = ++msgId;
    pending.set(id, { res, rej });
    ws.send(JSON.stringify({ id, method, params }));
  });

const waitFor = async (fn, tries = 90) => {
  for (let i = 0; i < tries; i++) {
    try {
      const v = await fn();
      if (v) return v;
    } catch {}
    await new Promise((r) => setTimeout(r, 400));
  }
  return null;
};

try {
  const up = await waitFor(async () => (await fetch(`http://127.0.0.1:${PORT}/`)).ok);
  if (!up) throw new Error(`next start did not come up on :${PORT}`);

  const target = await waitFor(async () => {
    const list = await (await fetch(`http://127.0.0.1:${CDP_PORT}/json`)).json();
    return list.find((x) => x.type === "page");
  });
  if (!target) throw new Error(`headless Chrome did not come up on :${CDP_PORT}`);

  ws = new WebSocket(target.webSocketDebuggerUrl);
  ws.onmessage = (e) => {
    const m = JSON.parse(e.data);
    if (!m.id || !pending.has(m.id)) return;
    const { res, rej } = pending.get(m.id);
    pending.delete(m.id);
    m.error ? rej(new Error(JSON.stringify(m.error))) : res(m.result);
  };
  await new Promise((r) => (ws.onopen = r));
  await send("Page.enable");
  await send("Emulation.setDeviceMetricsOverride", {
    width: 1280,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });

  console.log("\n1.4.6  Contrast (Enhanced), measured on composited pixels where text meets photography");

  for (const { path, sel, name, large } of CASES) {
    const floor = large ? 4.5 : 7;
    await send("Page.navigate", { url: `http://127.0.0.1:${PORT}${path}` });
    await new Promise((r) => setTimeout(r, 2600));

    // step down the page so every whileInView reveal has fired before anything is measured
    const { result: h } = await send("Runtime.evaluate", {
      returnByValue: true,
      expression: "document.documentElement.scrollHeight",
    });
    for (let y = 0; y < h.value; y += 450) {
      await send("Runtime.evaluate", { expression: `window.scrollTo(0,${y})` });
      await new Promise((r) => setTimeout(r, 200));
    }
    await new Promise((r) => setTimeout(r, 700));

    const { result: boxRes } = await send("Runtime.evaluate", {
      returnByValue: true,
      expression: `(() => {
        const el = document.querySelector(${JSON.stringify(sel)});
        if (!el) return null;
        el.scrollIntoView({ block: 'center', behavior: 'instant' });
        const r = el.getBoundingClientRect();
        // let the browser normalise whatever colour syntax this is, alpha included
        const c = document.createElement('canvas'); c.width = c.height = 1;
        const g = c.getContext('2d');
        g.clearRect(0, 0, 1, 1); g.fillStyle = getComputedStyle(el).color; g.fillRect(0, 0, 1, 1);
        const q = g.getImageData(0, 0, 1, 1).data;
        const s = document.createElement('style');
        s.textContent = '*,*::before,*::after{color:transparent!important;text-shadow:none!important;text-decoration-color:transparent!important;}';
        document.head.appendChild(s);
        // inset by 2px so a neighbouring line's glyphs cannot bleed into the crop
        return { x: Math.round(r.left) + 2, y: Math.round(r.top) + 2,
                 w: Math.max(Math.round(r.width) - 4, 1), h: Math.max(Math.round(r.height) - 4, 1),
                 fg: [q[0], q[1], q[2], q[3] / 255] };
      })()`,
    });
    if (!boxRes.value) {
      ok(name, false, `selector matched nothing: ${sel}`);
      continue;
    }
    const b = boxRes.value;
    await new Promise((r) => setTimeout(r, 400));

    const shot = await send("Page.captureScreenshot", { format: "png" });
    const { result: px } = await send("Runtime.evaluate", {
      returnByValue: true,
      awaitPromise: true,
      expression: `(async () => {
        const img = new Image();
        img.src = 'data:image/png;base64,' + ${JSON.stringify(shot.data)};
        await img.decode();
        const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
        const g = c.getContext('2d'); g.drawImage(img, 0, 0);
        const d = g.getImageData(${b.x}, ${b.y}, ${b.w}, ${b.h}).data;
        const o = [];
        for (let i = 0; i < d.length; i += 4) o.push([d[i], d[i + 1], d[i + 2]]);
        return o;
      })()`,
    });

    const [fr, fg, fb, fa] = b.fg;
    const worst = px.value
      .map(([r, g, bb]) => {
        const cr = fr * fa + r * (1 - fa);
        const cg = fg * fa + g * (1 - fa);
        const cb = fb * fa + bb * (1 - fa);
        return contrast(lum(cr, cg, cb), lum(r, g, bb));
      })
      .reduce((m, v) => Math.min(m, v), Infinity);

    ok(
      name.padEnd(26),
      worst >= floor,
      `${worst.toFixed(2)}:1 against a ${floor}:1 floor (${large ? "large" : "body"} text)`,
    );
  }
} catch (err) {
  failures.push(String(err && err.message ? err.message : err));
  console.log(`  \x1b[31m✘ suite error\x1b[0m ${err}`);
} finally {
  try {
    ws?.close();
  } catch {}
  chrome.kill();
  server.kill();
}

console.log(
  `\n${failures.length ? "\x1b[31m" : "\x1b[32m"}${pass} passed, ${failures.length} failed\x1b[0m\n`,
);
process.exit(failures.length ? 1 : 0);
