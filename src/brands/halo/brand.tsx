import { img } from '../../data/mock/imagery';
import { OVERVIEW, TRIPS, WALLET } from '../../regions/account';
import { theme } from './theme';
import type { BrandConfig } from '../types';
import { SegmentedChoice } from '../../components/primitives';
import { CanvasSignIn } from '../../components/layouts';
import { FooterNote, SignInAside } from './presenters/slots';
import { AppShell } from './layouts/AppShell';

/** Liquid glass. Translucent surfaces over a lit page, slow and quiet. */
export const halo: BrandConfig = {
  id: 'halo',
  name: 'Halo',
  tagline: 'Everything you need, and nothing you do not.',
  heroImage: img('kaimana'),
  signInImage: img('maui', 1200, 1600),

  analytics: { partner: 'HALO', brandKey: 'HLO' },

  theme,

  businessModels: ['tier-rewards', 'cash'],
  defaultBusinessModel: 'tier-rewards',

  accountSections: [
    { ...OVERVIEW, label: 'Overview' },
    { ...TRIPS, label: 'My stays' },
    { ...WALLET, label: 'Payment methods' },
  ],

  /* Sign-in: the picture fills the page and the form floats on it. The card
     is a plain surface, so it picks up this brand's glass without knowing. */
  overrides: {
    checkout: { PaymentChoice: SegmentedChoice },
    chrome:   { AppShell, FooterNote },
    auth:     { Aside: SignInAside, Layout: CanvasSignIn },
  },
};
