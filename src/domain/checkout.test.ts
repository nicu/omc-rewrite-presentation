/* ============================================================================
   The point of moving these decisions out of components: this file needs no
   React, no DOM, no mock server and no browser. It is a table.

     node --test src/domain/*.test.ts        (Node 24 strips the types itself)
   ========================================================================= */

import { strict as assert } from 'node:assert';
import { test } from 'node:test';

import { billingComplete, contactComplete, offersCertificates, requiresBilling } from './checkout.ts';
import { amountStillOwed, businessModelFor } from './pricing.ts';
import type { BrandConfig } from '../brands/types.ts';
import type { Cart } from '../data/model.ts';
import type { Draft } from '../data/draft.ts';

/* A brand sells what it defaults to. Keeping that true here stops a test
   describing a brand that could not exist — which is what these fixtures used
   to do: they named a default the brand did not sell, and the old pricing code
   was happy to price a booking with it. */
const brand = (over: Partial<BrandConfig> = {}) => ({
  businessModels: ['cash', 'earn-burn', 'tier-rewards', 'certificates'],
  defaultBusinessModel: 'cash',
  ...over,
} as BrandConfig);

const cart = (over: Partial<Cart> = {}): Cart => ({
  id: 'c-1',
  vertical: 'hotel',
  itemName: 'Alcázar Playa Resort',
  itemDetail: '4 nights',
  prices: {
    cash:           { model: 'cash', currency: 'USD', amount: 1648 },
    'earn-burn':    { model: 'earn-burn', currency: 'USD', amount: 1648, points: 164800, pointsEarned: 8240 },
    'tier-rewards': { model: 'tier-rewards', currency: 'USD', publicAmount: 1648, memberAmount: 1319, tier: 'Gold' },
    certificates:   { model: 'certificates', currency: 'USD', certificates: 2, supplement: 0 },
  },
  ...over,
});

test('the way you are paying follows the cart, not just the brand', () => {
  const meridian = brand({ defaultBusinessModel: 'tier-rewards', businessModels: ['tier-rewards', 'certificates'] });
  assert.equal(businessModelFor(cart(), meridian), 'tier-rewards');
  assert.equal(businessModelFor(cart({ certificateId: 'x' }), meridian), 'certificates');
});

test('what is still owed on a card, per business model', () => {
  const cases: [string, BrandConfig, Cart, number | undefined][] = [
    ['cash pays the full amount',        brand(),                                          cart(),                        1648],
    ['a member rate pays less',          brand({ defaultBusinessModel: 'tier-rewards' }),  cart(),                        1319],
    ['a covering certificate pays none', brand({ defaultBusinessModel: 'tier-rewards' }),  cart({ certificateId: 'x' }),  0],
    ['a supplement is still owed',       brand({ defaultBusinessModel: 'certificates' }),  cart({
      certificateId: 'x',
      prices: { certificates: { model: 'certificates', currency: 'USD', certificates: 1, supplement: 89 } },
    }), 89],
    /* The one that used to read as zero. A flight priced in cash and miles but
       not in certificates, with a certificate somehow applied: there is no
       price to read, and saying "nothing to pay" removed the step that takes
       a card. */
    ['no price we can charge is not free', brand({ businessModels: ['certificates'] }), cart({
      certificateId: 'x',
      prices: { cash: { model: 'cash', currency: 'USD', amount: 612 } },
    }), undefined],
  ];
  for (const [name, b, c, expected] of cases) {
    assert.equal(amountStillOwed(c, b), expected, name);
  }
});

const ADDRESS: Draft = { billingAddress: { line1: '1 Example St', city: 'Lisbon', postcode: '1100' } };
/** A context, spelling out where each answer is coming from. */
const ctx = (c: Cart, b: BrandConfig, draft: Draft = {}) => ({ cart: c, brand: b, draft });

test('billing applies only when there is something left to charge', () => {
  const meridian = brand({ defaultBusinessModel: 'tier-rewards', businessModels: ['tier-rewards', 'certificates'] });
  assert.equal(requiresBilling(ctx(cart(), meridian)), true);
  assert.equal(requiresBilling(ctx(cart({ certificateId: 'x' }), meridian)), false);
});

