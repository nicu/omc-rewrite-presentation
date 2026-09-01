/* Presenters, grouped by the area of the app they draw for. PriceDisplay and
   Rating stay at the root: they belong to every area, not one of them.

   This barrel is the public face of the folder, so moving a file between areas
   never reaches a call site. */

export { PriceDisplay } from './PriceDisplay';
export { Rating } from './Rating';

export { SearchBar } from './search/SearchBar';
export { BusinessModelFilter, SearchToolbar } from './search/SearchControls';
export { HotelResultCard } from './search/HotelResultCard';
export type { HotelResultCardProps } from './search/HotelResultCard';
export { FlightResultCard } from './search/FlightResultCard';
export type { FlightResultCardProps } from './search/FlightResultCard';

export { DestinationCard } from './landing/DestinationCard';
export { DestinationGrid } from './landing/DestinationGrid';
export type { FeaturedDestinationsProps, DestinationCardProps } from './landing/DestinationGrid';
export { PromoBanner } from './landing/PromoBanner';

export { TierBadge, BalanceSummary, PaymentMethodRow, CertificateRow, BookingRow, AccountNav }
  from './account/AccountPresenters';

export { SignInForm } from './auth/SignInForm';

export { FailurePanel } from './feedback/FailurePanel';
export type { FailureSurface } from './feedback/FailurePanel';
export { ToastHost } from './feedback/ToastHost';
export { ResultListSkeleton, CardGridSkeleton, LandingSkeleton, AccountSkeleton }
  from './feedback/skeletons';
