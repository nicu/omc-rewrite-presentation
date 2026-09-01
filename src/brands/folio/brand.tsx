import { img } from '../../data/mock/imagery';
import { OVERVIEW, TRIPS, WALLET } from '../../regions/account';
import { theme } from './theme';
import type { BrandConfig } from '../types';
import { FooterNote } from './presenters/slots';
import { FOLIO_LANDING } from './presenters/Landing';

/** A magazine. Ink on paper, serif display, and a deliberate imbalance —
 *  the brand we added to find out where our layouts stop bending. */
export const folio: BrandConfig = {
  id: 'folio',
  name: 'Folio',
  tagline: 'A shorter list, chosen carefully.',
  heroImage: img('aspen'),
  signInImage: img('lisbonD', 1200, 1600),

  analytics: { partner: 'FOLIO', brandKey: 'FLO' },

  theme,

  businessModels: ['cash'],
  defaultBusinessModel: 'cash',

  accountSections: [
    { ...OVERVIEW, label: 'Overview' },
    { ...TRIPS, label: 'My bookings' },
    { ...WALLET, label: 'Payment methods' },
  ],

  /* Its own page: a different order, and three sections of its own. */
  landing: FOLIO_LANDING,

  overrides: { chrome: { FooterNote } },
};
