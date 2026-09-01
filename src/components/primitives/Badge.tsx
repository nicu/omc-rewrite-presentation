import Chip from '@mui/material/Chip';
import type { ReactNode } from 'react';

export type BadgeTone = 'brand' | 'accent' | 'neutral' | 'solid' | 'success' | 'warning' | 'danger';

const COLOUR = {
  brand: 'primary', accent: 'secondary', neutral: 'default', solid: 'primary',
  success: 'success', warning: 'warning', danger: 'error',
} as const;

export const Badge = ({ children, tone = 'neutral' }: { children: ReactNode; tone?: BadgeTone }) => (
  <Chip
    size="small"
    label={children}
    color={COLOUR[tone]}
    variant={tone === 'solid' ? 'filled' : 'outlined'}
  />
);
