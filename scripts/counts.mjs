/* ============================================================================
   COUNTS
   Every number the deck quotes, counted from the repository.

   The slide says "counted from the repository, not estimated", and twice now a
   number has drifted because someone edited code after updating a slide. This
   is the counter, so the claim can be re-checked in a second rather than
   re-derived by hand.

       node scripts/counts.mjs

   The counting rule, kept here so it stays reproducible: a shared component is
   an exported component under src/components or src/regions, excluding the
   section-list constants, which are data. Shared lines exclude both the brand
   folders and the POC's own instruments — see INSTRUMENTS below.
   ========================================================================= */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const walk = (dir, out = []) => {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path, out);
    else out.push(path);
  }
  return out;
};

const read = (p) => readFileSync(p, 'utf8');
/* Newlines, so this agrees with `wc -l` — the deck's numbers were counted that
   way and a silent off-by-one per file is exactly the drift this exists to stop. */
const lines = (paths) => paths.reduce((n, p) => n + (read(p).match(/\n/g)?.length ?? 0), 0);

/* Constants that happen to start with a capital. `SECTIONS` is the vocabulary
   a CMS writes against — a map of components, not a component. */
const NOT_COMPONENTS = /^(LANDING|FOLIO_LANDING|KIOSK_LANDING|BRAND_IDS|SECTIONS)$/;

const componentsIn = (dir) => {
  const names = new Set();
  for (const path of walk(dir)) {
    if (extname(path) !== '.tsx') continue;
    for (const [, name] of read(path).matchAll(/^export const ([A-Z][A-Za-z0-9]*)/gm)) {
      if (!NOT_COMPONENTS.test(name)) names.add(name);
    }
  }
  return names;
};

const primitives = componentsIn('src/components/primitives');
const layouts = componentsIn('src/components/layouts');
const presenters = componentsIn('src/components/presenters');
const regions = componentsIn('src/regions');
const shared = primitives.size + layouts.size + presenters.size + regions.size;

const brandIds = [...read('src/brands/types.ts').matchAll(/'([a-z]+)'/g)]
  .map(([, id]) => id)
  .filter((id) => { try { return statSync(`src/brands/${id}`).isDirectory(); } catch { return false; } });

const brandFiles = Object.fromEntries(brandIds.map((id) => [id, walk(`src/brands/${id}`)]));
const brandComponents = brandIds.reduce(
  (n, id) => n + brandFiles[id].filter((p) => extname(p) === '.tsx')
    .reduce((m, p) => m + [...read(p).matchAll(/^export const [A-Z][A-Za-z0-9]*(?: *: *ComponentType| *= *\()/gm)].length, 0), 0);

const allFiles = walk('src').filter((p) => ['.ts', '.tsx', '.css'].includes(extname(p)));
/* "Shared" is everything that is not one brand's own folder — which includes
   src/brands/{index,types,theme}.ts, the machinery every brand runs on.

   It is not, however, the demo's own instruments. The dev panel, the event log
   and the design page are props for showing the prototype off; no brand ships
   them, and counting them as "lines shared by every brand" would overstate the
   figure the deck leans on by several hundred. They get their own line. */
const INSTRUMENTS = /src\/app\/(DevPanel|EventLog)/;
const ownedByABrand = (p) => brandIds.some((id) => p.includes(`src/brands/${id}/`));
const instrumentFiles = allFiles.filter((p) => INSTRUMENTS.test(p));
const sharedLines = lines(allFiles.filter((p) => !ownedByABrand(p) && !INSTRUMENTS.test(p)));
const brandLines = lines(brandIds.flatMap((id) => brandFiles[id]));

const slotCount = [...read('src/brands/types.ts')
  .slice(read('src/brands/types.ts').indexOf('export type BrandOverrides'),
         read('src/brands/types.ts').indexOf('export type BrandConfig'))
  /* A slot is a place a brand can put a component. Most are named for the
     component that goes in them and start with a capital; a slot that takes a
     *list* of components (headerActions) is named like a list and does not. */
  .matchAll(/^ {4}[A-Za-z][A-Za-z]*\?: *ComponentType/gm)].length;

const domain = walk('src/domain').filter((p) => p.endsWith('.ts') && !p.endsWith('.test.ts'));
const domainTests = walk('src/domain').filter((p) => p.endsWith('.test.ts'));
const useLoadCallers = walk('src').filter((p) => extname(p) === '.tsx' && read(p).includes('useLoad(')).length;
const brandCss = walk('src/tokens/brands');

const row = (label, value) => console.log(`  ${label.padEnd(34)} ${value}`);

console.log('\nSHARED COMPONENTS');
row('total', shared);
row('primitives / layouts / presenters', `${primitives.size} / ${layouts.size} / ${presenters.size}`);
row('regions and page sections', regions.size);
row('components that talk to the server', useLoadCallers);

console.log('\nBRANDS');
for (const id of brandIds) {
  row(id, `${brandFiles[id].length} files, ${lines(brandFiles[id])} lines`);
}
row('brand-owned components', brandComponents);
row('slots in BrandOverrides', slotCount);
row('brand stylesheets', `${brandCss.length} files, ${lines(brandCss)} lines`);

console.log('\nLINES');
row('shared by every brand', sharedLines.toLocaleString('en-US'));
row('across all brand folders', brandLines.toLocaleString('en-US'));
row('POC instruments (in neither)', `${instrumentFiles.length} files, ${lines(instrumentFiles).toLocaleString('en-US')} lines`);

console.log('\nBUSINESS LOGIC');
row('src/domain', `${domain.length} files, ${lines(domain)} lines`);
row('its tests', `${domainTests.length} file, ${lines(domainTests)} lines`);
console.log('');
