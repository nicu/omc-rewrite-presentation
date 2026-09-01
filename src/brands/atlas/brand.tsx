import { SegmentedChoice } from '../../components/primitives';
import { img } from '../../data/mock/imagery';
import { OVERVIEW, TRIPS, WALLET } from '../../regions/account';
import { theme } from './theme';
import type { BrandConfig } from '../types';
import { FooterNote, MembershipBanner, SignInAside } from './presenters/slots';
import { HeaderBalance } from './regions/HeaderBalance';

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
    { ...OVERVIEW, label: 'Overview' },
    { ...TRIPS, label: 'Trips' },
    { ...WALLET, label: 'Payment methods' },
  ],

  overrides: {
    checkout: { PaymentChoice: SegmentedChoice },
    chrome:   { MembershipBanner, FooterNote, headerActions: [{ id: 'balance', analytics: 'chrome.balance', Action: HeaderBalance }] },
    auth:     { Aside: SignInAside },
  },
};
