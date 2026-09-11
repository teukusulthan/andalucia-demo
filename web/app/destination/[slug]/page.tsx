import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArticlePage } from "@/components/site/article";
import { getDestination, destinationSlugs, plain } from "@/lib/content";
import { photo } from "@/lib/photos";

export function generateStaticParams() {
  return destinationSlugs.map((slug) => ({ slug }));
}

export async function generateMetadata(props: PageProps<"/destination/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const a = getDestination(slug);
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

export default async function DestinationPage(props: PageProps<"/destination/[slug]">) {
  const { slug } = await props.params;
  const article = getDestination(slug);
  if (!article) notFound();
  return <ArticlePage article={article} slug={slug} />;
}
