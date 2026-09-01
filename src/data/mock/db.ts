import type {
  BusinessModelId, Booking, Cart, Certificate, Destination, Flight, Hotel, PaymentMethod, Price,
  Promo, Room, User,
} from '../model';
import { img } from './imagery';

/* The properties themselves. Their room types are a separate table below,
   because only the details endpoint ever returns them. */
const properties: Hotel[] = [
  {
    id: 'h-alcazar', name: 'Alcázar Playa Resort', destination: 'Los Cabos', country: 'Mexico',
    image: img('alcazar'), rating: 4.7, reviewCount: 1284, badge: 'Member favourite',
    amenities: ['Beachfront', 'Adults only', '3 restaurants', 'Spa', 'Free parking'],
    description: 'Low-rise casitas along a private stretch of sand, with a cliffside spa and two infinity pools.',
    overview: 'Forty-two casitas step down the headland to a beach the resort shares with nobody, each one screened from the next by mature palms. The spa is cut into the cliff below the main house, and the lower of the two pools runs to the edge of it. Dinner is served on the terrace until eleven; the beach bar keeps going rather later than that.',
    prices: {
      'cash':         { model: 'cash', currency: 'USD', amount: 412 },
      'earn-burn':    { model: 'earn-burn', currency: 'USD', amount: 412, points: 41200, pointsEarned: 2060 },
      'tier-rewards': { model: 'tier-rewards', currency: 'USD', publicAmount: 412, memberAmount: 329, tier: 'Gold' },
      'certificates': { model: 'certificates', currency: 'USD', certificates: 1, supplement: 89 },
    },
  },
  {
    id: 'h-marbella', name: 'Marbella Grand', destination: 'Costa del Sol', country: 'Spain',
    image: img('marbella'), rating: 4.4, reviewCount: 892,
    amenities: ['Sea view', 'Golf', 'Kids club', 'Rooftop bar'],
    description: 'A 1970s landmark reworked around a palm courtyard, five minutes from the old town.',
    overview: 'Built in 1974 and stripped back to its concrete frame in 2021, the Marbella Grand now wraps a planted courtyard that most of the rooms look into. The sea is a four-minute walk through the gardens, the old town a little further along the promenade. Two of the three golf courses on the estate are open to guests without a tee-time fee.',
    prices: {
      'cash':         { model: 'cash', currency: 'USD', amount: 268 },
      'earn-burn':    { model: 'earn-burn', currency: 'USD', amount: 268, points: 26800, pointsEarned: 1340 },
      'tier-rewards': { model: 'tier-rewards', currency: 'USD', publicAmount: 268, memberAmount: 241, tier: 'Silver' },
    },
  },
  {
    id: 'h-kaimana', name: 'Kaimana Shores', destination: 'Maui', country: 'United States',
    image: img('kaimana'), rating: 4.9, reviewCount: 2140, badge: 'Top rated',
    amenities: ['Beachfront', 'Snorkelling', 'Two pools', 'EV charging', 'Pet friendly'],
    description: 'Quiet north-shore property with direct reef access and an open-air lobby.',
    overview: 'The lobby has no walls, which tells you most of what you need to know about the pace of the place. The reef starts about thirty metres out and the property lends the gear to look at it. It is a long way from the resort strip on purpose: the nearest town is fifteen minutes north and closes early.',
    prices: {
      'cash':         { model: 'cash', currency: 'USD', amount: 596 },
      'earn-burn':    { model: 'earn-burn', currency: 'USD', amount: 596, points: 59600, pointsEarned: 2980 },
      'tier-rewards': { model: 'tier-rewards', currency: 'USD', publicAmount: 596, memberAmount: 447, tier: 'Platinum' },
      'certificates': { model: 'certificates', currency: 'USD', certificates: 2, supplement: 0 },
    },
  },
  {
    id: 'h-lisbon', name: 'Baixa Terrace House', destination: 'Lisbon', country: 'Portugal',
    image: img('lisbon'), rating: 4.6, reviewCount: 517,
    amenities: ['City centre', 'Historic building', 'Breakfast included'],
    description: 'Eighteen rooms in a restored merchant house, two streets back from Praça do Comércio.',
    overview: 'A merchant house rebuilt after the 1755 earthquake and left largely alone since, down to the tiled stair that runs the height of the building. Eighteen rooms, no two the same shape. Breakfast is laid out in what was the counting room, and the roof terrace is open to guests from six.',
    prices: {
      'cash':         { model: 'cash', currency: 'USD', amount: 189 },
      'earn-burn':    { model: 'earn-burn', currency: 'USD', amount: 189, points: 18900, pointsEarned: 945 },
      'tier-rewards': { model: 'tier-rewards', currency: 'USD', publicAmount: 189, memberAmount: 170, tier: 'Silver' },
    },
  },
  {
    id: 'h-aspen', name: 'Cascade Lodge', destination: 'Aspen', country: 'United States',
    image: img('aspen'), rating: 4.5, reviewCount: 733,
    amenities: ['Ski-in ski-out', 'Fireplace', 'Hot tub', 'Airport shuttle'],
    description: 'Timber-framed lodge at the base of the gondola, with a stone hearth in every suite.',
    overview: 'You can carry your skis to the gondola without putting them down, which in Aspen is worth more than the square footage. Inside it is all timber and stone: a hearth in every suite, a bigger one in the bar, and drying rooms off the boot hall. The shuttle to the airport runs on the hour through the season.',
    prices: {
      'cash':         { model: 'cash', currency: 'USD', amount: 734 },
      'earn-burn':    { model: 'earn-burn', currency: 'USD', amount: 734, points: 73400, pointsEarned: 3670 },
      'certificates': { model: 'certificates', currency: 'USD', certificates: 2, supplement: 140 },
    },
  },
  {
    id: 'h-santorini', name: 'Oia Cliff Suites', destination: 'Santorini', country: 'Greece',
    image: img('santorini'), rating: 4.8, reviewCount: 1608, badge: 'Limited availability',
    amenities: ['Caldera view', 'Private plunge pool', 'Adults only'],
    description: 'Cave suites cut into the caldera wall, each with its own terrace and plunge pool.',
    overview: 'The suites are genuine cave houses, dug into the rock long before anybody thought to rent them out, and the thick walls keep them cool without much help. Every terrace faces the volcano and the sunset, and every one has its own plunge pool. There are a hundred and eighty steps down to the water, and a boat if you would rather not.',
    prices: {
      'cash':         { model: 'cash', currency: 'USD', amount: 521 },
      'earn-burn':    { model: 'earn-burn', currency: 'USD', amount: 521, points: 52100, pointsEarned: 2605 },
      'tier-rewards': { model: 'tier-rewards', currency: 'USD', publicAmount: 521, memberAmount: 417, tier: 'Gold' },
    },
  },
];

