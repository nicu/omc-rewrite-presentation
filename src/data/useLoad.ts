/* ============================================================================
   useLoad  ·  the load boundary
   One call declares everything a region needs. All queries start together, so
   there is no waterfall; there is one status to guard on, so there is no
   nesting.

   It does not name itself. The <Analytics> wrapper above the region does that,
   and this hook reads the name from context — which is why the string appears
   once in the codebase instead of once here and once around the markup.
   ========================================================================= */

import { useEffect, useMemo, useRef, useSyncExternalStore } from 'react';

import type { EventName } from '../telemetry/catalog';
import { useAmbient, useEmit } from '../telemetry/context';
import type { Failure } from '../errors/failure';
import { cache, type OptionalQuery, type Query } from './cache';

/* `any` rather than `unknown`: a Query mentions its own type in both an
   argument and a return position, so Query<Hotel[]> is not assignable to
   Query<unknown>. This is the one place that costs us. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type QueryMap = Record<string, Query<any>>;

/** What each name holds once it has arrived. An .optional() one may not. */
type Loaded<Q extends QueryMap> = {
  [K in keyof Q]: Q[K] extends OptionalQuery<infer T> ? T | undefined
    : Q[K] extends Query<infer T> ? T
    : never;
};

type Options<Q extends QueryMap> = {
  /** Fired once when the region's data first resolves. */
  pageView?: EventName;
  /** Called once per failure, so the region can decide where it surfaces:
   *  a toast, an inline panel, or nothing. Logging happens regardless. */
  onFailure?: (failure: Failure) => void;
  /** Called once, when the region's data first arrives. This is where the
   *  work that used to be a useEffect in every region goes: correct the URL,
   *  finish something the page was sent back to finish, focus a field.
   *  Regions get a callback; the effect lives here, once. */
  onReady?: (data: Loaded<Q>) => void;
};

/**
 * Four states, not three. `partial` is the one the app we are replacing has no
 * word for: everything asked for has answered, but a search is still filling
 * in. Both `partial` and `ready` carry data, so a region draws the same rows
 * either way and only decides whether to say "still looking".
 */
type Result<Q extends QueryMap> =
  | { status: 'loading'; data: undefined; error: undefined; retry: () => void }
  | { status: 'error'; data: undefined; error: Failure; retry: () => void }
  | { status: 'partial'; data: Loaded<Q>; error: undefined; retry: () => void }
  | { status: 'ready'; data: Loaded<Q>; error: undefined; retry: () => void };

export const useLoad = <Q extends QueryMap>(queries: Q, options: Options<Q> = {}): Result<Q> => {
  const emit = useEmit();
  /* The name <Analytics> put above us. Only OPERATION_FAILED needs it as a
     value — every other event carries it in the context already. */
  const { region } = useAmbient();
  const names = Object.keys(queries);
  const keys = names.map((n) => queries[n].key);
  const fingerprint = keys.join('|');

  // Subscribe once to the cache; re-render on any entry change.
  useSyncExternalStore(cache.subscribe, cache.getVersion);

  useEffect(() => {
    keys.forEach(cache.retain);
    return () => { keys.forEach(cache.release); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fingerprint]);

  // Deliberately un-keyed: runs after every render so a cleared entry (retry,
  // invalidate, a tag drop elsewhere) starts fetching again on its own.
  // ensure() no-ops unless the entry is idle, so this stays cheap.
  useEffect(() => {
    for (const name of names) cache.ensure(queries[name]);
  });

  const result = useMemo(() => {
    const loaded = {} as Loaded<Q>;
    let firstError: Failure | undefined;
    let pending = false;
    let filling = false;

    for (const name of names) {
      const entry = cache.peek(queries[name].key);
      const optional = queries[name].isOptional === true;

      if (!entry || entry.status === 'idle' || entry.status === 'loading') pending = true;
      else if (entry.status === 'error') {
        // An optional one failing leaves its value undefined and nothing else.
        if (!optional) firstError ??= entry.error;
      } else {
        if (entry.status === 'partial') filling = true;
        (loaded as Record<string, unknown>)[name] = entry.data;
      }
    }
    // An error wins over a pending sibling: there is nothing useful to wait for.
    if (firstError) return { status: 'error' as const, error: firstError };
    if (pending) return { status: 'loading' as const };
    if (filling) return { status: 'partial' as const, data: loaded };
    return { status: 'ready' as const, data: loaded };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fingerprint, cache.getVersion()]);

  /* --- automatic instrumentation: the reason the region names itself ----- */

  const reported = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (result.status !== 'error') return;
    const signature = `${fingerprint}:${result.error.code}`;
    if (reported.current === signature) return;
    reported.current = signature;
    for (const name of names) {
      const key = queries[name].key;
      const ms = cache.durationOf(key);
      if (ms !== undefined) emit('REQUEST_COMPLETED', { name: key, ms, ok: false });
    }
    options.onFailure?.(result.error);
    emit('OPERATION_FAILED', {
      kind: result.error.kind,
      code: result.error.code,
      region: region ?? '',
      retryable: result.error.kind === 'rejection' ? result.error.retryable : false,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result.status, fingerprint, emit, region]);

  /* Engineering health. Nothing at a call site asks for this: the region
     already knows what it fetched and the cache already knows how long each
     one took, so it costs nothing to report. Routed to App Insights only. */
  const timed = useRef(false);
  useEffect(() => {
    if (result.status !== 'ready' || timed.current || names.length === 0) return;
    timed.current = true;

    let slowest = 0;
    for (const name of names) {
      const key = queries[name].key;
      const ms = cache.durationOf(key);
      if (ms === undefined) continue;
      slowest = Math.max(slowest, ms);
      emit('REQUEST_COMPLETED', { name: key, ms, ok: true });
    }
    emit('PAGE_READY', { ms: slowest, requests: names.length });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result.status, fingerprint, emit]);

  /* Latest callback, so a region can close over fresh values without the
     effect below re-running every render. */
  const onReady = useRef(options.onReady);
  onReady.current = options.onReady;

  const viewed = useRef(false);
  useEffect(() => {
    if (result.status !== 'ready' || viewed.current) return;
    viewed.current = true;
    // Fires when content is actually shown, not on route change — so the payload
    // can carry result counts and business model, which the region already has.
    if (options.pageView) emit(options.pageView, {} as never);
    onReady.current?.(result.data as Loaded<Q>);
  }, [result.status, emit, options.pageView]);

  // Clearing is enough: the un-keyed effect above refetches on the next render.
  const retry = useMemo(
    () => () => keys.forEach((key) => cache.invalidate(key)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fingerprint],
  );

  return { ...result, error: undefined, data: undefined, ...result, retry } as Result<Q>;
};
