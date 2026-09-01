/* Sections compose. This one is two other sections, each still loading its
   own data — which is why they arrive together rather than one after another. */

import { Stack, Text } from '../../components/primitives';
import { Section } from '../../components/layouts';
import { TripsSection } from './TripsSection';
import { WalletSection } from './WalletSection';

export const OverviewSection = () => (
  <Stack gap={6}>
    <Section title={<Text variant="heading">Trips</Text>}><TripsSection /></Section>
    <Section title={<Text variant="heading">Payment methods</Text>}><WalletSection /></Section>
  </Stack>
);
