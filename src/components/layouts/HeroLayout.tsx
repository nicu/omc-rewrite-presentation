import type { ReactNode } from 'react';
import styles from './HeroLayout.module.css';

export const HeroLayout = ({ image, copy, search }: {
  image: string; copy: ReactNode; search?: ReactNode;
}) => (
  <section className={styles.hero}>
    <div className={styles.media}><img className={styles.mediaImage} src={image} alt="" /></div>
    <div className={styles.scrim} />
    <div className={styles.inner}>
      <div className={styles.copy}>{copy}</div>
      {search && <div className={styles.searchSlot}>{search}</div>}
    </div>
  </section>
);
