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
      ...(onClick && { transition: 'box-shadow .2s', '&:hover': { boxShadow: 6 } }),
    }}
  >
    {onClick
      ? <CardActionArea aria-label={ariaLabel} onClick={onClick} component="div">{children}</CardActionArea>
      : children}
  </MuiCard>
);
