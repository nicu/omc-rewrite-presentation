/* ============================================================================
   SIGN-IN  ·  the arrangements
   The region owns signing in — the validation, the rejection, the telemetry.
   None of that is here. What is here is only *where the parts go*, and that
   turned out to be the thing brands actually wanted to change.

   So a sign-in layout is handed the finished parts and decides nothing else:

     media     the brand's picture. A layout may ignore it entirely.
     copy      the headline and the line under it.
     aside     the brand's extra line. Each layout decides where it lands.
     children  the form, already wired. No layout ever builds one.

   Two shipped here; a brand can pass its own instead. Either way it inherits
   the form, which means it inherits the validation and the tracking too.
   ========================================================================= */

import type { ComponentType, ReactNode } from 'react';

import { SplitLayout } from './SplitLayout';
import { Stack, Text } from '../primitives';
import { useBrand } from '../../app/brand';
import styles from './SignInLayouts.module.css';

export type SignInLayoutProps = {
  media?: ReactNode;
  copy: ReactNode;
  aside?: ReactNode;
  children: ReactNode;
};

/** Two halves: picture on one side, form on the other. What everyone gets.
 *  The tagline over the picture belongs to this arrangement — a layout with no
 *  picture has nowhere to put it — so it is read here rather than passed in. */
export const SplitSignIn: ComponentType<SignInLayoutProps> = ({ media, copy, aside, children }) => {
  const brand = useBrand();
  return (
    <SplitLayout
      media={media}
      mediaOverlay={
        <Stack gap={3} align="start">
          {aside}
          <Text variant="displayMd" tone="onMedia">{brand.tagline}</Text>
        </Stack>
      }
    >
      {copy}
      {children}
    </SplitLayout>
  );
};

/** One picture behind everything, with the form floating on it. The card is a
 *  plain surface, so on a brand whose surfaces are glass it becomes glass —
 *  this layout does not know that and does not need to. */
export const CanvasSignIn: ComponentType<SignInLayoutProps> = ({ media, copy, aside, children }) => (
  <div className={styles.canvas}>
    {media && <div className={styles.canvasMedia}>{media}</div>}
    <div className={styles.canvasScrim} />
    <div className={styles.card}>
      <Stack gap={5}>
        {aside}
        {copy}
        {children}
      </Stack>
    </div>
  </div>
);
