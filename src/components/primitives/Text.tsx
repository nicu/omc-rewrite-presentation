/* MUI Typography, with our own names for the roles. The map is here so a
   presenter asks for "title" and never for a font size. */

import Typography from '@mui/material/Typography';
import type { ElementType, ReactNode } from 'react';

export type TextVariant = 'displayLg' | 'displayMd' | 'heading' | 'title' | 'body' | 'caption' | 'overline';
export type TextTone =
  | 'primary' | 'secondary' | 'muted' | 'inverse'
  | 'brand' | 'accent' | 'disabled'
  /* Fixed against their backdrop rather than against the page. */
  | 'onBrand' | 'onMedia';

const VARIANT = {
  displayLg: 'h1', displayMd: 'h2', heading: 'h3', title: 'h6',
  body: 'body1', caption: 'body2', overline: 'overline',
} as const;

const COLOUR: Record<TextTone, string> = {
  primary: 'text.primary',
  secondary: 'text.secondary',
  muted: 'text.secondary',
  inverse: 'background.default',
  brand: 'primary.main',
  accent: 'secondary.main',
  disabled: 'text.disabled',
  onBrand: 'primary.contrastText',
  onMedia: 'common.white',
};

export const Text = ({ children, variant = 'body', tone = 'primary', as, clamp, id }: {
  children: ReactNode;
  variant?: TextVariant;
  tone?: TextTone;
  as?: ElementType;
  clamp?: number;
  id?: string;
}) => (
  <Typography
    id={id}
    {...(as ? { component: as } : {})}
    variant={VARIANT[variant]}
    sx={{
      color: COLOUR[tone],
      ...(variant === 'overline' && { display: 'block' }),
      ...(clamp && { display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: clamp, overflow: 'hidden' }),
    }}
  >
    {children}
  </Typography>
);
