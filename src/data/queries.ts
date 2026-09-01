/* ============================================================================
   QUERY DESCRIPTORS
   Plain objects. No React, no hooks, no components — so a region can declare
   what it needs without importing anything that renders.
   ========================================================================= */

import type { Query } from './cache';
import { api } from './mock/api';
import type {
  BusinessModelId, Booking, Certificate, Destination, Flight, Hotel, PaymentMethod, Promo, SearchCriteria, User,
} from './model';

export const destinationsQuery = (): Query<Destination[]> => ({
  key: 'destinations', tags: ['catalog'], fetch: () => api.destinations(),
});

export const promosQuery = (): Query<Promo[]> => ({
  key: 'promos', tags: ['catalog'], fetch: () => api.promos(),
});

export const featuredHotelsQuery = (): Query<Hotel[]> => ({
  key: 'hotels:featured', tags: ['catalog'], fetch: () => api.featuredHotels(),
});

export const hotelSearchQuery = (criteria: SearchCriteria): Query<Hotel[]> => ({
  key: `hotels:search:${criteria.destination}:${criteria.businessModel}:${criteria.sort}:${criteria.nights}`,
  tags: ['search'],
  fetch: () => api.searchHotels(criteria),
});

/** Note how similar this is to hotelSearchQuery — same criteria type, same
 *  shape. Adding a vertical did not need a new kind of query. */
export const flightSearchQuery = (criteria: SearchCriteria): Query<Flight[]> => ({
  key: `flights:search:${criteria.destination}:${criteria.businessModel}:${criteria.sort}`,
  tags: ['search'],
  fetch: () => api.searchFlights(criteria),
});

export const businessModelsQuery = (available: BusinessModelId[]): Query<BusinessModelId[]> => ({
  key: `businessModels:${available.join(',')}`, fetch: () => api.businessModels(available),
});

export const userQuery = (): Query<User> => ({
  key: 'user', tags: ['user'], fetch: () => api.user(),
});

export const paymentMethodsQuery = (): Query<PaymentMethod[]> => ({
  key: 'paymentMethods', tags: ['user'], fetch: () => api.paymentMethods(),
});

export const certificatesQuery = (): Query<Certificate[]> => ({
  key: 'certificates', tags: ['user'], fetch: () => api.certificates(),
});

export const bookingsQuery = (): Query<Booking[]> => ({
  key: 'bookings', tags: ['user'], fetch: () => api.bookings(),
});
