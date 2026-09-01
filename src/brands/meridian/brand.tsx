import { ChipChoice } from '../../components/primitives';
import { img } from '../../data/mock/imagery';
import { CERTIFICATES, OVERVIEW, TRIPS, WALLET } from '../../regions/account';
import { CHECKOUT_WITH_CERTIFICATES } from '../../regions/checkout/checkoutFlow';
import { theme } from './theme';
import type { BrandConfig } from '../types';
import { FooterNote, MembershipBanner, SignInAside } from './presenters/slots';

/** Tier rewards, plus certificates members already own. */
export const meridian: BrandConfig = {
  id: 'meridian',
  name: 'Meridian Club',
  tagline: 'A shorter list of better places, at the price your tier earns.',
  heroImage: img('meridian-hero'),
  signInImage: img('meridian-signin', 1200, 1600),

  analytics: { partner: 'MERIDIAN', brandKey: 'MRD' },

  theme,

  businessModels: ['tier-rewards', 'certificates', 'cash'],
  defaultBusinessModel: 'tier-rewards',

  /* This brand's landing page is arranged by whoever edits the content system,
     not by this file. Same list, same sections, fetched instead of written. */
  landing: 'cms',

  accountSections: [
    { ...OVERVIEW, label: 'Overview' },
    { ...TRIPS, label: 'Reservations' },
    { ...CERTIFICATES, label: 'Certificates' },
    { ...WALLET, label: 'Wallet' },
  ],

  checkoutFlow: CHECKOUT_WITH_CERTIFICATES,

  overrides: {
    checkout: { PaymentChoice: ChipChoice },
    chrome:   { MembershipBanner, FooterNote },
    auth:     { Aside: SignInAside },
  },
};
