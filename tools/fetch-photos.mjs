// Sources real photography for every image slot on the site.
// Unsplash's public search endpoint, then one full-size download plus a 20px version that
// becomes the inline blur placeholder, so images fade in instead of popping.
//
//   node tools/fetch-photos.mjs            # fetch anything missing
//   node tools/fetch-photos.mjs --force    # re-fetch everything
import { mkdirSync, existsSync, writeFileSync, readFileSync } from 'node:fs';

const OUT = new URL('../web/public/photos/', import.meta.url).pathname;
const MANIFEST = new URL('../web/lib/photos.generated.json', import.meta.url).pathname;
const FORCE = process.argv.includes('--force');
mkdirSync(OUT, { recursive: true });
mkdirSync(new URL('../web/lib/', import.meta.url).pathname, { recursive: true });

/* One query per visual theme; each supplies the slots listed under it, in order. */
let GROUPS = [
  { q: 'padar island komodo', slugs: ['padar-island', 'sunrise-hike', 'sunset-hike', 'itinerary-day1'] },
  { q: 'komodo dragon', slugs: ['komodo-village', 'komodo-trekking'] },
  { q: 'komodo national park landscape', slugs: ['hero-home', 'destinations-index', 'sailing-index', 'pempeng-island'] },
  { q: 'phinisi boat indonesia', slugs: ['andalucia-2', 'andalucia-1', 'andalucia-3'] },
  { q: 'sailing boat sunset ocean', slugs: ['home-cta', 'about-hero', 'kalong-island'] },
  { q: 'labuan bajo flores', slugs: ['kelor-island', 'kanawa-island', 'travel-resources'] },
  { q: 'pink beach sand tropical', slugs: ['pink-beach', 'taka-makassar'] },
  { q: 'manta ray underwater', slugs: ['manta-point', 'snorkeling'] },
  { q: 'scuba diving coral reef', slugs: ['diving', 'batu-bolong', 'penga-island', 'sebayur-kecil'] },
  { q: 'sea turtle underwater', slugs: ['siaba-besar', 'manjarite-island'] },
  { q: 'yacht cabin interior bed', slugs: ['room-vip', 'room-ocean', 'room-private', 'room-sharing'] },
  { q: 'luxury yacht deck teak', slugs: ['cabin-collection', 'andalucia-2-aerial', 'gallery-hero'] },
  { q: 'boat crew sailing team', slugs: ['team-hero', 'crew-1', 'crew-2', 'crew-3', 'crew-4', 'crew-5', 'crew-6'] },
  { q: 'kayak paddleboard clear water', slugs: ['paddling-kayaking'] },
  { q: 'beach dinner table candlelight', slugs: ['stargazer-dinner'] },
  { q: 'night sky stars ocean', slugs: ['itinerary-day3', 'legal-hero'] },
  { q: 'snorkeling tropical fish', slugs: ['itinerary-day2', 'open-trip'] },
  { q: 'tropical island aerial drone', slugs: ['private-charter', 'membership-hero', 'faq-hero'] },
  { q: 'indonesia boat dining food', slugs: ['gallery-dining', 'newsletter-hero', 'offer-hero'] },
  { q: 'ocean horizon minimal', slugs: ['join-hero', 'terms-hero', 'press-hero', 'awards-hero'] },
  { q: 'komodo island hiking trail', slugs: ['gallery-hike', 'benefits-hero'] },
  { q: 'boat anchored turquoise bay', slugs: ['gallery-anchor', 'gallery-sailing', 'gallery-aerial'] },
  { q: 'island sunset golden hour sea', slugs: ['news-1', 'news-2', 'news-3', 'news-4'] },

  /* The brief asks for 2-3 distinct photographs per cabin in a left-right slider, so each
     room needs its own second and third frame rather than the same picture three times. */
  { q: 'luxury suite bedroom sea view window', slugs: ['room-vip-2'] },
  { q: 'bathroom bathtub luxury hotel', slugs: ['room-vip-3'] },
  { q: 'cabin bedroom porthole window boat', slugs: ['room-ocean-2'] },
  { q: 'ensuite bathroom modern shower', slugs: ['room-ocean-3', 'room-private-3'] },
  { q: 'small bedroom minimal white interior', slugs: ['room-private-2'] },
  { q: 'bunk beds cabin room wood', slugs: ['room-sharing-2'] },
  { q: 'compact bathroom sink mirror', slugs: ['room-sharing-3'] },

  /* Dive sites the brief lists that have no destination page of their own, so the diving
     article can show all ten as cards rather than as a list. */
  { q: 'reef shark school underwater', slugs: ['dive-castle-rock'] },
  { q: 'underwater current drift divers', slugs: ['dive-cauldron'] },
  { q: 'manta ray deep blue', slugs: ['dive-manta-alley'] },
  { q: 'soft coral orange reef slope', slugs: ['dive-tatawa-besar'] },
  { q: 'school of fish underwater', slugs: ['dive-crystal-rock'] },
  { q: 'coral reef blue water', slugs: ['dive-three-sisters'] },

  /* ---------------------------------------------------------------- galleries
     Every destination and experience article carries a gallery, and each slot has a written
     caption saying what it should show. Those captions are the queries below, rewritten into
     the plain nouns Unsplash actually indexes.

     Until these existed, all 104 slots fell through `photo()`'s missing-slug fallback and every
     gallery on the site rendered the same home-hero photograph five or six times over.

     Slots are grouped by subject rather than one query each: a group takes successive results
     from one search (`pool[i % pool.length]`), so related slots get *different* photographs for
     a single request, which is both more accurate and far fewer calls.
     ---------------------------------------------------------------- */

  // Komodo Village + the trekking article's village frames
  { q: 'stilt houses fishing village indonesia', slugs: ['village-stilt-houses', 'komodo-village-stilts'] },
  { q: 'indonesian village elder portrait', slugs: ['village-elder-daily'] },
  { q: 'wood carving craftsman hands', slugs: ['village-woodcarving', 'komodo-souvenir-carving'] },
  { q: 'indonesian village market stall', slugs: ['village-market'] },
  { q: 'park ranger guide briefing group', slugs: ['village-ranger-training', 'komodo-ranger-briefing'] },

  // Padar: the island's own page, plus the sunrise and sunset hike articles
  { q: 'padar island aerial three bays', slugs: ['padar-aerial-panorama', 'padar-three-bays'] },
  { q: 'island sunrise summit viewpoint', slugs: ['padar-golden-summit', 'padar-sunrise-summit'] },
  { q: 'pink sand bay aerial', slugs: ['padar-pink-bay'] },
  { q: 'hikers steep trail island ridge', slugs: ['padar-trail-hikers', 'padar-group-summit'] },
  { q: 'deer grazing dry grassland', slugs: ['padar-deer-hillside', 'komodo-deer-savannah'] },
  { q: 'volcanic ridges turquoise sea island', slugs: ['padar-wide-ridges', 'padar-golden-ridge'] },
  { q: 'tropical island aerial dawn light', slugs: ['padar-aerial-dawn'] },
  { q: 'hikers head torch before sunrise', slugs: ['padar-predawn-trail'] },
  { q: 'couple watching sunset viewpoint', slugs: ['padar-sunset-couple'] },
  { q: 'green hills tropical island wet season', slugs: ['padar-season-green'] },
  { q: 'golden dry grass hills sunset', slugs: ['padar-season-gold'] },
  { q: 'boat sailing night stars sea', slugs: ['padar-night-cruise'] },

  // Kelor
  { q: 'small tropical island beach aerial', slugs: ['kelor-aerial-beach', 'pempeng-drone-oval'] },
  { q: 'hiker on island ridge looking out', slugs: ['kelor-hikers-ridge'] },
  { q: 'panorama from island summit sea', slugs: ['kelor-summit-panorama', 'pempeng-summit-view'] },
  { q: 'family snorkeling shallow clear water', slugs: ['kelor-family-snorkel'] },
  { q: 'boats anchored off a beach', slugs: ['kelor-boats-anchored'] },

  // Kalong, the bat island
  { q: 'flying foxes bats sunset sky', slugs: ['kalong-bats-sunset', 'kalong-bats-closeup'] },
  { q: 'mangrove island twilight water', slugs: ['kalong-island-wide', 'kalong-mangrove-dusk'] },
  { q: 'boat upper deck guests sunset', slugs: ['kalong-deck-watching'] },

  // Taka Makassar, the sandbar
  { q: 'curved sandbar aerial turquoise ocean', slugs: ['taka-aerial-curve', 'taka-high-noon'] },
  { q: 'people walking on a sandbar', slugs: ['taka-walkers-sand'] },
  { q: 'pink sand grains macro close up', slugs: ['taka-pink-grains', 'pink-sand-macro'] },
  { q: 'floating in shallow turquoise water', slugs: ['taka-shallow-float', 'manjarite-floating-guests'] },

  // Manta Point
  { q: 'manta ray gliding near surface', slugs: ['manta-surface-glide', 'snorkel-manta-surface'] },
  { q: 'snorkellers watching manta ray', slugs: ['manta-snorkellers-distance'] },
  { q: 'manta ray cleaning station reef', slugs: ['manta-cleaning-station', 'dive-manta-cleaning'] },
  { q: 'manta ray close up face', slugs: ['manta-cephalic-closeup'] },
  { q: 'group of manta rays swimming', slugs: ['manta-formation'] },

  // Penga + Batu Bolong: wall and current diving
  { q: 'scuba divers along a coral wall', slugs: ['penga-wall-divers', 'dive-wall-descent', 'batu-divers-descend'] },
  { q: 'baby reef shark shallow water', slugs: ['penga-baby-shark', 'dive-reef-shark'] },
  { q: 'nudibranch macro underwater', slugs: ['penga-macro-nudibranch', 'dive-macro-nudibranch'] },
  { q: 'school of fish in current reef', slugs: ['penga-current-school', 'batu-shark-current'] },
  { q: 'rocky islet rising from the sea', slugs: ['penga-rock-surface', 'batu-rock-surface'] },
  { q: 'coral wall covered in fish', slugs: ['batu-wall-fish'] },
  { q: 'moray eel coral reef', slugs: ['batu-macro-moray'] },

  // Pink Beach
  { q: 'pink beach shoreline aerial', slugs: ['pink-shoreline-aerial'] },
  { q: 'shallow coral garden sunlight', slugs: ['pink-coral-garden', 'snorkel-coral-garden'] },
  { q: 'clownfish in anemone', slugs: ['pink-clownfish'] },
  { q: 'people walking along a beach', slugs: ['pink-beach-walkers'] },

  // Pempeng
  { q: 'grassy hill island climb', slugs: ['pempeng-grass-hill'] },
  { q: 'dry grass against bright sky', slugs: ['pempeng-dry-grass'] },
  { q: 'lone person on a hilltop panorama', slugs: ['pempeng-lone-figure'] },

  // Manjarite, the pier reef
  { q: 'coral reef beneath a wooden pier', slugs: ['manjarite-under-pier'] },
  { q: 'wooden jetty aerial over reef', slugs: ['manjarite-jetty-aerial', 'kanawa-aerial-pier'] },
  { q: 'snorkeling guide with beginner', slugs: ['manjarite-beginner-guide', 'snorkel-guest-guide'] },
  { q: 'snorkel mask and fins on a pier', slugs: ['manjarite-gear-pier'] },

  // Siaba Besar, turtles
  { q: 'green sea turtle close up', slugs: ['siaba-turtle-closeup'] },
  { q: 'snorkeller swimming with a turtle', slugs: ['siaba-snorkeller-turtle'] },
  { q: 'soft coral and reef fish calm water', slugs: ['siaba-soft-coral-fish', 'sebayur-coral-surface'] },
  { q: 'shallow reef plateau from above', slugs: ['siaba-shallow-overhead', 'sebayur-snorkel-ledge'] },
  { q: 'scuba training in shallow water', slugs: ['siaba-training-dive'] },
  { q: 'turtle feeding on seagrass', slugs: ['snorkel-turtle-seagrass', 'sebayur-anemone-turtle'] },

  // Kanawa
  { q: 'snorkeling from the shore beach', slugs: ['kanawa-shore-snorkel'] },
  { q: 'sea star starfish shallow water', slugs: ['kanawa-reef-stars'] },
  { q: 'hilltop view over a tropical island', slugs: ['kanawa-hilltop-view'] },
  { q: 'swimming in a tropical sea at dusk', slugs: ['kanawa-final-swim'] },

  // Sebayur
  { q: 'diver drifting along a coral slope', slugs: ['sebayur-diver-slope'] },
  { q: 'small island and reef outline aerial', slugs: ['sebayur-island-aerial'] },

  // Komodo trekking
  { q: 'komodo dragon walking on open ground', slugs: ['komodo-dragon-trail'] },

  // Snorkelling + diving articles
  { q: 'reef fish over hard coral', slugs: ['snorkel-reef-fish'] },
  { q: 'orange soft coral in current', slugs: ['dive-soft-coral'] },

  // Paddling and kayaking
  { q: 'paddleboard over a shallow sandbank', slugs: ['paddle-sandbank-glide', 'paddle-clear-shallows'] },
  { q: 'kayak on the coast at golden hour', slugs: ['paddle-kayak-golden'] },
  { q: 'kayaks on the beach', slugs: ['paddle-crew-setup'] },

  // Stargazer dinner
  { q: 'dinner table set on the beach at sunset', slugs: ['dinner-table-sunset'] },
  { q: 'chef plating a dish', slugs: ['dinner-chef-prep'] },
  { q: 'candlelit dinner table at night', slugs: ['dinner-candles-night'] },
  { q: 'guests toasting at a dinner table', slugs: ['dinner-guests-toast'] },

  /* Second pass. These nine queries returned nothing that cleared the filter (landscape, at
     least 1600px wide, and not Unsplash+, whose downloads carry a watermark without a paid key).
     Reworded towards commoner nouns rather than the exact caption. */
  { q: 'stilt house over water', slugs: ['village-stilt-houses', 'komodo-village-stilts'] },
  { q: 'market stall fruit vendor asia', slugs: ['village-market'] },
  { q: 'sunrise over mountain viewpoint', slugs: ['padar-golden-summit', 'padar-sunrise-summit'] },
  { q: 'manta ray swimming in the ocean', slugs: ['manta-surface-glide', 'snorkel-manta-surface', 'manta-cephalic-closeup'] },
  { q: 'scuba diver over a reef', slugs: ['sebayur-diver-slope'] },
];