/* --- room types ---------------------------------------------------------
   A room is written as a name, a line about it, and how its rate compares to
   the property's headline rate. Deriving the four prices rather than keying
   them in means a room can never offer a way to pay the property does not,
   and a rate change stays one edit instead of five. `rate` is scaffolding for
   this table only — it is not part of the model. */

const roomTypes: Record<string, { id: string; name: string; description: string; rate: number }[]> = {
  'h-alcazar': [
    { id: 'r-garden',  name: 'Garden Casita',   rate: 1,    description: 'Ground-floor casita off the palm walk, with a shaded patio and an outdoor shower.' },
    { id: 'r-ocean',   name: 'Ocean Casita',    rate: 1.22, description: 'The same room one row forward, so the terrace faces the water rather than the gardens.' },
    { id: 'r-cliff',   name: 'Cliff Suite',     rate: 1.78, description: 'Two rooms above the spa with a plunge pool cut into the rock and a private stair to the beach.' },
  ],
  'h-marbella': [
    { id: 'r-court',   name: 'Courtyard Double', rate: 1,    description: 'Looks into the planted courtyard, which is the quiet side of the building.' },
    { id: 'r-sea',     name: 'Sea View Double',  rate: 1.19, description: 'Third floor and above, with a balcony over the gardens towards the promenade.' },
    { id: 'r-family',  name: 'Family Suite',     rate: 1.64, description: 'A double and a twin either side of a sitting room, with the bathroom between them.' },
    { id: 'r-tower',   name: 'Tower Apartment',  rate: 2.1,  description: 'The whole top of the west tower: a kitchen, a terrace on two sides, and no neighbours.' },
  ],
  'h-kaimana': [
    { id: 'r-reef',    name: 'Reef Room',        rate: 1,    description: 'Nearest the water, with a lanai that opens straight onto the sand path.' },
    { id: 'r-lanai',   name: 'Garden Lanai',     rate: 1.14, description: 'Set back under the ironwoods, a few degrees cooler and rather darker.' },
    { id: 'r-house',   name: 'Beach House',      rate: 2.35, description: 'A two-bedroom house at the north end of the property with its own kitchen and outdoor shower.' },
  ],
  'h-lisbon': [
    { id: 'r-merchant', name: 'Merchant Room',   rate: 1,    description: 'A first-floor room off the tiled stair, with the original shutters and a view of the street.' },
    { id: 'r-praca',    name: 'Praça View',      rate: 1.28, description: 'Corner room on the second floor; you can see the arch from the left-hand window.' },
    { id: 'r-attic',    name: 'Attic Studio',    rate: 1.52, description: 'Under the roof, with beams you will meet at least once, and the terrace outside the door.' },
  ],
  'h-aspen': [
    { id: 'r-gondola', name: 'Gondola Room',     rate: 1,    description: 'Ground floor by the boot hall, which is the shortest walk to the lift in the building.' },
    { id: 'r-hearth',  name: 'Hearth Suite',     rate: 1.45, description: 'A sitting room with a stone fireplace, laid every afternoon while you are out.' },
    { id: 'r-loft',    name: 'Cabin Loft',       rate: 1.9,  description: 'Two floors at the end of the west wing, sleeping four, with a kitchen and a drying room.' },
  ],
  'h-santorini': [
    { id: 'r-cave',    name: 'Cave Double',      rate: 1,    description: 'A single vaulted room dug into the rock, with a terrace wide enough for two chairs.' },
    { id: 'r-caldera', name: 'Caldera Suite',    rate: 1.4,  description: 'Bedroom and sitting room on separate levels, both facing the volcano.' },
    { id: 'r-villa',   name: 'Plunge Pool Villa', rate: 2.2, description: 'The lowest terrace on the property: two bedrooms, a kitchen, and the pool nobody walks past.' },
  ],
};

