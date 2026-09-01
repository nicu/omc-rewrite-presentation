import MuiButton from '@mui/material/Button';
import type { ReactNode } from 'react';

/** Our four intents mapped onto MUI's variant/colour pairs. */
const STYLE = {
  primary:   { variant: 'contained', color: 'primary' },
  accent:    { variant: 'contained', color: 'secondary' },
  secondary: { variant: 'outlined',  color: 'inherit' },
  ghost:     { variant: 'text',      color: 'primary' },
} as const;

export type ButtonProps = {
  children: ReactNode;
  onClick?: () => void;
  variant?: keyof typeof STYLE;
  size?: 'sm' | 'md' | 'lg';
  block?: boolean;
  disabled?: boolean;
  type?: 'button' | 'submit';
  ariaLabel?: string;
};

const SIZE = { sm: 'small', md: 'medium', lg: 'large' } as const;

export const Button = ({
  children, onClick, variant = 'primary', size = 'md', block, disabled, type = 'button', ariaLabel,
}: ButtonProps) => (
  <MuiButton
    type={type}
    aria-label={ariaLabel}
    disabled={disabled}
    onClick={onClick}
    fullWidth={block}
    size={SIZE[size]}
    variant={STYLE[variant].variant}
    color={STYLE[variant].color}
  >
    {children}
  </MuiButton>
);
