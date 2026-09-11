// Editorial content: experiences, destinations, vessels, membership and About Us.
// Copy comes from *Andalucía Website Brief*. Everything is data here and rendered by three
// templates below, so a new blog or destination is a row, not a route.
import { db } from './db.js';
import { page, esc, req, field, cine, ctaBand, photoStrip, photoTiles, chips, factStrip,
  DESTINATIONS, EXPERIENCES, CONTACT } from './views.js';
import { img } from './media.js';

const all = (s, ...a) => db.prepare(s).all(...a);
const one = (s, ...a) => db.prepare(s).get(...a);
const P = (...paras) => paras;

/* ================= experiences (Sailing → Private Charter) ================= */
export const EXPERIENCE = {
  'komodo-trekking': {
    nav: 'Sailing', crumb: ['Sailing', '/sailing'],
    title: 'Trekking with dragons on Komodo Island',
    eyebrow: 'Private charter · Land',
    h1: 'Trekking with Dragons on Komodo Island',
    tagline: 'Where the wild still whispers and giants still roam.',
    lede: P(`This is not a hike. It is a walk through one of the last places on earth where a large
      predator still sets the terms, in a national park that has been protected precisely because
      what lives here lives nowhere else.`),
    sections: [
      { h: 'Two ways to meet the dragons', p: P(), cards: [
        ['Rinca Island', `Quieter than Komodo Island and, for many guests, the better trek. The ranger
          basecamp holds a small Komodo museum that explains the animals’ evolution, behaviour and the
          conservation work that keeps them here.`],
        ['Komodo Village', `A rare thing: a settlement that has shared its island with the dragons for
          generations. You will see how houses, routines and caution have been shaped around that fact.
          A small market sells ethically made local crafts, so bring cash.`],
      ] },
      { h: 'Three trails, three appetites', p: P(`Every trek is led by an experienced ranger who reads the
        ground, sets the pace and explains what you are looking at: how the dragons hunt, feed, compete
        and survive. It is a wildlife documentary unfolding at walking speed.`), tracks: [
        { name: 'Short track', difficulty: 'Easy', terrain: 'Flat, near the ranger post', sighting: 'Good',
          blurb: 'Beginner-friendly. A quick, reliable look at dragons in the open, still surrounded by the raw shape of the island.' },
        { name: 'Medium track', difficulty: 'Moderate', terrain: 'Rolling, into the savannah', sighting: 'Better',
          blurb: 'The balanced choice. Deeper into the terrain, more chances to observe, and the panoramic views open up.' },
        { name: 'Long track', difficulty: 'Demanding', terrain: 'Ridge and interior', sighting: 'Best',
          blurb: 'For the bold. Far into the island’s interior, with the best odds of wild dragons, native birds and the deer they hunt.' },
      ], trackNote: `Distances and walking times are set by the park and by your ranger on the day, so
        they are deliberately not printed here. Confirm the route at the ranger post before you set off.` },
      { h: 'At the end of the trail', p: P(`A souvenir corner run by the local community closes the walk -
        hand-carved Komodo figures, island-made crafts and ethically sourced keepsakes. Buying here is
        the most direct way a visitor supports the people who protect this place.`) },
    ],
    facts: [['Led by', 'National park ranger'], ['Trails', 'Short · Medium · Long'], ['Best light', 'Early morning'], ['Bring', 'Cash, closed shoes, water']],
    gallery: { label: 'Komodo trekking', items: [
      ['komodo-dragon-trail', 'A dragon crossing the open ground near the ranger post'],
      ['komodo-ranger-briefing', 'The ranger briefing before the trek begins'],
      ['komodo-village-stilts', 'Stilt houses in Komodo Village'],
      ['komodo-deer-savannah', 'Deer grazing the savannah, the dragons’ natural prey'],
      ['komodo-souvenir-carving', 'Hand-carved figures at the souvenir corner'],
    ] },
    close: `Few encounters are this rare, and none of them are guaranteed to last. Walk gently, take
      only photographs, and go before the dragons become a story people tell rather than a thing people see.`,
    cta: { line: 'Plan your trek, meet the dragons. Komodo is waiting.', label: 'Explore trips to Komodo', href: '/trips' },
  },

  'sunrise-hike': {
    nav: 'Sailing', crumb: ['Sailing', '/sailing'],
    title: 'Chasing dawn on Padar Island',
    eyebrow: 'Private charter · Land',
    h1: 'Chasing Dawn on Padar Island',
    tagline: 'A golden journey to the edge of the world.',
    lede: P(`You start in the dark. For the first twenty minutes there is only your breath, the sound of
      your feet on the stone, and the promise of a view that has to be earned. Then the ridgelines
      separate from the sky, and you understand why you got up.`),
    sections: [
      { h: 'What the climb actually asks', p: P(`The trail starts between 4:30 and 5:00 in the morning.
        You will want a torch, trekking shoes with grip and a full water bottle. It is roughly 818 steps
        and takes 30 to 45 minutes depending on your pace. It is demanding for some people. It is not
        dangerous, and our crew climbs with you.`) },
      { h: 'The reward', p: P(`From the summit, Padar’s three crescent bays fall away beneath you in three
        different colours: white sand, black volcanic sand, and the rare pale pink. Those hues are never
        better than in the first soft light of the day, before the heat flattens everything out.`) },
    ],
    facts: [['Start', '04:30 to 05:00'], ['Steps', 'Approximately 818'], ['Time to summit', '30 to 45 minutes'], ['Difficulty', 'Moderate']],
    gallery: { label: 'Sunrise on Padar', items: [
      ['padar-predawn-trail', 'Head torches on the trail before first light'],
      ['padar-sunrise-summit', 'The three bays as the sun clears the ridge'],
      ['padar-three-bays', 'White, black and pink sand in one frame'],
      ['padar-group-summit', 'Guests at the summit marker'],
      ['padar-aerial-dawn', 'Aerial view of the island at dawn'],
    ] },
    close: `It is not really about reaching the top. It is about the stillness up there, the thinking you
      do on the way, and a memory that stays long after the sun has finished rising.`,
    cta: { line: 'Watch the day begin in one of the world’s most iconic landscapes.', label: 'Plan your sunrise hike', href: '/charter' },
  },

  'sunset-hike': {
    nav: 'Sailing', crumb: ['Sailing', '/sailing'],
    title: 'Golden silence at sunset on Padar Island',
    eyebrow: 'Private charter · Land',
    h1: 'Golden Silence: Sunset at Padar Island',
    tagline: 'Where the sky burns and the sea stands still.',
    lede: P(`The sun drops, the wind turns cool, the hills glow orange and everything slows down.
      Where sunrise is a pursuit, sunset is an unhurried thing: no rush, no schedule, just presence.`),
    sections: [
      { h: 'The same steps, a gentler hour', p: P(`You climb the same trail, around 818 stone steps cut
        into the hillside, but in cooler air, which makes it noticeably easier. Comfortable shoes and
        water still matter. Hikes typically set off between 4:30 and 5:00 in the afternoon, reaching the
        top just before golden hour.`), note: `There is no artificial light on the trail. The descent
        happens straight after sunset, with a guide or crew member alongside you.` },
      { h: 'Three seasons, three islands', p: P(`Padar does not look the same twice. Through the year the
        hillsides run from deep green, through a dry gold, to the burnt brown of late season, and the
        same photograph taken three months apart looks like three different places.`) },
      { h: 'How the evening usually ends', p: P(`Back on the water, some charter guests take a private dining
        setup on the beach; others prefer a slow cruise home under the stars. Both are arranged with the
        crew during the day.`) },
    ],
    facts: [['Start', '16:30 to 17:00'], ['Steps', 'Approximately 818'], ['Conditions', 'Cooler than sunrise'], ['Descend', 'Immediately after sunset']],
    gallery: { label: 'Sunset on Padar', items: [
      ['padar-golden-ridge', 'Long shadows across the ridgelines at golden hour'],
      ['padar-sunset-couple', 'Guests at the viewpoint as the light turns'],
      ['padar-season-green', 'The green season on the hillsides'],
      ['padar-season-gold', 'The dry season, in gold'],
      ['padar-night-cruise', 'The slow cruise back under the stars'],
    ] },
    close: `Endings matter as much as beginnings. A sunset from the top of Padar reads like a farewell
      letter from the island itself.`,
    cta: { line: 'Let the sun set on a perfect day in Komodo.', label: 'Book your sunset experience', href: '/charter' },
  },

  snorkeling: {
    nav: 'Sailing', crumb: ['Sailing', '/sailing'],
    title: 'Snorkelling in Komodo',
    eyebrow: 'Private charter · Water',
    h1: 'Snorkelling in Komodo: Where the Ocean Comes Alive',
    tagline: 'Float, breathe, and witness a world untouched.',
    lede: P(`Light comes down through the water in columns. Below you, a coral garden is busy doing what
      it has done for thousands of years. Komodo sits inside the Coral Triangle, the most biodiverse
      marine region on the planet, and you are floating on the roof of it.`),
    sections: [
      { h: 'Where we take you', p: P(`Each site is chosen on the day against tide and current, not against
        a fixed timetable.`), sites: [
        ['taka-makassar', 'Taka Makassar', 'A sandbar that surfaces at low tide. Calm, shallow, clear.', '/destination/taka-makassar'],
        ['manta-point', 'Manta Point', 'Reef mantas gliding under the surface at a cleaning station.', '/destination/manta-point'],
        ['siaba-besar', 'Siaba Besar', 'Turtle City: green turtles grazing in a few metres of water.', '/destination/siaba-besar'],
        ['kanawa-island', 'Kanawa Island', 'Walk in from the beach and the reef starts immediately.', '/destination/kanawa-island'],
        ['pink-beach', 'Pink Beach', 'A shallow coral garden a few strokes off the pink sand.', '/destination/pink-beach'],
        ['batu-bolong', 'Batu Bolong', 'A vertical wall of coral. Divers only, never snorkellers.', '/destination/batu-bolong'],
        ['sebayur-kecil', 'Sebayur Kecil', 'Coral slopes that suit snorkellers and divers on one boat.', '/destination/sebayur-kecil'],
        ['penga-island', 'Penga Island', 'Steep walls and strong current, for confident swimmers.', '/destination/penga-island'],
        ['kelor-island', 'Kelor Island', 'Gentle shallows, sea stars, and the occasional baby shark.', '/destination/kelor-island'],
      ] },
      { h: 'Snorkelling with a private charter', p: P(`Gear is aboard and fitted for you. A guide is in the
        water. Beginner-friendly sites come first so nobody is thrown into current on day one, and the
        running order is rebuilt each morning around the tide.`) },
      { h: 'Reef-safe, every time', p: P(`Reef-safe sunscreen, no touching, no standing on coral, nothing
        left behind. The reef is the reason the trip exists; protecting it is not an optional extra.`) },
    ],
    facts: [['Gear', 'Provided aboard'], ['Guide', 'In the water with you'], ['Level', 'Beginner to confident'], ['Scheduled by', 'Tide, not clock']],
    gallery: { label: 'Snorkelling in Komodo', items: [
      ['snorkel-coral-garden', 'Shallow coral garden in full sun'],
      ['snorkel-manta-surface', 'A manta gliding just beneath the surface'],
      ['snorkel-turtle-seagrass', 'A green turtle feeding on seagrass'],
      ['snorkel-guest-guide', 'A guide alongside a first-time snorkeller'],
      ['snorkel-reef-fish', 'Reef fish over hard coral'],
    ] },
    close: `Most guests come up from their first proper snorkel quieter than they went in. That is the
      part of the trip nobody quite plans for.`,
    cta: { line: 'Start your ocean journey.', label: 'See open trip departures', href: '/trips' },
  },

  diving: {
    nav: 'Sailing', crumb: ['Sailing', '/sailing'],
    title: 'Diving in Komodo',
    eyebrow: 'Private charter · Water',
    h1: 'Diving in Komodo: Explore the Deep Coral Paradise',
    tagline: 'Descend, breathe, and discover a realm untouched by time.',
    lede: P(`The soundless glide beneath the waves. A school of fusiliers turning as one. Komodo National
      Park sits at the heart of the Coral Triangle, and its walls and pinnacles are among the most
      species-rich dive sites anywhere in the world.`),
    sections: [
      { h: 'Top dive sites', p: P(`What you see depends on the day, the tide and a little luck: mantas,
        reef sharks, turtles, napoleon wrasse, and soft coral in colours that look artificially saturated
        until you see them yourself.`), sites: [
        ['batu-bolong', 'Batu Bolong', 'A vertical wall of life on a submerged pinnacle. Slack tide only.', '/destination/batu-bolong'],
        ['manta-point', 'Manta Point', 'A cleaning station where reef mantas circle coral outcrops.', '/destination/manta-point'],
        ['dive-castle-rock', 'Castle Rock', 'Predator action in current: trevally, tuna and reef sharks hunting.'],
        ['dive-cauldron', 'The Cauldron / Shotgun', 'A drift through a channel that accelerates and spits you out over the reef.'],
        ['dive-manta-alley', 'Manta Alley', 'South-park site, reliable manta aggregations in season.'],
        ['dive-tatawa-besar', 'Tatawa Besar', 'A gentle drift over an unbroken slope of orange soft coral.'],
        ['siaba-besar', 'Siaba Besar', 'Shallow, calm and full of green turtles. Good for the first dive of a trip.', '/destination/siaba-besar'],
        ['kanawa-island', 'Kanawa Island', 'Easy reef with excellent visibility, close to Labuan Bajo.', '/destination/kanawa-island'],
        ['dive-crystal-rock', 'Crystal Rock', 'A pinnacle that blooms with fish when the current runs.'],
        ['dive-three-sisters', 'Three Sisters', 'Three seamounts for divers who want something well off the standard route.'],
      ] },
      { h: 'Diving with a private charter', p: P(`All gear is provided. Dives are led by certified
        instructors and scheduled against tide and water conditions, which in Komodo is a safety matter
        rather than a preference. The programme is built around your group, so certified divers and
        first-timers can share the same boat and the same day.`) },
      { h: 'Conservation is the operating rule', p: P(`No touching, no taking, no anchoring on coral. Group
        sizes stay small. These sites are in the condition they are in because operators here have kept
        to that, and we intend to keep it that way.`) },
    ],
    facts: [['Gear', 'Fully provided'], ['Led by', 'Certified instructors'], ['Levels', 'Beginner to advanced'], ['Planned by', 'Tide and current']],
    gallery: { label: 'Diving in Komodo', items: [
      ['dive-wall-descent', 'A diver descending a coral wall'],
      ['dive-manta-cleaning', 'Mantas circling a cleaning station'],
      ['dive-soft-coral', 'Orange soft coral in current'],
      ['dive-reef-shark', 'A reef shark on the sand'],
      ['dive-macro-nudibranch', 'Macro life along the slope'],
    ] },
    close: `Diving here is not really an activity. It is a period of stillness with your own breathing
      for company, in a place that does not need you to be there.`,
    cta: { line: 'Plan your descent into Komodo’s wonders. Your dive begins here.', label: 'More information about diving trips', href: '/login' },
  },

  'paddling-kayaking': {
    nav: 'Sailing', crumb: ['Sailing', '/sailing'],
    title: 'Kayaking and paddleboarding in Komodo',
    eyebrow: 'Private charter · Water',
    h1: 'Kayaking &amp; Paddleboarding in Komodo',
    tagline: 'Flow with the tides and discover stillness on the sea.',
    lede: P(`Morning water, flat and bright. You are a few centimetres above it rather than inside it,
      moving between islets at exactly the speed you choose. It is the quietest way to see this place.`),
    sections: [
      { h: 'What is aboard', p: P(`The boat carries two paddleboards and one kayak, available throughout
        your trip. Tell the crew the evening before and the equipment will be ready and waiting on the
        beach or at the waterline when you arrive, so you never have to wrestle it off the deck yourself.`) },
      { h: 'Where it works best', p: P(`We set up at the calm destinations: Pink Beach, Taka Makassar,
        Kelor Island and Kalong Island. Shallow water, protected anchorages, and reef edges close enough
        to see straight down through.`) },
      { h: 'No experience needed', p: P(`Paddling is beginner-friendly and the crew supports every session.
        It is entirely optional and flexible: it happens when you want it and when the weather agrees.`) },
    ],
    facts: [['Aboard', '2 paddleboards, 1 kayak'], ['Best spots', 'Pink Beach · Taka Makassar · Kelor · Kalong'], ['Level', 'Complete beginner'], ['Booking', 'Tell the crew the day before']],
    gallery: { label: 'Paddling in Komodo', items: [
      ['paddle-sandbank-glide', 'A paddleboard crossing a shallow sandbank'],
      ['paddle-kayak-golden', 'A kayak near the coastline at golden hour'],
      ['paddle-clear-shallows', 'Clear water and reef visible from the board'],
      ['paddle-crew-setup', 'The crew setting up on the beach before guests arrive'],
    ] },
    close: `Floating over a reef bed with nothing to do and nowhere to be tends to be the moment people
      actually slow down. That is worth as much as any summit.`,
    cta: { line: 'Let the water guide your journey. Paddle with us in Komodo.', label: 'Book your paddle trip', href: '/charter' },
  },

  'stargazer-dinner': {
    nav: 'Sailing', crumb: ['Sailing', '/sailing'],
    title: 'Private dinner by the sea',
    eyebrow: 'Private charter · Evening',
    h1: 'Private Dinner by the Sea',
    tagline: 'An evening of elegance, silence, and stars.',
    lede: P(`You walk barefoot up a beach nobody else is on, and there is a candle-lit table set for your
      party and no one else. No neighbouring tables, no soundtrack, no queue. Just the water doing what
      it does and a sky that gets busier as the evening goes on.`),
    sections: [
      { h: 'The setting', p: P(`Dinner is arranged on one of the small uninhabited islands on your route,
        chosen for calm water and distance from other boats. The table is ready as the sky turns gold,
        with lighting kept deliberately low so the natural ambience does the work.`) },
      { h: 'The food', p: P(`Every dish is cooked fresh aboard by our chef, using local ingredients and
        served minutes after it leaves the galley. The menu is adjusted to dietary preferences -
        gluten-free, vegetarian and allergy requirements are routine, not a favour. Wine and juice
        pairings are available on request.`) },
    ],
    facts: [['Where', 'A private, uninhabited island'], ['Cooked', 'Fresh aboard, minutes before serving'], ['Dietary', 'Adjusted on request'], ['Pairings', 'Wine or juice, on request']],
    /* Real reviews, attributed as written. They speak to the galley and the crew rather than to
       this dinner specifically, and the page says so: inventing dinner-specific quotes would be
       fabricating reviews. */
    quotes: {
      label: 'What guests say about the food and the crew',
      note: `These are general trip reviews. Dinner-specific quotes are still to be gathered.`,
      items: [
        ['They have satisfied any request like gluten-free food and it was so good. The crew involved us in many activities and created a beautiful atmosphere.', 'Lara &amp; Daryl', 'Italy'],
        ['Clean cabins, hot water, very good food, amazing spots and a discreet and very nice team.', 'Mathieu C', 'France'],
        ['Clean ship and cabin, great food, nice crew.', 'Edward', ''],
      ],
    },
    gallery: { label: 'Private dinner by the sea', items: [
      ['dinner-table-sunset', 'The table set on the sand as the sky turns'],
      ['dinner-chef-prep', 'The chef plating aboard before service'],
      ['dinner-candles-night', 'Candlelight after dark'],
      ['dinner-guests-toast', 'Guests at the table'],
    ] },
    close: `Guests remember the food. What they describe afterwards, though, is the quiet, and the fact
      that somebody had thought about every part of it before they arrived.`,
    cta: { line: 'Book your table on a hidden island.', label: 'Add a private dinner to your trip', href: '/support' },
  },
};