/** Move one price by a multiplier, whatever business model it is expressed in.
 *  Exhaustive over the union, so adding a way to pay fails here rather than
 *  quietly leaving room rates behind. */
const moved = (price: Price, rate: number): Price => {
  const at = (n: number) => Math.round(n * rate);
  switch (price.model) {
    case 'cash':         return { ...price, amount: at(price.amount) };
    case 'earn-burn':    return { ...price, amount: at(price.amount), points: at(price.points), pointsEarned: at(price.pointsEarned) };
    case 'tier-rewards': return { ...price, publicAmount: at(price.publicAmount), memberAmount: at(price.memberAmount) };
    case 'certificates': return { ...price, certificates: Math.max(1, at(price.certificates)), supplement: at(price.supplement) };
  }
};

const roomsFor = (hotel: Hotel): Room[] =>
  (roomTypes[hotel.id] ?? []).map(({ rate, ...room }) => ({
    ...room,
    prices: Object.fromEntries(
      (Object.entries(hotel.prices) as [BusinessModelId, Price][])
        .map(([model, price]) => [model, moved(price, rate)]),
    ),
  }));

export const hotels: Hotel[] = properties.map((hotel) => ({ ...hotel, rooms: roomsFor(hotel) }));

export const destinations: Destination[] = [
  { id: 'd-cabos',     name: 'Los Cabos',     country: 'Mexico',        image: img('cabos', 600, 700),     propertyCount: 84 },
  { id: 'd-maui',      name: 'Maui',          country: 'United States', image: img('maui', 600, 700),      propertyCount: 61 },
  { id: 'd-lisbon',    name: 'Lisbon',        country: 'Portugal',      image: img('lisbonD', 600, 700),   propertyCount: 132 },
  { id: 'd-santorini', name: 'Santorini',     country: 'Greece',        image: img('santoriniD', 600, 700),propertyCount: 47 },
  { id: 'd-costa',     name: 'Costa del Sol', country: 'Spain',         image: img('costa', 600, 700),     propertyCount: 210 },
];

export const promos: Promo[] = [
  { id: 'p-1', headline: 'Two nights, one certificate', body: 'Stretch a single certificate across a midweek stay at over 300 resorts.', image: img('promo1', 1200, 700), cta: 'See eligible resorts' },
  { id: 'p-2', headline: 'Double earn through March', body: 'Every cash booking earns at twice the usual rate on stays of three nights or more.', image: img('promo2', 1200, 700), cta: 'Browse stays' },
];

