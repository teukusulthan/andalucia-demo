/** The Island Dispatch: member-facing notes from the crew, teased on the home page. */
export type Dispatch = { slug: string; title: string; excerpt: string; date: string; photo: string };

export const DISPATCHES: Dispatch[] = [
  {
    slug: "manta-season-2026",
    title: "Manta season is running early this year",
    excerpt:
      "Our guides have logged reliable aggregations at Manta Point three weeks ahead of the usual window.",
    date: "September 2026",
    photo: "news-1",
  },
  {
    slug: "andalucia-iii-keel",
    title: "Andalucía III: the keel is laid",
    excerpt:
      "The third vessel in the line has entered construction in South Sulawesi. First photographs from the yard.",
    date: "August 2026",
    photo: "news-2",
  },
  {
    slug: "padar-trail-repairs",
    title: "Padar's summit trail has been resurfaced",
    excerpt:
      "The park authority has rebuilt the upper steps. The sunrise hike is easier underfoot than it was last season.",
    date: "August 2026",
    photo: "news-3",
  },
  {
    slug: "new-galley-menu",
    title: "A new galley menu for the dry season",
    excerpt:
      "Chef Nadhy has rebuilt the three-day menu around what the Labuan Bajo market lands each morning.",
    date: "July 2026",
    photo: "news-4",
  },
];
