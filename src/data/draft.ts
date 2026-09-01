/* ============================================================================
   THE DRAFT  ·  answers with nowhere else to live
   Some of what a checkout collects cannot go anywhere good:

     · not the cart — the API will not take billing details a piece at a time
     · not the URL  — an address in a URL ends up in access logs, in analytics
                      page views, and in the Referer header of every outbound
                      request the page makes

   So it goes here: sessionStorage, keyed by the cart it belongs to. That
   survives a reload, a Back, and a return from the bank. It does not survive a
   new tab, and it is gone when the tab closes — which is the point.

   Never put a card number here. With hosted payment fields it never reaches
   our JavaScript in the first place, so there is nothing to store.
   ========================================================================= */

/** Named, because the checkout step holds a half-filled one and the rule that
 *  judges it takes the same shape. */
export type BillingAddress = { line1?: string; city?: string; postcode?: string };

export type Draft = {
  billingAddress?: BillingAddress;
};

/* Keyed by cart: a different booking must not inherit these answers. */
const keyFor = (cartId: string) => `checkout.draft:${cartId}`;

export const readDraft = (cartId: string): Draft => {
  try {
    return JSON.parse(sessionStorage.getItem(keyFor(cartId)) ?? '{}') as Draft;
  } catch {
    // Private mode, storage disabled, or something else wrote nonsense here.
    // A missing draft is a state the flow already handles, so say it is empty.
    return {};
  }
};

export const writeDraft = (cartId: string, patch: Draft): void => {
  try {
    sessionStorage.setItem(keyFor(cartId), JSON.stringify({ ...readDraft(cartId), ...patch }));
  } catch {
    /* Nothing to do: the step still works, it just will not survive a reload. */
  }
};

/** Called once the booking is paid for. Nothing here should outlive it. */
export const clearDraft = (cartId: string): void => {
  try {
    sessionStorage.removeItem(keyFor(cartId));
  } catch { /* empty */ }
};