export const user: User = {
  id: 'u-1', firstName: 'Nicu', lastName: 'Ciocan', email: 'ciocan.nicu@gmail.com',
  tier: 'Gold', memberSince: '2019-04-12', balances: { points: 84_500, miles: 132_400 },
};

export const paymentMethods: PaymentMethod[] = [
  { id: 'pm-1', brand: 'visa',       last4: '4429', expiry: '11/27', isDefault: true },
  { id: 'pm-2', brand: 'mastercard', last4: '8813', expiry: '03/26', isDefault: false },
  { id: 'pm-3', brand: 'amex',       last4: '1005', expiry: '09/28', isDefault: false },
];

export const certificates: Certificate[] = [
  { id: 'c-1', name: 'Resort week — Studio',  expiresOn: '2026-12-31', status: 'available' },
  { id: 'c-2', name: 'Resort week — 1 bed',   expiresOn: '2027-06-30', status: 'available' },
  { id: 'c-3', name: 'Companion night',       expiresOn: '2026-09-30', status: 'reserved' },
  /* Available and out of date. The checkout must not offer it; the account
     page must still show it, because it is still yours. */
  { id: 'c-4', name: 'Weekend upgrade',       expiresOn: '2025-11-30', status: 'available' },
];

export const bookings: Booking[] = [
  { id: 'b-1', hotelName: 'Kaimana Shores',    destination: 'Maui',       checkIn: '2026-11-04', nights: 5, status: 'upcoming',  paidWith: 'Visa ···· 4429' },
  { id: 'b-2', hotelName: 'Baixa Terrace House', destination: 'Lisbon',   checkIn: '2026-09-18', nights: 3, status: 'upcoming',  paidWith: '18,900 points' },
  { id: 'b-3', hotelName: 'Marbella Grand',    destination: 'Costa del Sol', checkIn: '2026-05-02', nights: 7, status: 'completed', paidWith: 'Certificate ×1' },
];

/* --- flights ------------------------------------------------------------
   Same Price union as hotels: how you pay belongs to the brand, not to the
   vertical, so nothing about pricing had to be re-invented here. */

export const flights: Flight[] = [
  {
    id: 'f-lhr-cun', carrier: 'Meridian Air', flightNumber: 'MA 412',
    origin: 'London Heathrow', originCode: 'LHR', destination: 'Cancún', destinationCode: 'CUN',
    departs: '09:40', arrives: '15:20', durationMinutes: 640, stops: 0, cabin: 'Economy',
    badge: 'Direct',
    prices: {
      'cash':         { model: 'cash', currency: 'USD', amount: 612 },
      'earn-burn':    { model: 'earn-burn', currency: 'USD', amount: 612, points: 61200, pointsEarned: 3060 },
      'tier-rewards': { model: 'tier-rewards', currency: 'USD', publicAmount: 612, memberAmount: 489, tier: 'Gold' },
    },
  },
  {
    id: 'f-lhr-cun-2', carrier: 'Atlantic Blue', flightNumber: 'AB 88',
    origin: 'London Gatwick', originCode: 'LGW', destination: 'Cancún', destinationCode: 'CUN',
    departs: '07:15', arrives: '16:05', durationMinutes: 830, stops: 1, cabin: 'Economy',
    prices: {
      'cash':         { model: 'cash', currency: 'USD', amount: 438 },
      'earn-burn':    { model: 'earn-burn', currency: 'USD', amount: 438, points: 43800, pointsEarned: 2190 },
      'tier-rewards': { model: 'tier-rewards', currency: 'USD', publicAmount: 438, memberAmount: 394, tier: 'Silver' },
    },
  },
  {
    id: 'f-lhr-hnl', carrier: 'Pacific Rim', flightNumber: 'PR 7',
    origin: 'London Heathrow', originCode: 'LHR', destination: 'Honolulu', destinationCode: 'HNL',
    departs: '11:00', arrives: '21:45', durationMinutes: 1245, stops: 1, cabin: 'Premium',
    badge: 'Lie-flat seat',
    prices: {
      'cash':         { model: 'cash', currency: 'USD', amount: 1480 },
      'earn-burn':    { model: 'earn-burn', currency: 'USD', amount: 1480, points: 148000, pointsEarned: 7400 },
      'certificates': { model: 'certificates', currency: 'USD', certificates: 2, supplement: 210 },
    },
  },
  {
    id: 'f-lhr-lis', carrier: 'Meridian Air', flightNumber: 'MA 118',
    origin: 'London City', originCode: 'LCY', destination: 'Lisbon', destinationCode: 'LIS',
    departs: '06:50', arrives: '09:35', durationMinutes: 165, stops: 0, cabin: 'Economy',
    badge: 'Direct',
    prices: {
      'cash':         { model: 'cash', currency: 'USD', amount: 164 },
      'earn-burn':    { model: 'earn-burn', currency: 'USD', amount: 164, points: 16400, pointsEarned: 820 },
      'tier-rewards': { model: 'tier-rewards', currency: 'USD', publicAmount: 164, memberAmount: 148, tier: 'Silver' },
    },
  },
  {
    id: 'f-lhr-jtr', carrier: 'Aegean Star', flightNumber: 'AS 340',
    origin: 'London Heathrow', originCode: 'LHR', destination: 'Santorini', destinationCode: 'JTR',
    departs: '14:20', arrives: '20:10', durationMinutes: 290, stops: 0, cabin: 'Business',
    prices: {
      'cash':         { model: 'cash', currency: 'USD', amount: 902 },
      'tier-rewards': { model: 'tier-rewards', currency: 'USD', publicAmount: 902, memberAmount: 721, tier: 'Gold' },
      'certificates': { model: 'certificates', currency: 'USD', certificates: 1, supplement: 160 },
    },
  },
];


