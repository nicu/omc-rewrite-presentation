/* ============================================================================
   DOMAIN MODEL
   The vocabulary the old repo never had. Business model is a first-class type,
   and price is a discriminated union over it — so "how much does this cost"
   has one shape per business model instead of one component per brand.
   ========================================================================= */

export type BusinessModelId = 'cash' | 'earn-burn' | 'tier-rewards' | 'certificates';

/** The kinds of thing you can book. Two of roughly twenty are built. */
export type Vertical = 'hotel' | 'air';

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

/** One bookable room type inside a property. It carries the same `Price`
 *  union as the property itself — how you pay is the brand's decision, not
 *  something that changes as you go deeper into the catalogue. */
export type Room = {
  id: string;
  name: string;
  description: string;
  prices: Partial<Record<BusinessModelId, Price>>;
};

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

  /* The two fields a list does not carry. A search row is a summary: the
     rooms and the long-form overview only come back when you ask for one
     property by id. They are optional because that absence is real, and it is
     what lets the details page tell what it already knows from the row it was
     handed apart from what it is still waiting for. */
  overview?: string;
  rooms?: Room[];
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

/**
 * What a search answers with. Not just the rows: how many there are in total,
 * and whether the server has finished looking.
 *
 * The last field is the one that matters. Availability is gathered from a
 * dozen suppliers at different speeds, so the first response is rarely all of
 * it — the server says "here is what I have, ask again". Modelling that here
 * means the client can show what arrived instead of a spinner, and nobody has
 * to hand-roll a polling loop per vertical.
 */
export type SearchResult<T> = {
  items: T[];
  total: number;
  complete: boolean;
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

/** The half-finished order. It lives on the server, so every step reads and
 *  writes the same thing and a refresh loses nothing. */
/**
 * Who is travelling, and where the confirmation goes.
 *
 * Every field is optional because this is filled in a piece at a time — the
 * form holds a half-answered one, and so does a cart that has been through
 * the details step once. What a *complete* one looks like is not a property
 * of the shape: it depends on the vertical, and that answer lives in
 * `src/domain/travellers.ts`.
 */
export type Contact = {
  firstName?: string;
  lastName?: string;
  email?: string;
  /** ISO `YYYY-MM-DD`. Airlines ask for it; a stay never does. */
  dateOfBirth?: string;
};

export type Cart = {
  id: string;
  /** What is being booked. Decides which details the traveller is asked for. */
  vertical: Vertical;
  /** How the reader chose to pay, back on the search or details page. Absent
   *  until they have chosen, and ignored if this booking has no price in it. */
  businessModel?: BusinessModelId;
  itemName: string;
  itemDetail: string;
  prices: Partial<Record<BusinessModelId, Price>>;
  contact?: Contact;
  paymentMethodId?: string;
  certificateId?: string;
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
