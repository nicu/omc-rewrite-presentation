import type { ReactNode } from 'react';
import styles from './AccountLayout.module.css';

export const AccountLayout = ({ summary, nav, children }: {
  /** The tenant-varying part: earn & burn shows balances, cash shows nothing. */
  summary?: ReactNode; nav: ReactNode; children: ReactNode;
}) => (
  <div className={styles.layout}>
    {summary && <div className={styles.summary}>{summary}</div>}
    <nav className={styles.nav}>{nav}</nav>
    <div className={styles.content}>{children}</div>
  </div>
);
