/* ============================================================================
   SEARCH LAYOUT  ·  version B — compound components
   Same structure, same CSS module, different call-site contract.
   Written so the two can be swapped in HotelSearchRegion for comparison.
   ========================================================================= */

import { createContext, useContext, type ReactNode } from 'react';
import styles from './SearchLayout.module.css';

const HasFilters = createContext(false);

const Root = ({ children, withFilters = true }: { children: ReactNode; withFilters?: boolean }) => (
  <HasFilters.Provider value={withFilters}>
    <div className={[styles.layout, withFilters ? '' : styles.single].filter(Boolean).join(' ')}>
      {children}
    </div>
  </HasFilters.Provider>
);

const Banner  = ({ children }: { children: ReactNode }) => <div className={styles.banner}>{children}</div>;
const Filters = ({ children }: { children: ReactNode }) => <aside className={styles.filters}>{children}</aside>;

/* Results/Toolbar must share a wrapper, which named-prop slots got for free.
   Here the caller has to nest them correctly, and nothing enforces it. */
const Results = ({ children }: { children: ReactNode }) => <div className={styles.results}>{children}</div>;
const Toolbar = ({ children }: { children: ReactNode }) => <div className={styles.toolbar}>{children}</div>;
const List    = ({ children }: { children: ReactNode }) => <div className={styles.list}>{children}</div>;

export const SearchLayoutCompound = Object.assign(Root, { Banner, Filters, Results, Toolbar, List });

/** Exposed so a brand fill can ask whether the filter rail is present. */
export const useHasFilters = () => useContext(HasFilters);