/* --- the cart ------------------------------------------------------------
   Standing in for the cart API. Steps read it and patch it; nothing keeps a
   copy on the client.

   It is persisted to localStorage, not because a cart belongs there, but
   because this file is pretending to be a server and a server does not forget
   when you press refresh. Deliberately localStorage rather than session: the
   cart is the same cart in a second tab, exactly as a real one would be. That
   is what makes the difference from src/data/draft.ts visible in the demo. */

const SEED: Cart = {
  id: 'c-1',
  vertical: 'hotel',
  itemName: 'Alcázar Playa Resort',
  itemDetail: 'Los Cabos · 4 nights · 2 guests',
  /* One booking, priced every way the group sells. Which of these the member
     sees is the brand's business model, not a property of the booking. */
  prices: {
    cash:           { model: 'cash', currency: 'USD', amount: 1648 },
    'earn-burn':    { model: 'earn-burn', currency: 'USD', amount: 1648, points: 164800, pointsEarned: 8240 },
    'tier-rewards': { model: 'tier-rewards', currency: 'USD', publicAmount: 1648, memberAmount: 1319, tier: 'Gold' },
    certificates:   { model: 'certificates', currency: 'USD', certificates: 2, supplement: 0 },
  },
};

/* --- authorisations -------------------------------------------------------
   Keyed by cart. The bank has already taken the money once; asking again with
   the same key gets the same answer back, not a second charge. */
export const authorisations = new Map<string, { reference: string }>();

const CART_KEY = 'poc.server.cart';

const load = (): Cart => {
  try {
    const stored = localStorage.getItem(CART_KEY);
    return stored ? ({ ...SEED, ...JSON.parse(stored) } as Cart) : SEED;
  } catch {
    return SEED;
  }
};

export let cart: Cart = load();

export const patchCart = (patch: Partial<Cart>) => {
  cart = { ...cart, ...patch };
  try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch { /* empty */ }
  return cart;
};

/** Used by the dev panel: start the booking over.
 *
 *  It forgets the authorisation as well as the cart. That is not tidiness —
 *  the server answers a cart it has already taken payment on with the same
 *  authorisation rather than a second charge, so without this a second run
 *  through the checkout books instantly and the bank challenge never shows
 *  again. Correct behaviour, and useless in a demonstration. */
export const resetCart = () => {
  cart = SEED;
  authorisations.clear();
  try { localStorage.removeItem(CART_KEY); } catch { /* empty */ }
};


/* What a CMS would hold for a landing page: which blocks, in what order. Ids,
   not components — a CMS names things, it does not ship code. Someone in
   marketing reorders this and the page changes without a deploy. */
export const landingLayouts: Record<string, string[]> = {
  meridian: ['hero', 'promos', 'featured', 'destinations'],
};
