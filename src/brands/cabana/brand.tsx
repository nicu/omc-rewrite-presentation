import { SelectChoice } from '../../components/primitives';
import { img } from '../../data/mock/imagery';
import { OVERVIEW, TRIPS, WALLET } from '../../regions/account';
import { theme } from './theme';
import type { BrandConfig } from '../types';
import { SearchLayout } from './layouts/SearchLayout';
import { FooterNote } from './presenters/slots';

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
    { ...OVERVIEW, label: 'Overview' },
    { ...TRIPS, label: 'My trips' },
    { ...WALLET, label: 'Cards' },
  ],

  overrides: {
    checkout: { PaymentChoice: SelectChoice },
    chrome:   { FooterNote },
    search:   { Layout: SearchLayout },
  },
};
