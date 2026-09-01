/* ============================================================================
   QUERY CACHE
   ~70 lines, deliberately hand-rolled so the whole mechanism is readable.
   Shaped to map 1:1 onto RTK Query `builder.query` + tags in the real rewrite:
   keyed entries, in-flight dedup, ref-counted subscriptions, tag invalidation.
   ========================================================================= */

import { fault, isFailure, type Failure } from '../errors/failure';

export type Query<T> = {
  key: string;
  tags?: string[];
  fetch: (signal: AbortSignal) => Promise<T>;
};

type Entry = {
  status: 'idle' | 'loading' | 'ready' | 'error';
  data?: unknown;
  error?: Failure;
  promise?: Promise<void>;
  tags: string[];
  subscribers: number;
  /** When the request started and finished. Used to show, rather than claim,
   *  that the queries in one useLoad call overlap. */
  startedAt?: number;
  endedAt?: number;
};

const entries = new Map<string, Entry>();
const listeners = new Set<() => void>();
let version = 0;

const notify = () => { version += 1; listeners.forEach((l) => l()); };

export const cache = {
  getVersion: () => version,
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  },
  peek: (key: string): Entry | undefined => entries.get(key),

  /**
   * Starts the fetch only for an untouched entry, so it is safe to call on
   * every render. Notably it does NOT retry an errored entry: that would loop
   * forever, since each failure notifies and triggers another render. Clearing
   * the entry (invalidate/reset/retry) is what makes it fetchable again.
   */
  ensure<T>(query: Query<T>) {
    let entry = entries.get(query.key);
    if (!entry) {
      entry = { status: 'idle', tags: query.tags ?? [], subscribers: 0 };
      entries.set(query.key, entry);
    }
    if (entry.status !== 'idle') return;

    const controller = new AbortController();
    entry.status = 'loading';
    entry.error = undefined;
    entry.startedAt = performance.now();
    entry.endedAt = undefined;
    entry.promise = query
      .fetch(controller.signal)
      .then((data) => {
        const e = entries.get(query.key)!;
        e.status = 'ready';
        e.data = data;
      })
      .catch((err) => {
        const e = entries.get(query.key)!;
        e.status = 'error';
        e.error = isFailure(err) ? err : fault('UNKNOWN', err);
      })
      .finally(() => {
        entries.get(query.key)!.endedAt = performance.now();
        notify();
      });
    notify();
  },

  retain(key: string) {
    const entry = entries.get(key);
    if (entry) entry.subscribers += 1;
  },

  release(key: string) {
    const entry = entries.get(key);
    if (!entry) return;
    entry.subscribers -= 1;
    // Keep the data around briefly so remounting a modal is instant, then drop it.
    if (entry.subscribers <= 0) {
      setTimeout(() => {
        const e = entries.get(key);
        if (e && e.subscribers <= 0) entries.delete(key);
      }, KEEP_UNUSED_FOR);
    }
  },

  invalidate(key: string) {
    entries.delete(key);
    notify();
  },

  invalidateTag(tag: string) {
    for (const [key, entry] of entries) if (entry.tags.includes(tag)) entries.delete(key);
    notify();
  },

  reset() { entries.clear(); notify(); },

  /** [key, startedAt, endedAt] for every entry that has run. */
  timings: () =>
    [...entries.entries()]
      .filter(([, e]) => e.startedAt !== undefined)
      .map(([key, e]) => ({ key, startedAt: e.startedAt!, endedAt: e.endedAt })),
};

const KEEP_UNUSED_FOR = 30_000;
