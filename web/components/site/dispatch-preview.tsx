"use client";

import Link from "next/link";
import Image from "next/image";
import { Lock } from "lucide-react";
import { useSession } from "./session";
import type { Dispatch } from "@/lib/dispatch";

/**
 * The Island Dispatch preview.
 *
 * Signed out, the cards are blurred behind a sign-in prompt, as the brief specifies. The
 * blurred copy is inert and aria-hidden: a screen reader should not be read teasers it has no
 * way to open, so the lock panel carries the whole meaning. Signed in, the same cards become
 * real links into each dispatch.
 */
export function DispatchPreview({
  items,
}: {
  items: (Dispatch & { src?: string; blurDataURL?: string })[];
}) {
  const { user, loading } = useSession();
  const locked = !loading && !user;

  const cards = (blurred: boolean) => (
    <div
      aria-hidden={blurred ? "true" : undefined}
      className={
        blurred
          ? "pointer-events-none grid select-none gap-8 opacity-55 blur-[5px] sm:grid-cols-2 lg:grid-cols-4"
          : "grid gap-8 sm:grid-cols-2 lg:grid-cols-4"
      }
    >
      {items.map((d) => {
        const body = (
          <>
            <span className="relative block aspect-[4/3] w-full overflow-hidden bg-secondary">
              {d.src ? (
                <Image
                  src={d.src}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 100vw, 25vw"
                  placeholder={d.blurDataURL ? "blur" : undefined}
                  blurDataURL={d.blurDataURL}
                  className="object-cover transition-transform duration-700 ease-out-expo group-hover:scale-[1.05]"
                />
              ) : null}
            </span>
            <span className="block pt-4">
              <span className="mb-1.5 block text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
                {d.date}
              </span>
              <span className="mb-1.5 block text-[1.05rem] font-semibold tracking-[-0.012em] underline-offset-[5px] group-hover:underline">
                {d.title}
              </span>
              <span className="block text-[15px] leading-relaxed text-muted-foreground">
                {d.excerpt}
              </span>
            </span>
          </>
        );
        return blurred ? (
          <figure key={d.slug} className="m-0 text-left">
            {body}
          </figure>
        ) : (
          <Link key={d.slug} href={`/news/${d.slug}`} className="group block text-left">
            {body}
          </Link>
        );
      })}
    </div>
  );

  if (!locked) return cards(false);

  return (
    <div className="relative">
      {cards(true)}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[linear-gradient(to_bottom,rgb(250_250_248/0.35),var(--background)_72%)] p-6 text-center">
        <Lock aria-hidden="true" className="size-5 text-muted-foreground" strokeWidth={1.4} />
        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
          Members only
        </p>
        <p className="max-w-[44ch] text-muted-foreground">
          Sign in to read the Dispatch in full, or join the Voyage Club. It is free.
        </p>
        <div className="mt-1 flex flex-wrap justify-center gap-3">
          <Link
            href="/membership/join"
            className="inline-flex min-h-11 items-center justify-center bg-primary px-6 text-[15px] font-medium text-primary-foreground transition-colors duration-200 hover:bg-brand"
          >
            Join the Voyage Club
          </Link>
          <Link
            href="/signin"
            className="inline-flex min-h-11 items-center justify-center px-6 text-[15px] font-medium text-foreground shadow-[inset_0_0_0_1px_var(--input)] transition-colors duration-200 hover:bg-primary hover:text-primary-foreground"
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
