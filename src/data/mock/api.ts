/* ============================================================================
   MOCK API
   Stands in for the POST/$Type endpoints. `chaos` lets the demo force each
   failure kind so the Fault / Rejection / Validation split can be seen working.
   ========================================================================= */

import { fault, rejection } from '../../errors/failure';
import type { BusinessModelId, Cart, Flight, Hotel, Price, SearchCriteria, SearchResult } from '../model';
import * as db from './db';

export type Chaos = 'none' | 'fault' | 'rejection';
let chaos: Chaos = 'none';
export const setChaos = (next: Chaos) => { chaos = next; };
export const getChaos = () => chaos;

/* --- how much comes back -------------------------------------------------
   A result set is not always three tidy rows, and a mock that only ever
   returns three tidy rows hides exactly the shapes that break a layout. */

export type Volume = 'normal' | 'empty' | 'single';
let volume: Volume = 'normal';
export const setVolume = (next: Volume) => { volume = next; };
export const getVolume = () => volume;

/* Separate from volume, because it is a different question. How *many* rows
   come back and how *big* each one is break different things, and a layout
   that survives sixty tidy rows can still break on one long name. */
let longContent = false;
export const setLongContent = (on: boolean) => { longContent = on; };
export const getLongContent = () => longContent;

const latency = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/* The shapes that break layouts: nothing, one, far too many, and content that
   is the right shape but the wrong size. Everything here is derived from the
   real rows, so a stress case is still a plausible page. */
const shape = <T extends { id: string; name?: string }>(rows: T[], stretch: (row: T) => T): T[] => {
  const many = volume === 'empty' ? [] : volume === 'single' ? rows.slice(0, 1) : rows;
  return longContent ? many.map(stretch) : many;
};

const LONG = 'The Grand Metropolitan Beachfront Resort, Spa, Marina & Conference Centre at Playa Larga';

const stretchHotel = (hotel: Hotel): Hotel => ({
  ...hotel,
  name: LONG,
  destination: 'An Unusually Long Destination Name, Province',
  amenities: [...hotel.amenities, 'Twenty-four hour concierge', 'Championship golf course', 'Kids club and creche'],
  rooms: hotel.rooms?.map((room) => ({
    ...room, name: `${room.name} with Terrace, Sea View and a Separate Living Area`,
  })),
});

/* --- what a list endpoint hands back -------------------------------------
   A search row is a summary of a property, not the property. The rooms and
   the long-form overview cost the server real work to assemble and no list
   has ever needed them, so no list gets them.

   Enforcing that here is what makes the details page's instant hydration an
   honest demonstration rather than a trick: the row the list hands over is
   genuinely missing the two things the details page draws a skeleton over. */
const summary = (hotel: Hotel): Hotel => {
  const row = { ...hotel };
  delete row.rooms;
  delete row.overview;
  return row;
};

/* --- searches that finish late -------------------------------------------
   A search is not one request. The first answer carries whatever came back
   quickly and a flag saying there is more; the caller asks again until the
   flag flips. This mock fills up over about two and a half seconds, keyed by
   the search itself so asking again continues rather than starting over. */
const startedAt = new Map<string, number>();
let staged = true;
export const setStaged = (on: boolean) => { staged = on; startedAt.clear(); };
export const getStaged = () => staged;

const arriving = <T>(key: string, all: T[]): SearchResult<T> => {
  if (!staged || all.length <= 1) return { items: all, total: all.length, complete: true };
  const since = Date.now() - (startedAt.get(key) ?? (startedAt.set(key, Date.now()), Date.now()));
  const shown = Math.min(all.length, 2 + Math.floor(since / 800) * 3);
  return { items: all.slice(0, shown), total: all.length, complete: shown >= all.length };
};

/* One request failing on its own. The chaos switch above fails everything at
   once, which is the wrong shape for showing what .optional() buys you: the
   interesting case is a page where one piece is missing and the rest is fine. */
let failOffers = false;
export const setFailOffers = (on: boolean) => { failOffers = on; };
export const getFailOffers = () => failOffers;

const maybeFail = (code: string) => {
  if (chaos === 'fault') throw fault('NETWORK');
  if (chaos === 'rejection') throw rejection(code, REJECTIONS[code], true);
};

/** Stands in for messages the API returns. There are no error codes in the
 *  real API, so this text is all we would have to show. */
const REJECTIONS: Record<string, string> = {
  SOLD_OUT: 'These dates just sold out. Try another date.',
  NOT_ELIGIBLE: 'This rate is not available on your membership.',
  CARD_DECLINED: 'Your card was declined. Try another payment method.',
  NO_CERTIFICATES: 'You have no unused certificates for these dates.',
  PRICE_CHANGED: 'The price changed while you were booking. Please review it.',
  AUTH_FAILED: 'Your bank did not approve this payment. Try another card.',
};

