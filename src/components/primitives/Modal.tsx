import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import type { ReactNode } from 'react';

/** A dialog with slots, like every other layout here: it holds a title, a
 *  body and some buttons, and knows nothing about any of them. */
export const Modal = ({ open, title, children, actions, onClose }: {
  open: boolean;
  title: string;
  children: ReactNode;
  actions?: ReactNode;
  /** Omit to make the dialog unskippable — which a bank step-up is. */
  onClose?: () => void;
}) => (
  <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
    <DialogTitle>{title}</DialogTitle>
    <DialogContent>{children}</DialogContent>
    {actions && <DialogActions sx={{ px: 3, pb: 3 }}>{actions}</DialogActions>}
  </Dialog>
);
