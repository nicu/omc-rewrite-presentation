/* ============================================================================
   HALO · its own chrome
   The shared shell stacks a header above the content. This brand floats a
   single pill over it instead, because glass that has nothing behind it is
   just a grey box — the blur is only worth anything when the page is moving
   underneath it.

   Everything inside the pill is still the shared header: the same nav links,
   the same actions. Only where it sits is ours.
   ========================================================================= */

import type { AppShellProps } from '../../../components/layouts';
import styles from './AppShell.module.css';

export const AppShell = ({ header, children, footer }: AppShellProps) => (
  <div className={styles.shell}>
    <div className={styles.floating}>
      <div className={styles.pill}>{header}</div>
    </div>
    <main className={styles.main}>{children}</main>
    <div className={styles.footer}>{footer}</div>
  </div>
);
