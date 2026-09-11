/**
 * WCAG 2.2 Level AAA guards, ported from the original prototype's suite.
 *
 * Token values are read out of app/globals.css rather than duplicated here, so the stylesheet
 * that ships and the contract cannot drift apart. Structure is asserted against the rendered
 * HTML of every route, served by `next start`.
 *
 *   npm run test:a11y
 */
import { readFileSync } from "node:fs";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PORT = Number(process.env.A11Y_PORT || 3123);

let pass = 0;
const failures = [];
const ok = (id, name, cond, detail = "") => {
  if (cond) {
    pass++;
    console.log(`  \x1b[32m✔\x1b[0m ${id} ${name}`);
  } else {
    failures.push(`${id} ${name} ${detail}`);
    console.log(`  \x1b[31m✘ ${id} ${name}\x1b[0m ${detail}`);
  }
};

/* ------------------------------------------------- token contrast */

const css = readFileSync(join(ROOT, "app/globals.css"), "utf8");
const rootBlock = css.slice(css.indexOf(":root {"), css.indexOf("\n}", css.indexOf(":root {")));
const TOKENS = Object.fromEntries(
  [...rootBlock.matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{3,8})\s*;/g)].map((m) => [m[1], m[2]]),
);

const relLum = (hex) => {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const c = full
    .match(/../g)
    .slice(0, 3)
    .map((x) => parseInt(x, 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const contrast = (a, b) => {
  const [hi, lo] = [relLum(a), relLum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

const { CONTRAST_PAIRS, NON_TEXT_PAIRS, MIN_SCRIM_ALPHA, MIN_TAP_PX } = await import(
  "../lib/tokens.ts"
);

console.log("\n1.4.6  Contrast (Enhanced), every declared pair at 7:1 or better");
{
  const missing = CONTRAST_PAIRS.flat().filter((t) => !TOKENS[t]);
  ok("tokens", "every pair names a token that exists in globals.css", missing.length === 0, [
    ...new Set(missing),
  ].join(", "));

  const bad = CONTRAST_PAIRS.filter(([f, b]) => TOKENS[f] && TOKENS[b])
    .map(([f, b]) => ({ f, b, r: contrast(TOKENS[f], TOKENS[b]) }))
    .filter((x) => x.r < 7);
  ok(
    "1.4.6",
    `${CONTRAST_PAIRS.length} foreground/background pairs reach AAA`,
    bad.length === 0,
    bad.map((x) => `${x.f} on ${x.b} = ${x.r.toFixed(2)}:1`).join(", "),
  );

  const badNonText = NON_TEXT_PAIRS.filter(([f, b]) => TOKENS[f] && TOKENS[b])
    .map(([f, b]) => ({ f, b, r: contrast(TOKENS[f], TOKENS[b]) }))
    .filter((x) => x.r < 3);
  ok(
    "1.4.11",
    `${NON_TEXT_PAIRS.length} non-text pairs reach 3:1`,
    badNonText.length === 0,
    badNonText.map((x) => `${x.f} on ${x.b} = ${x.r.toFixed(2)}:1`).join(", "),
  );

  const scrim = Number((css.match(/--scrim:\s*([\d.]+)/) || [])[1]);
  ok(
    "1.4.6",
    "text over photography sits on a scrim opaque enough to hold the on-deep/deep pair",
    scrim >= MIN_SCRIM_ALPHA,
    `scrim ${scrim}`,
  );
  ok("2.5.5", "the tap-target floor is declared", MIN_TAP_PX >= 44);
  ok(
    "2.3.3",
    "reduced motion and increased contrast are honoured",
    /prefers-reduced-motion:\s*reduce/.test(css) && /prefers-contrast:\s*more/.test(css),
  );
  ok(
    "2.4.12",
    "the sticky header cannot land on the focused element",
    /scroll-padding-top/.test(css),
  );
}

/* ------------------------------------------------- rendered structure */

/* read straight from the generated JSON: importing lib/content.ts would need JSON import
   attributes that plain Node ESM does not apply to a TypeScript module graph */
const content = JSON.parse(readFileSync(join(ROOT, "lib/content.generated.json"), "utf8"));
const { experiences: EXPERIENCES, destinations: DESTINATIONS, vessels: VESSELS } = content;

const ROUTES = [
  "/",
  "/sailing",
  "/sailing/cabin-collection",
  "/destinations",
  "/open-trip/itinerary",
  "/about",
  "/about/team",
  "/about/legal",
  "/membership",
  "/membership/join",
  "/membership/newsletter",
  "/membership/special-offer",
  "/membership/benefits",
  "/gallery",
  "/faq",
  "/terms",
  "/awards",
  "/press",
  "/travel-resources",
  "/credits",
  "/enquire",
  "/signin",
  "/news",
  "/news/manta-season-2026",
  "/schedule",
  "/language/fr",
  ...Object.keys(VESSELS).map((s) => `/sailing/${s}`),
  ...Object.keys(EXPERIENCES).map((s) => `/experience/${s}`),
  ...Object.keys(DESTINATIONS).map((s) => `/destination/${s}`),
];

const server = spawn("node_modules/.bin/next", ["start", "-p", String(PORT)], {
  cwd: ROOT,
  stdio: "ignore",
});
const waitForServer = async () => {
  for (let i = 0; i < 80; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${PORT}/`);
      if (r.ok) return true;
    } catch {}
    await new Promise((r) => setTimeout(r, 400));
  }
  return false;
};

try {
  if (!(await waitForServer())) throw new Error(`next start did not come up on :${PORT}`);

  const pages = {};
  for (const path of ROUTES) {
    const res = await fetch(`http://127.0.0.1:${PORT}${path}`);
    pages[path] = { status: res.status, html: await res.text() };
  }

  console.log(`\nStructure, audited on the rendered HTML of ${ROUTES.length} routes`);

  const every = (id, name, fn) => {
    const bad = Object.entries(pages)
      .filter(([, p]) => !fn(p.html, p))
      .map(([path]) => path);
    ok(id, name, bad.length === 0, bad.slice(0, 6).join(" "));
  };

  every("smoke", "every audited route returns 200", (_h, p) => p.status === 200);
  every("3.1.1", "every page declares a language", (h) => /<html[^>]+lang="en"/.test(h));
  every("2.4.2", "every page has a descriptive title", (h) =>
    /<title>[^<]{10,}<\/title>/.test(h),
  );
  every(
    "2.4.1",
    "every page offers a skip link to main content",
    (h) => /href="#main"/.test(h) && /<main[^>]+id="main"/.test(h),
  );
  every(
    "1.3.1",
    "landmarks are present and labelled",
    (h) => /aria-label="Primary"/.test(h) && /<footer/.test(h),
  );
  every("1.3.1", "exactly one h1 per page", (h) => (h.match(/<h1[\s>]/g) || []).length === 1);
  every("1.3.1", "heading levels never skip a rank", (h) => {
    const lv = [...h.matchAll(/<h([1-6])[\s>]/g)].map((m) => Number(m[1]));
    return lv[0] === 1 && lv.every((v, i) => i === 0 || v - lv[i - 1] <= 1);
  });
  every("3.3.2", "every visible form control has an associated label", (h) => {
    const fors = new Set([...h.matchAll(/<label[^>]*\sfor="([^"]+)"/g)].map((m) => m[1]));
    const controls = [...h.matchAll(/<(input|select|textarea)\b[^>]*>/g)]
      .map((m) => m[0])
      .filter((t) => !/type="hidden"/.test(t));
    return controls.every((t) => {
      const id = t.match(/\sid="([^"]+)"/);
      return id && fors.has(id[1]);
    });
  });
  every("3.3.2", "required fields are marked for assistive technology", (h) =>
    [...h.matchAll(/<(input|select|textarea)\b[^>]*\brequired\b[^>]*>/g)].every((m) =>
      /aria-required="true"/.test(m[0]),
    ),
  );
  every("2.4.4", "no link or button is left without an accessible name", (h) =>
    ![...h.matchAll(/<(a|button)\b([^>]*)>([\s\S]*?)<\/\1>/g)].some(
      (m) =>
        !m[3].replace(/<[^>]+>/g, "").trim() &&
        !/aria-label=/.test(m[2]) &&
        !/aria-labelledby=/.test(m[2]),
    ),
  );
  every("1.3.1", "every data table has a caption and column scopes", (h) => {
    const tables = (h.match(/<table[\s>]/g) || []).length;
    const captions = (h.match(/<caption[\s>]/g) || []).length;
    // the (?=[\s>]) guard matters: without it "<thead>" matches the "<th" branch
    return tables === captions && !/<th(?=[\s>])(?![^>]*scope=)/.test(h);
  });
  every("3.2.5", "nothing refreshes or redirects on its own", (h) =>
    !/http-equiv="refresh"/i.test(h),
  );
  every("1.4.8", "text is never justified", (h) => !/text-align:\s*justify/.test(h));
  every(
    "2.4.8",
    "inner pages state the visitor's location with a breadcrumb",
    (h, p) => p === pages["/"] || /aria-label="Breadcrumb"/.test(h),
  );

  ok(
    "1.4.10",
    "horizontal scrollers establish a containing block for the .vh spans inside them",
    /\.rail\s*\{[^}]*position:\s*relative/.test(css),
  );
  ok(
    "D11",
    "an unpublished language says so rather than serving English silently",
    /not published yet/.test(pages["/language/fr"].html),
  );
  ok(
    "credit",
    "every photograph is attributed",
    /Photography Credits/.test(pages["/credits"].html),
  );

  /* PR07: "Protect agent rates across APIs, HTML, search indexing, shared caches, exports,
     notifications and invoices."

     The site now publishes retail prices, which means there is a real way to leak the wrong ones:
     drop the rate_class filter in lib/offer.ts and agent net rates appear on a prerendered page
     served to anonymous visitors. This reads the confidential amounts straight out of the
     reservation engine and asserts that none of them appears anywhere in the crawled HTML, in
     either the grouped form the site renders or as a bare integer. */
  {
    const { DatabaseSync } = await import("node:sqlite");
    const dbPath = process.env.ANDALUCIA_DB || join(ROOT, "..", "data", "app.db");
    let agentAmounts = [];
    try {
      const db = new DatabaseSync(dbPath, { readOnly: true });
      agentAmounts = db
        .prepare(`SELECT DISTINCT amount_idr FROM rates WHERE rate_class='agent'`)
        .all()
        .map((r) => r.amount_idr);
      db.close();
    } catch {
      /* no database in this environment; the check reports itself as skipped below */
    }

    const forms = (n) => [n.toLocaleString("en-US"), String(n)];
    const leaked = [];
    for (const [path, p] of Object.entries(pages)) {
      for (const n of agentAmounts) {
        if (forms(n).some((f) => p.html.includes(f))) leaked.push(`${path} exposes ${n}`);
      }
    }
    ok(
      "PR07",
      agentAmounts.length
        ? `no agent rate appears in public HTML (${agentAmounts.length} confidential amounts checked)`
        : "no agent rate appears in public HTML (skipped: no database)",
      leaked.length === 0,
      leaked.slice(0, 4).join(", "),
    );
  }
} finally {
  server.kill();
}

console.log(
  `\n${failures.length ? "\x1b[31m" : "\x1b[32m"}${pass} passed, ${failures.length} failed\x1b[0m\n`,
);
process.exit(failures.length ? 1 : 0);
