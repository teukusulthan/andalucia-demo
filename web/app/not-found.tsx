import { SimplePage } from "@/components/site/simple-page";
import { ButtonLink } from "@/components/site/sections";
import { Reveal } from "@/components/motion/reveal";

export default function NotFound() {
  return (
    <SimplePage
      slug="press-hero"
      eyebrow="404"
      title="That page is not on the chart"
      tagline="The address you followed does not exist on this site."
      crumb={[{ href: "/", label: "Home" }, { label: "Page not found" }]}
      lede="It may have moved, or the link may have been mistyped. The places below are the ones people are usually looking for."
    >
      <Reveal>
        <div className="flex flex-wrap justify-center gap-3">
          <ButtonLink href="/">Home</ButtonLink>
          <ButtonLink href="/sailing" variant="ghost">
            Sailing
          </ButtonLink>
          <ButtonLink href="/destinations" variant="ghost">
            Destinations
          </ButtonLink>
          <ButtonLink href="/enquire" variant="ghost">
            Make an enquiry
          </ButtonLink>
        </div>
      </Reveal>
    </SimplePage>
  );
}
