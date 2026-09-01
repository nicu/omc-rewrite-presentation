/* ============================================================================
   useLoad  ·  the load boundary
   One call declares everything a region needs. All queries start together, so
   there is no waterfall; there is one status to guard on, so there is no
   nesting. The region names itself here — and that same name becomes the
   telemetry region for every event emitted beneath it.
   ========================================================================= */

import { useEffect, useMemo, useRef, useSyncExternalStore, type ReactNode } from 'react';

import type { EventName } from '../telemetry/catalog';
import { RegionScope, useEmit } from '../telemetry/context';
import type { Failure } from '../errors/failure';
import { cache, type Query } from './cache';

type QueryMap = Record<string, Query<unknown>>;
type Loaded<Q extends QueryMap> = { [K in keyof Q]: Q[K] extends Query<infer T> ? T : never };

type Options = {
  /** Region name — used for telemetry and for failure reporting. */
  name: string;
  /** Fired once when the region's data first resolves. */
  pageView?: EventName;
  /** Called once per failure, so the region can decide where it surfaces:
   *  a toast, an inline panel, or nothing. Logging happens regardless. */
  onFailure?: (failure: Failure) => void;
};

type Result<Q extends QueryMap> =
  | { status: 'loading'; data: undefined; error: undefined; retry: () => void; Scope: (p: { children: ReactNode }) => ReactNode }
  | { status: 'error'; data: undefined; error: Failure; retry: () => void; Scope: (p: { children: ReactNode }) => ReactNode }
  | { status: 'ready'; data: Loaded<Q>; error: undefined; retry: () => void; Scope: (p: { children: ReactNode }) => ReactNode };

export const useLoad = <Q extends QueryMap>(queries: Q, options: Options): Result<Q> => {
  const emit = useEmit();
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

    for (const name of names) {
      const entry = cache.peek(queries[name].key);
      if (!entry || entry.status === 'idle' || entry.status === 'loading') pending = true;
      else if (entry.status === 'error') firstError ??= entry.error;
      else (loaded as Record<string, unknown>)[name] = entry.data;
    }
    // An error wins over a pending sibling: there is nothing useful to wait for.
    if (firstError) return { status: 'error' as const, error: firstError };
    if (pending) return { status: 'loading' as const };
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
    options.onFailure?.(result.error);
    emit(
      'OPERATION_FAILED',
      {
        kind: result.error.kind,
        code: result.error.code,
        region: options.name,
        retryable: result.error.kind === 'rejection' ? result.error.retryable : false,
      },
      { region: options.name },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result.status, fingerprint, emit, options.name]);

  const viewed = useRef(false);
  useEffect(() => {
    if (result.status !== 'ready' || viewed.current || !options.pageView) return;
    viewed.current = true;
    // Fires when content is actually shown, not on route change — so the payload
    // can carry result counts and business model, which the region already has.
    emit(options.pageView, {} as never, { region: options.name });
  }, [result.status, emit, options.pageView, options.name]);

  const Scope = useMemo(
    () => ({ children }: { children: ReactNode }) => RegionScope({ region: options.name, children }),
    [options.name],
  );

  // Clearing is enough: the un-keyed effect above refetches on the next render.
  const retry = useMemo(
    () => () => keys.forEach((key) => cache.invalidate(key)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fingerprint],
  );

  return { ...result, error: undefined, data: undefined, ...result, retry, Scope } as Result<Q>;
};