/* ================= destinations ================= */
const D = (h1, tagline, lede, body, tags, gal, cta, eyebrow = 'Komodo Archipelago') =>
  ({ nav: 'Destination', crumb: ['Destinations', '/destinations'], title: h1, h1, eyebrow, tagline, lede,
    sections: body, chips: tags, gallery: gal, cta });

export const DESTINATION = {
  'komodo-village': D('Komodo Village', 'Where humans and dragons share the land.',
    P(`Komodo Village is a rare anomaly in modern wildlife conservation: a human settlement inside the
      natural habitat of an apex predator. Around 2,000 people live here, mostly from the Bajo, Bima and
      Manggarai communities. The original Komodo tribe is believed to have vanished in the 1980s; those
      who live here now continue a careful, negotiated coexistence with the dragons.`),
    [{ h: 'Built around the dragons', p: P(`The adaptation is both practical and symbolic. Houses stand on
        stilts so that a dragon can pass underneath without incident, and daily routines follow local
        knowledge, passed down over generations, about how to avoid conflict entirely. It is a form of
        coexistence that is functional and cultural at the same time.`) },
     { h: 'What a visit involves', p: P(`Guided cultural tours cover daily life, traditional fishing methods
        and woodcarving, particularly the hand-carved dragon figures sold as souvenirs. Guides often
        share the legend of Putri Naga, the Dragon Princess, which tells of kinship between the villagers
        and the dragons and underpins a genuinely spiritual relationship with the animals.`),
       note: 'There are no card facilities in the village. Bring cash if you intend to buy anything.' },
     { h: 'Tourism as conservation', p: P(`Tourism has reshaped the local economy. Many residents now work
        as national park guides, artisans or eco-tourism operators. Buying from them directly is what
        makes protecting the dragons economically rational for the people who live closest to them.`) }],
    ['Cultural tourism', 'Human-dragon coexistence', 'Traditional stilt architecture', 'Local legends and folklore', 'Eco-tourism economy', 'Village life in a wildlife reserve'],
    { layout: 'grid', label: 'Gallery of Komodo Village', items: [
      ['village-stilt-houses', 'Where humans and dragons share the land'],
      ['village-elder-daily', 'Home built on wisdom and survival'],
      ['village-woodcarving', 'Crafting memory from wood and myth'],
      ['village-market', 'The living spirit of Komodo Island'],
      ['village-ranger-training', 'A local guide preparing for a trek'],
    ] },
    { line: 'Meet the people who have shared an island with dragons for generations.', label: 'Explore the village', href: '/experience/komodo-trekking' }),

  'padar-island': D('Padar Island', 'Three bays, three colours, one ridgeline.',
    P(`Padar is the third-largest landmass in Komodo National Park and the most photographed natural
      formation in Southeast Asia. Its rugged savannah hills have a prehistoric quality that photographs
      never quite exaggerate.`),
    [{ h: 'The view that does the work', p: P(`The summit viewpoint reveals three contrasting beaches at
        once: one soft white, one volcanic black, and one a rare pale pink, curving between the island’s
        ridgelines. The hike takes 20 to 40 minutes on a steep mix of stairs and dirt trail, and the
        reward is an unbroken 360-degree view that is at its best at sunrise and sunset.`) },
     { h: 'Come prepared', p: P(`Padar is uninhabited and has no facilities of any kind: no shelter, no
        water, no shade. Bring water, proper footwear and sun protection. Wild deer are sometimes seen
        along the trails.`) }],
    ['Jurassic-style landscape', 'Three-bay panorama', 'Sunrise and sunset hiking', 'Steep trail, no facilities', 'Drone and landscape photography'],
    { layout: 'masonry', label: 'Gallery of Padar Island', items: [
      ['padar-aerial-panorama', 'The iconic tri-coloured bays from above', true],
      ['padar-golden-summit', 'Sunrise hike with golden tones over Padar’s ridges'],
      ['padar-pink-bay', 'Close on the pink bay'],
      ['padar-trail-hikers', 'Hikers on the steep trail'],
      ['padar-deer-hillside', 'Wildlife encounters on Padar’s trail'],
      ['padar-wide-ridges', 'Layers of nature: volcanic slopes meet turquoise seas'],
    ] },
    { line: 'Ready to climb into a postcard?', label: 'Plan your hike to Padar', href: '/experience/sunrise-hike' }),

  'kelor-island': D('Kelor Island', 'A gentle start to the Komodo journey.',
    P(`Kelor is small, uninhabited and close to Labuan Bajo, which makes it one of the most accessible
      points in the whole park. It is usually the first or the last stop of a trip, and it is a very good
      introduction to what the rest of the archipelago is going to be like.`),
    [{ h: 'A short, steep, worthwhile climb', p: P(`The hill takes 10 to 15 minutes. From the top you get a
        panorama of the surrounding islands and the coastline of Flores, which is at its most dramatic in
        early morning or late afternoon light. The trail is brief but loose underfoot, so proper shoes matter
        more than fitness here.`) },
     { h: 'In the water', p: P(`The shallows are calm and clear, well suited to swimming and first-time
        snorkelling. Coral growth is modest but sufficient for reef fish and sea stars, and baby reef
        sharks are regularly seen in the shallows. It is a gentle preview of Komodo’s more intense sites.`),
       note: 'No facilities or shelter on the island. Bring water, sun protection and non-slip shoes.' }],
    ['Easy access from Labuan Bajo', 'Short hill hike, panoramic views', 'Families and beginners', 'Snorkelling and swimming', 'Baby reef sharks', 'Ideal first or last stop'],
    { layout: 'grid', label: 'Gallery of Kelor Island', items: [
      ['kelor-aerial-beach', 'A gentle start to the Komodo journey'],
      ['kelor-hikers-ridge', 'Views worth the short climb'],
      ['kelor-summit-panorama', 'The panorama from the top'],
      ['kelor-family-snorkel', 'Swim, snorkel, or simply breathe'],
      ['kelor-boats-anchored', 'Boats anchored off the beach'],
    ] },
    { line: 'The easiest introduction to Komodo, and one of the prettiest.', label: 'Visit Kelor Island', href: '/trips' }),

  'kalong-island': D('Kalong Island', 'Nature’s nightly migration show.',
    P(`Kalong, literally Bat Island, is a small mangrove islet near Rinca. You cannot land on it, and
      you do not need to. Each evening it produces one of the most unforgettable natural performances in
      the archipelago.`),
    [{ h: 'The exodus', p: P(`As the sky turns orange and violet, tens of thousands of giant fruit bats
        (Pteropus vampyrus) lift out of the mangrove canopy and head for mainland Flores in search of fruit
        and nectar. It forms a black ribbon across the sky, accompanied by the sound of wings. It lasts
        15 to 30 minutes and it is best watched from the upper deck with a drink in hand.`) },
     { h: 'Why you cannot land', p: P(`The bats are pollinators and seed dispersers, and they regenerate
        forest across the surrounding islands. The mangrove is strictly protected and landing is not
        permitted, because a disturbed colony is a damaged ecosystem several islands wide.`) }],
    ['Sunset bat migration', 'Boat-based experience', 'Giant fruit bats', 'Mangrove conservation zone', 'No landing permitted', 'Evening itinerary highlight'],
    { layout: 'rail', label: 'Gallery of Kalong Island', items: [
      ['kalong-bats-sunset', 'Thousands take flight at golden hour', true],
      ['kalong-island-wide', 'A twilight ritual over Kalong’s mangroves'],
      ['kalong-deck-watching', 'Best seat: your boat’s upper deck'],
      ['kalong-bats-closeup', 'Bats mid-flight'],
      ['kalong-mangrove-dusk', 'The mangrove forest before the bats emerge'],
    ] },
    { line: 'Be on deck before the light goes.', label: 'Watch the sunset spectacle', href: '/open-trip/itinerary' }),

  'taka-makassar': D('Taka Makassar', 'Nature’s fleeting artwork.',
    P(`Taka Makassar is not an island. It is a crescent-shaped sandbar that surfaces at low tide in the
      middle of the park and disappears again when the water comes back. White sand with a hint of pink,
      ringed by turquoise, and only there if you time it right.`),
    [{ h: 'What you do here', p: P(`Shallow snorkelling, unhurried floating, or simply walking the length
        of it. The water is calm and clear enough for non-swimmers. The marine life is subtler than the
        major dive sites; the view from above is the reason people come, and it is a rightly famous one.`) },
     { h: 'No shade, no shelter, no exceptions', p: P(`The sandbar is completely exposed and ecologically
        fragile. There are no trees and no facilities. Bring protective clothing, water and reef-safe
        sunscreen, and expect the heat to be serious at midday. Its proximity to Manta Point makes it a
        natural pairing on most itineraries.`) }],
    ['Crescent-shaped sandbar', 'Tide-dependent', 'Shallow snorkelling', 'Drone photography', 'No shade or facilities', 'Often paired with Manta Point'],
    { layout: 'mosaic', label: 'Gallery of Taka Makassar', items: [
      ['taka-aerial-curve', 'Where the ocean draws a curve', true],
      ['taka-walkers-sand', 'Visible only when the tide allows'],
      ['taka-pink-grains', 'Pink-tinted grains close up'],
      ['taka-shallow-float', 'Floating in the shallows'],
      ['taka-high-noon', 'A sandbar in the sea of stories'],
    ] },
    { line: 'Visible only when the tide allows.', label: 'Add it to your route', href: '/open-trip/itinerary' }),

  'manta-point': D('Manta Point', 'Face-to-fin with ocean giants.',
    P(`Manta Point sits near Taka Makassar and is a cleaning station and feeding ground for reef manta
      rays. Strong plankton-rich currents draw them here throughout the year, and they are entirely
      indifferent to you, which is what makes the encounter so extraordinary.`),
    [{ h: 'Snorkel or dive', p: P(`Mantas often glide just beneath the surface, so the site is accessible to
        snorkellers with basic experience. Divers can drop deeper and watch them circle coral outcrops
        while small fish clean their bodies, an underwater ritual that is as functional as it is
        beautiful.`) },
     { h: 'Never guaranteed', p: P(`Sightings depend on current, season and tide. Guides monitor conditions
        to improve the odds, but the honest answer is that the ocean decides. Come with patience rather
        than expectation and the good days feel like a gift instead of a delivery.`) },
     { h: 'How to behave', p: P(`The site is regulated with a daily cap on boats. Avoid sudden movements,
        never touch the animals, and stay calm and horizontal in the water so you do not disrupt their
        behaviour. Let them lead; you follow.`) }],
    ['Manta ray hotspot', 'Snorkelling and diving', 'Cleaning station ecosystem', 'Current-sensitive', 'Wildlife interaction ethics', 'Near Taka Makassar'],
    { layout: 'wide', label: 'Gallery of Manta Point', items: [
      ['manta-surface-glide', 'Face-to-fin with ocean giants', true],
      ['manta-snorkellers-distance', 'Let them lead, you follow'],
      ['manta-cleaning-station', 'Where marine life cleanses and connects'],
      ['manta-cephalic-closeup', 'A ritual of stillness and flow'],
      ['manta-formation', 'Mantas in formation'],
    ] },
    { line: 'No cages. No aquariums. Just you and the ocean.', label: 'Swim with mantas', href: '/trips' }),

  'penga-island': D('Penga Island', 'Only for the bold and certified.',
    P(`Penga, or Pulau Pengah Kecil, is a secluded rocky islet in central Komodo and a deep-water dive
      site for experienced divers who want somewhere off the standard route. Its topography runs from
      steep vertical walls to broad coral plateaus.`),
    [{ h: 'Not a beginner site', p: P(`Currents here are strong and unpredictable. That rules it out for
        beginners and makes it exactly what confident divers come to Komodo for. The reward is vibrant
        coral, baby reef sharks resting under table corals, turtles, large moray eels and rich macro life
        including shrimps and nudibranchs.`) },
     { h: 'Why it stays this good', p: P(`Penga is rarely part of day tours and mostly appears on advanced
        liveaboard itineraries. The low traffic is precisely why the coral is healthy and the marine
        behaviour undisturbed, which makes it a prized site for underwater photographers.`) }],
    ['Advanced dive site', 'Steep coral walls and plateaus', 'Strong currents', 'Baby reef sharks and macro life', 'Hidden gem', 'Liveaboard access'],
    { layout: 'rail', label: 'Gallery of Penga Island', items: [
      ['penga-wall-divers', 'Vertical drama beneath the waves', true],
      ['penga-baby-shark', 'A sanctuary for rare encounters'],
      ['penga-macro-nudibranch', 'Macro life along the wall'],
      ['penga-current-school', 'Currents carve out a living cathedral'],
      ['penga-rock-surface', 'The islet from the boat'],
    ] },
    { line: 'Off the route, and all the better for it.', label: 'Book a dive expedition', href: '/experience/diving' }),

  'pink-beach': D('Pink Beach', 'Formed by nature, protected by us.',
    P(`Pantai Merah is one of very few pink beaches in the world, and the colour is biological rather
      than mineral. Millions of red-shelled Foraminifera live on the nearby reefs; when their shells
      break down and mix with white sand, the shoreline turns a pale blush, clearest at the water’s
      edge on a bright day.`),
    [{ h: 'What to do here', p: P(`The best-known pink beach sits on Komodo Island itself. It suits
        low-impact snorkelling, sunbathing and easy swimming, and just offshore there is a shallow coral
        garden full of reef fish and soft corals, an accessible underwater experience at any level.`) },
     { h: 'A fragile thing', p: P(`Both the colour of the sand and the health of the reef respond directly
        to how people behave here. Reef-safe sunscreen, no touching the coral, nothing left behind. These
        are small actions that decide whether this stays rare or stops being remarkable.`) }],
    ['Pink sand beach', 'Biogenic colour formation', 'Coral reef ecosystem', 'Beginner-friendly snorkelling', 'Conservation awareness'],
    { layout: 'grid', label: 'Gallery of Pink Beach', items: [
      ['pink-shoreline-aerial', 'A rare shoreline coloured by life itself', true],
      ['pink-sand-macro', 'Pink and white grains close up'],
      ['pink-coral-garden', 'Snorkel-friendly reefs just steps away'],
      ['pink-clownfish', 'Underwater, moments from the beach'],
      ['pink-beach-walkers', 'Responsible travel sustains natural beauty'],
    ] },
    { line: 'Step into nature’s softest shade, and help keep it that way.', label: 'Explore Pink Beach', href: '/trips' }),

  'pempeng-island': D('Pempeng Island', 'Small island. Big view.',
    P(`Pempeng, also called Penggah, is a tiny island between Siaba and Gili Lawa. It is modest in
      size and immodest in outlook: a central hill you can climb in under ten minutes delivers one of
      the best 360-degree views in the park.`),
    [{ h: 'Quiet, and that is the point', p: P(`The island is uninhabited and routinely skipped by
        mainstream tourist routes, which makes it ideal if you want scenery without an audience. Gently
        sloping hills and sparse vegetation give it a clean, cinematic profile, especially in the dry
        season, when the grass turns gold against a hard blue sky.`) },
     { h: 'Easy underfoot', p: P(`There are no steep cliffs, so the walk is safe and approachable for
        beginners and casual explorers. The open circular terrain and absence of crowds make it a
        particularly good drone site. There is no shade and no facilities, so hats, water and decent
        footwear, and most visits are short and quiet by design.`) }],
    ['360-degree hilltop view', 'Short, easy hiking', 'Drone-friendly', 'Quiet and uncrowded', 'No facilities', 'Good mid-itinerary stop'],
    { layout: 'mosaic', label: 'Gallery of Pempeng Island', items: [
      ['pempeng-summit-view', 'A quiet crown in the Komodo sea', true],
      ['pempeng-grass-hill', 'Climb, pause, and see it all'],
      ['pempeng-drone-oval', 'The island’s shape from above'],
      ['pempeng-dry-grass', 'Dry grass against a bright sky'],
      ['pempeng-lone-figure', 'Panoramas worth the pause'],
    ] },
    { line: 'Ten minutes up. The whole archipelago in every direction.', label: 'Climb to the viewpoint', href: '/open-trip/itinerary' }),

  'manjarite-island': D('Manjarite Island', 'Snorkelling starts here.',
    P(`Manjarite is 40 to 50 minutes by boat from Labuan Bajo, and its long wooden jetty reaching into
      clear water is one of the friendliest entries into Komodo’s underwater world there is.`),
    [{ h: 'Made for first-timers', p: P(`The water is calm, the current minimal and the visibility high.
        There is no need to swim far or dive deep: coral, sea stars and small reef fish are already
        visible directly below the pier. It suits children, nervous swimmers and anybody who wants to get
        comfortable with a mask before the more demanding sites.`) },
     { h: 'A working first stop', p: P(`Manjarite is not a remote island, and that is exactly its role: it
        is often the first stop of a tour, where guests find their fins and their confidence. Boats anchor
        close, and you can rest aboard or on the jetty between swims. There are no shops or facilities.`) }],
    ['Beginner snorkelling', 'Coral garden under the pier', 'Calm water, high visibility', 'Long wooden jetty', 'Close to Labuan Bajo', 'Families and students'],
    { layout: 'grid', label: 'Gallery of Manjarite', items: [
      ['manjarite-under-pier', 'Corals beneath your feet', true],
      ['manjarite-jetty-aerial', 'A jetty into a living reef'],
      ['manjarite-beginner-guide', 'Safe, calm, and colourful'],
      ['manjarite-floating-guests', 'Floating above the reef'],
      ['manjarite-gear-pier', 'Snorkel gear on the pier'],
    ] },
    { line: 'The gentlest possible introduction to the reef.', label: 'Start snorkelling at Manjarite', href: '/experience/snorkeling' }),

  'siaba-besar': D('Siaba Besar', 'Welcome to Turtle City.',
    P(`Siaba Besar earned its nickname honestly. A shallow reef plateau, gentle current, warm water and
      excellent visibility make it one of the most beginner-friendly underwater sites in the park, and
      it is full of green sea turtles.`),
    [{ h: 'Turtles, at arm’s length and eye level', p: P(`They graze the seagrass beds or rest on the reef,
        usually in just a few metres of water, which means snorkellers see exactly what divers see.
        Clownfish, lionfish and soft corals fill in around them. It is a rewarding site that asks nothing
        technical of you.`) },
     { h: 'Where people learn', p: P(`Dive schools favour Siaba for certification dives because the
        conditions are consistent and forgiving. The natural light and unbothered marine life also make it
        a strong site for underwater photography. Visits are run from boats anchored offshore; shade and
        refreshments stay aboard.`) }],
    ['Beginner snorkelling and diving', 'Sea turtle encounters', 'Calm water, no strong current', 'Popular training site', 'High-visibility reef plateau', 'Underwater photography'],
    { layout: 'masonry', label: 'Gallery of Siaba Besar', items: [
      ['siaba-turtle-closeup', 'Welcome to Turtle City', true],
      ['siaba-snorkeller-turtle', 'Gentle currents, rich encounters'],
      ['siaba-soft-coral-fish', 'A calm reef for quiet explorers'],
      ['siaba-shallow-overhead', 'The shallow plateau from above'],
      ['siaba-training-dive', 'First dive, lasting memories'],
    ] },
    { line: 'Gentle currents, rich encounters.', label: 'Swim with sea turtles', href: '/experience/snorkeling' }),

  'kanawa-island': D('Kanawa Island', 'Closer than you think, calmer than expected.',
    P(`Kanawa sits about 15 kilometres from Labuan Bajo. Technically it falls just outside the park
      boundary; in practice it has always been part of the greater Komodo experience, thanks to calm
      water, a healthy reef and an unusually peaceful beach.`),
    [{ h: 'Straight in from the beach', p: P(`Thirty to forty-five minutes by boat is all it takes. A wooden
        pier leads to white sand, and you walk into the water and start snorkelling: no tender, no
        briefing. The reefs are shallow and hold a colourful range of fish, soft corals, sea stars, and
        occasionally a small shark or an eagle ray.`) },
     { h: 'And a hill, if you want one', p: P(`A short, beginner-friendly walk gives panoramic views over
        the Flores Sea and neighbouring islets, and it is particularly good at golden hour. The island
        once had a small resort; today it functions as a natural retreat with minimal facilities, which
        most visitors consider an improvement.`) }],
    ['Easy access from Labuan Bajo', 'Snorkelling from the beach', 'Calm water, vibrant reef', 'Short hill hike', 'Minimal facilities', 'Good closing stop'],
    { layout: 'grid', label: 'Gallery of Kanawa Island', items: [
      ['kanawa-aerial-pier', 'Closer than you think, calmer than expected', true],
      ['kanawa-shore-snorkel', 'Snorkel straight from shore'],
      ['kanawa-reef-stars', 'Sea stars and soft coral in the shallows'],
      ['kanawa-hilltop-view', 'A quiet retreat off the main route'],
      ['kanawa-final-swim', 'The final swim before home'],
    ] },
    { line: 'One last swim before the harbour.', label: 'Relax at Kanawa Island', href: '/trips' }),

  'batu-bolong': D('Dive Site Batu Bolong', 'A living vertical cathedral.',
    P(`Batu Bolong, meaning hollow rock, is a cone-shaped seamount in the channel between Tatawa and Komodo
      Island. Above water it is an unremarkable rock with a hole in it. Below, it is one of the richest
      dive sites on earth.`),
    [{ h: 'A wall of colour and motion', p: P(`The submerged pinnacle carries a dense coral reef from a few
        metres below the surface down past 70 metres. A single descent can produce schools of anthias and
        fusiliers, giant trevally, napoleon wrasse, turtles, reef sharks, moray eels and endless macro
        life among the hard and soft corals.`) },
     { h: 'Not for everyone, and that is deliberate', p: P(`Powerful, shifting currents wrap the site.
        Dives run only at slack tide, navigation stays on the lee side of the rock to avoid dangerous
        downdrafts, and experienced local guides are not optional. Snorkelling is not recommended here at
        all, because the depth and current make it genuinely unsafe.`),
       note: 'Strict no-touch, no-take rules apply. Group sizes are limited and operators follow tight environmental protocols.' }],
    ['Advanced dive site', 'Vertical reef wall', 'Extreme biodiversity', 'Strong current zone', 'No snorkelling', 'Strict conservation rules'],
    { layout: 'masonry', label: 'Gallery of Batu Bolong', items: [
      ['batu-wall-fish', 'Wall of life beneath a hollow rock', true],
      ['batu-divers-descend', 'Dive deep, dive precisely'],
      ['batu-macro-moray', 'Rare species along the wall'],
      ['batu-shark-current', 'Where currents feed a thousand colours'],
      ['batu-rock-surface', 'The rock from the boat'],
    ] },
    { line: 'High stakes, high reward. Komodo’s underwater apex.', label: 'Dive Batu Bolong', href: '/experience/diving' }),

  'sebayur-kecil': D('Sebayur Kecil', 'Two depths, one reef.',
    P(`Sebayur Kecil sits just outside the core park zone and does something unusual: it works equally
      well for snorkellers and divers, on the same reef, at the same time. Calm water, healthy coral and
      easy access from Labuan Bajo make it a reliable favourite.`),
    [{ h: 'A reef that suits mixed groups', p: P(`Coral slopes fringe the island and descend gradually into
        deeper reef walls, so snorkellers enjoy the shallow gardens while divers explore below, so one boat,
        one site, two experiences. Expect schools of reef fish, soft and hard corals, occasional turtles
        and good macro life along the slopes. Coral coverage is extensive and photographs best in
        mid-morning light.`) },
     { h: 'A teaching site', p: P(`Clear visibility, moderate current and consistent conditions make Sebayur
        a favourite for dive schools. The island itself is barely developed, which gives you a quiet
        backdrop for surface intervals and shallow beach entries. There are no permanent facilities, but
        the calm anchorage makes it a natural lunch stop.`) }],
    ['Snorkelling and diving', 'Coral slopes and reef wall', 'Moderate current, high visibility', 'Dive training location', 'Beginner to intermediate', 'Quiet anchorage'],
    { layout: 'grid', label: 'Gallery of Sebayur Kecil', items: [
      ['sebayur-coral-surface', 'Colour blooms in calm waters', true],
      ['sebayur-diver-slope', 'Perfect for learning and drifting'],
      ['sebayur-snorkel-ledge', 'Float or dive, Sebayur welcomes both'],
      ['sebayur-anemone-turtle', 'Anemones, reef fish and turtles'],
      ['sebayur-island-aerial', 'The island and its reef outline'],
    ] },
    { line: 'One reef, whichever depth you prefer.', label: 'Explore Sebayur Kecil', href: '/trips' }),
};

