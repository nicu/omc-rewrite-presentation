/* ============================================================================
   DOMAIN MODEL
   The vocabulary the old repo never had. Business model is a first-class type,
   and price is a discriminated union over it — so "how much does this cost"
   has one shape per business model instead of one component per brand.
   ========================================================================= */

export type BusinessModelId = 'cash' | 'earn-burn' | 'tier-rewards' | 'certificates';

export type BusinessModel = {
  id: BusinessModelId;
  label: string;
  /** Short line explaining the deal, shown wherever the model is chosen. */
  tagline: string;
};

export const BUSINESS_MODELS: Record<BusinessModelId, BusinessModel> = {
  'cash':          { id: 'cash',          label: 'Pay in full',     tagline: 'Standard rate, pay by card' },
  'earn-burn':     { id: 'earn-burn',     label: 'Miles',           tagline: 'Redeem miles, or earn on cash bookings' },
  'tier-rewards':  { id: 'tier-rewards',  label: 'Member rate',     tagline: 'Your tier unlocks a lower price' },
  'certificates':  { id: 'certificates',  label: 'Use certificate', tagline: 'Redeem a certificate you already own' },
};

/** One price shape per business model. Presenters switch on `model`, nothing else. */
export type Price =
  | { model: 'cash';         currency: string; amount: number }
  | { model: 'earn-burn';    currency: string; amount: number; points: number; pointsEarned: number }
  | { model: 'tier-rewards'; currency: string; publicAmount: number; memberAmount: number; tier: string }
  | { model: 'certificates'; currency: string; certificates: number; supplement: number };

export type Hotel = {
  id: string;
  name: string;
  destination: string;
  country: string;
  image: string;
  rating: number;
  reviewCount: number;
  amenities: string[];
  description: string;
  prices: Partial<Record<BusinessModelId, Price>>;
  badge?: string;
};

/** A flight. Note it shares `Price` with Hotel — the way you pay is a
 *  property of the brand, not of the vertical. */
export type Flight = {
  id: string;
  carrier: string;
  flightNumber: string;
  origin: string;
  originCode: string;
  destination: string;
  destinationCode: string;
  departs: string;
  arrives: string;
  durationMinutes: number;
  stops: number;
  cabin: 'Economy' | 'Premium' | 'Business';
  prices: Partial<Record<BusinessModelId, Price>>;
  badge?: string;
};

export type Destination = {
  id: string;
  name: string;
  country: string;
  image: string;
  propertyCount: number;
};

export type Promo = {
  id: string;
  headline: string;
  body: string;
  image: string;
  cta: string;
};

export type MembershipTier = 'Standard' | 'Silver' | 'Gold' | 'Platinum';

export type User = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  tier: MembershipTier;
  memberSince: string;
  balances: { points?: number; miles?: number };
};

export type PaymentMethod = {
  id: string;
  brand: 'visa' | 'mastercard' | 'amex';
  last4: string;
  expiry: string;
  isDefault: boolean;
};

export type Certificate = {
  id: string;
  name: string;
  expiresOn: string;
  status: 'available' | 'reserved' | 'used';
};

export type Booking = {
  id: string;
  hotelName: string;
  destination: string;
  checkIn: string;
  nights: number;
  status: 'upcoming' | 'completed' | 'cancelled';
  paidWith: string;
};

/** Shared by both verticals. Only `sort` differs in what it offers. */
export type SearchCriteria = {
  destination: string;
  checkIn: string;
  nights: number;
  guests: number;
  businessModel: BusinessModelId;
  sort: SortOption;
};

export type SortOption = 'recommended' | 'price-low' | 'rating' | 'duration' | 'departure';
