/* ============================================================================
   THE ARRIVAL, ARMED
   Signing in and seeing the app are two different renders on two different
   routes, so the moment has to be handed across. A one-shot flag does that
   without anything watching anything: sign-in arms it, the next page takes it,
   and taking it clears it.

   Per tab, because it describes this visit and not this person. When it should
   fire only on a member's *first ever* sign-in, that answer comes from the
   account — this flag stays exactly as it is and only the arming changes.
   ========================================================================= */

const KEY = 'arrival.pending';

/** Called by whatever just changed who you are. */
export const armArrival = () => {
  try { sessionStorage.setItem(KEY, '1'); } catch { /* storage can be unavailable */ }
};

let answeredThisTick: boolean | null = null;

/**
 * Read once, by whoever is about to render. Answers true at most once.
 *
 * The tick-scoped memo is not an optimisation. StrictMode runs a `useState`
 * initializer twice in development, and React keeps the *second* answer — so a
 * one-shot that cleared on the first call would answer true, then false, and
 * the animation would never run once. Both calls happen in the same
 * synchronous render, so answering the same thing until the microtask queue
 * drains makes the pair agree without anything having to know about StrictMode.
 */
export const takeArrival = (): boolean => {
  if (answeredThisTick !== null) return answeredThisTick;

  let armed = false;
  try {
    armed = sessionStorage.getItem(KEY) !== null;
    if (armed) sessionStorage.removeItem(KEY);
  } catch { /* storage can be unavailable */ }

  answeredThisTick = armed;
  queueMicrotask(() => { answeredThisTick = null; });
  return armed;
};
