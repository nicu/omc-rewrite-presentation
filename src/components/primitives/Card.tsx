import MuiCard from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import type { ReactNode, Ref } from 'react';

export const Card = ({ children, onClick, padded, ref, ariaLabel }: {
  children: ReactNode;
  onClick?: () => void;
  padded?: boolean;
  ref?: Ref<HTMLDivElement>;
  ariaLabel?: string;
}) => (
  <MuiCard
    ref={ref}
    sx={{
      overflow: 'hidden',
      ...(padded && { p: 2 }),
      ...(onClick && {
        transition: (theme) => theme.transitions.create('box-shadow'),
        /* Resolves to none in a brand that asked to be flat. */
        '&:hover': { boxShadow: 6 },
      }),
    }}
  >
    {onClick
      ? <CardActionArea aria-label={ariaLabel} onClick={onClick} component="div">{children}</CardActionArea>
      : children}
  </MuiCard>
);
