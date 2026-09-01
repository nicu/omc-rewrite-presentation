import { atlas } from './atlas/brand';
import { cabana } from './cabana/brand';
import { meridian } from './meridian/brand';
import type { BrandConfig, BrandId } from './types';

/** Adding a brand means adding a folder and one line here. */
export const BRANDS: Record<BrandId, BrandConfig> = { atlas, meridian, cabana };

export type { BrandConfig, BrandId, BrandOverrides } from './types';
export { hasLoyalty } from './types';