/* ================= vessels ================= */
export const VESSELS = {
  'andalucia-1': { name: 'Andalucía I', state: 'retired', ship_id: null,
    tagline: 'The first of the line, retired from service.',
    intro: `Andalucía I carried our first guests through the Komodo archipelago and set the standard the
      rest of the fleet was built to. She is retired from charter service and kept here as part of the
      story rather than the schedule.` },
  'andalucia-2': { name: 'Andalucía II', state: 'active', ship_id: 'SHIP-ANDAL',
    tagline: 'A story carved in wood and wind.',
    intro: `Crafted in 2020 and launched in 2021, Andalucía II is a modern homage to traditional phinisi
      design: heritage shapes, contemporary comfort, and a crew of eight who have sailed these waters
      long enough to know where to be and when.` },
  'andalucia-3': { name: 'Andalucía III', state: 'soon', ship_id: null,
    tagline: 'Coming soon to the Komodo archipelago.',
    intro: `The third vessel in the Andalucía line is under preparation. Specifications, cabin plans and
      her first schedule will be published here as they are confirmed.` },
};

/* Cabin copy from the brief. Mapped onto the ship's real cabins where one exists, so the
   Room Showcase and the booking engine never disagree about what is aboard. */
export const ROOMS = [
  { key: 'vip', name: 'VIP Room', category: 'master',
    desc: `The most exclusive suite onboard, offering panoramic ocean views and timeless luxury. It
      features a private bathroom with a bathtub, custom lighting and a peaceful ambiance ideal for
      couples or special guests. A generous floor space allows for an optional extra bed on request.`,
    units: 1, location: 'Main Deck', occupancy: '2 guests (extra bed available)', amenities: 'Private bathroom, bathtub, air conditioning' },
  { key: 'ocean', name: 'Ocean View', category: 'deluxe',
    desc: `Designed for a serene and intimate experience at sea. Full ocean-facing windows and a cosy
      interior make it the right room for resting properly. Ensuite bathroom and full air conditioning.`,
    units: 2, location: 'Upper Deck', occupancy: '2 guests', amenities: 'Private bathroom, air conditioning, balcony' },
  { key: 'private', name: 'Private Room', category: 'standard',
    desc: `A cosy, quiet cabin for travellers who value privacy over a view. It does not face the ocean,
      and it carries exactly the same quality of furnishing and amenity as every other room aboard.
      Well suited to solo guests or pairs looking for value and comfort.`,
    units: 2, location: 'Lower Deck', occupancy: '2 guests', amenities: 'Private bathroom, air conditioning' },
  { key: 'sharing', name: 'Sharing Room', category: 'sharing',
    desc: `Built for groups and families. A welcoming, communal cabin with bunk-style bedding that sleeps
      up to four without giving up comfort, its own private bathroom and full air conditioning.`,
    units: 1, location: 'Lower Deck', occupancy: 'Up to 4 guests', amenities: 'Private bathroom, air conditioning' },
];

