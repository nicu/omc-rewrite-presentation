import { ChipChoice } from '../../components/primitives';
import { img } from '../../data/mock/imagery';
import { OVERVIEW, TRIPS, WALLET } from '../../regions/account';
import { theme } from './theme';
import type { BrandConfig } from '../types';
import { KIOSK_LANDING } from './presenters/Landing';
import { FooterNote, SignInAside } from './presenters/slots';
import { DestinationCard } from './presenters/DestinationCard';
import { HotelResultCard } from './presenters/HotelResultCard';
import { SignInLayout } from './layouts/SignInLayout';

/**
 * A magazine rack. The colour lives in the tags rather than the furniture, and
 * the landing page is a shelf you scroll sideways.
 */
export const kiosk: BrandConfig = {
  id: 'kiosk',
  name: 'Kiosk',
  tagline: 'Which place would you like to read about?',
  heroImage: img('lisbon'),
  signInImage: img('santorini', 1200, 1600),

  analytics: { partner: 'KIOSK', brandKey: 'KSK' },

  theme,

  businessModels: ['cash', 'earn-burn'],
  defaultBusinessModel: 'cash',

  accountSections: [
    { ...OVERVIEW, label: 'Overview' },
    { ...TRIPS, label: 'My shelf' },
    { ...WALLET, label: 'Payment methods' },
  ],

  landing: KIOSK_LANDING,

  overrides: {
    checkout:  { PaymentChoice: ChipChoice },
    chrome:    { FooterNote },
    auth:      { Aside: SignInAside, Layout: SignInLayout },
    landing:   { DestinationCard },
    verticals: { hotel: { ResultCard: HotelResultCard } },
  },
};
