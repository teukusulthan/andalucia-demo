import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Hero } from "@/components/site/hero";
import { Band, Inner, Lede, Crumbs, ButtonLink } from "@/components/site/sections";
import { Reveal } from "@/components/motion/reveal";
import { TextLine, LoadingRegion } from "@/components/site/skeleton";
import { currentUser } from "@/lib/auth";
import { one } from "@/lib/db";

type Article = {
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  published_at: string;
  members_only: number;
};

const getArticle = (slug: string) =>
  one<Article>("SELECT * FROM articles WHERE slug=?", slug);

export async function generateMetadata(props: PageProps<"/news/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const a = getArticle(slug);
  return a ? { title: a.title, description: a.excerpt } : {};
}

/**
 * The article itself is public, so the headline, date and standfirst render immediately. Only the
 * body waits, because whether it is readable or gated depends on the session.
 *
 * notFound() has to run before anything suspends — once a fallback renders, the response headers
 * are already sent and the status can no longer be changed to 404.
 */
export default async function DispatchPage(props: PageProps<"/news/[slug]">) {
  const { slug } = await props.params;
  const article = getArticle(slug);
  if (!article) notFound();

  return (
    <>
      <Hero
        slug="news-1"
        alt="The Komodo archipelago"
        eyebrow="The Island Dispatch"
        title={article.title}
        tagline={article.published_at?.slice(0, 10)}
        short
      />
      <Crumbs
        trail={[
          { href: "/", label: "Home" },
          { href: "/news", label: "The Island Dispatch" },
          { label: article.title },
        ]}
      />

      <Band>
        <Inner narrow>
          <Reveal>
            <Lede className="mb-10">{article.excerpt}</Lede>
          </Reveal>

          <Suspense fallback={<BodySkeleton />}>
            <DispatchBody article={article} />
          </Suspense>
        </Inner>
      </Band>
    </>
  );
}

async function DispatchBody({ article }: { article: Article }) {
  const user = await currentUser();
  const locked = Boolean(article.members_only) && !user;

  if (locked) {
    return (
      <Reveal>
        <div className="border-t border-border pt-8">
          <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Members only
          </p>
          <p className="mb-7 max-w-[52ch] text-muted-foreground">
            The rest of this dispatch is open to Voyage Club members. Joining is free and takes
            about a minute.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <ButtonLink href="/membership/join">Join the Voyage Club</ButtonLink>
            <ButtonLink href="/signin" variant="ghost">
              Sign in
            </ButtonLink>
          </div>
        </div>
      </Reveal>
    );
  }

  return (
    <Reveal>
      <p className="max-w-[68ch] text-[1.0625rem] leading-[1.65] text-foreground/85">
        {article.body}
      </p>
      <p className="mt-10">
        <Link href="/news" className="text-brand underline underline-offset-4">
          All dispatches
        </Link>
      </p>
    </Reveal>
  );
}

function BodySkeleton() {
  return (
    <LoadingRegion label="Loading the dispatch">
      <div className="max-w-[68ch] space-y-3.5">
        {["w-full", "w-full", "w-11/12", "w-full", "w-full", "w-2/3"].map((w, i) => (
          <TextLine key={i} w={w} />
        ))}
      </div>
    </LoadingRegion>
  );
}
