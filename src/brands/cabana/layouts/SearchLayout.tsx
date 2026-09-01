/* ============================================================================
   CABANA'S OWN SEARCH LAYOUT
   The same three slots, arranged differently: filters and toolbar share one
   bar across the top, and the results run full width.

   Everything that goes in the slots is unchanged — the same filter control,
   the same toolbar, the same result cards. Only the arrangement is ours.
   ========================================================================= */

import type { SearchLayoutProps } from '../../../components/layouts';
import styles from './SearchLayout.module.css';

export const SearchLayout = ({ banner, filters, toolbar, results }: SearchLayoutProps) => (
  <div className={styles.layout}>
    {banner}
    <div className={styles.bar}>
      {filters}
      {toolbar}
    </div>
    <div className={styles.list}>{results}</div>
  </div>
);
