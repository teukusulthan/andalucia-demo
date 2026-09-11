// Real photographs of Andalucía II, replacing the stock stand-ins on every slot that is meant
// to show the actual vessel. Destination and landscape slots keep their stock photography.
//
// Source: the vessel's listing on komodoluxury.com. These are the operator's own vessel and
// cabin photographs as published by a booking agency. RIGHTS ARE NOT VERIFIED HERE: confirm
// Andalucía holds or is licensed for these before the site goes live.
//
//   node tools/fetch-vessel-photos.mjs
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from 'node:fs';

const OUT = new URL('../web/public/photos/', import.meta.url).pathname;
const MANIFEST = new URL('../web/lib/photos.generated.json', import.meta.url).pathname;
const TMP = '/tmp/andalucia-src/';
mkdirSync(OUT, { recursive: true });
mkdirSync(TMP, { recursive: true });

const BASE = 'https://www.komodoluxury.com/wp-content/uploads/2025/03/';

/* slug -> [file, alt] */
const SHOTS = {
  'andalucia-2':          ['Andalucia-Exterior-Cover.webp',        'Andalucía II at anchor in Komodo waters'],
  'andalucia-1':          ['Andalucia-II-Exterior-.webp',          'Andalucía under sail'],
  'andalucia-3':          ['Andalucia-II-Exterior-2.webp',         'Andalucía seen from the bow'],
  'andalucia-2-aerial':   ['Andalucia-II-Exterior-3.webp',         'Andalucía II from astern in open water'],
  'vessel-deck':          ['Andalucia-Deck-Area-edited.webp',      'The open deck aboard Andalucía II'],
  'vessel-dining-out':    ['Andalucia-2-Outdoor-Dining-Area.webp', 'The outdoor dining area'],
  'vessel-dining-in':     ['Indoor-dining-area-Andalucia.webp',    'The indoor dining saloon'],
  'vessel-lounge':        ['outdoor-Dining-.webp',                 'Outdoor seating on the upper deck'],
  'vessel-galley':        ['Andalucia-2-Kitchen.webp',             'The galley, where every meal is cooked aboard'],

  'room-vip':             ['Andalucia-2-VIP-Room-1.webp',            'The VIP room aboard Andalucía II'],
  'room-vip-2':           ['Andalucia-VIP-Room-Cabin-2.webp',        'The VIP room, interior detail'],
  'room-vip-3':           ['Andalucia-2-VIP-Room-Balcony.webp',      'The VIP room private balcony'],
  'room-ocean':           ['Andalucia-2-Ocean-Room.webp',            'An Ocean View cabin'],
  'room-ocean-2':         ['Andalucia-2-Ocean-Room-Balcony-1.webp',  'The Ocean View cabin balcony'],
  'room-ocean-3':         ['Andalucia-2-Ocean-Room-Bathroom-1.webp', 'The Ocean View cabin bathroom'],
  'room-private':         ['Andalucia-2-Private-Room.webp',          'A Private cabin'],
  'room-private-2':       ['Andalucia-2-Private-Room-1.webp',        'The Private cabin, interior detail'],
  'room-private-3':       ['Andalucia-2-Private-Room-Bathroom.webp', 'The Private cabin bathroom'],
  'room-sharing':         ['Andalucia-2-Sharing-Room-1.webp',        'The Sharing cabin, with bunk berths'],
  'room-sharing-3':       ['Andalucia-2-Sharing-Room-Bathroom.webp', 'The Sharing cabin bathroom'],
};

/* the operator publishes two frames of the sharing cabin, not three: drop the stale third */
const DROP = ['room-sharing-2'];

const probe = (file) =>
  JSON.parse(
    execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0',
      '-show_entries', 'stream=width,height', '-of', 'json', file], { encoding: 'utf8' }),
  ).streams[0];

const manifest = existsSync(MANIFEST) ? JSON.parse(readFileSync(MANIFEST, 'utf8')) : {};
let done = 0;
const failed = [];

for (const [slug, [file, alt]] of Object.entries(SHOTS)) {
  try {
    const res = await fetch(BASE + encodeURIComponent(file));
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const src = `${TMP}${slug}.webp`;
    writeFileSync(src, Buffer.from(await res.arrayBuffer()));

    // one full-size jpg, and a 20px version that becomes the inline blur placeholder
    const dst = `${OUT}${slug}.jpg`;
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', src,
      '-vf', "scale='min(2000,iw)':-2", '-q:v', '4', dst]);
    const tiny = `${TMP}${slug}-tiny.jpg`;
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', src,
      '-vf', 'scale=20:-2', '-q:v', '12', tiny]);

    const { width, height } = probe(dst);
    manifest[slug] = {
      src: `/photos/${slug}.jpg`,
      width, height,
      blurDataURL: `data:image/jpeg;base64,${readFileSync(tiny).toString('base64')}`,
      alt,
      credit: { name: 'Andalucía Charter', url: 'https://www.komodoluxury.com/boat-charter/vip/andalucia-ii/', id: slug, vessel: true },
    };
    done++;
    process.stdout.write(`  ${slug.padEnd(20)} ${width}x${height}\n`);
  } catch (err) {
    failed.push(`${slug}: ${err.message}`);
    process.stdout.write(`  ! ${slug} ${err.message}\n`);
  }
}

for (const slug of DROP) {
  if (manifest[slug]) { delete manifest[slug]; rmSync(`${OUT}${slug}.jpg`, { force: true }); }
}

writeFileSync(MANIFEST, JSON.stringify(manifest, null, 1));
console.log(`\n${done} real Andalucía photographs in place (${Object.keys(manifest).length} slots total)`);
if (failed.length) console.log('failed:\n  ' + failed.join('\n  '));
