import styles from './Rating.module.css';

export const Rating = ({ score, reviewCount, emphasis = 'plain' }: {
  score: number; reviewCount?: number; emphasis?: 'plain' | 'mark';
}) => (
  <span className={styles.rating}>
    <span className={emphasis === 'mark' ? styles.mark : styles.score}>{score.toFixed(1)}</span>
    {reviewCount !== undefined && (
      <span className={styles.count}>{new Intl.NumberFormat('en-US').format(reviewCount)} reviews</span>
    )}
  </span>
);
