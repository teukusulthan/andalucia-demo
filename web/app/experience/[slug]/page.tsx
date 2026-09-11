import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArticlePage } from "@/components/site/article";
import { getExperience, experienceSlugs, plain } from "@/lib/content";
import { photo } from "@/lib/photos";

export function generateStaticParams() {
  return experienceSlugs.map((slug) => ({ slug }));
}

export async function generateMetadata(props: PageProps<"/experience/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const a = getExperience(slug);
  if (!a) return {};
  return {
    title: plain(a.title),
    description: plain(a.lede[0] ?? a.tagline),
    openGraph: {
      title: plain(a.h1),
      description: plain(a.tagline),
      images: [{ url: photo(slug).src }],
    },
  };
}

export default async function ExperiencePage(props: PageProps<"/experience/[slug]">) {
  const { slug } = await props.params;
  const article = getExperience(slug);
  if (!article) notFound();
  return <ArticlePage article={article} slug={slug} />;
}
