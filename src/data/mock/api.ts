/* ============================================================================
   MOCK API
   Stands in for the POST/$Type endpoints. `chaos` lets the demo force each
   failure kind so the Fault / Rejection / Validation split can be seen working.
   ========================================================================= */

import { fault, rejection } from '../../errors/failure';
import type { BusinessModelId, Flight, Hotel, Price, SearchCriteria } from '../model';
import * as db from './db';

export type Chaos = 'none' | 'fault' | 'rejection';
let chaos: Chaos = 'none';
export const setChaos = (next: Chaos) => { chaos = next; };
export const getChaos = () => chaos;

const latency = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

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
};

export const api = {
  async destinations() {
    await latency(320); maybeFail('NOT_ELIGIBLE');
    return db.destinations;
  },
  async promos() {
    await latency(260); maybeFail('NOT_ELIGIBLE');
    return db.promos;
  },
  async featuredHotels() {
    await latency(420); maybeFail('SOLD_OUT');
    return db.hotels.slice(0, 3);
  },
  async searchHotels(criteria: SearchCriteria) {
    await latency(560); maybeFail('SOLD_OUT');
    const available = db.hotels.filter((h) => h.prices[criteria.businessModel]);
    if (criteria.businessModel === 'certificates' && available.length === 0) {
      throw rejection('NO_CERTIFICATES', REJECTIONS.NO_CERTIFICATES);
    }
    return sortHotels(available, criteria);
  },
  async searchFlights(criteria: SearchCriteria) {
    await latency(500); maybeFail('SOLD_OUT');
    const available = db.flights.filter((f) => f.prices[criteria.businessModel]);
    return sortFlights(available, criteria);
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
  /** Business models available to this tenant for this vertical — mirrors
   *  memberContext.membershipTierContext.businessModels[productType]. */
  async businessModels(available: BusinessModelId[]) {
    await latency(180);
    return available;
  },
};

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
