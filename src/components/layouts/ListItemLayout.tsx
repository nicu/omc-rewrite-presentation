/* ============================================================================
   LIST ITEM LAYOUT
   A row in a list of things: an optional picture, the thing itself, and
   whatever sits on the right — a price, a status, a button.

   It has no idea whether the row is a hotel, a flight or a past booking.
   That is the point: the three fill the same three gaps differently.
   ========================================================================= */

import type { ReactNode, Ref } from 'react';

import { Card } from '../primitives';
import styles from './ListItemLayout.module.css';

export type ListItemLayoutProps = {
  /** Left-hand picture. Leave it out and the row closes up. */
  media?: ReactNode;
  /** The middle: title, description, whatever this thing is. */
  body: ReactNode;
  /** The right-hand edge: a price, a status, an action. */
  aside?: ReactNode;

  onClick?: () => void;
  ariaLabel?: string;
  ref?: Ref<HTMLDivElement>;
};

export const ListItemLayout = ({ media, body, aside, onClick, ariaLabel, ref }: ListItemLayoutProps) => (
  <Card ref={ref} onClick={onClick} ariaLabel={ariaLabel}>
    <div className={[
      styles.item,
      media ? styles.withMedia : styles.withoutMedia,
      aside ? '' : styles.noAside,
    ].filter(Boolean).join(' ')}>
      {media}
      <div className={styles.body}>{body}</div>
      {aside && (
        <div className={[styles.aside, media ? '' : styles.asideFlush].filter(Boolean).join(' ')}>
          {aside}
        </div>
      )}
    </div>
  </Card>
);