export const SPECS = [
  ['Year built', '2023', true], ['Length', '26.5 m'], ['Beam (width)', '5 m'], ['Draft', null],
  ['Guest cabins', '6 cabins: 1 VIP suite, 2 Ocean View, 2 Private, 1 Shared'],
  ['Guest bathrooms', '6 ensuite bathrooms + 1 captain’s bathroom'],
  ['Maximum guests', '18 guests'], ['Crew', '8'],
  ['Generators', '1 Colt diesel engine, dedicated to electrical systems'],
  ['Water capacity', null], ['Fuel capacity', null], ['Water maker', null], ['Compressor', null],
  ['Maximum cruising speed', null],
  ['Main engine', 'Nissan RF8, 8 cylinders, approximately 175 HP, dedicated to propulsion'],
];

export const CREW = [
  ['Captain Alimin', 'Captain', 'An experienced navigator with deep knowledge of the Komodo waters. Calm, confident and respected by his crew, Captain Alimin makes sure every voyage is guided with precision and safety.'],
  ['Kris', 'Chief Engineer', 'The quiet force behind every smooth journey. Kris keeps the heart of the vessel running and oversees all mechanical and safety systems onboard.'],
  ['Nadhy', 'Chef de Cuisine', 'Passionate about heritage and flavour, Nadhy builds every meal with a balance of warmth, creativity and comfort. Guests remember his cooking long after the voyage ends.'],
  ['Donnis', 'Guest Attendant', 'The first to greet and the last to wave goodbye. Donnis brings energy, attentiveness and a personal touch to every guest interaction.'],
  ['Ali', 'Photographer', 'Ali documents every memorable moment with an eye for storytelling and natural light. Guests leave with their trip captured properly.'],
  ['Erik', 'Onboard Guide', 'Knowledgeable, patient and professional. Erik leads treks and island visits with insight and care, keeping guests safe and better informed about the Komodo environment.'],
];

