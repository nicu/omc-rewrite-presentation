/* ============================================================================
   FAILURE PANEL  ·  pure presenter
   Used when a page cannot render at all. Anything the user can retry or work
   around goes to a toast instead — same as the current app.
   ========================================================================= */

import { Button, Stack, Surface, Text } from '../../primitives';
import styles from './FailurePanel.module.css';

export type FailureSurface = 'page' | 'inline' | 'banner';

export const FailurePanel = ({ message, onRetry, surface = 'inline', severity = 'danger' }: {
  message: string; onRetry?: () => void;
  surface?: FailureSurface; severity?: 'danger' | 'warning' | 'info';
}) => (
  <div className={[styles.panel, styles[surface], styles[severity]].join(' ')}>
    <Surface tone="none" pad={surface === 'page' ? 'lg' : 'md'}>
      <Stack gap={3} align={surface === 'page' ? 'center' : 'start'}>
        <Text variant={surface === 'page' ? 'heading' : 'title'}>{message}</Text>
        {onRetry && <Button variant="secondary" size="sm" onClick={onRetry}>Try again</Button>}
      </Stack>
    </Surface>
  </div>
);
