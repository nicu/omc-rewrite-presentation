import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useState, type ReactNode, type UIEvent } from 'react';

/** Expand/collapse. Reports open-state so a presenter can map it to an action. */
export const Disclosure = ({ label, children, onToggle }: {
  label: string; children: ReactNode; onToggle?: (open: boolean) => void;
}) => (
  <Accordion
    disableGutters
    square
    elevation={0}
    onChange={(_, expanded) => onToggle?.(expanded)}
    sx={{ bgcolor: 'transparent', '&::before': { display: 'none' }, borderTop: 1, borderColor: 'divider' }}
  >
    <AccordionSummary sx={{ px: 0, minHeight: 0 }}>
      <Typography variant="body2" sx={{ fontWeight: 500 }}>{label}</Typography>
    </AccordionSummary>
    <AccordionDetails sx={{ px: 0, pt: 0 }}>{children}</AccordionDetails>
  </Accordion>
);

/** Scroll container that reports depth — the only way to observe "scrolled for more". */
export const ScrollArea = ({ children, maxHeight = 6, onScrollEnd }: {
  children: ReactNode; maxHeight?: number; onScrollEnd?: (depth: number) => void;
}) => {
  const [reported, setReported] = useState(false);
  const handle = (e: UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const depth = (el.scrollTop + el.clientHeight) / el.scrollHeight;
    if (!reported && depth > 0.85) { setReported(true); onScrollEnd?.(Math.round(depth * 100)); }
  };
  return (
    <Box onScroll={handle} sx={{ overflowY: 'auto', overscrollBehavior: 'contain', maxHeight: `var(--space-${maxHeight})` }}>
      {children}
    </Box>
  );
};
