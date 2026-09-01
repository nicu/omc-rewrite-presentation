/* ============================================================================
   DESTINATION GRID
   The default answer to "what does the featured destinations section look
   like". A brand can replace this whole thing, or replace only the card
   inside it — those are different sizes of change and they have different
   slots.

   It owns the list, so it owns the stagger. A brand that swaps the card keeps
   this arrangement, and the cards still arrive one after another.
   ========================================================================= */

import type { ComponentType } from 'react';

import { Reveal } from '../../primitives';
import { Grid } from '../../layouts';
import type { Destination } from '../../../data/model';
import type { SearchRefinePayload } from '../../../telemetry/catalog';
import type { TrackMap } from '../../../telemetry/tracking';
import { DestinationCard } from './DestinationCard';

export type DestinationCardProps = {
  destination: Destination;
  vertical: string;
  onSelect?: (d: Destination) => void;
  track?: TrackMap<{ select: SearchRefinePayload }>;
};

export type FeaturedDestinationsProps = {
  destinations: Destination[];
  onSelect: (destination: Destination) => void;
  /** Named by the page, as every event is. Passed straight through. */
  track?: TrackMap<{ select: SearchRefinePayload }>;
  /** The card to draw for each one. The brand's, if it has one of its own. */
  Card?: ComponentType<DestinationCardProps>;
};

export const DestinationGrid = ({
  destinations, onSelect, track, Card = DestinationCard,
}: FeaturedDestinationsProps) => (
  <Grid columns={4}>
    <Reveal stagger direction="up" distance="md">
      {destinations.map((destination) => (
        <Card key={destination.id} destination={destination} vertical="hotel"
              onSelect={onSelect} track={track} />
      ))}
    </Reveal>
  </Grid>
);