/* Slots whose first result did not match the slot: the hero drew a dragon close-up, the VIP
   cabin an RV interior, private charter a surfboard. `--fix` drops these and re-queries. */
const FIXES = [
  { q: 'komodo islands aerial turquoise sea', slugs: ['hero-home'] },
  { q: 'aerial top down boat turquoise water', slugs: ['andalucia-2-aerial'] },
  { q: 'luxury hotel bedroom ocean view window', slugs: ['room-vip'] },
  // "yacht charter" returns motor superyachts; this brand sails a wooden phinisi
  { q: 'traditional wooden sailing boat indonesia', slugs: ['private-charter'] },
  { q: 'calm ocean waves minimal horizon', slugs: ['newsletter-hero'] },
  { q: 'beach sunset indonesia palm', slugs: ['offer-hero'] },
  { q: 'komodo dragon wildlife beach', slugs: ['itinerary-day2'] },
  { q: 'people snorkeling coral reef', slugs: ['open-trip'] },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const existing = existsSync(MANIFEST) && !FORCE ? JSON.parse(readFileSync(MANIFEST, 'utf8')) : {};
if (process.argv.includes('--fix')) {
  for (const f of FIXES) for (const s of f.slugs) delete existing[s];
  GROUPS.unshift(...FIXES);
}

async function search(q, n) {
  const url = `https://unsplash.com/napi/search/photos?query=${encodeURIComponent(q)}&per_page=${n + 6}&orientation=landscape`;
  // no user-agent override: a browser UA gets 307-redirected to an endpoint that needs an API key
  const res = await fetch(url, { headers: { accept: 'application/json' } });
  if (!res.ok) throw new Error(`search ${q}: HTTP ${res.status}`);
  const { results } = await res.json();
  // Landscape, big enough for a hero, and NOT Unsplash+ : premium photos download with a
  // tiled "Unsplash+" watermark across the frame unless you hold a paid API key.
  return results.filter(
    (p) => p.width >= 1600 && p.width > p.height && !p.premium && !p.plus,
  );
}

async function grab(photo, slug) {
  const base = photo.urls.raw;
  const full = `${base}&w=2000&q=76&fm=jpg&fit=max`;
  const tiny = `${base}&w=20&q=40&fm=jpg&fit=max&blur=20`;
  const [fRes, tRes] = await Promise.all([fetch(full), fetch(tiny)]);
  if (!fRes.ok || !tRes.ok) throw new Error(`download ${slug}`);
  writeFileSync(`${OUT}${slug}.jpg`, Buffer.from(await fRes.arrayBuffer()));
  const blur = `data:image/jpeg;base64,${Buffer.from(await tRes.arrayBuffer()).toString('base64')}`;
  const ratio = photo.height / photo.width;
  return {
    src: `/photos/${slug}.jpg`,
    width: 2000,
    height: Math.round(2000 * ratio),
    blurDataURL: blur,
    alt: (photo.alt_description || photo.description || '').replace(/\s+/g, ' ').trim(),
    credit: { name: photo.user.name, url: photo.user.links.html, id: photo.id },
  };
}

const manifest = { ...existing };
let added = 0, failed = [];
for (const { q, slugs } of GROUPS) {
  const todo = slugs.filter((s) => !manifest[s]);
  if (!todo.length) continue;
  try {
    const pool = await search(q, todo.length);
    for (let i = 0; i < todo.length; i++) {
      const photo = pool[i % pool.length];
      if (!photo) { failed.push(todo[i]); continue; }
      try {
        manifest[todo[i]] = await grab(photo, todo[i]);
        added++;
        process.stdout.write(`  ${todo[i]} <- ${photo.user.name}\n`);
      } catch (e) { failed.push(todo[i]); process.stdout.write(`  ! ${todo[i]} ${e.message}\n`); }
      await sleep(120);
    }
  } catch (e) { failed.push(...todo); process.stdout.write(`  ! "${q}" ${e.message}\n`); }
  await sleep(300);
}

writeFileSync(MANIFEST, JSON.stringify(manifest, null, 1));
console.log(`\n${Object.keys(manifest).length} photos in manifest (${added} new)`);
// A slug can fail under one query and then succeed under a later retry group, so report what is
// actually absent from the manifest rather than everything that ever threw.
const stillMissing = [...new Set(failed)].filter((s) => !manifest[s]);
if (stillMissing.length) console.log(`missing: ${stillMissing.join(', ')}`);
