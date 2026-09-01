import { ChipChoice } from '../../components/atoms';
import { img } from '../../data/mock/imagery';
import { CertificatesSection, OverviewSection, TripsSection, WalletSection } from '../../regions/account';
import { theme } from './theme';
import type { BrandConfig } from '../types';
import { FooterNote, MembershipBanner, SignInAside } from './slots';

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

  accountSections: [
    { id: 'overview', label: 'Overview', Panel: OverviewSection },
    { id: 'bookings', label: 'Reservations', Panel: TripsSection },
    { id: 'certificates', label: 'Certificates', Panel: CertificatesSection },
    { id: 'wallet', label: 'Wallet', Panel: WalletSection },
  ],

  overrides: { PaymentChoice: ChipChoice, MembershipBanner, SignInAside, FooterNote },
};
