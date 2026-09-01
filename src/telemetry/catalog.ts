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

  /* account */
  ACCOUNT_VIEWED:           AccountPayload;
  ACCOUNT_SECTION_OPENED:   AccountPayload;
  PAYMENT_METHOD_SELECTED:  PaymentPayload;
  CERTIFICATE_APPLIED:      AccountPayload;

  /* failures — emitted automatically by useLoad, never by hand */
  OPERATION_FAILED:         FailurePayload;
};

export type EventName = keyof EventPayloadMap;
