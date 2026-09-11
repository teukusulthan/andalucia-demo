// Vessel pages, the open-trip itinerary, About Us and the supporting pages the footer links to.
import { db } from './db.js';
import { page, esc, req, cine, ctaBand, photoStrip, photoTiles, factStrip, CONTACT } from './views.js';
import { img } from './media.js';
import { VESSELS, ROOMS, SPECS, CREW } from './content.js';

const all = (s, ...a) => db.prepare(s).all(...a);
const one = (s, ...a) => db.prepare(s).get(...a);

const GALLERY = [
  ['gallery-sailing', 'Under sail between the islands'],
  ['gallery-guests-deck', 'An afternoon on the upper deck'],
  ['gallery-sunset-anchor', 'At anchor as the light goes'],
  ['gallery-aerial-boat', 'Andalucía II from above'],
  ['gallery-cabin-interior', 'Inside the Ocean View cabin'],
  ['gallery-dining-crew', 'Dinner, and the crew who cooked it'],
];

/* ---------- room showcase, shared by the vessel page and /sailing/cabin-collection ---------- */
/* `level` keeps the heading rank contiguous: h3 under the vessel page's "Cabin collection" h2,
   h2 when the showcase is the page's own first section (1.3.1). */
const roomShowcase = (level = 3) => ROOMS.map((r) => `<section class="room">
  <h${level} class="roomname">${esc(r.name)}</h${level}>
  <p class="roomlead">${esc(r.desc)}</p>
  ${photoStrip([
    [`room-${r.key}-1`, `${r.name} - main view`],
    [`room-${r.key}-2`, `${r.name} - detail`],
    [`room-${r.key}-3`, `${r.name} - bathroom`],
  ], `${r.name} photographs`)}
  <dl class="roomfacts">
    <div><dt>Units</dt><dd>${r.units}</dd></div>
    <div><dt>Location</dt><dd>${esc(r.location)}</dd></div>
    <div><dt>Occupancy</dt><dd>${esc(r.occupancy)}</dd></div>
    <div><dt>Amenities</dt><dd>${esc(r.amenities)}</dd></div>
  </dl></section>`).join('');

const specTable = () => `<div class="scroll spectable"><table>
  <caption>Andalucía II - specification</caption>
  <thead><tr><th scope="col">Category</th><th scope="col">Specification</th></tr></thead>
  <tbody>${SPECS.map(([k, v, unconfirmed]) => `<tr><th scope="row">${esc(k)}</th>
    <td>${v === null ? '<span class="pending">Awaiting data</span>'
      : `${esc(v)}${unconfirmed ? ' <span class="pending">(awaiting confirmation)</span>' : ''}`}</td></tr>`).join('')}
  </tbody></table></div>`;

