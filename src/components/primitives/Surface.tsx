import type { ReactNode } from 'react';
import styles from './Surface.module.css';

export type SurfaceTone = 'page' | 'raised' | 'sunken' | 'inverse' | 'brand' | 'brandSubtle' | 'accent' | 'accentSubtle' | 'none';
export type Elevation = 'flat' | 'raised' | 'card' | 'popover' | 'modal';
export type Radius = 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';

type SurfaceProps = {
  children: ReactNode;
  tone?: SurfaceTone;
  pad?: 'none' | 'sm' | 'md' | 'lg';
  radius?: Radius;
  elevation?: Elevation;
  bordered?: boolean;
  as?: 'div' | 'section' | 'article' | 'aside' | 'header' | 'footer';
};

const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

export const Surface = ({
  children, tone = 'raised', pad = 'none', radius = 'none', elevation = 'flat', bordered, as: Tag = 'div',
}: SurfaceProps) => (
  <Tag className={[
    styles.surface, styles[tone], styles[`pad${cap(pad)}`],
    styles[`radius${cap(radius)}`], styles[`elevation${cap(elevation)}`],
    bordered ? styles.bordered : '',
  ].filter(Boolean).join(' ')}>
    {children}
  </Tag>
);