test('a step nobody has to answer counts as answered', () => {
  const meridian = brand({ defaultBusinessModel: 'tier-rewards' });
  // No card chosen, but none is needed, so billing does not block the flow.
  assert.equal(billingComplete(ctx(cart({ certificateId: 'x' }), meridian)), true);
  // Still owed and nothing answered: it does block.
  assert.equal(billingComplete(ctx(cart(), meridian)), false);
});

/* --- which steps a booking gets ------------------------------------------- */

test('a booking with no price we can charge still asks for a card', () => {
  /* Fails towards asking. Skipping the step that takes a card because a price
     was missing is how a booking reaches the end with no way to pay for it. */
  const meridian = brand({ businessModels: ['certificates'] });
  const unpriced = cart({ prices: { cash: { model: 'cash', currency: 'USD', amount: 612 } } });
  assert.equal(requiresBilling(ctx(unpriced, meridian)), true);
});

test('the certificate step needs all three of its conditions', () => {
  const sells = brand({ businessModels: ['tier-rewards', 'certificates'], defaultBusinessModel: 'tier-rewards' });
  const paying = cart({ businessModel: 'certificates' });

  assert.equal(offersCertificates(ctx(paying, sells)), true);

  // The brand does not sell them.
  const cashOnly = brand({ businessModels: ['cash'], defaultBusinessModel: 'cash' });
  assert.equal(offersCertificates(ctx(paying, cashOnly)), false);

  // This booking has no certificate price — a flight priced only in cash.
  const noCertificatePrice = cart({
    businessModel: 'certificates',
    prices: { cash: { model: 'cash', currency: 'USD', amount: 612 } },
  });
  assert.equal(offersCertificates(ctx(noCertificatePrice, sells)), false);

  // The reader chose to pay in full, so they are not asked about certificates.
  assert.equal(offersCertificates(ctx(cart({ businessModel: 'cash' }), sells)), false);
});

test('the way the reader chose to pay beats the brand default', () => {
  const meridian = brand({ businessModels: ['tier-rewards', 'cash'], defaultBusinessModel: 'tier-rewards' });
  assert.equal(businessModelFor(cart(), meridian), 'tier-rewards');
  assert.equal(businessModelFor(cart({ businessModel: 'cash' }), meridian), 'cash');
  // …but only if this booking is priced that way.
  const noCash = cart({ businessModel: 'cash', prices: { 'tier-rewards': cart().prices['tier-rewards']! } });
  assert.equal(businessModelFor(noCash, meridian), 'tier-rewards');
});

test('billing needs both of its answers, from both of its stores', () => {
  const meridian = brand({ defaultBusinessModel: 'tier-rewards' });
  const withCard = cart({ paymentMethodId: 'pm-1' });

  // The card is on the cart, the address is in the draft. Neither is enough.
  assert.equal(billingComplete(ctx(withCard, meridian)), false, 'card but no address');
  assert.equal(billingComplete(ctx(cart(), meridian, ADDRESS)), false, 'address but no card');
  assert.equal(billingComplete(ctx(withCard, meridian, ADDRESS)), true, 'both');
});

test('a new tab keeps the cart and loses the draft, so billing reopens', () => {
  const meridian = brand({ defaultBusinessModel: 'tier-rewards' });
  // Everything answered, in the tab where it was answered.
  const answered = cart({
    contact: { firstName: 'Nicu', lastName: 'Ciocan', email: 'a@b.com' },
    paymentMethodId: 'pm-1',
  });
  assert.equal(billingComplete(ctx(answered, meridian, ADDRESS)), true);

  // Same link, new tab: sessionStorage is empty, the cart is not. The contact
  // details survive; the billing address does not, so that is where you land.
  assert.equal(contactComplete(ctx(answered, meridian)), true);
  assert.equal(billingComplete(ctx(answered, meridian)), false);
});

test('contact details are complete only when they are usable', () => {
  const b = brand();
  assert.equal(contactComplete(ctx(cart(), b)), false);
  assert.equal(contactComplete(
    ctx(cart({ contact: { firstName: 'Nicu', lastName: 'Ciocan', email: 'not-an-email' } }), b),
  ), false);
  assert.equal(contactComplete(
    ctx(cart({ contact: { firstName: 'Nicu', lastName: 'Ciocan', email: 'a@b.com' } }), b),
  ), true);
});
