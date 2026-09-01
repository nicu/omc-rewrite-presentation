import type { ReactNode } from 'react';
import styles from './SplitLayout.module.css';

/** Used by sign-in. Tenants move the media slot; no new component. */
export const SplitLayout = ({ media, mediaOverlay, children, mediaSide = 'left' }: {
  media?: ReactNode;
  mediaOverlay?: ReactNode;
  children: ReactNode;
  /** Which half the media occupies. Named sides rather than a `reverse` flag,
   *  so a call site reads as a layout choice instead of a negation. */
  mediaSide?: 'left' | 'right';
}) => (
  <div className={`${styles.split} ${styles[mediaSide]}`}>
    {media && (
      <div className={styles.media}>
        {media}
        <div className={styles.mediaScrim} />
        {mediaOverlay && <div className={styles.mediaOverlay}>{mediaOverlay}</div>}
      </div>
    )}
    <div className={styles.panel}>
      <div className={styles.panelInner}>{children}</div>
    </div>
  </div>
);
