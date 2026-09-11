import type { Metadata } from "next";
import { SimplePage, PendingNote } from "@/components/site/simple-page";
import { CONTACT } from "@/lib/content";

export const metadata: Metadata = {
  title: "Press",
  description: "Press enquiries, images and interview requests.",
};

export default function PressPage() {
  return (
    <SimplePage
      slug="press-hero"
      title="Press"
      tagline="Coverage, and how to reach us."
      lede={
        <>
          For press enquiries, images or interview requests, write to{" "}
          <a href={`mailto:${CONTACT.email}`} className="text-brand underline underline-offset-4">
            {CONTACT.email}
          </a>{" "}
          and we will come back to you.
        </>
      }
      cta={{ line: "Writing about Komodo?", label: "Get in touch", href: "/enquire" }}
    >
      <PendingNote title="Awaiting content:">
        press clippings and a downloadable media kit are listed in the brief but have not been
        supplied.
      </PendingNote>
    </SimplePage>
  );
}
