/* ============================================================================
   TRACK MAPS
   A presenter OFFERS actions and builds a payload per action.
   An INSTANCE names the catalog event each action maps to — or omits it,
   and that action costs nothing.
   A LAYOUT does neither.
   ========================================================================= */

import { useMemo } from 'react';

import type { EventName, EventPayloadMap } from './catalog';
import { useEmit } from './context';

/**
 * The union of catalog events whose payload is satisfied by P.
 * This is what makes `track={{ select: 'SEARCH_SORTED' }}` a compile error on a
 * card whose `select` action produces a product payload.
 */
export type EventAccepting<P> = {
  [E in EventName]: P extends EventPayloadMap[E] ? E : never;
}[EventName];

/** Actions is a map of action name -> the payload shape that action produces. */
export type TrackMap<Actions> = { [K in keyof Actions]?: EventAccepting<Actions[K]> };

/** Payload builders, one per action. Arguments are supplied at fire time. */
type Builders<Actions> = { [K in keyof Actions]: (...args: never[]) => Actions[K] };

type Emitters<Actions, B extends Builders<Actions>> = {
  [K in keyof Actions]: (...args: Parameters<B[K]>) => void;
};

/**
 * Binds a track map to its builders. Every returned emitter is always callable:
 * unmapped actions are no-ops, so presenters never write `track?.x && emit(...)`.
 * Builders run only when the action is both mapped and fired — so an
 * uninstrumented card in a 200-item list computes nothing.
 */
export const useTracking = <Actions, B extends Builders<Actions>>(
  map: TrackMap<Actions> | undefined,
  builders: B,
): Emitters<Actions, B> => {
  const emit = useEmit();

  return useMemo(() => {
    const bound = {} as Emitters<Actions, B>;
    for (const action of Object.keys(builders) as (keyof Actions)[]) {
      const event = map?.[action];
      bound[action] = event
        ? ((...args: never[]) => {
            emit(event as EventName, builders[action](...args) as never);
          }) as Emitters<Actions, B>[typeof action]
        : (noop as Emitters<Actions, B>[typeof action]);
    }
    return bound;
    // builders are recreated per render by design (they close over fresh props);
    // the map is what decides wiring, so that is the dependency that matters.
  }, [map, emit]);
};

const noop = () => {};
