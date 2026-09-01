/* ============================================================================
   QUERY CACHE
   ~70 lines, deliberately hand-rolled so the whole mechanism is readable.
   Shaped to map 1:1 onto RTK Query `builder.query` + tags in the real rewrite:
   keyed entries, in-flight dedup, ref-counted subscriptions, tag invalidation.
   ========================================================================= */

import { fault, isFailure, type Failure } from '../errors/failure';

type Spec<T> = {
  key: string;
  tags?: string[];
  fetch: (signal: AbortSignal) => Promise<T>;
  /** Set by .until(). While this says the answer is unfinished, keep asking. */
  done?: (data: T) => boolean;
  /** Set by .optional(). This one failing does not stop the region. */
  isOptional?: true;
};

export type Query<T> = Spec<T> & {
  /**
   * Some searches do not finish in one response: the server answers with what
   * it has and a flag saying whether that is all of it. Say when it is
   * finished and the cache does the rest — the interval, the guard against a
   * stale search key, giving up, and cleaning the timer up.
   *
   * Deliberately no interval or deadline at the call site. Those are one
   * decision for the whole app, and in the app we are replacing they were
   * written out by hand in each of the two places that poll — where they had
   * already started to disagree.
   */
  until(done: (data: T) => boolean): Query<T>;
  /**
   * "The page is still worth showing without this." A balance, a reviews
   * panel, a recommendation strip: it fails, the value is undefined, and the
   * region carries on. Without this, one optional request takes the page down.
   */
  optional(): OptionalQuery<T>;
};

/** Distinct from Query only so useLoad can type its value as possibly absent. */
export type OptionalQuery<T> = Query<T> & { isOptional: true };

export const query = <T>(spec: Spec<T>): Query<T> => ({
  ...spec,
  until: (done) => query({ ...spec, done }),
  optional: () => query({ ...spec, isOptional: true }) as OptionalQuery<T>,
});

type Entry = {
  /** `partial` is "we have some of it and more is coming" — the state a
   *  search sits in between the first response and the flag that says stop. */
  status: 'idle' | 'loading' | 'partial' | 'ready' | 'error';
  data?: unknown;
  error?: Failure;
  promise?: Promise<void>;
  tags: string[];
  subscribers: number;
  /** When the request started and finished. Used to show, rather than claim,
   *  that the queries in one useLoad call overlap. */
  startedAt?: number;
  endedAt?: number;
  /** Live poll, so leaving the page or invalidating can stop it. */
  pollTimer?: number;
  /** A request is out right now. Between polls the status is `partial` with no
   *  timer, which is also what a parked poll looks like — without this, every
   *  render during a request would start another one. */
  inFlight?: boolean;
};

const entries = new Map<string, Entry>();
const listeners = new Set<() => void>();
let version = 0;

const notify = () => { version += 1; listeners.forEach((l) => l()); };

/* One fetch, and — for a query that said .until() — however many more it takes.

   Everything the two hand-rolled polling loops in the app we are replacing got
   wrong lives here instead, once: the interval, the deadline, checking that
   the entry we are about to write into is still the one we started on, and
   clearing the timer when the page goes away.

   `startedPollingAt` is passed down rather than read off the entry, so the
   deadline is measured from the first request and not reset by each retry. */
const run = <T>(query: Query<T>, startedPollingAt: number) => {
  const entry = entries.get(query.key);
  if (!entry) return;                       // released while we were waiting

  const controller = new AbortController();
  entry.inFlight = true;
  entry.status = entry.data === undefined ? 'loading' : 'partial';
  entry.error = undefined;
  entry.startedAt ??= performance.now();
  entry.endedAt = undefined;
  entry.promise = query
    .fetch(controller.signal)
    .then((data) => {
      const e = entries.get(query.key);
      if (!e) return;                       // the search moved on; drop this answer
      e.data = data;

      const finished = query.done ? query.done(data) : true;
      const outOfTime = performance.now() - startedPollingAt > GIVE_UP_AFTER;
      if (finished || outOfTime) { e.status = 'ready'; return; }

      /* Still filling. Showing what has arrived is the whole point of asking
         again — a spinner over rows we already have is a worse page. */
      e.status = 'partial';
      e.pollTimer = window.setTimeout(() => run(query, startedPollingAt), POLL_EVERY);
    })
    .catch((err) => {
      const e = entries.get(query.key);
      if (!e) return;
      e.status = 'error';
      e.error = isFailure(err) ? err : fault('UNKNOWN', err);
    })
    .finally(() => {
      const e = entries.get(query.key);
      if (e) { e.endedAt = performance.now(); e.inFlight = false; }
      notify();
    });
  notify();
};

