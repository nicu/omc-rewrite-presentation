/* ============================================================================
   THE BRANDS
   Found, not listed. A brand folder is discovered by its `brand.tsx`, so
   adding one means adding a folder — not editing a file that fifty other
   brands also edit.

   `BrandId` stays hand-written: it is one line, and it is what makes
   `Record<BrandId, BrandConfig>` exhaustive and every `data-brand` selector
   spell-checked. The guard below is what pairs the two back up.
   ========================================================================= */

import { BRAND_IDS, type BrandConfig, type BrandId } from './types';

const files = import.meta.glob('./*/brand.tsx', { eager: true }) as
  Record<string, Record<string, BrandConfig>>;

const configFor = (id: BrandId): BrandConfig => {
  const module = files[`./${id}/brand.tsx`];
  if (!module) throw new Error(`No src/brands/${id}/brand.tsx — BRAND_IDS lists a brand that has no folder.`);
  /* By id rather than by "the first export", so a brand.tsx that grows a
     second export cannot silently register the wrong thing. */
  const brand = Object.values(module).find((value) => value?.id === id);
  if (!brand) throw new Error(`src/brands/${id}/brand.tsx exports no BrandConfig with id "${id}".`);
  return brand;
};

/** Keyed and ordered by BRAND_IDS, so the list is the source of truth and the
 *  folders are only where the code lives. */
export const BRANDS = Object.fromEntries(
  BRAND_IDS.map((id) => [id, configFor(id)]),
) as Record<BrandId, BrandConfig>;

export type { BrandConfig, BrandId, BrandOverrides } from './types';
export { hasLoyalty } from '../domain/membership';