/* Full review text as supplied in the brief. The cards clamp the display to a few lines and
   the whole quote opens in the carousel, so nothing is cut from the record itself. */
export const TESTIMONIALS = [
  { name: 'Jessica Yan', country: 'China', rating: 5, date: 'June 2025', lang: 'zh',
    body: `Andalucia的工作人员都非常热情，服务态度特别好，有什么需要的都可以跟他们说。一日三餐的食物包括肉类蔬菜水果，营养丰富，吃的也不错。每天的行程之前我们会吃点面包充饥，第一个活动是去科莫多公园，从沙滩回来以后会有正式的早餐。每天的行程例如去跳岛游或者浮潜会有工作人员开着小船接送我们去景点。浮潜回来大家沐浴之后就到了午饭时间，这样悠悠闲闲的玩玩吃吃喝喝一天的时间就过去了，在船上的时间非常惬意。每次到景点摄影师会给我们拍照。在Andalucia的三天两晚很惬意。` },
  { name: 'Edward', country: '', rating: 5, date: 'July 2025', source: 'TripAdvisor',
    body: `Went to experience live-on-board with Andalucia in May 2025. Very satisfied with the experience. Clean ship and cabin, great food, nice crew. They provide one dedicated crew to document our trip with camera, GoPro and drone so you can concentrate on enjoying your trip. We visited islands with breath-taking views, trekking, saw the Komodo dragons and of course snorkelling with mantas, fishes and turtles! Weather during this month was perfect. Wished we could have spent more days on board!` },
  { name: 'Mathieu C', country: 'France', rating: 5, date: 'May 2025', source: 'TripAdvisor',
    body: `2 nights and 3 days on this beautiful boat, no complaints. My partner and I booked the cheapest room at the last minute, price incomparable with what we had been able to find earlier. Everything, but really everything was perfect from A to Z. Clean cabins, hot water, very good food, amazing spots and a discreet and very nice team. Our guide carefully ensured that we were first at every step, before all other boats landed, so we could enjoy every activity to the fullest. Many activities: snorkelling, beaches, trekking, sunset, swimming. Nothing was missing. A photographer on the team, with drone, camera and GoPro, followed us everywhere and took tons of photos. We saw many animals: manta rays, dolphins, turtles, thousands of fish of all colours, bats, baby sharks and of course Komodo dragons. My girlfriend and I may be looking for something to complain about on this cruise but really nothing to complain about. We could not give better advice!` },
  { name: 'Omar G', country: '', rating: 5, date: 'June 2025', source: 'TripAdvisor',
    body: `I think everything is beautiful and the guys they are so nice. We will do it again with the same company. Fantastic, thank you guys.` },
  { name: 'Lara &amp; Daryl', country: 'Italy', rating: 5, date: 'May 2025', source: 'TripAdvisor',
    body: `We spent 3 amazing days on Andalucia II. One of the best experiences ever made: the staff was friendly and helpful throughout the experience, they have satisfied any request like gluten-free food and it was so good. The crew involved us in many activities and created a beautiful atmosphere. All complete with photos and videos to allow us to live the experience to the maximum! Absolutely recommended.` },
  { name: 'Myah', country: 'Canada', rating: 5, date: 'June 2023', source: 'TripAdvisor',
    body: `Best times of my life. This experience was amazing! Absolutely incredible and we got to see so much marine life! The staff on the boat was 10/10, they took pictures and videos for us as well as provided amazing care and helped with anything we needed! We had such a memorable 3 days and I wish it could have been even longer.` },
  { name: 'Maria', country: 'Spain', rating: 5, date: 'July 2025', source: 'TripAdvisor',
    body: `Brutal, one of the best experiences of my life. The most alive corals I have ever seen and amazing staff. I recommend it 100%.` },
  { name: 'Beatrice', country: '', rating: 5, date: 'February 2023', source: 'TripAdvisor',
    body: `Amazing 3 days at sea. Absolutely amazing trip and crew! They also took GoPro underwater and drone footage of all of us, absolutely priceless memories. They did such a good job with the food, the guidance and the planning. Hats off to this team!` },
];

