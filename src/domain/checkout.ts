/* ============================================================================
   CHECKOUT  ·  decisions
   Which steps apply to this cart, and whether a step is finished. Both are
   questions about the booking, not about React, so they are answered here and
   the flow only reads the answer.

   Note what is *not* here: reserving a certificate, taking the money. Those
   have consequences and belong with the commands.
   ========================================================================= */

import type { BrandConfig } from '../brands/types';
import type { Cart } from '../data/model';
import type { Draft } from '../data/draft';
// Explicit extension: this file is also run directly by `node --test`,
// and Node's resolver does not guess them. Everything else here is a type,
// which is stripped before it ever needs resolving.
import { amountStillOwed, businessModelFor } from './pricing.ts';
import { billingAddressErrors } from './billing.ts';
import { contactErrors } from './travellers.ts';

/** Everything a decision is allowed to look at. Small on purpose: a rule that
 *  needs something else has to say so, and we get to see it in the diff.
 *
 *  Note the three sources. The answers live in different places for reasons
 *  that have nothing to do with the rules — the cart is what the server will
 *  accept, the draft is what it will not — and the rules below cannot tell
 *  which is which. When the API grows a way to take billing details, a field
 *  moves from `draft` to `cart` and not one of these functions changes. */
export type CheckoutContext = { cart: Cart; brand: BrandConfig; draft: Draft };

/* Both of these are the same question the step asks about what is on screen,
   asked again about what was saved. They delegate rather than restate: the
   step and the flow disagreeing about "finished" is how a URL guard sends you
   back to a step whose Continue button was enabled. */

export const contactComplete = ({ cart }: CheckoutContext): boolean =>
  contactErrors(cart.vertical, cart.contact ?? {}).length === 0;

/** No card is needed when there is nothing left to put on one.
 *
 *  A booking we cannot price is the dangerous case, and it fails towards
 *  asking: skipping the step that takes a card because a price was missing is
 *  how a booking reaches the end with no way to pay for it. */
export const requiresBilling = ({ cart, brand }: CheckoutContext): boolean => {
  const owed = amountStillOwed(cart, brand);
  return owed === undefined || owed > 0;
};

/* Two stores, one question. The card is on the cart because the server takes
   it; the billing address is in the draft because it does not. */
export const billingComplete = (ctx: CheckoutContext): boolean =>
  !requiresBilling(ctx) ||
  (Boolean(ctx.cart.paymentMethodId) && billingAddressErrors(ctx.draft.billingAddress).length === 0);

/**
 * Three things have to be true before this step is worth showing: the brand
 * sells certificates, this booking is priced in them, and the reader is
 * paying that way. Only the first used to be checked, so a reader who chose
 * to pay in full was still asked about certificates, and a flight with no
 * certificate price offered a step that could not be completed.
 */
export const offersCertificates = ({ brand, cart }: CheckoutContext): boolean =>
  brand.businessModels.includes('certificates')
  && Boolean(cart.prices.certificates)
  && businessModelFor(cart, brand) === 'certificates';