export default function registerPages({ get }) {
  /* ================= vessels ================= */
  get(/^\/sailing\/(andalucia-[123])$/, (ctx, slug) => {
    const v = VESSELS[slug];
    if (!v) return null;
    const ship = v.ship_id ? one(`SELECT * FROM ships WHERE id=?`, v.ship_id) : null;
    const live = v.state === 'active';
    return page({
      title: v.name, user: ctx.user, path: '/sailing', wide: true, float: true,
      trail: [{ label: 'Home', href: '/' }, { label: 'Sailing', href: '/sailing' }, { label: v.name }],
      hero: cine({ slug: `${slug}-hero`, alt: `${v.name} sailing across open water`,
        eyebrow: 'Our voyage', h1: v.name, tagline: v.tagline,
        actions: live ? `<a class="btn ghost" href="/charter">Check charter dates</a>
          <a class="btn ghost" href="/sailing/cabin-collection">Cabin collection</a>` : '' }),
      body: `
      <!-- the name returns, larger, dissolving into the deep-sea gradient (brief: opening section) -->
      <section class="deepband dissolveband">
        <p class="vesselname" aria-hidden="true">${esc(v.name)}</p>
        <div class="inner narrow center"><p class="lede" style="color:var(--mutedDeep)">${esc(v.intro)}</p>
        ${v.state === 'retired' ? '<p><span class="tag">Retired from service</span></p>' : ''}
        ${v.state === 'soon' ? '<p><span class="tag warn">Coming soon - specifications to follow</span></p>' : ''}
        </div></section>

      ${live ? `
      <section class="shellband"><div class="inner">
        <div class="center"><h2 style="margin-top:0">Cabin collection</h2>
        <p class="lede">Six cabins across three decks. Every room has a private bathroom and full air conditioning.</p></div>
        ${roomShowcase()}
      </div></section>

      <section style="padding:76px 20px"><div class="inner">
        <div class="center"><h2 style="margin-top:0">From the air, and from within</h2></div>
        <figure style="margin:0 0 10px">
          <img src="${img(`${slug}-aerial`, 1600, 760, 'sea')}" alt="${esc(v.name)} from directly above in open water"
            loading="lazy" style="display:block;width:100%;height:auto;border-radius:2px">
        </figure>
        <figure style="margin:0 0 40px">
          <img src="${img(`${slug}-deckplan`, 1600, 900, 'interior')}" alt="Deck plan of ${esc(v.name)}"
            loading="lazy" style="display:block;width:100%;height:auto;border-radius:2px">
          <figcaption class="muted" style="padding-top:12px">Deck plan. The scroll-linked transition from the
          aerial photograph into this plan is specified in the brief and is not built yet.</figcaption>
        </figure>
        ${specTable()}
      </div></section>

      <section class="deepband"><div class="inner">
        <div class="center"><h2 style="margin-top:0">Life aboard</h2>
        <p style="max-width:52ch">A glimpse into life aboard our handcrafted yacht - woven with intimacy,
        exploration and charm.</p>
        <p class="actions" style="justify-content:center;margin:0 0 34px"><a class="btn ghost" href="/gallery">View gallery →</a></p></div>
        ${photoStrip(GALLERY, 'Life aboard Andalucía II')}
      </div></section>

      ${ship ? `<section class="shellband"><div class="inner">
        <h2>Live availability${req('U04 · PC01')}</h2>
        <p class="lede">The marketing pages above describe the vessel. Everything below comes straight from
        the reservation system - the same calendar that private charter, open trips and inbound schedule
        updates all check before anything is committed.</p>
        <p class="actions"><a class="btn" href="/ship/${ship.id}">Open the ${esc(ship.name)} calendar</a>
        <a class="btn ghost" href="/charter">Search charter dates</a></p></div></section>` : ''}
      ` : ''}

      ${ctaBand({ line: 'Let Andalucía accompany your journey across the sea.',
        label: live ? 'Make an enquiry' : 'Talk to us about the fleet', href: '/support', slug: `${slug}-cta` })}`,
    });
  });

  /* ---------- cabin collection ---------- */
  get(/^\/sailing\/cabin-collection$/, (ctx) => page({
    title: 'Cabin collection aboard Andalucía II', user: ctx.user, path: '/sailing', wide: true, float: true,
    trail: [{ label: 'Home', href: '/' }, { label: 'Sailing', href: '/sailing' }, { label: 'Cabin collection' }],
    hero: cine({ slug: 'cabin-collection-hero', alt: 'The VIP room aboard Andalucía II', short: true,
      eyebrow: 'Onboard', h1: 'Cabin Collection', tagline: 'Six rooms, three decks, one private bathroom each.' }),
    body: `<section style="padding:64px 20px"><div class="inner">${roomShowcase(2)}</div></section>
    <section class="shellband"><div class="inner center">
      <h2>Ready to choose a cabin?</h2>
      <p class="lede">Open-trip departures sell by the berth or by the whole cabin, and both draw on the
      same physical capacity, so what you see is what is actually left.${req('OT02 · AT05')}</p>
      <p class="actions" style="justify-content:center"><a class="btn" href="/trips">See departures and availability</a></p>
    </div></section>
    ${ctaBand({ line: 'A story carved in wood and wind.', label: 'Make an enquiry', href: '/support', slug: 'cabin-cta' })}`,
  }));

  /* ================= open trip itinerary ================= */
  get(/^\/open-trip\/itinerary$/, (ctx) => {
    const day = (n, title, paras, gets, slug) => `<section class="room" style="border-top:1px solid var(--line)">
      <p class="eyebrow">Day ${n}</p><h2 style="margin-top:0">${title}</h2>
      ${paras.map((p) => `<p>${p}</p>`).join('')}
      <img src="${img(slug, 1400, 620)}" alt="${esc(title)}" loading="lazy"
        style="display:block;width:100%;height:auto;border-radius:2px;margin:10px 0 26px">
      <h3>What guests receive</h3>
      <ul>${gets.map((g) => `<li>${g}</li>`).join('')}</ul></section>`;
    return page({
      title: 'Open trip itinerary - three days in Komodo', user: ctx.user, path: '/sailing', wide: true, float: true,
      trail: [{ label: 'Home', href: '/' }, { label: 'Sailing', href: '/sailing' }, { label: 'Itinerary' }],
      hero: cine({ slug: 'itinerary-hero', alt: 'The open trip route through the Komodo archipelago', short: true,
        eyebrow: 'Open trip', h1: 'Three Days Through Komodo', tagline: 'Mantas, dragons, pink sand and a sky full of bats.' }),
      body: `<section style="padding:56px 20px"><div class="inner narrow">
      ${day(1, 'Arrival, mantas and sunset at Padar', [
        `We collect you from your hotel or the airport in Labuan Bajo. Once everyone is aboard and the
         welcome coconut is in your hand, we sail for the first stop.`,
        `<a href="/destination/manta-point">Manta Point</a> comes first - snorkelling alongside reef mantas
         in clear water. No cages, no aquariums. Then <a href="/destination/taka-makassar">Taka Makassar</a>,
         a sandbar in the middle of the sea, for swimming and photographs.`,
        `By late afternoon we reach <a href="/destination/padar-island">Padar Island</a>. The hike takes
         around 40 minutes and ends with three crescent beaches and the golden hills below you.`,
      ], ['Pick-up from airport or hotel', 'Welcome drink and crew introduction', 'Snorkelling with manta rays',
          'Swimming and beach time at Taka Makassar', 'Guided hike to the Padar viewpoint',
          'All meals and soft drinks aboard', 'Professional documentation throughout the day'], 'itinerary-day1')}

      ${day(2, 'Komodo dragons, Pink Beach and paddle adventures', [
        `After breakfast we begin with <a href="/experience/komodo-trekking">trekking on Komodo Island</a>,
         guided by an experienced ranger through the dragons’ own habitat.`,
        `From there to <a href="/destination/pink-beach">Pink Beach</a> to swim, sunbathe and take the
         paddleboards out straight from the shore. Then <a href="/destination/penga-island">Penga Island</a>
         for snorkelling over shallow coral, and Pempeng for a beach stop.`,
        `We close the day anchored near <a href="/destination/kalong-island">Kalong Island</a>, where tens of
         thousands of fruit bats cross the sunset sky.`,
      ], ['Guided Komodo dragon trekking with a ranger', 'Paddleboarding and beach time at Pink Beach',
          'Snorkelling at Penga Island', 'Beach swim at Pempeng', 'Sunset bat migration at Kalong Island',
          'Chef-prepared meals aboard', 'Optional stargazing from the upper deck after dinner'], 'itinerary-day2')}

      ${day(3, 'Final exploration and farewell', [
        `On the last morning we visit <a href="/destination/manjarite-island">Manjarite</a> for a calm
         snorkel and a good chance of turtles. Then <a href="/destination/kelor-island">Kelor Island</a> -
         clear water, a short hike to the hilltop, and sometimes baby sharks in the shallows.`,
        `We aim to be back at Labuan Bajo harbour around 11:00, with drop-off to your hotel or the airport
         depending on your departure.`,
      ], ['Snorkelling and swimming at Manjarite', 'Hiking and island views at Kelor',
          'Farewell breakfast and final photographs on deck', 'Drop-off to hotel or airport'], 'itinerary-day3')}
      </div></section>
      ${ctaBand({ line: 'Three days. Every island on this page.', label: 'See departures and prices',
        href: '/trips', slug: 'itinerary-cta' })}`,
    });
  });

  /* ================= about ================= */
  get(/^\/about$/, (ctx) => page({
    title: 'About Andalucía Charter', user: ctx.user, path: '/about', wide: true, float: true,
    trail: [{ label: 'Home', href: '/' }, { label: 'About Us' }],
    hero: cine({ slug: 'about-hero', alt: 'Andalucía II sailing in Komodo waters', short: true,
      eyebrow: 'About us', h1: 'Sailing with Confidence, Crafted with Care',
      tagline: 'Refined sailing in the Komodo Archipelago since 2018.' }),
    body: `<section style="padding:70px 20px"><div class="inner narrow">
      <p class="lede">Established in 2018, our charter company has grown with a clear mission: to deliver
      refined sailing experiences in the Komodo Archipelago. Andalucía II, our signature vessel, was
      crafted in 2020 and launched in 2021 as a modern homage to traditional phinisi design, built to
      combine heritage with comfort.</p>
      <p class="lede">Our team of eight trained professionals makes sure each journey is not only safe but
      exceptional in every way. Whether you join a private charter or an open trip, every moment is guided
      with precision, care and genuine hospitality.</p>
      <dl class="metrics">
        <div><dt>Guest cabins</dt><dd class="n">6</dd></div>
        <div><dt>Crew on board</dt><dd class="n">8</dd></div>
        <div><dt>Hours of experience</dt><dd class="n">10,000+</dd></div>
      </dl>
    </div></section>
    <section class="deepband"><div class="inner">
      ${photoStrip([
        ['about-aerial-sailing', 'Andalucía II under way in Komodo waters'],
        ['about-crew-service', 'The crew at work'],
        ['about-interior-salon', 'The main salon'],
        ['about-guests-sunset', 'Guests on deck at sunset'],
      ], 'Andalucía Charter')}
    </div></section>
    <section class="shellband"><div class="inner center">
      <h2>Meet the people who make it work</h2>
      <p class="lede">Eight professionals, most of whom have sailed these waters their whole working lives.</p>
      <p class="actions" style="justify-content:center"><a class="btn" href="/about/team">Our team</a>
      <a class="btn ghost" href="/about/legal">Legal information</a></p>
    </div></section>
    ${ctaBand({ line: 'Let Andalucía accompany your journey across the sea.', label: 'Make an enquiry', href: '/support', slug: 'about-cta' })}`,
  }));

  get(/^\/about\/team$/, (ctx) => page({
    title: 'Our team - the crew of Andalucía II', user: ctx.user, path: '/about', wide: true, float: true,
    trail: [{ label: 'Home', href: '/' }, { label: 'About Us', href: '/about' }, { label: 'Our team' }],
    hero: cine({ slug: 'team-hero', alt: 'The crew of Andalucía II on deck', short: true,
      eyebrow: 'About us', h1: 'Meet the Crew Behind Every Seamless Voyage',
      tagline: 'The people who make a good trip feel effortless.' }),
    body: `<section style="padding:64px 20px"><div class="inner">
      <div class="crew">${CREW.map(([name, role, bio], i) => `<figure>
        <img src="${img(`crew-${name.toLowerCase().replace(/\W+/g, '-')}`, 640, 760, 'reef')}"
          alt="${esc(name)}, ${esc(role)}" loading="lazy">
        <p class="role">${esc(role)}</p><h2 style="margin:0 0 8px;font-size:1.3rem">${esc(name)}</h2>
        <p>${esc(bio)}</p></figure>`).join('')}</div>
      <div class="notice warn" style="margin-top:40px"><p><strong>Still to come:</strong> the shore-side
      management team. The brief leaves this section open - names, roles and photographs are needed before
      launch.</p></div>
    </div></section>
    ${ctaBand({ line: 'Sail with a crew who know these waters.', label: 'Make an enquiry', href: '/support', slug: 'team-cta' })}`,
  }));

  get(/^\/about\/legal$/, (ctx) => {
    const block = (title, paras) => `<div class="card"><h2 style="margin-top:0;font-size:1.25rem">${title}</h2>
      ${paras.map((p) => `<p class="muted">${p}</p>`).join('')}</div>`;
    return page({
      title: 'Legal information and safety certification', user: ctx.user, path: '/about', wide: true, float: true,
      trail: [{ label: 'Home', href: '/' }, { label: 'About Us', href: '/about' }, { label: 'Legal information' }],
      hero: cine({ slug: 'legal-hero', alt: 'Andalucía II at anchor', short: true,
        eyebrow: 'About us', h1: 'Legal &amp; Safety Information',
        tagline: 'Registered, certified, and operating under national and park regulations.' }),
      body: `<section style="padding:64px 20px"><div class="inner">
        <p class="lede">Andalucía II is legally registered, fully certified and operates under both
        Indonesian national maritime regulation and the specific rules of Komodo National Park. The
        documents summarised below are available for guest review on request.</p>
        <div class="grid g2" style="margin-top:32px">
        ${block('Vessel certification <span class="muted" style="font-size:14px">- Legalitas Kapal</span>', [
          `The vessel holds a valid Annual Seaworthiness Certificate (<em>Pas Tahunan</em>) issued by the
           Indonesian Port Authority (KSOP - <em>Kantor Kesyahbandaran dan Otoritas Pelabuhan</em>).`,
          `Registration status, official size measurement (<em>Surat Ukur Kapal</em>) and annual inspection
           records are held onboard and at the office.`])}
        ${block('Crew training &amp; safety <span class="muted" style="font-size:14px">- Sertifikasi Kru</span>', [
          `All crew members hold Basic Safety Training certification (BST - <em>Pelatihan Dasar Keselamatan</em>).`,
          `The captain and officers hold official competency licences (SKK60 / SKK30 - <em>Surat Keterangan
           Kecakapan</em>).`,
          `Passenger insurance (<em>Asuransi Penumpang</em>) is active and valid for every voyage.`])}
        ${block('National park compliance <span class="muted" style="font-size:14px">- Izin Operasional</span>', [
          `The vessel holds the permits required to operate inside Komodo National Park
           (<em>Taman Nasional Komodo</em>).`,
          `We use authorised landing zones only and work with official park rangers
           (<em>Petugas Balai Taman Nasional</em>) at every site that requires them.`])}
        ${block('Onboard safety equipment <span class="muted" style="font-size:14px">- Fasilitas Keselamatan</span>', [
          `Life jackets (<em>jaket pelampung</em>), life rafts (<em>sekoci</em>), GPS, VHF radio and fire
           extinguishers (<em>alat pemadam api</em>) are carried as standard.`,
          `All equipment is inspected before every trip, and the inspection log is available to guests.`])}
        </div>
        <p class="actions" style="margin-top:34px"><a class="btn" href="/support">Request a copy of our permits and certifications</a></p>
        <div class="notice warn"><p><strong>For review:</strong> this page paraphrases the brief’s legal
        section. It needs sign-off from the operator, and the certificate numbers and expiry dates need to
        be supplied, before it is published.</p></div>
      </div></section>`,
    });
  });

  /* ================= supporting pages the footer links to ================= */
  const simple = (path, { title, h1, tagline, slug, lede, body = '', cta }) => get(new RegExp(`^${path}$`), (ctx) => page({
    title, user: ctx.user, path, wide: true, float: true,
    trail: [{ label: 'Home', href: '/' }, { label: h1.replace(/<[^>]+>/g, '') }],
    hero: cine({ slug, alt: title, short: true, h1, tagline, eyebrow: 'Andalucía' }),
    body: `<section style="padding:64px 20px"><div class="inner narrow">
      <p class="lede">${lede}</p>${body}</div></section>
      ${cta ? ctaBand({ ...cta, slug: `${slug}-cta` }) : ''}`,
  }));

  get(/^\/gallery$/, (ctx) => page({
    title: 'Gallery - life aboard Andalucía II', user: ctx.user, wide: true, float: true,
    trail: [{ label: 'Home', href: '/' }, { label: 'Gallery' }],
    hero: cine({ slug: 'gallery-hero', alt: 'Andalucía II at golden hour', short: true,
      eyebrow: 'Gallery', h1: 'Gallery',
      tagline: 'A glimpse into life aboard our handcrafted yacht, woven with intimacy, exploration and charm.' }),
    body: `<section style="padding:64px 20px"><div class="inner">
      ${photoTiles([...GALLERY.map(([s, c], i) => [s, c, i % 3 === 0]),
        ['gallery-snorkel-guests', 'Snorkelling off the tender', false],
        ['gallery-padar-hike', 'The climb up Padar', true],
        ['gallery-crew-galley', 'In the galley before service', false]], 'Life aboard Andalucía II')}
    </div></section>
    ${ctaBand({ line: 'Let Andalucía accompany your journey across the sea.', label: 'Make an enquiry', href: '/support', slug: 'gallery-cta' })}`,
  }));

  simple('/faq', { title: 'Frequently asked questions', h1: 'Frequently Asked Questions', slug: 'faq-hero',
    tagline: 'The things guests ask before they book.',
    lede: `We are still assembling the full list with the crew. In the meantime the fastest route to an
      answer is the chat - a real person reads it, usually within the hour.`,
    body: `<h2>Common questions we can already answer</h2>
    <dl><div class="kv"><dt>How long is the minimum private charter?</dt><dd>Three days and two nights.</dd></div>
    <div class="kv"><dt>Can I book a single berth?</dt><dd>Yes, on any open-trip departure.</dd></div>
    <div class="kv"><dt>Is dietary requirement catering possible?</dt><dd>Yes - tell us when you book.</dd></div>
    <div class="kv"><dt>How much deposit is taken?</dt><dd>30% at booking, balance 30 days before departure.</dd></div></dl>
    <div class="notice warn"><p><strong>Incomplete:</strong> the brief lists FAQ as a footer destination but
    does not supply the questions. This page needs real content from the operator.</p></div>`,
    cta: { line: 'Ask us anything.', label: 'Start a conversation', href: '/support' } });

  simple('/terms', { title: 'Terms and conditions', h1: 'Terms &amp; Conditions', slug: 'terms-hero',
    tagline: 'Booking, payment, cancellation and liability.',
    lede: `The booking rules the reservation system actually enforces are summarised below. The full legal
      terms have not been drafted yet and must be reviewed before this site goes live.`,
    body: `<h2>What the system enforces today</h2>
    <dl><div class="kv"><dt>Deposit</dt><dd>30% of the total, due to confirm a reservation.</dd></div>
    <div class="kv"><dt>Balance</dt><dd>Due 30 days before departure.</dd></div>
    <div class="kv"><dt>Hold</dt><dd>15 minutes from checkout to payment, stated before you commit.</dd></div>
    <div class="kv"><dt>Cancellation</dt><dd>Handled case by case with a recorded fee and reason.</dd></div></dl>
    <div class="notice bad"><p><strong>Not legal copy:</strong> this is a plain-language summary of system
    behaviour, not a contract. Do not publish without a drafted and reviewed set of terms.</p></div>` });

  simple('/awards', { title: 'Awards and recognition', h1: 'Awards', slug: 'awards-hero',
    tagline: 'Recognition from the travel industry.',
    lede: `Andalucía has been featured by Travass Life for authentic journeys to Indonesia, and within the
      luxury travel industry through Ker &amp; Downey.`,
    body: `<div class="grid g2" style="margin-top:26px">
      <div class="card"><h2 style="margin-top:0;font-size:1.2rem">Travass Life</h2>
      <p class="muted">Authentic Journeys to Indonesia.</p></div>
      <div class="card"><h2 style="margin-top:0;font-size:1.2rem">Ker &amp; Downey</h2>
      <p class="muted">Press recognition within the luxury travel industry.</p></div></div>
    <div class="notice warn"><p><strong>Needs detail:</strong> the brief names these two but gives no dates,
    citations or links. Supply them and this page becomes real.</p></div>` });

  simple('/press', { title: 'Press', h1: 'Press', slug: 'press-hero',
    tagline: 'Coverage, and how to reach us.',
    lede: `For press enquiries, images or interview requests, write to
      <a href="mailto:${esc(CONTACT.email)}">${esc(CONTACT.email)}</a> and we will come back to you.`,
    body: `<div class="notice warn"><p><strong>Awaiting content:</strong> press clippings and a downloadable
    media kit are listed in the brief but have not been supplied.</p></div>`,
    cta: { line: 'Writing about Komodo?', label: 'Get in touch', href: '/support' } });

  simple('/travel-resources', { title: 'Travel resources - visas and customs for Indonesia',
    h1: 'Travel Resources', slug: 'travel-hero',
    tagline: 'Visas, customs and getting to Labuan Bajo.',
    lede: `Practical information for visiting Indonesia. Requirements change, so always confirm against the
      official Directorate General of Immigration guidance before you travel.`,
    body: `<h2>Before you fly</h2>
    <dl><div class="kv"><dt>Visa</dt><dd>Most nationalities can use visa on arrival or e-VOA for tourism. Check current eligibility.</dd></div>
    <div class="kv"><dt>Passport validity</dt><dd>At least six months beyond your arrival date.</dd></div>
    <div class="kv"><dt>Customs declaration</dt><dd>Submit the electronic customs declaration on arrival.</dd></div>
    <div class="kv"><dt>Getting here</dt><dd>Fly to Komodo Airport (LBJ) in Labuan Bajo, via Jakarta, Bali or Surabaya.</dd></div>
    <div class="kv"><dt>Park fees</dt><dd>Komodo National Park entry and ranger fees are not included in your trip price.</dd></div></dl>
    <div class="notice warn"><p><strong>Verify before launch:</strong> visa and customs rules change often.
    This page needs a factual review and a dated last-checked line.</p></div>`,
    cta: { line: 'Questions about getting here?', label: 'Ask the crew', href: '/support' } });
}
