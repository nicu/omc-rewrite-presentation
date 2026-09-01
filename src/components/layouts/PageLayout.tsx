/* ============================================================================
   PAGE LAYOUTS  ·  named-prop slots
   Structure and token-driven spacing only. No data, no telemetry, no brand
   or vertical meaning — which is exactly why the same file serves hotels,
   cars and cruises for all three brands.
   ========================================================================= */

import type { ReactNode } from 'react';
import styles from './PageLayout.module.css';

export type AppShellProps = {
  header: ReactNode; children: ReactNode; footer: ReactNode;
};

export const AppShell = ({ header, children, footer }: AppShellProps) => (
  <div className={styles.shell}>
    {header}
    <main className={styles.main}>{children}</main>
    {footer}
  </div>
);

export const Container = ({ children, width = 'default' }: {
  children: ReactNode; width?: 'narrow' | 'default' | 'wide' | 'full';
}) => (
  <div className={[styles.container, width !== 'default' ? styles[width] : ''].filter(Boolean).join(' ')}>
    {children}
  </div>
);

export const Section = ({ title, action, children }: {
  /** Slots, not strings — so a brand can supply a decorated heading. */
  title?: ReactNode; action?: ReactNode; children: ReactNode;
}) => (
  <section className={styles.section}>
    {(title || action) && (
      <header className={styles.sectionHeader}>
        {title}
        {action}
      </header>
    )}
    {children}
  </section>
);

export const Grid = ({ children, columns = 'auto' }: {
  children: ReactNode; columns?: 2 | 3 | 4 | 'auto';
}) => (
  <div className={[styles.grid, styles[columns === 'auto' ? 'colsAuto' : `cols${columns}`]].join(' ')}>
    {children}
  </div>
);
