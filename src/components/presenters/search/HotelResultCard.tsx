/* ============================================================================
   HOTEL RESULT CARD  ·  presenter
   Offers five actions and builds a payload per action. Names NO events —
   the call site decides which of them are worth recording. Search names all
   five; the landing page names two; a call site that omits `track` gets a card
   that reports nothing.
   ========================================================================= */

import { Badge, Disclosure, Media, ScrollArea, Stack, Text } from '../../primitives';
import { ListItemLayout } from '../../layouts';
import { useTracking, type TrackMap } from '../../../telemetry/tracking';
import { useOnVisible } from '../../../telemetry/useOnVisible';
import type {
  ProductDetailPayload, ProductListPayload, ProductPayload, ProductScrollPayload,
} from '../../../telemetry/catalog';
import type { BusinessModelId, Hotel } from '../../../data/model';
import { PriceDisplay } from '../PriceDisplay';
import { Rating } from '../Rating';
import styles from './HotelResultCard.module.css';

/** What this component can report, and the payload shape each action produces. */
type Actions = {
  impression:    ProductListPayload;
  select:        ProductListPayload;
  moreLoaded:    ProductScrollPayload;
  infoRequested: ProductDetailPayload;
  expand:        ProductPayload;
};

export type HotelResultCardProps = {
  hotel: Hotel;
  businessModel: BusinessModelId;
  onSelect?: (hotel: Hotel) => void;
  track?: TrackMap<Actions>;
  /** Dimensions only the instance knows, e.g. position in the list. */
  position?: number;
  listId?: string;
};

export const HotelResultCard = ({
  hotel, businessModel, onSelect, track, position, listId,
}: HotelResultCardProps) => {
  const base = { productId: hotel.id, productName: hotel.name, position, listId };
  const price = hotel.prices[businessModel];

  const t = useTracking<Actions, {
    impression: () => ProductListPayload;
    select: () => ProductListPayload;
    moreLoaded: (depth: number) => ProductScrollPayload;
    infoRequested: (section: string) => ProductDetailPayload;
    expand: () => ProductPayload;
  }>(track, {
    impression:    () => base,
    select:        () => base,
    moreLoaded:    (depth) => ({ ...base, scrollDepth: depth }),
    infoRequested: (section) => ({ ...base, section }),
    expand:        () => base,
  });

  const ref = useOnVisible(t.impression);

  return (
    <ListItemLayout
      ref={ref}
      ariaLabel={hotel.name}
      onClick={() => { t.select(); onSelect?.(hotel); }}
      media={
        <Media
          src={hotel.image}
          alt={hotel.name}
          ratio="landscape"
          overlayTopStart={hotel.badge ? <Badge tone="solid">{hotel.badge}</Badge> : undefined}
        />
      }
      body={
        <>
          <Stack gap={1}>
            <Text variant="overline" tone="muted">{hotel.destination}, {hotel.country}</Text>
            <Text variant="title">{hotel.name}</Text>
          </Stack>

          <Rating score={hotel.rating} reviewCount={hotel.reviewCount} />
          <Text variant="caption" tone="secondary" clamp={2}>{hotel.description}</Text>

          <ScrollArea maxHeight={6} onScrollEnd={t.moreLoaded}>
            <div className={styles.amenities}>
              {hotel.amenities.map((a) => <span key={a} className={styles.amenity}>{a}</span>)}
            </div>
          </ScrollArea>

          <button
            type="button"
            className={styles.infoButton}
            onClick={(e) => { e.stopPropagation(); t.infoRequested('cancellation'); }}
          >
            Cancellation policy
          </button>

          <div onClick={(e) => e.stopPropagation()}>
            <Disclosure label="What's included" onToggle={(open) => open && t.expand()}>
              <Text variant="caption" tone="secondary">
                Daily breakfast, resort credit and airport transfers are included on this rate.
              </Text>
            </Disclosure>
          </div>
        </>
      }
      aside={
        price
          ? <PriceDisplay price={price} />
          : <Text variant="caption" tone="muted">Not available on this rate</Text>
      }
    />
  );
};
