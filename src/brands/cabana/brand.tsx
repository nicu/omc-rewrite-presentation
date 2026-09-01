import { SelectChoice } from '../../components/atoms';
import { img } from '../../data/mock/imagery';
import { OverviewSection, TripsSection, WalletSection } from '../../regions/account';
import { theme } from './theme';
import type { BrandConfig } from '../types';
import { FooterNote } from './slots';

/**
 * Cash retail. No loyalty programme, so no membership banner and no sign-in
 * aside — those two overrides are simply absent, and nothing renders.
 */
export const cabana: BrandConfig = {
  id: 'cabana',
  name: 'Cabana Travel',
  tagline: 'Straightforward prices. No membership, no points, no games.',
  heroImage: img('cabana-hero'),
  signInImage: img('cabana-signin', 1200, 1600),

  analytics: { partner: 'CABANA', brandKey: 'CBN' },

  theme,

  businessModels: ['cash'],
  defaultBusinessModel: 'cash',

  accountSections: [
    { id: 'overview', label: 'Overview', Panel: OverviewSection },
    { id: 'bookings', label: 'My trips', Panel: TripsSection },
    { id: 'wallet', label: 'Cards', Panel: WalletSection },
  ],

  overrides: { PaymentChoice: SelectChoice, FooterNote },
};
