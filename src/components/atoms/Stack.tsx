import type { ReactNode, Ref } from 'react';
import styles from './Stack.module.css';

/** Spacing scale positions — never raw pixels. */
export type Space = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

type StackProps = {
  children: ReactNode;
  direction?: 'vertical' | 'horizontal';
  gap?: Space;
  align?: 'start' | 'center' | 'end' | 'stretch' | 'baseline';
  justify?: 'start' | 'center' | 'end' | 'between';
  wrap?: boolean;
  grow?: boolean;
  as?: 'div' | 'ul' | 'li' | 'section' | 'nav' | 'header' | 'footer' | 'form';
  ref?: Ref<HTMLDivElement>;
};

const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

export const Stack = ({
  children, direction = 'vertical', gap = 4, align, justify, wrap, grow, as: Tag = 'div', ref,
}: StackProps) => (
  <Tag
    ref={ref as never}
    className={[
      styles.stack, styles[direction], styles[`gap${gap}`],
      align ? styles[`align${cap(align)}`] : '',
      justify ? styles[`justify${cap(justify)}`] : '',
      wrap ? styles.wrap : '', grow ? styles.grow : '',
    ].filter(Boolean).join(' ')}
  >
    {children}
  </Tag>
);
