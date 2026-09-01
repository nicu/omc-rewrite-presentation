import type { ReactNode } from 'react';
import styles from './Media.module.css';

export type Ratio = 'wide' | 'landscape' | 'square' | 'portrait' | 'hero';

type MediaProps = {
  src: string;
  alt: string;
  ratio?: Ratio;
  /** Slot for badges/actions floated over the image. */
  overlayTopStart?: ReactNode;
  overlayTopEnd?: ReactNode;
};

const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

export const Media = ({ src, alt, ratio = 'landscape', overlayTopStart, overlayTopEnd }: MediaProps) => (
  <div className={[styles.frame, styles[`ratio${cap(ratio)}`]].join(' ')}>
    <img className={styles.image} src={src} alt={alt} loading="lazy" />
    {overlayTopStart && <div className={styles.overlayTopStart}>{overlayTopStart}</div>}
    {overlayTopEnd   && <div className={styles.overlayTopEnd}>{overlayTopEnd}</div>}
  </div>
);
