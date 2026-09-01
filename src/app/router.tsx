/* ============================================================================
   ROUTER  ·  the URL is the state
   Every screen the user can be on has an address, including each wizard step
   and each set of search filters. Two consequences we care about:

     · the back button works, everywhere, without anyone writing back logic;
     · a link someone pastes into Slack opens what they were looking at.

   Regions never hold this state in useState. They read it from the route and
   write it with go() or replace(). A real app swaps this file for react-router
   and nothing in the component layer notices.

   go()      pushes  — a new place. Back returns to the previous one.
   replace() swaps   — same place, different view. Back skips it, so changing
                       a filter five times does not need five presses to leave.
   ========================================================================= */

import { createContext, useContext, useMemo, useSyncExternalStore, type ReactNode } from 'react';

import type { BusinessModelId, SortOption } from '../data/model';

/* Anything a screen needs in order to redraw itself belongs here. If it is not
   in the route, it does not survive a refresh or a paste. */
export type Route =
  | { name: 'landing' }
  | { name: 'search';  destination: string; sort?: SortOption; pay?: BusinessModelId }
  /* One property. `id` is a path segment rather than a query parameter
     because it is what the page *is*, not how it is filtered — and `pay`
     rides along so that leaving a search and opening a stay does not silently
     change the way you were being quoted. Both are strings off the address
     bar, so both are the region's to check. */
  | { name: 'stay';    id: string; pay?: BusinessModelId }
  | { name: 'flights'; destination: string; sort?: SortOption; pay?: BusinessModelId }
  /* `auth` is what the bank hands back on the return URL after a 3DS
     step-up. It is in the route because that is where a redirect can put it. */
  | { name: 'checkout'; step?: string; auth?: string }
  | { name: 'signin' }
  | { name: 'account'; section?: string }
  ;

type RouterValue = {
  route: Route;
  /** New place. Adds a history entry. */
  go: (route: Route) => void;
  /** Same place, different view. Overwrites the current history entry. */
  replace: (route: Route) => void;
  /** Whatever the browser's back button would do. */
  back: () => void;
};

/* --- URL <-> Route -------------------------------------------------------
   Hash routing so the build works from any subpath (GitHub Pages) with no
   server rewrite rules. #/stays?to=Los%20Cabos&sort=price-low&pay=earn-burn */

const PATHS = { search: 'stays', flights: 'flights' } as const;

export const toHash = (route: Route): string => {
  switch (route.name) {
    case 'search':
    case 'flights': {
      const q = new URLSearchParams();
      if (route.destination) q.set('to', route.destination);
      if (route.sort) q.set('sort', route.sort);
      if (route.pay) q.set('pay', route.pay);
      const query = q.toString();
      return `#/${PATHS[route.name]}${query ? `?${query}` : ''}`;
    }
    case 'stay':
      return `#/${PATHS.search}/${encodeURIComponent(route.id)}${route.pay ? `?pay=${route.pay}` : ''}`;
    case 'checkout':
      return `#/checkout/${route.step ?? 'details'}${route.auth ? `?auth=${encodeURIComponent(route.auth)}` : ''}`;
    case 'account':  return `#/account${route.section ? `/${route.section}` : ''}`;
    case 'signin':   return '#/signin';
    default:         return '#/';
  }
};

/* Everything here arrives from the address bar, so everything here is a guess.
   Values are handed on as-is and the region validates them — it is the one
   that knows which sorts exist for its vertical. */
const fromHash = (hash: string): Route => {
  const [path, query] = hash.replace(/^#\/?/, '').split('?');
  const [head, tail] = path.split('/');
  const q = new URLSearchParams(query);
  const list = () => ({
    destination: q.get('to') ?? '',
    sort: (q.get('sort') as SortOption) ?? undefined,
    pay:  (q.get('pay') as BusinessModelId) ?? undefined,
  });

  switch (head) {
    /* `#/stays` is the list and `#/stays/<id>` is one of them, so the segment
       after the vertical is what tells the two apart. The id is passed on
       exactly as it arrived — whether it names a property is a question only
       the region can answer, and it answers it against the data. */
    case PATHS.search:  return tail
      ? { name: 'stay', id: decodeURIComponent(tail), pay: list().pay }
      : { name: 'search', ...list() };
    case PATHS.flights: return { name: 'flights', ...list() };
    case 'checkout':    return { name: 'checkout', step: tail || undefined, auth: q.get('auth') ?? undefined };
    case 'account':     return { name: 'account', section: tail || undefined };
    case 'signin':      return { name: 'signin' };
    default:            return { name: 'landing' };
  }
};

/* --- the store -----------------------------------------------------------
   The browser already holds this state; we only subscribe to it. replace()
   does not fire hashchange, so we tell our own subscribers by hand. */

const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

const subscribe = (onChange: () => void) => {
  listeners.add(onChange);
  window.addEventListener('hashchange', onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener('hashchange', onChange);
  };
};

const getSnapshot = () => window.location.hash;

const RouterCtx = createContext<RouterValue>({
  route: { name: 'landing' }, go: () => {}, replace: () => {}, back: () => {},
});

export const RouterProvider = ({ children }: { children: ReactNode }) => {
  const hash = useSyncExternalStore(subscribe, getSnapshot);
  const route = useMemo(() => fromHash(hash), [hash]);

  const value = useMemo<RouterValue>(() => ({
    route,
    go: (next) => { window.location.hash = toHash(next); },
    replace: (next) => {
      history.replaceState(null, '', toHash(next));
      notify();
    },
    back: () => history.back(),
  }), [route]);

  return <RouterCtx.Provider value={value}>{children}</RouterCtx.Provider>;
};

export const useRouter = () => useContext(RouterCtx);
