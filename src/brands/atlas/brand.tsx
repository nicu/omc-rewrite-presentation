import { SegmentedChoice } from '../../components/atoms';
import { img } from '../../data/mock/imagery';
import { OverviewSection, TripsSection, WalletSection } from '../../regions/account';
import { theme } from './theme';
import type { BrandConfig } from '../types';
import { FooterNote, MembershipBanner, SignInAside } from './slots';

/** Earn & burn. Miles are the headline; cash is the fallback. */
export const atlas: BrandConfig = {
  id: 'atlas',
  name: 'Atlas Rewards',
  tagline: 'Every mile you have earned, worth more here.',
  heroImage: img('atlas-hero'),
  signInImage: img('atlas-signin', 1200, 1600),

  analytics: { partner: 'ATLASGRP', brandKey: 'ATL' },

  theme,

  businessModels: ['earn-burn', 'cash'],
  defaultBusinessModel: 'earn-burn',

  accountSections: [
    { id: 'overview', label: 'Overview', Panel: OverviewSection },
    { id: 'bookings', label: 'Trips', Panel: TripsSection },
    { id: 'wallet', label: 'Payment methods', Panel: WalletSection },
  ],

  overrides: { PaymentChoice: SegmentedChoice, MembershipBanner, SignInAside, FooterNote },
};
