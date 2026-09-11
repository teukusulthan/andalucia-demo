import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Hero } from "@/components/site/hero";
import { Band, Inner, H2, Crumbs, ButtonLink } from "@/components/site/sections";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal";
import { Photo } from "@/components/site/photo";
import { currentUser } from "@/lib/auth";
import { all } from "@/lib/db";
import { signOutAction } from "@/app/membership/actions";

export const metadata: Metadata = {
  title: "My account",
  robots: { index: false },
};

type Booking = {
  ref: string;
  start_date: string;
  end_date: string;
  status: string;
  total_idr: number;
};

type Article = { slug: string; title: string; excerpt: string; published_at: string };

const INTEREST: Record<string, string> = {
  both: "both trip types",
  open: "open trips",
  private: "private charter",
};

export default async function AccountPage(props: PageProps<"/account">) {
  const user = await currentUser();
  if (!user) redirect("/signin");

  const params = await props.searchParams;
  const welcome = params?.welcome === "1";

  // the reservation engine owns bookings; this reads the same table it writes
  const bookings = all<Booking>(
    `SELECT ref, start_date, end_date, status, total_idr FROM bookings
     WHERE lower(contact_email)=lower(?) ORDER BY created_at DESC`,
    user.email,
  );
  const dispatches = all<Article>(
    "SELECT slug, title, excerpt, published_at FROM articles ORDER BY published_at DESC",
  );

  return (
    <>
      <Hero
        slug="andalucia-2"
        alt="Andalucía II at anchor"
        eyebrow="Voyage Club"
        title={user.preferred_name || user.name}
        tagline={`Member · ${user.email}`}
        short
      />
      <Crumbs trail={[{ href: "/", label: "Home" }, { label: "My account" }]} />

      <Band>
        <Inner>
          {welcome ? (
            <Reveal>
              <p
                role="status"
                className="mb-10 max-w-[68ch] border-l-2 border-brand py-2 pl-5 text-[15px] leading-relaxed"
              >
                <strong className="font-medium">Welcome aboard. </strong>
                Your membership is active and the Island Dispatch is open to you below.
              </p>
            </Reveal>
          ) : null}

          <div className="grid gap-14 lg:grid-cols-[minmax(0,1fr)_18rem]">
            <div>
              <Reveal>
                <H2 className="mb-6">Your bookings</H2>
              </Reveal>
              {bookings.length ? (
                <Reveal>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left text-[15px]">
                      <caption className="pb-4 text-left text-[13px] text-muted-foreground">
                        Bookings made with this email address
                      </caption>
                      <thead>
                        <tr>
                          {["Reference", "Dates", "Status", "Total"].map((h) => (
                            <th
                              key={h}
                              scope="col"
                              className="border-b border-border py-3 text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground"
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {bookings.map((b) => (
                          <tr key={b.ref}>
                            <th scope="row" className="border-b border-border py-3.5 font-medium">
                              {b.ref}
                            </th>
                            <td className="border-b border-border py-3.5">
                              {b.start_date} to {b.end_date}
                            </td>
                            <td className="border-b border-border py-3.5">{b.status}</td>
                            <td className="border-b border-border py-3.5 tabular-nums">
                              IDR {Number(b.total_idr || 0).toLocaleString("en-US")}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Reveal>
              ) : (
                <Reveal>
                  <p className="max-w-[60ch] text-muted-foreground">
                    No bookings yet under this address. Departures and checkout are served by the
                    reservation system;{" "}
                    <Link href="/schedule" className="text-brand underline underline-offset-4">
                      see the schedule
                    </Link>
                    .
                  </p>
                </Reveal>
              )}

              <Reveal>
                <H2 className="mb-6 mt-16">The Island Dispatch</H2>
              </Reveal>
              <RevealGroup className="grid gap-8 sm:grid-cols-2">
                {dispatches.map((d, i) => (
                  <RevealItem key={d.slug} as="figure" className="group m-0">
                    <Link href={`/news/${d.slug}`} className="block text-left">
                      <span className="relative block aspect-[4/3] w-full overflow-hidden bg-secondary">
                        <Photo
                          slug={`news-${(i % 4) + 1}`}
                          alt=""
                          sizes="(max-width: 640px) 100vw, 40vw"
                          className="transition-transform duration-700 ease-out-expo group-hover:scale-[1.05]"
                        />
                      </span>
                      <figcaption className="pt-4">
                        <span className="mb-1.5 block text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
                          {d.published_at?.slice(0, 10)}
                        </span>
                        <span className="mb-1.5 block text-[1.05rem] font-semibold tracking-[-0.012em] underline-offset-[5px] group-hover:underline">
                          {d.title}
                        </span>
                        <span className="block text-[15px] leading-relaxed text-muted-foreground">
                          {d.excerpt}
                        </span>
                      </figcaption>
                    </Link>
                  </RevealItem>
                ))}
              </RevealGroup>
            </div>

            <Reveal delay={0.1}>
              <aside className="border-t border-border pt-6">
                <h2 className="mb-4 text-[1.05rem] font-semibold tracking-[-0.012em]">
                  Your details
                </h2>
                <dl className="mb-8 text-[15px]">
                  <Row term="Name" value={user.name} />
                  <Row term="Email" value={user.email} />
                  {user.phone ? <Row term="Phone" value={user.phone} /> : null}
                  <Row term="Interested in" value={INTEREST[user.interest ?? "both"] ?? "both trip types"} />
                  <Row term="Role" value={user.role} />
                </dl>
                <ButtonLink href="/schedule" className="mb-3 w-full">
                  See departures
                </ButtonLink>
                <form action={signOutAction}>
                  <button
                    type="submit"
                    className="inline-flex min-h-11 w-full items-center justify-center px-6 text-[15px] font-medium text-foreground shadow-[inset_0_0_0_1px_var(--input)] transition-colors duration-200 hover:bg-primary hover:text-primary-foreground"
                  >
                    Sign out
                  </button>
                </form>
              </aside>
            </Reveal>
          </div>
        </Inner>
      </Band>
    </>
  );
}

function Row({ term, value }: { term: string; value: string }) {
  return (
    <div className="border-b border-border py-3 last:border-b-0">
      <dt className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground">{term}</dt>
      <dd className="m-0">{value}</dd>
    </div>
  );
}