/* ================= templates ================= */
const paras = (arr) => (arr || []).map((t) => `<p>${t}</p>`).join('');

const renderSections = (sections) => (sections || []).map((s) => `
  <h2>${s.h}</h2>
  ${paras(s.p)}
  ${s.cards ? `<div class="grid g2">${s.cards.map(([t, d]) =>
    `<div class="card"><h3>${t}</h3><p class="muted">${d}</p></div>`).join('')}</div>` : ''}
  ${s.list ? `<dl class="kvlist">${s.list.map(([t, d]) =>
    `<div class="kv" style="display:block;padding:14px 0"><dt style="font-weight:600;color:var(--ink);margin-bottom:4px">${t}</dt>
     <dd style="margin:0;text-align:left;color:var(--muted)">${d}</dd></div>`).join('')}</dl>` : ''}
  ${s.links ? `<ul class="chips" style="margin-top:4px">${s.links.map(([slug, t]) =>
    `<li style="padding:0"><a href="/destination/${slug}" style="display:inline-flex;align-items:center;min-height:var(--tap);padding:0 14px">${t}</a></li>`).join('')}</ul>` : ''}
  ${s.note ? `<div class="notice warn"><p><strong>Good to know:</strong> ${s.note}</p></div>` : ''}`).join('');

/** One template for every experience blog and every destination page. */
export function renderArticle(a, { user, path, slug }) {
  const gal = a.gallery || { label: a.h1, items: [] };
  return page({
    title: a.title, user, path, wide: true, float: true,
    trail: [{ label: 'Home', href: '/' }, { label: a.crumb[0], href: a.crumb[1] }, { label: a.title }],
    hero: cine({ slug: `${slug}-hero`, alt: `${a.title}, hero photograph`, eyebrow: a.eyebrow,
      h1: a.h1, tagline: a.tagline, short: true }),
    body: `
    <section class="shellband"><div class="inner narrow">
      ${a.chips ? chips(a.chips, 'Highlights') : ''}
      <p class="lede">${(a.lede || []).join('</p><p class="lede">')}</p>
    </div></section>

    <section style="padding:64px 20px"><div class="inner narrow">
      ${renderSections(a.sections)}
      ${a.facts ? factStrip(a.facts) : ''}
      ${a.close ? `<p class="lede" style="margin-top:34px">${a.close}</p>` : ''}
    </div></section>

    ${gal.items.length ? `<section class="deepband"><div class="inner">
      <h2>${esc(gal.label)}</h2>
      ${photoStrip(gal.items.map(([s, c]) => [s, c]), gal.label)}
    </div></section>` : ''}

    ${ctaBand({ ...a.cta, slug: `${slug}-cta`, alt: '' })}`,
  });
}

