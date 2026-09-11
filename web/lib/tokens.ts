/**
 * The accessibility contract.
 *
 * These are the foreground/background pairs that carry text somewhere on the site.
 * `npm run test:a11y` reads the actual hex values out of `app/globals.css` and asserts
 * every pair below clears 7:1 (WCAG 2.2 AAA 1.4.6). Values are deliberately NOT duplicated
 * here: the test checks what ships, so the stylesheet and the contract cannot drift apart.
 *
 * Add a colour to globals.css, add its pair here.
 */
export const CONTRAST_PAIRS: ReadonlyArray<readonly [string, string]> = [
  // body and headings on every surface they appear on
  ["foreground", "background"],
  ["foreground", "card"],
  ["foreground", "secondary"],
  ["foreground", "muted"],
  ["foreground", "accent"],
  ["foreground", "popover"],
  ["muted-foreground", "background"],
  ["muted-foreground", "card"],
  ["muted-foreground", "secondary"],
  ["muted-foreground", "muted"],

  // the accent, on the grounds it is used on
  ["brand", "background"],
  ["brand", "card"],
  ["brand", "secondary"],
  ["brand-hi", "background"],
  ["brand-hi", "card"],

  // primary button: near-black plate, light label
  ["primary-foreground", "primary"],
  ["secondary-foreground", "secondary"],
  ["accent-foreground", "accent"],

  // the dark bands
  ["on-deep", "deep"],
  ["on-deep", "band"],
  ["on-deep", "brand"],
  ["on-deep", "brand-hi"],
  ["muted-deep", "deep"],
  ["muted-deep", "band"],

  // star ratings need one value per ground; a single gold cannot clear both
  ["gold", "background"],
  ["gold", "card"],
  ["gold", "secondary"],
  ["gold-deep", "deep"],
  ["gold-deep", "band"],

  // status
  ["destructive", "background"],
  ["destructive", "card"],
] as const;

/**
 * Non-text contrast (1.4.11) needs only 3:1: component boundaries and state indicators.
 */
export const NON_TEXT_PAIRS: ReadonlyArray<readonly [string, string]> = [
  ["input", "card"],
  ["input", "background"],
  ["ring", "foreground"],
] as const;

/**
 * Cinematic sections put light text over photography. Rather than hope a photograph is dark
 * enough, the text always sits on a scrim of --deep at this alpha. At >= 0.85 the composite
 * luminance is within a rounding error of --deep itself, so the declared on-deep/deep pair
 * still describes what a reader actually sees.
 */
export const MIN_SCRIM_ALPHA = 0.85;

/** Target size (Enhanced), 2.5.5. */
export const MIN_TAP_PX = 44;