export const api = {
  async destinations() {
    await latency(320); maybeFail('NOT_ELIGIBLE');
    return db.destinations;
  },
  async promos() {
    await latency(260); maybeFail('NOT_ELIGIBLE');
    if (failOffers) throw fault('NETWORK');
    return db.promos;
  },
  async featuredHotels() {
    await latency(420); maybeFail('SOLD_OUT');
    return db.hotels.slice(0, 3).map(summary);
  },
  async searchHotels(criteria: SearchCriteria) {
    await latency(560); maybeFail('SOLD_OUT');
    const available = db.hotels.filter((h) => h.prices[criteria.businessModel]).map(summary);
    if (criteria.businessModel === 'certificates' && available.length === 0) {
      throw rejection('NO_CERTIFICATES', REJECTIONS.NO_CERTIFICATES);
    }
    const rows = shape(sortHotels(available, criteria), stretchHotel);
    return arriving(`hotels:${criteria.destination}:${criteria.businessModel}:${criteria.sort}`, rows);
  },
  /* One property, by the id someone has in their address bar.

     An id that is not a property comes back as `undefined` rather than as a
     failure. A bad address is a normal answer, not something broken: routing
     it through the failure path would put a "Try again" button on a page
     whose only possible outcome is the same answer. The region decides what
     an absent property looks like. */
  async hotel(id: string) {
    await latency(640); maybeFail('SOLD_OUT');
    const found = db.hotels.find((h) => h.id === id);
    if (!found) return undefined;
    return longContent ? stretchHotel(found) : found;
  },
  async searchFlights(criteria: SearchCriteria) {
    await latency(500); maybeFail('SOLD_OUT');
    const available = db.flights.filter((f) => f.prices[criteria.businessModel]);
    const rows = shape(sortFlights(available, criteria), (f) => ({ ...f, carrier: `${f.carrier} International Regional Connect` }));
    return arriving(`flights:${criteria.destination}:${criteria.businessModel}:${criteria.sort}`, rows);
  },
  /* Slower than our own endpoints, the way a content API usually is. */
  async landingLayout(brandId: string) {
    await latency(500); maybeFail('NOT_ELIGIBLE');
    return db.landingLayouts[brandId] ?? [];
  },
  async cart() {
    await latency(260); maybeFail('SOLD_OUT');
    return db.cart;
  },
  async updateCart(patch: Partial<Cart>) {
    await latency(340); maybeFail('PRICE_CHANGED');
    return db.patchCart(patch);
  },
  async user() {
    await latency(240); maybeFail('NOT_ELIGIBLE');
    return db.user;
  },
  async paymentMethods() {
    await latency(380); maybeFail('CARD_DECLINED');
    return db.paymentMethods;
  },
  async certificates() {
    await latency(300); maybeFail('NO_CERTIFICATES');
    return db.certificates;
  },
  async bookings() {
    await latency(440); maybeFail('SOLD_OUT');
    return db.bookings;
  },
  /** Business models available to this brand for this vertical — mirrors
   *  memberContext.membershipTierContext.businessModels[productType]. */
  async businessModels(available: BusinessModelId[]) {
    await latency(180);
    return available;
  },

  /* --- the one call with consequences -------------------------------------
     Either it is done, or the bank wants to speak to the cardholder first.
     Both are normal answers, so both are in the return type rather than one
     of them being an exception. */
  /* Nothing left to charge — a certificate covered it — so there is no card
     and no issuer. The booking still has to be made, and it is still keyed by
     the cart, so asking twice gets the first reference back rather than a
     second booking. */
  async confirm(cartId: string): Promise<Authorisation> {
    await latency(500);

    const existing = db.authorisations.get(cartId);
    if (existing) return { status: 'authorised', ...existing };

    const reference = `bk_${cartId}_1`;
    db.authorisations.set(cartId, { reference });
    return { status: 'authorised', reference };
  },

  async authorise(cartId: string, token?: string): Promise<Authorisation> {
    await latency(700); maybeFail('CARD_DECLINED');

    // Already taken. Same answer, no second charge — this is what makes it
    // safe to retry after a redirect we do not control.
    const existing = db.authorisations.get(cartId);
    if (existing) return { status: 'authorised', ...existing };

    if (!token) return { status: 'challenge', challengeId: `ch_${cartId}` };
    if (token !== EXPECTED_TOKEN) throw rejection('AUTH_FAILED', REJECTIONS.AUTH_FAILED);

    const reference = `bk_${cartId}_1`;
    db.authorisations.set(cartId, { reference });
    return { status: 'authorised', reference };
  },
};

/** What the issuer would hand back on the return URL. */
export const EXPECTED_TOKEN = 'tok_3ds_ok';

export type Authorisation =
  | { status: 'authorised'; reference: string }
  | { status: 'challenge'; challengeId: string };

/** Comparable cash value of a price, whatever business model it is expressed in. */
const comparable = (price: Price) => {
  switch (price.model) {
    case 'cash':         return price.amount;
    case 'earn-burn':    return price.amount;
    case 'tier-rewards': return price.memberAmount;
    case 'certificates': return price.certificates * 400 + price.supplement;
  }
};

const sortHotels = (hotels: Hotel[], criteria: SearchCriteria) => {
  const sorted = [...hotels];
  if (criteria.sort === 'price-low') {
    sorted.sort((a, b) => comparable(a.prices[criteria.businessModel]!) - comparable(b.prices[criteria.businessModel]!));
  }
  if (criteria.sort === 'rating') sorted.sort((a, b) => b.rating - a.rating);
  return sorted;
};

const sortFlights = (flights: Flight[], criteria: SearchCriteria) => {
  const sorted = [...flights];
  if (criteria.sort === 'price-low') {
    sorted.sort((a, b) => comparable(a.prices[criteria.businessModel]!) - comparable(b.prices[criteria.businessModel]!));
  }
  if (criteria.sort === 'duration') sorted.sort((a, b) => a.durationMinutes - b.durationMinutes);
  if (criteria.sort === 'departure') sorted.sort((a, b) => a.departs.localeCompare(b.departs));
  return sorted;
};