/** A poll that outlives its page keeps a tab busy for nothing. */
const stop = (entry: Entry | undefined) => {
  if (entry?.pollTimer !== undefined) {
    clearTimeout(entry.pollTimer);
    entry.pollTimer = undefined;
  }
};

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
    /* Idle, or a poll that was parked when the last reader left. Anything
       else is already in flight. */
    const parked = entry.status === 'partial' && entry.pollTimer === undefined && !entry.inFlight;
    if (entry.status !== 'idle' && !parked) return;
    run(query, performance.now());
  },

  /**
   * Put an answer we already have into an entry nobody has asked for yet.
   *
   * A row in a list of search results already carries most of a property: its
   * name, its picture, its rating, where it is. Navigating to that property
   * and then covering those facts with a skeleton — facts that were on the
   * screen a moment ago and are still true — is a worse page than showing
   * them. So the list hands its row over on the way out.
   *
   * The entry lands as `partial`, which is the word this cache already had
   * for "some of it, and more is coming". Nothing else had to change:
   * useLoad already gives a region data in that state, and ensure() already
   * treats a `partial` entry with no request out as one to pick up — so the
   * real fetch still runs and still overwrites this with the whole answer.
   *
   * It seeds only an untouched entry. A real answer already in hand beats a
   * summary, and a request already in flight must not be raced.
   */
  seed<T>(query: Query<T>, data: T) {
    const existing = entries.get(query.key);
    if (existing && existing.status !== 'idle') return;
    entries.set(query.key, {
      status: 'partial', data, tags: query.tags ?? [], subscribers: existing?.subscribers ?? 0,
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
    /* Nobody is looking any more, so stop asking. Measured: without this a
       search left half-finished kept polling for another half minute, on a
       page the reader had already navigated away from. The rows it had are
       kept, and ensure() picks the poll back up if they come back. */
    if (entry.subscribers <= 0) stop(entry);
    // Keep the data around briefly so remounting a modal is instant, then drop it.
    if (entry.subscribers <= 0) {
      setTimeout(() => {
        const e = entries.get(key);
        if (e && e.subscribers <= 0) { stop(e); entries.delete(key); }
      }, KEEP_UNUSED_FOR);
    }
  },

  invalidate(key: string) {
    stop(entries.get(key));
    entries.delete(key);
    notify();
  },

  invalidateTag(tag: string) {
    for (const [key, entry] of entries) {
      if (entry.tags.includes(tag)) { stop(entry); entries.delete(key); }
    }
    notify();
  },

  reset() {
    for (const entry of entries.values()) stop(entry);
    entries.clear();
    notify();
  },

  /** How long one request took, once it has finished. */
  durationOf: (key: string) => {
    const e = entries.get(key);
    return e?.startedAt !== undefined && e.endedAt !== undefined
      ? Math.round(e.endedAt - e.startedAt)
      : undefined;
  },

  /** [key, startedAt, endedAt] for every entry that has run. */
  timings: () =>
    [...entries.entries()]
      .filter(([, e]) => e.startedAt !== undefined)
      .map(([key, e]) => ({ key, startedAt: e.startedAt!, endedAt: e.endedAt })),
};

const KEEP_UNUSED_FOR = 30_000;

/* How often to ask again, and when to stop asking. One decision for the whole
   app rather than an argument at every call site — the app we are replacing
   spells both out in each of its two polling loops, and they had already
   drifted apart. */
const POLL_EVERY = 900;
const GIVE_UP_AFTER = 60_000;
