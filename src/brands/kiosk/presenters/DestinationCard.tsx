/* ============================================================================
   KIOSK · a cover, not a photo card
   The reference this brand comes from puts the title *on* the artwork: a flat
   colour block, the picture sunk into it, the name set across the top and an
   issue number in the corner.

   It is still a DestinationCard — same props, same one action, same event
   named by the page. Only the drawing is Kiosk's.
   ========================================================================= */

import { Card, Text } from '../../../components/primitives';
import { useTracking } from '../../../telemetry/tracking';
import type { SearchRefinePayload } from '../../../telemetry/catalog';
import type { DestinationCardProps } from '../../../components/presenters';
import styles from './DestinationCard.module.css';

type Actions = { select: SearchRefinePayload };

/** Stable per destination, so a cover keeps its colour between visits. */
const coverFor = (id: string) =>
  `var(--cover-${(([...id].reduce((n, c) => n + c.charCodeAt(0), 0) % 4) + 1)})`;

export const DestinationCard = ({ destination, vertical, onSelect, track }: DestinationCardProps) => {
  const t = useTracking<Actions, { select: () => SearchRefinePayload }>(track, {
    select: () => ({ vertical, value: destination.name }),
  });

  return (
    <Card onClick={() => { t.select(); onSelect?.(destination); }} ariaLabel={destination.name}>
      <div className={styles.cover} style={{ '--cover': coverFor(destination.id) } as React.CSSProperties}>
        <div className={styles.title}>{destination.name}</div>
        <img src={destination.image} alt="" />
        <span className={styles.issue}>NO.{destination.propertyCount}</span>
      </div>
      <div className={styles.caption}>
        <Text variant="caption" tone="muted">{destination.country}</Text>
      </div>
    </Card>
  );
};
