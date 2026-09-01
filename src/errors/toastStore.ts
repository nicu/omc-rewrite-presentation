/* ============================================================================
   TOASTS
   Stands in for react-toastify + useToastMessage. Same shape as the real one:
   a region calls showError(failure) and a host at the app root renders it.
   ========================================================================= */

export type Toast = { id: number; severity: 'error' | 'warning' | 'success'; message: string };

let seq = 0;
let toasts: Toast[] = [];
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

export const toastStore = {
  subscribe: (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; },
  snapshot: () => toasts,
  push(severity: Toast['severity'], message: string) {
    const id = seq++;
    toasts = [{ id, severity, message }, ...toasts].slice(0, 4);
    notify();
    setTimeout(() => toastStore.dismiss(id), AUTO_CLOSE);
  },
  dismiss(id: number) {
    toasts = toasts.filter((t) => t.id !== id);
    notify();
  },
};

const AUTO_CLOSE = 6000;
