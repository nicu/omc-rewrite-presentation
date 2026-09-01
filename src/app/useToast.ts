import { useCallback } from 'react';

import type { Failure } from '../errors/failure';
import { failureMessage } from '../errors/messages';
import { toastStore } from '../errors/toastStore';

/** Mirrors useToastMessage().addApiError in the current app. */
export const useToast = () => {
  const showFailure = useCallback((failure: Failure) => {
    toastStore.push(failure.kind === 'rejection' ? 'warning' : 'error', failureMessage(failure));
  }, []);
  const showMessage = useCallback((severity: 'error' | 'warning' | 'success', message: string) => {
    toastStore.push(severity, message);
  }, []);
  return { showFailure, showMessage };
};
