/* ============================================================================
   SEARCH LAYOUT  ·  version A — named-prop slots
   Compare directly against SearchLayoutCompound.tsx.
   ========================================================================= */

import type { ReactNode } from 'react';
import styles from './SearchLayout.module.css';

export type SearchLayoutProps = {
  /** Tenant- or vertical-specific banner. Omit and the row collapses. */
  banner?: ReactNode;
  filters?: ReactNode;
  toolbar: ReactNode;
  results: ReactNode;
};

export const SearchLayout = ({ banner, filters, toolbar, results }: SearchLayoutProps) => (
  <div className={[styles.layout, filters ? '' : styles.single].filter(Boolean).join(' ')}>
    {banner && <div className={styles.banner}>{banner}</div>}
    {filters && <aside className={styles.filters}>{filters}</aside>}
    <div className={styles.results}>
      <div className={styles.toolbar}>{toolbar}</div>
      <div className={styles.list}>{results}</div>
    </div>
  </div>
);
