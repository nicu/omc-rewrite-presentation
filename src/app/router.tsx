/* Minimal route state. A real app swaps this for react-router; nothing in the
   component layer knows the difference because regions receive callbacks. */

import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

export type Route =
  | { name: 'landing' }
  | { name: 'search'; destination: string }
  | { name: 'flights'; destination: string }
  | { name: 'signin' }
  | { name: 'account'; section?: string };

type RouterValue = { route: Route; go: (route: Route) => void };

const RouterCtx = createContext<RouterValue>({ route: { name: 'landing' }, go: () => {} });

export const RouterProvider = ({ children }: { children: ReactNode }) => {
  const [route, setRoute] = useState<Route>({ name: 'landing' });
  const value = useMemo(() => ({ route, go: setRoute }), [route]);
  return <RouterCtx.Provider value={value}>{children}</RouterCtx.Provider>;
};

export const useRouter = () => useContext(RouterCtx);
