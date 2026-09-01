/* ============================================================================
   KIOSK · a stay, as a listing
   Every other brand draws a result as a wide media card. This one draws it the
   way the rack does: a small cover, a title with a coloured tag, and the price
   as a pill on the right.

   It offers the same actions and names none of them — impressions and clicks
   still come from whichever page put it there, so search stays fully
   instrumented and the account page stays silent, exactly as before.
   ========================================================================= */

import { Card, Text } from '../../../components/primitives';
import { PriceDisplay, Rating } from '../../../components/presenters';
import type { HotelResultCardProps } from '../../../components/presenters';
import { useTracking } from '../../../telemetry/tracking';
import { useOnVisible } from '../../../telemetry/useOnVisible';
import type { ProductListPayload } from '../../../telemetry/catalog';
import styles from './HotelResultCard.module.css';

type Actions = { impression: ProductListPayload; select: ProductListPayload };

const coverFor = (id: string) =>
  `var(--cover-${(([...id].reduce((n, c) => n + c.charCodeAt(0), 0) % 4) + 1)})`;

export const HotelResultCard = ({
  hotel, businessModel, onSelect, track, position, listId,
}: HotelResultCardProps) => {
  const base = { productId: hotel.id, productName: hotel.name, position, listId };
  const price = hotel.prices[businessModel];

  const t = useTracking<Actions, {
    impression: () => ProductListPayload;
    select: () => ProductListPayload;
  }>(track as never, {
    impression: () => base,
    select: () => base,
  });

  return (
    <div ref={useOnVisible(t.impression)}>
      <Card onClick={() => { t.select(); onSelect?.(hotel); }} ariaLabel={hotel.name}>
        <div className={styles.row}>
          <div className={styles.cover} style={{ '--cover': coverFor(hotel.id) } as React.CSSProperties}>
            <img src={hotel.image} alt="" />
          </div>

          <div className={styles.body}>
            <div className={styles.meta}>
              <span className={styles.tag}>{hotel.destination}</span>
              <Rating score={hotel.rating} reviewCount={hotel.reviewCount} />
            </div>
            <Text variant="title">{hotel.name}</Text>
            <div className={styles.blurb}>
              <Text variant="caption" tone="muted">{hotel.description}</Text>
            </div>
          </div>

          <div className={styles.price}>
            {price && <PriceDisplay price={price} unit="night" />}
          </div>
        </div>
      </Card>
    </div>
  );
};
