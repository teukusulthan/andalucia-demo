import { Band, Inner, CONTAINER } from "@/components/site/sections";
import { Shimmer, TextLine, CardGridSkeleton, LoadingRegion } from "@/components/site/skeleton";

/**
 * The one page that takes a route-level fallback rather than a Suspense boundary around its data.
 * Its h1 is the member's own name, so nothing here can render before the session resolves and
 * there is no static opener to hold. Everywhere else the boundary sits around the fetch instead,
 * because a whole-page fallback greys out a hero that was never waiting and streams the footer's
 * headings ahead of the page's h1 — neither of which matters on a noindex page behind a sign-in.
 */
export default function Loading() {
  return (
    <LoadingRegion label="Loading your account">
      <div className="relative flex min-h-[62svh] items-end overflow-hidden bg-deep">
        <div className={`${CONTAINER} pb-20 pt-24`}>
          <Shimmer className="mb-6 h-3 w-28 bg-on-deep/10" />
          <Shimmer className="mb-4 h-12 w-[min(20rem,70%)] bg-on-deep/10 sm:h-16" />
          <Shimmer className="h-4 w-[min(28rem,90%)] bg-on-deep/10" />
        </div>
      </div>

      <div className={`${CONTAINER} pt-5`}>
        <Shimmer className="h-3 w-44" />
      </div>

      <Band>
        <Inner>
          <Shimmer className="mb-8 h-7 w-56" />
          <div className="mb-16 max-w-[52rem]">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="grid gap-x-8 gap-y-2 border-b border-border py-5 sm:grid-cols-[minmax(0,10rem)_minmax(0,1fr)_minmax(0,7rem)]"
              >
                <TextLine w="w-28" />
                <TextLine w="w-full" />
                <TextLine w="w-20" />
              </div>
            ))}
          </div>

          <Shimmer className="mb-8 h-7 w-64" />
          <CardGridSkeleton count={2} columns={2} />
        </Inner>
      </Band>
    </LoadingRegion>
  );
}
