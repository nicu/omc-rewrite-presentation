/* ============================================================================
   WHAT A BRAND IS
   Every field is documented here, so the editor teaches you rather than a wiki.
   Everything in `overrides` is optional: a brand that overrides nothing still
   renders every page, using the shared defaults.
   ========================================================================= */

import type { Theme } from '@mui/material/styles';
import type { ComponentType } from 'react';

import type { ChoiceProps } from '../components/primitives';
import type { AppShellProps, SearchLayoutProps, SignInLayoutProps } from '../components/layouts';
import type {
  DestinationCardProps, FeaturedDestinationsProps,
  FlightResultCardProps, HotelResultCardProps,
} from '../components/presenters';
import type { Flow } from '../regions/checkout/flow';
import type { LandingSection } from '../regions/landing/sections';
import type { BusinessModelId } from '../data/model';

/* The brands that exist, in the order they should be offered — cheapest first,
   which is the order the argument is made in. One hand-written line, and it
   buys three things: the `BrandId` type, an exhaustive `Record<BrandId, …>`,
   and a display order a directory listing cannot give us. */
export const BRAND_IDS = ['atlas', 'meridian', 'cabana', 'halo', 'folio', 'kiosk'] as const;

export type BrandId = (typeof BRAND_IDS)[number];

/**
 * The points a brand is allowed to replace. Each value is a component, not a
 * keyword — so you can click through to see what the default draws, and pass
 * your own with the same props when the theme cannot express the difference.
 *
 * Grouped by *area*, and the per-vertical slots kept separately under
 * `verticals`. That split is the whole point of the shape: a flat map grows
 * with verticals multiplied by replaceable things, which is exactly how the
 * live repo arrived at a 48-value ComponentType enum. Here a new vertical adds
 * one entry under `verticals` and nothing anywhere else gets longer.
 *
 * Everything is optional at every level. A brand that overrides nothing still
 * renders every page.
 */
export type BrandOverrides = {
  /**
   * The chrome around every page: where the header sits, whether there is one
   * bar or a floating one, what happens at the bottom.
   */
  chrome?: {
    /** The whole shell. The biggest slot here, and the one a brand should need least often. */
    AppShell?: ComponentType<AppShellProps>;
    /** Strip above the header. Omit it and no strip renders. */
    MembershipBanner?: ComponentType;
    /**
     * Extra things in the header's right-hand row, before the shared account
     * and sign-in buttons. A list rather than a slot for one component: a
     * brand that wants two gets two, and the order is the brand's.
     *
     * This is where a points balance, a currency picker or a "back to the
     * members site" link goes — the kind of thing that, in the app we are
     * replacing, is the whole reason a brand owns a copy of the header.
     *
     * Same shape as `accountSections` and the checkout flow: the component,
     * plus the telemetry name of the region it becomes. The name is here and
     * not inside the component because <Analytics> has to wrap from outside —
     * so this list is the only call site there is.
     */
    headerActions?: { id: string; analytics: string; Action: ComponentType }[];
    /** Small print at the bottom of every page. */
    FooterNote?: ComponentType;
  };

  /** Signing in. */
  auth?: {
    /**
     * How the sign-in page is arranged. Shared options: `SplitSignIn` (the
     * default two halves) and `CanvasSignIn` (the picture behind, the form
     * floating on it). A brand can pass one of its own — it still gets the
     * shared form, so it does not inherit responsibility for validating
     * anything or for reporting that a sign-in was attempted.
     */
    Layout?: ComponentType<SignInLayoutProps>;
    /** Extra content laid over the sign-in image. */
    Aside?: ComponentType;
  };

  /** The landing page's furniture. Which sections it has is `BrandConfig.landing`. */
  landing?: {
    /**
     * What one destination card looks like. Replace this and the section keeps
     * its grid and its stagger — the brand's cards still arrive in turn,
     * because how a section enters was never part of what a card is.
     */
    DestinationCard?: ComponentType<DestinationCardProps>;
    /**
     * The featured destinations section, whole. For a brand whose version is a
     * different thing rather than a different look — a carousel, say. Taking
     * this slot means taking responsibility for how it enters, too.
     */
    FeaturedDestinations?: ComponentType<FeaturedDestinationsProps>;
  };

  /** Any search page, whatever it is searching for. */
  search?: {
    /**
     * The shape of a search page. Supply your own and you decide where the
     * filters, the toolbar and the results sit — without touching any of the
     * components that go in them. A layout is about 25 lines of grid.
     */
    Layout?: ComponentType<SearchLayoutProps>;
  };

  /** Paying. Which steps there are is `BrandConfig.checkoutFlow`. */
  checkout?: {
    /**
     * How the "how do you want to pay" control is drawn.
     * Shared options: `SegmentedChoice`, `ChipChoice`, `SelectChoice`.
     * Which options appear is decided by the member's context, not here.
     */
    PaymentChoice?: ComponentType<ChoiceProps<BusinessModelId>>;
  };

  /**
   * Slots that exist once per vertical. This is the axis that grows, so it
   * grows sideways: adding cruises adds a `cruise` key here, and none of the
   * groups above get any longer.
   */
  verticals?: Partial<VerticalSlots>;
};

/**
 * One entry per vertical, because the props differ: a stay and a flight are
 * not drawn from the same shape. Adding a vertical adds one line.
 */
export type VerticalSlots = {
  hotel: {
    /**
     * What one stay looks like in a list of results. The biggest visual slot
     * in the app: it is on search, on landing and on the account page, and
     * every one of them keeps its own tracking because the card only offers
     * actions.
     */
    ResultCard?: ComponentType<HotelResultCardProps>;
  };
  air: {
    /** What one flight looks like in a list of results. */
    ResultCard?: ComponentType<FlightResultCardProps>;
  };
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
  accountSections: { id: string; label: string; analytics: string; Panel: ComponentType }[];

  /**
   * The checkout steps, in order. Omit it and the brand sells the usual three.
   * Adding a step is adding a line; reordering is reordering an array.
   */
  checkoutFlow?: Flow;

  /**
   * Which sections the landing page has, and in what order. A list, like the
   * checkout's steps — so a brand can reorder them, drop one, or bring its own
   * without forking the region. Omit it and the brand gets the shared page.
   */
  landing?: LandingSection[] | 'cms';

  overrides?: BrandOverrides;
};
