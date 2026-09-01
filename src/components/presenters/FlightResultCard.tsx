/* ============================================================================
   FLIGHT RESULT CARD  ·  presenter
   Written second, after HotelResultCard, to see what a new vertical actually
   costs. What it did NOT need: a new layout, a new price component, a new
   selector, a new loading pattern, a new analytics event, a new atom.
   ========================================================================= */

import { Badge, Disclosure, Stack, Text } from '../atoms';
import { ListItemLayout } from '../layouts';
import { useTracking, type TrackMap } from '../../telemetry/tracking';
import { useOnVisible } from '../../telemetry/useOnVisible';
import type { ProductListPayload, ProductPayload } from '../../telemetry/catalog';
import type { BusinessModelId, Flight } from '../../data/model';
import { PriceDisplay } from './PriceDisplay';
import styles from './FlightResultCard.module.css';

/* A flight reports fewer things than a hotel card does, and that is fine —
   the shape of the contract is the same, the contents differ. */
type Actions = {
  impression: ProductListPayload;
  select:     ProductListPayload;
  expand:     ProductPayload;
};

type FlightResultCardProps = {
  flight: Flight;
  businessModel: BusinessModelId;
  onSelect?: (flight: Flight) => void;
  track?: TrackMap<Actions>;
  position?: number;
  listId?: string;
};

const duration = (minutes: number) => `${Math.floor(minutes / 60)}h ${minutes % 60}m`;

export const FlightResultCard = ({
  flight, businessModel, onSelect, track, position, listId,
}: FlightResultCardProps) => {
  const base = { productId: flight.id, productName: `${flight.carrier} ${flight.flightNumber}`, position, listId };
  const price = flight.prices[businessModel];

  const t = useTracking<Actions, {
    impression: () => ProductListPayload;
    select: () => ProductListPayload;
    expand: () => ProductPayload;
  }>(track, {
    impression: () => base,
    select:     () => base,
    expand:     () => base,
  });

  const ref = useOnVisible(t.impression);

  return (
    <ListItemLayout
      ref={ref}
      ariaLabel={`${flight.carrier} ${flight.flightNumber}`}
      onClick={() => { t.select(); onSelect?.(flight); }}
      body={
        <>
          <Stack direction="horizontal" gap={4} align="center" justify="between">
            <Stack gap={1}>
              <Text variant="overline" tone="muted">{flight.carrier} &middot; {flight.flightNumber}</Text>
              <Text variant="title">{flight.originCode} &rarr; {flight.destinationCode}</Text>
            </Stack>
            {flight.badge && <Badge tone="solid">{flight.badge}</Badge>}
          </Stack>

          <div className={styles.times}>
            <Stack gap={0}>
              <Text variant="title">{flight.departs}</Text>
              <Text variant="caption" tone="muted">{flight.origin}</Text>
            </Stack>
            <Stack gap={1} align="center">
              <Text variant="caption" tone="muted">{duration(flight.durationMinutes)}</Text>
              <span className={styles.line} aria-hidden />
              <Text variant="caption" tone="muted">
                {flight.stops === 0 ? 'Direct' : `${flight.stops} stop`}
              </Text>
            </Stack>
            <Stack gap={0} align="end">
              <Text variant="title">{flight.arrives}</Text>
              <Text variant="caption" tone="muted">{flight.destination}</Text>
            </Stack>
          </div>

          <div onClick={(e) => e.stopPropagation()}>
            <Disclosure label="Fare conditions" onToggle={(open) => open && t.expand()}>
              <Text variant="caption" tone="secondary">
                {flight.cabin} &middot; one cabin bag included &middot; changes permitted for a fee.
              </Text>
            </Disclosure>
          </div>
        </>
      }
      aside={
        price
          ? <PriceDisplay price={price} unit="one way" />
          : <Text variant="caption" tone="muted">Not available on this rate</Text>
      }
    />
  );
};
