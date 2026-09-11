"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
} from "motion/react";
import { Menu, X, ChevronDown } from "lucide-react";
import { NAV } from "@/lib/nav";
import { LANGUAGES } from "@/lib/content";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useSession } from "./session";
import { cn } from "@/lib/utils";

const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * Primary navigation.
 *
 * Hand-built rather than shadcn's navigation-menu: that component is Base UI's popup
 * positioner, which anchors a floating card to its trigger. This design needs a full-bleed
 * panel spanning the whole header, so the popup positioner would be fought the whole way.
 * Keyboard behaviour is implemented explicitly instead - Escape closes, focus leaving the
 * group closes, and every trigger carries aria-expanded/aria-controls.
 *
 * The bar hides on the way down and returns on the way up. That is the brief's behaviour and
 * it is also what keeps AAA 2.4.12 honest: a permanently pinned bar can cover the element
 * that just took focus. It also un-hides the moment anything inside it receives focus.
 */
export function SiteHeader({ floating = false }: { floating?: boolean }) {
  const pathname = usePathname();
  const session = useSession();
  const reduce = useReducedMotion();
  const { scrollY } = useScroll();

  const [hidden, setHidden] = useState(false);
  const [solid, setSolid] = useState(!floating);
  const [open, setOpen] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  /* the bar goes solid once the page has scrolled under it, and also whenever a menu is open,
     so the bar and the panel beneath it are one surface rather than two */
  const opaque = solid || open !== null || mobileOpen;
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navRef = useRef<HTMLDivElement>(null);

  /* Derived booleans only. setState with an identical value bails out of re-render, so this
     runs per scroll frame without re-rendering the tree. */
  useMotionValueEvent(scrollY, "change", (y) => {
    const prev = scrollY.getPrevious() ?? 0;
    setSolid(!floating || y > 80);
    setHidden(y > prev && y > 260 && open === null && !mobileOpen);
  });

  useEffect(() => setOpen(null), [pathname]);

  const cancelClose = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }, []);
  const scheduleClose = useCallback(() => {
    cancelClose();
    closeTimer.current = setTimeout(() => setOpen(null), 220);
  }, [cancelClose]);
  useEffect(() => () => cancelClose(), [cancelClose]);

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <motion.header
      id="masthead"
      initial={false}
      animate={{ y: hidden && !reduce ? "-100%" : "0%" }}
      transition={{ duration: 0.32, ease: EASE }}
      onFocusCapture={() => setHidden(false)}
      /* names this element to the View Transitions API so globals.css can pin it: the bar is the
         reader's fixed reference point and must not dissolve with the page under it */
      style={{ viewTransitionName: "site-header" }}
      className="no-print fixed inset-x-0 top-0 z-50 text-on-deep"
    >
      {/* Two backdrops, crossfaded.
          When a mega menu opens, the bar has to become the same solid navy as the panel below it
          or the two read as separate surfaces with a seam between them. It cannot be done by
          swapping one class for the other: the floating state is a `background-image` gradient
          and the solid state is a `background-color`, and CSS interpolates neither into the
          other, so the change would snap. Layering them and animating opacity gives a real
          crossfade, and the panel's own entrance runs over the top of it. */}
      <span
        aria-hidden="true"
        className={cn(
          "absolute inset-0 z-0 bg-[linear-gradient(to_bottom,rgb(10_32_54/0.92),rgb(10_32_54/0.55)_60%,transparent)] transition-opacity duration-[600ms] ease-out-expo",
          opaque ? "opacity-0" : "opacity-100",
        )}
      />
      <span
        aria-hidden="true"
        className={cn(
          "absolute inset-0 z-0 bg-deep transition-opacity duration-[600ms] ease-out-expo",
          opaque ? "opacity-100" : "opacity-0",
        )}
      />

      <div
        ref={navRef}
        className="relative z-10 mx-auto flex max-w-[1120px] items-center gap-3 px-5 py-2 sm:px-8"
        onMouseLeave={scheduleClose}
      >
        <LanguageMenu />

        <Link
          href="/"
          className="mr-auto inline-flex min-h-11 shrink-0 items-center pr-4 text-[15px] font-semibold uppercase tracking-[0.2em] text-on-deep sm:text-base"
        >
          Andalucía
        </Link>

        {/* desktop */}
        <nav aria-label="Primary" className="hidden lg:block">
          <ul className="flex items-center">
            {NAV.map((group) => {
              const isOpen = open === group.label;
              const active = pathname.startsWith(group.href) && group.href !== "/";
              return (
                <li
                  key={group.label}
                  className="static"
                  onMouseEnter={() => {
                    cancelClose();
                    setOpen(group.label);
                  }}
                >
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={`mega-${slug(group.label)}`}
                    onClick={() => setOpen(isOpen ? null : group.label)}
                    className="relative inline-flex min-h-11 items-center gap-1.5 px-3.5 text-sm text-on-deep/85 transition-opacity hover:text-on-deep focus-visible:text-on-deep"
                  >
                    {group.label}
                    <ChevronDown
                      aria-hidden="true"
                      className={cn(
                        "size-3.5 transition-transform duration-[550ms] ease-out-expo",
                        isOpen && "rotate-180",
                      )}
                    />
                    {active ? (
                      <motion.span
                        layoutId="nav-active"
                        className="absolute inset-x-3.5 bottom-1.5 h-px bg-on-deep"
                        transition={{ duration: 0.4, ease: EASE }}
                      />
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="ml-auto hidden shrink-0 items-center gap-1 lg:flex">
          {/* held blank until the session is known, so it never flashes "Sign In" at a member */}
          {session.loading ? (
            <span className="inline-flex min-h-11 w-20 items-center" aria-hidden="true" />
          ) : session.user ? (
            <Link
              href="/account"
              className="inline-flex min-h-11 items-center px-3.5 text-sm text-on-deep/85 transition-opacity hover:text-on-deep"
            >
              {session.user.name}
            </Link>
          ) : (
            <Link
              href="/signin"
              className="inline-flex min-h-11 items-center px-3.5 text-sm text-on-deep/85 transition-opacity hover:text-on-deep"
            >
              Sign In
            </Link>
          )}
          <Link
            href="/enquire"
            className="inline-flex min-h-10 items-center bg-on-deep px-5 text-sm font-medium text-deep transition-colors duration-200 hover:bg-transparent hover:text-on-deep hover:shadow-[inset_0_0_0_1px_var(--on-deep)]"
          >
            Contact Us
          </Link>
        </div>

        <MobileNav open={mobileOpen} onOpenChange={setMobileOpen} pathname={pathname} user={session.user} />
      </div>

      {/* full-bleed mega panel */}
      <AnimatePresence>
        {open !== null ? (
          <motion.div
            key={open}
            id={`mega-${slug(open)}`}
            role="group"
            aria-label={open}
            initial={reduce ? false : { opacity: 0, y: -14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? undefined : { opacity: 0, y: -10 }}
            transition={{ duration: 0.55, ease: EASE }}
            onMouseEnter={cancelClose}
            onMouseLeave={scheduleClose}
            className="absolute inset-x-0 top-full hidden bg-deep shadow-[0_24px_48px_rgb(10_32_54/0.45)] lg:block"
          >
            <div className="mx-auto grid max-w-[1120px] gap-8 px-5 pb-10 pt-7 sm:px-8 lg:grid-cols-3">
              {NAV.find((g) => g.label === open)?.columns.map((col, ci) => (
                <motion.div
                  key={col.title}
                  initial={reduce ? false : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: 0.04 + ci * 0.05, ease: EASE }}
                >
                  <p
                    id={`col-${slug(open)}-${ci}`}
                    className="mb-3 border-b border-on-deep/15 pb-3 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-deep"
                  >
                    {col.title}
                  </p>
                  <ul aria-labelledby={`col-${slug(open)}-${ci}`}>
                    {col.links.map((l) => (
                      <li key={l.href}>
                        <Link
                          href={l.href}
                          className="group flex min-h-11 items-center text-[15px] text-on-deep/80 transition-colors hover:text-on-deep"
                        >
                          <span className="underline-offset-[6px] group-hover:underline">
                            {l.label}
                          </span>
                          {l.note ? (
                            <span className="ml-2.5 text-[11px] uppercase tracking-[0.1em] text-muted-deep">
                              {l.note}
                            </span>
                          ) : null}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.header>
  );
}

function slug(s: string) {
  return s.toLowerCase().replace(/\W+/g, "-");
}

function LanguageMenu() {
  const [open, setOpen] = useState(false);
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex min-h-11 items-center gap-1 px-2 text-[13px] font-medium uppercase tracking-[0.1em] text-on-deep"
      >
        EN
        <span className="vh">, choose a language</span>
        <ChevronDown aria-hidden="true" className={cn("size-3.5 transition-transform", open && "rotate-180")} />
      </button>
      <AnimatePresence>
        {open ? (
          <motion.ul
            initial={reduce ? false : { opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? undefined : { opacity: 0, y: -6 }}
            transition={{ duration: 0.2, ease: EASE }}
            className="absolute left-0 top-full z-50 min-w-52 border border-on-deep/20 bg-deep p-1.5"
          >
            {LANGUAGES.map(([code, name]) => (
              <li key={code}>
                <Link
                  href={code === "en" ? "/" : `/language/${code}`}
                  onClick={() => setOpen(false)}
                  aria-current={code === "en" ? "true" : undefined}
                  className={cn(
                    "flex min-h-11 items-center px-3 text-[15px] transition-colors hover:bg-band",
                    code === "en" ? "text-on-deep" : "text-on-deep/80",
                  )}
                >
                  {name}
                  {code === "en" ? <span className="vh"> (current language)</span> : null}
                </Link>
              </li>
            ))}
          </motion.ul>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function MobileNav({
  open,
  onOpenChange,
  pathname,
  user,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  pathname: string;
  user: { name: string } | null;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger
        className="inline-flex min-h-11 min-w-11 items-center justify-center text-on-deep lg:hidden"
        aria-label={open ? "Close menu" : "Open menu"}
      >
        {open ? <X className="size-5" aria-hidden="true" /> : <Menu className="size-5" aria-hidden="true" />}
      </SheetTrigger>
      <SheetContent side="right" className="w-[min(92vw,26rem)] overflow-y-auto bg-deep text-on-deep">
        <SheetTitle className="px-5 pt-5 text-sm font-semibold uppercase tracking-[0.2em] text-on-deep">
          Andalucía
        </SheetTitle>
        <nav aria-label="Primary" className="px-5 pb-12 pt-6">
          {NAV.map((group) => (
            <div key={group.label} className="mb-7">
              <p className="mb-2 border-b border-on-deep/15 pb-2 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-deep">
                {group.label}
              </p>
              <ul>
                {group.columns.flatMap((c) => c.links).map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      onClick={() => onOpenChange(false)}
                      aria-current={pathname === l.href ? "page" : undefined}
                      className="flex min-h-11 items-center text-[15px] text-on-deep/85"
                    >
                      {l.label}
                      {l.note ? (
                        <span className="ml-2.5 text-[11px] uppercase tracking-[0.1em] text-muted-deep">
                          {l.note}
                        </span>
                      ) : null}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div className="flex flex-col gap-2 pt-2">
            <Link
              href="/enquire"
              onClick={() => onOpenChange(false)}
              className="inline-flex min-h-12 items-center justify-center bg-on-deep px-5 text-sm font-medium text-deep"
            >
              Contact Us
            </Link>
            <Link
              href={user ? "/account" : "/signin"}
              onClick={() => onOpenChange(false)}
              className="inline-flex min-h-12 items-center justify-center px-5 text-sm text-on-deep shadow-[inset_0_0_0_1px_rgb(250_250_248/0.4)]"
            >
              {user ? "My account" : "Sign In"}
            </Link>
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
