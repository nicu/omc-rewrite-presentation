import type { Booking, Certificate, Destination, Flight, Hotel, PaymentMethod, Promo, User } from '../model';
import { img } from './imagery';

export const hotels: Hotel[] = [
  {
    id: 'h-alcazar', name: 'Alcázar Playa Resort', destination: 'Los Cabos', country: 'Mexico',
    image: img('alcazar'), rating: 4.7, reviewCount: 1284, badge: 'Member favourite',
    amenities: ['Beachfront', 'Adults only', '3 restaurants', 'Spa', 'Free parking'],
    description: 'Low-rise casitas along a private stretch of sand, with a cliffside spa and two infinity pools.',
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
    prices: {
      'cash':         { model: 'cash', currency: 'USD', amount: 521 },
      'earn-burn':    { model: 'earn-burn', currency: 'USD', amount: 521, points: 52100, pointsEarned: 2605 },
      'tier-rewards': { model: 'tier-rewards', currency: 'USD', publicAmount: 521, memberAmount: 417, tier: 'Gold' },
    },
  },
];

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
