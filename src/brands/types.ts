/* ============================================================================
   WHAT A BRAND IS
   Every field is documented here, so the editor teaches you rather than a wiki.
   Everything in `overrides` is optional: a brand that overrides nothing still
   renders every page, using the shared defaults.
   ========================================================================= */

import type { Theme } from '@mui/material/styles';
import type { ComponentType } from 'react';

import type { ChoiceProps } from '../components/atoms';
import type { BusinessModelId } from '../data/model';

export type BrandId = 'atlas' | 'meridian' | 'cabana';

/**
 * The points a brand is allowed to replace. Each value is a component, not a
 * keyword — so you can click through to see what the default draws, and pass
 * your own with the same props when the theme cannot express the difference.
 *
 * This is the same idea as today's brandComponentConfig. The difference is
 * that the theme carries the visual difference, so this map should stay small.
 */
export type BrandOverrides = {
  /**
   * How the "how do you want to pay" control is drawn.
   * Shared options: `SegmentedChoice`, `ChipChoice`, `SelectChoice`.
   * Which options appear is decided by the member's context, not here.
   */
  PaymentChoice?: ComponentType<ChoiceProps<BusinessModelId>>;

  /** Strip above the header. Omit it and no strip renders. */
  MembershipBanner?: ComponentType;

  /** Extra content laid over the sign-in image. */
  SignInAside?: ComponentType;

  /** Small print at the bottom of every page. */
  FooterNote?: ComponentType;
};

export type BrandConfig = {
  id: BrandId;

  /** Shown in the header and footer. Should come from the CMS — see README. */
  name: string;
  tagline: string;
  heroImage: string;
  signInImage: string;

  /** Analytics identity. Never rebuilt at a call site. */
  analytics: { partner: string; brandKey: string };

  /** The MUI theme. This is where nearly all of the brand's look lives. */
  theme: Theme;

  /** Mirrors memberContext.membershipTierContext.businessModels[productType].
   *  In the real app this comes from the API, not from here. */
  businessModels: BusinessModelId[];
  defaultBusinessModel: BusinessModelId;

  /**
   * The account page's sections, in order. `Panel` is a region: it fetches its
   * own data when you open it, so a brand that does not list a section never
   * loads that data. A brand can also point at a component of its own.
   */
  accountSections: { id: string; label: string; Panel: ComponentType }[];

  overrides?: BrandOverrides;
};

/** Does this brand have a loyalty balance at all? Derived, not a flag. */
export const hasLoyalty = (brand: BrandConfig) =>
  brand.businessModels.some((m) => m === 'earn-burn' || m === 'tier-rewards');
