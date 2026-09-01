/* ============================================================================
   QUERY DESCRIPTORS
   Descriptions of a request, not the request. No React, no hooks, no
   components — so a region can declare what it needs without importing
   anything that renders.

   Every one goes through query(), which is what gives them .until() and
   .optional() at the call site.
   ========================================================================= */

import { query, type Query } from './cache';
import { api } from './mock/api';
import type {
  BusinessModelId, Booking, Cart, Certificate, Destination, Flight, Hotel, PaymentMethod, Promo,
  SearchCriteria, SearchResult, User,
} from './model';

export const destinationsQuery = (): Query<Destination[]> => query({
  key: 'destinations', tags: ['catalog'], fetch: () => api.destinations(),
});

export const promosQuery = (): Query<Promo[]> => query({
  key: 'promos', tags: ['catalog'], fetch: () => api.promos(),
});

export const featuredHotelsQuery = (): Query<Hotel[]> => query({
  key: 'hotels:featured', tags: ['catalog'], fetch: () => api.featuredHotels(),
});

/** The landing page's running order, from the content system rather than from
 *  config. Keyed by brand because that is how a CMS would hold it. */
export const landingLayoutQuery = (brandId: string): Query<string[]> => query({
  key: `cms:landing:${brandId}`, tags: ['cms'], fetch: () => api.landingLayout(brandId),
});

export const hotelSearchQuery = (criteria: SearchCriteria): Query<SearchResult<Hotel>> => query({
  key: `hotels:search:${criteria.destination}:${criteria.businessModel}:${criteria.sort}:${criteria.nights}`,
  tags: ['search'],
  fetch: () => api.searchHotels(criteria),
});

/**
 * One property, by id.
 *
 * `Hotel | undefined` rather than a failure for an id that is not a property:
 * the address bar is where that id came from, so an unknown one is a bad
 * address, not a broken server. The region says "not found"; nothing offers a
 * retry that could only fail the same way.
 *
 * Its key is derived here and nowhere else, which is what lets the search
 * results seed this entry on the way out: the list asks the query descriptor
 * where the answer will be looked for rather than spelling the key out again.
 */
export const hotelQuery = (id: string): Query<Hotel | undefined> => query({
  key: `hotel:${id}`, tags: ['catalog'], fetch: () => api.hotel(id),
});

/** Note how similar this is to hotelSearchQuery — same criteria type, same
 *  shape. Adding a vertical did not need a new kind of query. */
export const flightSearchQuery = (criteria: SearchCriteria): Query<SearchResult<Flight>> => query({
  key: `flights:search:${criteria.destination}:${criteria.businessModel}:${criteria.sort}`,
  tags: ['search'],
  fetch: () => api.searchFlights(criteria),
});

export const businessModelsQuery = (available: BusinessModelId[]): Query<BusinessModelId[]> => query({
  key: `businessModels:${available.join(',')}`, fetch: () => api.businessModels(available),
});

export const cartQuery = (): Query<Cart> => query({
  key: 'cart', tags: ['cart'], fetch: () => api.cart(),
});

export const userQuery = (): Query<User> => query({
  key: 'user', tags: ['user'], fetch: () => api.user(),
});

export const paymentMethodsQuery = (): Query<PaymentMethod[]> => query({
  key: 'paymentMethods', tags: ['user'], fetch: () => api.paymentMethods(),
});

export const certificatesQuery = (): Query<Certificate[]> => query({
  key: 'certificates', tags: ['user'], fetch: () => api.certificates(),
});

export const bookingsQuery = (): Query<Booking[]> => query({
  key: 'bookings', tags: ['user'], fetch: () => api.bookings(),
});
