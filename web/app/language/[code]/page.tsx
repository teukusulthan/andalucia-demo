import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { SimplePage } from "@/components/site/simple-page";
import { ButtonLink } from "@/components/site/sections";
import { Reveal } from "@/components/motion/reveal";

const NAMES: Record<string, string> = {
  fr: "French",
  cn: "Chinese",
  id: "Bahasa Indonesia",
};

export function generateStaticParams() {
  return Object.keys(NAMES).map((code) => ({ code }));
}

export async function generateMetadata(props: PageProps<"/language/[code]">): Promise<Metadata> {
  const { code } = await props.params;
  const name = NAMES[code];
  return name ? { title: `${name} is on the way` } : {};
}

export default async function LanguagePage(props: PageProps<"/language/[code]">) {
  const { code } = await props.params;
  const name = NAMES[code];
  if (!name) notFound();

  return (
    <SimplePage
      slug="terms-hero"
      eyebrow="Language"
      title={`${name} is on the way`}
      tagline="Everything you can read today is in English."
      crumb={[{ href: "/", label: "Home" }, { label: name }]}
      lede={`The site is being prepared in English, French, Chinese and Bahasa Indonesia. ${name} translations are not published yet, so nothing on this site is served in ${name} rather than quietly falling back to English without telling you.`}
    >
      <Reveal>
        <p className="mb-8 max-w-[68ch] border-l-2 border-foreground py-1 pl-5 text-[15px] leading-relaxed text-muted-foreground">
          If you would rather write to us in {name}, our crew reads it. Start an enquiry and we will
          reply in the language you use.
        </p>
      </Reveal>
      <Reveal delay={0.06}>
        <div className="flex flex-wrap justify-center gap-3">
          <ButtonLink href="/">Continue in English</ButtonLink>
          <ButtonLink href="/enquire" variant="ghost">
            Write to us
          </ButtonLink>
        </div>
      </Reveal>
    </SimplePage>
  );
}
