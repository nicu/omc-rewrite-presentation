/* ============================================================================
   KIOSK · its own sign-in
   A cover, then the form. The band across the top is built from the same
   shapes the rack is built from — quarter circles, leaves, arches — in the
   four cover colours, with two cells cut from the photograph so the band is
   not purely decorative.

   It ignores the `media` slot on purpose: this brand does not want a picture
   beside the form, it wants a masthead above it. That is the whole reason a
   layout is a slot rather than a flag.

   What it does not do is build a form. The one below is the shared one, so
   Kiosk gets the validation, the field errors and the tracking without
   knowing that any of them exist.
   ========================================================================= */

import { Stack } from '../../../components/primitives';
import type { SignInLayoutProps } from '../../../components/layouts';
import { useBrand } from '../../../app/brand';
import styles from './SignInLayout.module.css';

/** The band, as data: a shape and a fill per cell. The row repeats it for as
 *  many cells as the width allows, so the pattern reads the same at any size
 *  rather than stretching. */
const BAND = [
  { shape: 'leaf',    fill: 'cover-1' },
  { shape: 'circle',  fill: 'photo'   },
  { shape: 'quarter', fill: 'cover-3' },
  { shape: 'arch',    fill: 'none'    },
  { shape: 'leaf',    fill: 'cover-4' },
  { shape: 'half',    fill: 'cover-2' },
  { shape: 'circle',  fill: 'cover-1' },
  { shape: 'quarter', fill: 'photo'   },
  { shape: 'arch',    fill: 'cover-3' },
  { shape: 'leaf',    fill: 'cover-2' },
  { shape: 'half',    fill: 'cover-4' },
  { shape: 'circle',  fill: 'none'    },
  { shape: 'quarter', fill: 'cover-2' },
  { shape: 'leaf',    fill: 'photo'   },
] as const;

/* Two rows at the widest layout we care about. Anything past the band's own
   height is clipped, so a narrow window simply shows fewer. */
const CELLS = 40;

export const SignInLayout = ({ copy, aside, children }: SignInLayoutProps) => {
  const brand = useBrand();
  return (
    <div className={styles.page}>
      <div className={styles.band} aria-hidden="true">
        {Array.from({ length: CELLS }, (_, i) => BAND[i % BAND.length]).map(({ shape, fill }, i) => (
          <span
            key={i}
            className={`${styles.cell} ${styles[shape]}`}
            style={fill === 'photo'
              ? { backgroundImage: `url(${brand.signInImage})` }
              : fill === 'none' ? undefined : { background: `var(--${fill})` }}
            data-outline={fill === 'none' ? '' : undefined}
          />
        ))}
      </div>

      <div className={styles.column}>
        <Stack gap={5}>
          {aside}
          {copy}
          {children}
        </Stack>
      </div>
    </div>
  );
};
