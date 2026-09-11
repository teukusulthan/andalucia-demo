// Lifts the editorial content out of the zero-dependency prototype into JSON the Next app
// consumes. Porting by import rather than by hand keeps the copy byte-identical.
import { writeFileSync, mkdirSync } from 'node:fs';

process.env.DATA_DIR ||= new URL('../data/', import.meta.url).pathname;
mkdirSync(process.env.DATA_DIR, { recursive: true });

const content = await import('../content.js');
const views = await import('../views.js');

const out = {
  experiences: content.EXPERIENCE,
  destinations: content.DESTINATION,
  vessels: content.VESSELS,
  rooms: content.ROOMS,
  specs: content.SPECS,
  crew: content.CREW,
  testimonials: content.TESTIMONIALS,
  destinationOrder: views.DESTINATIONS,
  experienceOrder: views.EXPERIENCES,
  contact: views.CONTACT,
  languages: views.LANGS,
};

const dir = new URL('../web/lib/', import.meta.url).pathname;
mkdirSync(dir, { recursive: true });
writeFileSync(`${dir}content.generated.json`, JSON.stringify(out, null, 1));

const n = (o) => Object.keys(o).length;
console.log(`experiences ${n(out.experiences)} | destinations ${n(out.destinations)} | vessels ${n(out.vessels)}`);
console.log(`rooms ${out.rooms.length} | specs ${out.specs.length} | crew ${out.crew.length} | testimonials ${out.testimonials.length}`);
