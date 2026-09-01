import { useSyncExternalStore } from 'react';

import { Stack, Text } from '../../primitives';
import { toastStore } from '../../../errors/toastStore';
import styles from './ToastHost.module.css';

/** Rendered once at the app root. Regions never render a toast themselves. */
export const ToastHost = () => {
  const toasts = useSyncExternalStore(toastStore.subscribe, toastStore.snapshot);

  return (
    <div className={styles.host} role="status" aria-live="polite">
      {toasts.map((toast) => (
        <div key={toast.id} className={[styles.toast, styles[toast.severity]].join(' ')}>
          <Stack direction="horizontal" gap={3} align="center" justify="between">
            <Text variant="caption">{toast.message}</Text>
            <button type="button" className={styles.close} aria-label="Dismiss"
                    onClick={() => toastStore.dismiss(toast.id)}>&times;</button>
          </Stack>
        </div>
      ))}
    </div>
  );
};
