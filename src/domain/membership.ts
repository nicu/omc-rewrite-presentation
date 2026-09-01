import type { BrandConfig } from '../brands/types';

/** Does this brand have a loyalty balance at all? Derived from what it sells,
 *  so there is no `showBalances` flag anywhere to get out of step with it. */
export const hasLoyalty = (brand: BrandConfig) =>
  brand.businessModels.some((m) => m === 'earn-burn' || m === 'tier-rewards');
