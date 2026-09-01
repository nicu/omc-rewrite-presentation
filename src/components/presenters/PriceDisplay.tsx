/* ============================================================================
   PRICE DISPLAY
   One presenter, four business models. In the old repo this shape is spread
   across bespoke pricing components per brand; here the business model is a
   type, so the switch is exhaustive and TypeScript proves nothing is missed.
   ========================================================================= */

import { Badge, Stack, Text } from '../atoms';
import type { Price } from '../../data/model';
import styles from './PriceDisplay.module.css';

const money = (amount: number, currency: string) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);

const count = (n: number) => new Intl.NumberFormat('en-US').format(n);

export const PriceDisplay = ({ price, size = 'md', unit = 'per night' }: {
  price: Price; size?: 'md' | 'lg'; unit?: string;
}) => {
  const amountClass = [styles.amount, size === 'lg' ? styles.amountLarge : ''].filter(Boolean).join(' ');

  switch (price.model) {
    case 'cash':
      return (
        <div className={styles.price}>
          <span className={amountClass}>{money(price.amount, price.currency)}</span>
          <span className={styles.unit}>{unit}</span>
        </div>
      );

    case 'earn-burn':
      return (
        <div className={styles.price}>
          <div className={styles.row}>
            <span className={amountClass}>{count(price.points)}</span>
            <span className={styles.unit}>pts</span>
          </div>
          <span className={styles.unit}>or {money(price.amount, price.currency)} {unit}</span>
          <span className={styles.earn}>Earn {count(price.pointsEarned)}</span>
        </div>
      );

    case 'tier-rewards':
      return (
        <div className={styles.price}>
          <div className={styles.row}>
            <span className={styles.struck}>{money(price.publicAmount, price.currency)}</span>
            <span className={amountClass}>{money(price.memberAmount, price.currency)}</span>
          </div>
          <Stack direction="horizontal" gap={2} align="center">
            <Badge tone="brand">{price.tier}</Badge>
            <span className={styles.unit}>{unit}</span>
          </Stack>
        </div>
      );

    case 'certificates':
      return (
        <div className={styles.price}>
          <div className={styles.row}>
            <span className={amountClass}>{price.certificates}</span>
            <span className={styles.unit}>{price.certificates === 1 ? 'certificate' : 'certificates'}</span>
          </div>
          {price.supplement > 0
            ? <span className={styles.supplement}>+ {money(price.supplement, price.currency)} resort fee</span>
            : <Text variant="caption" tone="muted">No supplement</Text>}
        </div>
      );
  }
};
