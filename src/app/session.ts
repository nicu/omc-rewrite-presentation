/* ============================================================================
   THE VISIT
   Signing in is mocked, so there is no session and no token — but the chrome
   still has to know, because "My account" and "Sign in" are not the same
   button. Before this, being signed in was inferred from standing on the
   account page, which stopped being true the moment sign-in sent you
   somewhere else.

   Per tab, and gone on reload: it describes this visit, not this person.

   It publishes changes because signing out does not always move you: sign out
   from the landing page and the route is the same route, so nothing would
   re-render and the header would still say "My account". One subscription,
   the same shape the cache uses.
   ========================================================================= */

import { useSyncExternalStore } from 'react';

const KEY = 'session.signedIn';

const listeners = new Set<() => void>();
const announce = () => { for (const listener of listeners) listener(); };

export const signIn = () => {
  try { sessionStorage.setItem(KEY, '1'); } catch { /* storage can be unavailable */ }
  announce();
};

export const signOut = () => {
  try { sessionStorage.removeItem(KEY); } catch { /* storage can be unavailable */ }
  announce();
};

/** A read, so it is safe to call while rendering. */
export const isSignedIn = (): boolean => {
  try { return sessionStorage.getItem(KEY) !== null; } catch { return false; }
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
};

/** Signed in or not, and re-rendered when that changes. */
export const useSession = (): boolean => useSyncExternalStore(subscribe, isSignedIn, () => false);
