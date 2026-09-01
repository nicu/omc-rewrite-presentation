/* ============================================================================
   PRICING  ·  derivations
   Pure functions of the model. No React, no fetch, no brand folder — just
   answers to questions the rest of the app keeps asking.

   Two of these were previously written out by hand in two regions, and the
   two copies had already started to disagree about the undefined case. That
   is the whole argument for this file.

   A booking is not priced every way the brand sells. A flight may have a cash
   and a member price and no certificate price at all, so "how is this being
   paid for" has to be answered against the booking in front of us and not
   against the brand's list. Getting that wrong is not a display bug: a way of
   paying with no price used to read as nothing left to pay, which silently
   removed the step that takes a card.
   ========================================================================= */

import type { BrandConfig } from '../brands/types';
import type { BusinessModelId, Cart, Price } from '../data/model';

/**
 * The way of paying a search is actually using. `asked` comes off the URL, so
 * it is a string someone could have typed; a brand that does not offer it gets
 * its default instead.
 *
 * It lives here rather than in the region because two things need the same
 * answer now: the region, to fetch the right prices, and the <Analytics>
 * wrapper above it, to report which way of paying the reader was looking at.
 * Two copies of this line would be two answers the moment one of them changed.
 */
export const payingWith = (brand: BrandConfig, asked?: string): BusinessModelId =>
  brand.businessModels.includes(asked as BusinessModelId)
    ? (asked as BusinessModelId)
    : brand.defaultBusinessModel;

/** The ways this particular booking can be paid for: the brand offers it, and
 *  the booking carries a price in it. Both halves are required. */
export const payableWith = (cart: Cart, brand: BrandConfig): BusinessModelId[] =>
  brand.businessModels.filter((model) => cart.prices[model]);

/**
 * How this booking is being paid for, in preference order: a certificate that
 * has been applied, then what the reader chose on the way in, then the brand's
 * default. Each is taken only if the booking is actually priced that way.
 *
 * `undefined` means the booking carries no price this brand can take. That is
 * a broken cart, and callers say so rather than treating it as free.
 */
export const businessModelFor = (cart: Cart, brand: BrandConfig): BusinessModelId | undefined => {
  const payable = payableWith(cart, brand);
  const ifPayable = (model?: BusinessModelId) =>
    model && payable.includes(model) ? model : undefined;

  return ifPayable(cart.certificateId ? 'certificates' : undefined)
    ?? ifPayable(cart.businessModel)
    ?? ifPayable(brand.defaultBusinessModel)
    ?? payable[0];
};

/** The one price out of the several this booking carries that applies here. */
export const priceFor = (cart: Cart, brand: BrandConfig): Price | undefined => {
  const model = businessModelFor(cart, brand);
  return model ? cart.prices[model] : undefined;
};

/**
 * What is still to be taken on a card, in currency. Points, certificates and
 * member discounts have already done their work by the time we ask.
 *
 * `undefined` when there is no price to read — not `0`. A booking we cannot
 * price is not a booking that costs nothing, and the difference decides
 * whether the checkout asks for a card.
 */
export const amountStillOwed = (cart: Cart, brand: BrandConfig): number | undefined => {
  const price = priceFor(cart, brand);
  if (!price) return undefined;
  switch (price.model) {
    case 'cash':         return price.amount;
    case 'earn-burn':    return price.amount;
    case 'tier-rewards': return price.memberAmount;
    case 'certificates': return price.supplement;
  }
};

/** True when the certificates cover the booking outright, supplement and all. */
export const certificateCoversTotal = (cart: Cart, brand: BrandConfig): boolean =>
  Boolean(cart.certificateId) && amountStillOwed(cart, brand) === 0;
