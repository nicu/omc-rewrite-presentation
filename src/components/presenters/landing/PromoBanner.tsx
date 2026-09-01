import { Badge, Button, Media, Stack, Text } from '../../primitives';
import { useTracking, type TrackMap } from '../../../telemetry/tracking';
import { useOnVisible } from '../../../telemetry/useOnVisible';
import type { ProductListPayload } from '../../../telemetry/catalog';
import type { Promo } from '../../../data/model';
import styles from './PromoBanner.module.css';

type Actions = { impression: ProductListPayload; select: ProductListPayload };

export const PromoBanner = ({ promo, eyebrow, onSelect, track, position }: {
  promo: Promo; eyebrow?: string; onSelect?: () => void; track?: TrackMap<Actions>; position?: number;
}) => {
  const base = { productId: promo.id, productName: promo.headline, position };
  const t = useTracking<Actions, { impression: () => ProductListPayload; select: () => ProductListPayload }>(track, {
    impression: () => base,
    select: () => base,
  });
  const ref = useOnVisible(t.impression);

  return (
    <div ref={ref} className={styles.promo}>
      <Media src={promo.image} alt="" ratio="wide" />
      <div className={styles.overlay}>
        <Stack gap={3} align="start">
          {eyebrow && <Badge tone="solid">{eyebrow}</Badge>}
          <Text variant="displayMd" tone="onMedia">{promo.headline}</Text>
          <Text variant="body" tone="onMedia">{promo.body}</Text>
          <Button variant="accent" onClick={() => { t.select(); onSelect?.(); }}>{promo.cta}</Button>
        </Stack>
      </div>
    </div>
  );
};
