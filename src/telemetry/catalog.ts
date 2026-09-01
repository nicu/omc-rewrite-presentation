/* ============================================================================
   EVENT CATALOG
   Mirrors the shape of Frontend/src/analytics/posthog/catalog/posthogEventCatalog.ts.
   Semantic, domain-shaped names with one payload type per event. Components
   reference these names; only adapters know what a destination calls them.
   ========================================================================= */

/* --- payload shapes ----------------------------------------------------- */

export type ProductPayload = {
  productId: string;
  productName?: string;
  price?: number;
  currency?: string;
};

export type ProductListPayload = ProductPayload & {
  position?: number;
  listId?: string;
};

export type ProductDetailPayload = ProductPayload & {
  section?: string;
};

export type ProductScrollPayload = ProductPayload & {
  scrollDepth: number;
};

export type SearchPayload = {
  vertical: string;
  destination?: string;
  resultCount?: number;
};

export type SearchRefinePayload = {
  vertical: string;
  value: string;
};

export type BusinessModelPayload = {
  vertical: string;
  from?: string;
  to: string;
};

export type AccountPayload = {
  section: string;
};

export type StepPayload = {
  /** The step id, e.g. `billing`. The funnel falls out of these. */
  step: string;
};

export type AuthPayload = {
  method: 'password' | 'sso' | 'magic-link';
};

export type PaymentPayload = {
  method: string;
  amount?: number;
};

export type FailurePayload = {
  kind: 'fault' | 'rejection' | 'validation';
  code: string;
  region?: string;
  retryable?: boolean;
};

export type EmptyPayload = Record<string, never>;

/* --- engineering health -------------------------------------------------
   Not product behaviour: how long things took and whether they worked. */

export type RequestPayload = {
  /** The query key, e.g. `flights:search:…`. Stands in for a dependency name. */
  name: string;
  ms: number;
  ok: boolean;
};

export type PageReadyPayload = {
  /** How long the whole region waited before it could render. */
  ms: number;
  requests: number;
};

/* --- the catalog -------------------------------------------------------- */

export type EventPayloadMap = {
  /* search */
  SEARCH_PERFORMED:         SearchPayload;
  SEARCH_RESULTS_VIEWED:    SearchPayload;
  SEARCH_SORTED:            SearchRefinePayload;
  SEARCH_BIZMODEL_CHANGED:  BusinessModelPayload;

  /* product */
  PRODUCT_VIEWED:           ProductListPayload;
  PRODUCT_SELECTED:         ProductListPayload;
  PRODUCT_EXPANDED:         ProductPayload;
  PRODUCT_INFO_REQUESTED:   ProductDetailPayload;
  PRODUCT_CONTENT_SCROLLED: ProductScrollPayload;

  /* landing */
  LANDING_VIEWED:           EmptyPayload;
  PROMO_VIEWED:             ProductListPayload;
  PROMO_SELECTED:           ProductListPayload;
  DESTINATION_SELECTED:     SearchRefinePayload;

  /* auth */
  SIGN_IN_VIEWED:           EmptyPayload;
  SIGN_IN_SUBMITTED:        AuthPayload;
  SIGN_IN_SUCCEEDED:        AuthPayload;
  SIGN_UP_REQUESTED:        EmptyPayload;
  PASSWORD_RESET_REQUESTED: EmptyPayload;

  /* checkout — one funnel step per region, so the funnel needs no wiring */
  CHECKOUT_STEP_VIEWED:     StepPayload;
  CHECKOUT_STEP_COMPLETED:  StepPayload;
  /** The bank interrupted us. Worth a name: it is the commonest place a
   *  booking is abandoned, and nobody can see it unless we say it happened. */
  PAYMENT_CHALLENGED:       StepPayload;
  CHECKOUT_COMPLETED:       StepPayload;

  /* account */
  ACCOUNT_VIEWED:           AccountPayload;
  ACCOUNT_SECTION_OPENED:   AccountPayload;
  PAYMENT_METHOD_SELECTED:  PaymentPayload;
  CERTIFICATE_APPLIED:      AccountPayload;

  /* failures — emitted automatically by useLoad, never by hand */
  OPERATION_FAILED:         FailurePayload;

  /* engineering health — also automatic, and routed differently below */
  REQUEST_COMPLETED:        RequestPayload;
  PAGE_READY:               PageReadyPayload;
};

export type EventName = keyof EventPayloadMap;

/* ============================================================================
   ROUTING
   Which destinations an event belongs to. Anything not listed goes to all of
   them, which is what happens today.

   This table is the whole of the "should App Insights carry product
   analytics?" argument: it is one file, not 58 call sites. Move an event
   between destinations by editing a line here.
   ========================================================================= */

export type Destination = 'appInsights' | 'posthog' | 'gtm';

export const DESTINATIONS: Partial<Record<EventName, Destination[]>> = {
  // Timings and request outcomes are engineering health. Product tools do not
  // want them, and they are most of what makes an analytics bill large.
  REQUEST_COMPLETED: ['appInsights'],
  PAGE_READY: ['appInsights'],
};