/* ================= routes ================= */
export default function registerContent({ get }) {
  /* --- language switcher --- */
  get(/^\/language\/(\w+)$/, (ctx, code) => {
    if (code === 'en') return ctx.redirect('/');
    const names = { fr: 'French', cn: 'Chinese', id: 'Bahasa Indonesia' };
    if (!names[code]) return null;
    return page({ title: `${names[code]}, coming soon`, user: ctx.user,
      trail: [{ label: 'Home', href: '/' }, { label: names[code] }],
      body: `<h1>${esc(names[code])} is on the way</h1>
      <p class="lede">The site is being prepared in English, French, Chinese and Bahasa Indonesia.
      ${esc(names[code])} translations are not published yet. Everything you can read today is in English.</p>
      <div class="notice"><p>If you would rather write to us in ${esc(names[code])}, our crew reads it.
      <a href="/support">Start a conversation</a> and we will reply in the language you use.</p></div>
      <p class="actions"><a class="btn" href="/">Continue in English</a></p>` });
  });

  /* --- experiences --- */
  get(/^\/experience\/([\w-]+)$/, (ctx, slug) => {
    const a = EXPERIENCE[slug];
    return a ? renderArticle(a, { user: ctx.user, path: '/sailing', slug }) : null;
  });

  /* --- destinations --- */
  get(/^\/destination\/([\w-]+)$/, (ctx, slug) => {
    const a = DESTINATION[slug];
    return a ? renderArticle(a, { user: ctx.user, path: '/destinations', slug }) : null;
  });

  get(/^\/destinations$/, (ctx) => page({
    title: 'Destinations in the Komodo archipelago', user: ctx.user, path: '/destinations', wide: true, float: true,
    trail: [{ label: 'Home', href: '/' }, { label: 'Destinations' }],
    hero: cine({ slug: 'destinations-hero', alt: 'The Komodo archipelago from the air', short: true,
      eyebrow: 'Komodo National Park', h1: 'Fourteen places worth the crossing',
      tagline: 'Islands, sandbars, reefs and one mangrove full of bats. This is where the boat actually goes.' }),
    body: `<section style="padding:64px 20px"><div class="inner">
      <div class="tiles">${DESTINATIONS.map(([slug, name]) => `
        <figure><a href="/destination/${slug}" style="text-decoration:none;color:inherit;display:block">
          <img src="${img(`${slug}-hero`, 760, 620)}" alt="${esc(name.replace(/&amp;/g, '&'))}" loading="lazy">
          <figcaption style="color:var(--brand);font-size:16px;padding-top:10px;text-decoration:underline;text-underline-offset:.2em">${name}</figcaption>
        </a></figure>`).join('')}</div>
    </div></section>
    ${ctaBand({ line: 'Every one of these sits on a single three-day route.', label: 'See the itinerary', href: '/open-trip/itinerary', slug: 'destinations-cta' })}`,
  }));

  /* --- sailing index --- */
  get(/^\/sailing$/, (ctx) => page({
    title: 'Sailing with Andalucía', user: ctx.user, path: '/sailing', wide: true, float: true,
    trail: [{ label: 'Home', href: '/' }, { label: 'Sailing' }],
    hero: cine({ slug: 'sailing-hero', alt: 'Andalucía II under sail', short: true, eyebrow: 'The fleet and the experiences',
      h1: 'Two ways to sail Komodo', tagline: 'Take the whole ship, or take a cabin on a scheduled departure.' }),
    body: `<section style="padding:64px 20px"><div class="inner">
      <h2>Our voyage</h2>
      <div class="grid g3">${Object.entries(VESSELS).map(([slug, v]) => `<a class="card pad0" href="/sailing/${slug}">
        <img src="${img(`${slug}-hero`, 760, 460)}" alt="${esc(v.name)}" loading="lazy" style="display:block;width:100%;height:180px;object-fit:cover">
        <div style="padding:20px"><h3>${esc(v.name)}${v.state === 'retired' ? ' <span class="tag">Retired</span>' :
          v.state === 'soon' ? ' <span class="tag warn">Coming soon</span>' : ''}</h3>
        <p class="muted">${esc(v.tagline)}</p></div></a>`).join('')}</div>

      <h2>Private charter experiences</h2>
      <div class="grid g3">${EXPERIENCES.map(([slug, name]) => `<a class="card pad0" href="/experience/${slug}">
        <img src="${img(`${slug}-hero`, 760, 460)}" alt="${esc(name.replace(/&amp;/g, '&'))}" loading="lazy" style="display:block;width:100%;height:170px;object-fit:cover">
        <div style="padding:18px"><h3>${name}</h3></div></a>`).join('')}</div>

      <h2>Open trip</h2>
      <div class="grid g3">
        <a class="card" href="/open-trip/itinerary"><h3>Itinerary</h3><p class="muted">Three days, island by island.</p></a>
        <a class="card" href="/sailing/cabin-collection"><h3>Cabin collection</h3><p class="muted">Every room aboard, in detail.</p></a>
        <a class="card" href="/trips"><h3>Schedule</h3><p class="muted">Live departures and live availability.</p></a>
      </div>
    </div></section>
    ${ctaBand({ line: 'Let Andalucía accompany your journey across the sea.', label: 'Make an enquiry', href: '/support', slug: 'sailing-cta' })}`,
  }));
}
