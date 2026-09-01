import { Card, Media, Stack, Text } from '../../primitives';
import { useTracking, type TrackMap } from '../../../telemetry/tracking';
import type { SearchRefinePayload } from '../../../telemetry/catalog';
import type { Destination } from '../../../data/model';
import styles from './DestinationCard.module.css';

type Actions = { select: SearchRefinePayload };

export const DestinationCard = ({ destination, vertical, onSelect, track }: {
  destination: Destination; vertical: string; onSelect?: (d: Destination) => void; track?: TrackMap<Actions>;
}) => {
  const t = useTracking<Actions, { select: () => SearchRefinePayload }>(track, {
    select: () => ({ vertical, value: destination.name }),
  });

  return (
    <Card onClick={() => { t.select(); onSelect?.(destination); }} ariaLabel={destination.name}>
      <Media src={destination.image} alt={destination.name} ratio="portrait" />
      <div className={styles.body}>
        <Stack gap={1}>
          <Text variant="title">{destination.name}</Text>
          <Text variant="caption" tone="muted">
            {destination.country} · {destination.propertyCount} properties
          </Text>
        </Stack>
      </div>
    </Card>
  );
};
