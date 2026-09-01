# Data — loading, shaping and storing

## One call declares a region's data

```ts
const { data, status, error, retry, Scope } = useLoad(
  { destinations: destinationsQuery(), promos: promosQuery(), featured: featuredHotelsQuery() },
  { name: 'hotel.landing', pageView: 'LANDING_VIEWED' },
);
```

What that one call is doing, and why there is never a second one in the same
region:

- **Everything runs in parallel.** Three queries, one round of waiting. Two
  `useLoad` calls in one region is a waterfall.
- **One status guard.** `loading` → skeleton, `error` → `FailurePanel`, `ready` →
  the page. Not one spinner per box.
- **It names the telemetry region.** `name` becomes the `region` dimension on every
  event emitted inside `Scope`. That is how you can answer "what does this page
  send" by reading one call.
- **It declares the page view.** One event, fired once, when the data is actually
  there.
- **It gives you `retry`** without a retry framework.
- **`__cache.timings()`** in the console shows when each request started and
  finished, so the parallelism is demonstrable, not claimed.

### Callbacks, not effects

```ts
useLoad(queries, {
  name: 'checkout',
  onReady: (data) => { /* deep-link guard, resume a 3DS return */ },
  onFailure: (failure) => { /* toast, log */ },
});
```

`onReady` and `onFailure` exist so that **no region needs an effect**. If you are
about to write `useEffect(() => { if (data) … }, [data])`, that is `onReady`.

## Queries

`src/data/queries.ts`. A query is a key and a function:

```ts
export const hotelSearchQuery = (criteria: SearchCriteria): Query<Hotel[]> => ({
  key: `hotel.search:${criteria.destination}:${criteria.sort}:${criteria.pay}`,
  run: () => api.searchHotels(criteria),
});
```

**The key is the cache identity.** Everything the answer depends on must be in it.
Leave out `sort` and two different searches silently share a result — and it will
look like a caching win until someone notices.

Queries are the only place a request is described. A region names queries; it does
not call `api.*` directly.

### An answer that is absent is not an answer that failed

`hotelQuery` returns `Query<Hotel | undefined>`. An id that is not a property comes
back as nothing, not as a `Failure`, because the request worked — the answer is
that there is no such stay. Routing it through the failure path would put a "Try
again" button on a page whose only possible outcome is the same answer.

Rule: **use a failure when something broke, and an absence when the question was
answered and the answer is no.** A region guards for the absence and renders a
page; a failure goes to `FailurePanel` or a toast as usual.

## Handing a page what it already knows

`cache.seed(query, data)` puts an answer we already have into an entry nobody has
asked for yet. `HotelSearchRegion` calls it as the reader clicks a row:

```ts
const openStay = (hotel: Hotel) => {
  cache.seed(hotelQuery(hotel.id), hotel);
  router.go({ name: 'stay', id: hotel.id, pay: businessModel });
};
```

The row already carried the name, the picture, the rating and the destination.
Drawing a skeleton over facts that were on the screen a moment ago and are still
true is a worse page, so the list hands its row over on the way out.

Nothing new had to be invented for the receiving end:

- The seeded entry lands as **`partial`** — the word this cache already had for
  "some of it, and more is coming", from a search that answers in stages.
- `useLoad` already gives a region its data in that state, so the details region
  has one status guard, not a second code path.
- `cache.ensure` already treats a `partial` entry with no request out as one to
  pick up, so the real fetch still runs and still overwrites the summary.

Three things to keep true when you use it:

1. **Seed at the moment of navigating, not on render.** Seeding six rows to use one
   of them is work spent on the five nobody asked for.
2. **Pass the query descriptor, not a key string.** `seed(hotelQuery(id), hotel)`
   asks the descriptor where the answer will be looked for; a hand-written key is a
   second definition waiting to disagree with the first.
3. **The seed must be a genuine subset.** `api.searchHotels` strips `rooms` and
   `overview` from every row it returns, so a search row really is missing what the
   details page waits for. If the list quietly carried everything, the skeleton
   would be theatre.

The last one is what decides where the skeleton goes: **cover only the fields the
seed could not carry**, and test that by looking at the data rather than at the
status. `HotelDetailsRegion` asks `hotel.rooms ? … : <ResultListSkeleton />`, not
`status === 'partial' ? …`, so a cold link — where nothing was seeded and nothing
is known — draws the whole page's skeleton through the same code.

## Shape — the fourth kind of business logic

The query is where the API's shape stops being our shape. This API has reads
declared as writes, POST envelopes, and prose where error codes should be. All of
that gets absorbed **here**, once, so nothing above knows:

- Adapt to our model types in `src/data/model.ts` — do not let a DTO reach a
  presenter.
- One model per thing, shared across brands and verticals. If two verticals want
  nearly the same shape, they want the same shape.

## Where each answer lives

Four homes. Putting an answer in the wrong one is the most expensive mistake in
this area, so this table is the rule:

| Home | What belongs there | Why |
|---|---|---|
| **The cart** (server) | Anything the booking is made of: dates, rooms, selected rate, applied certificate | It survives everything and it is the only copy that counts |
| **The URL** | Navigation only: which page, which step, which sort, which filter, which section | Shareable, back-button-able, and it lands in logs — which is why nothing private goes here |
| **The draft** (`sessionStorage`, per tab) | Half-finished answers the server has no field for: partial contact details, a billing address mid-wizard | The server has `updateCart` but not partial user info, so a wizard needs somewhere local |
| **Nowhere** | Card numbers | They are never ours to hold |

Consequences you must respect:

- **No PII in the URL.** Not names, not addresses, not billing details. A URL is
  captured by logs, referrers and analytics.
- The draft is keyed per cart: `checkout.draft:<cartId>`, via `readDraft` /
  `writeDraft` / `clearDraft` in `src/data/draft.ts`. Every access is
  try/caught — storage can be unavailable.
- Clear the draft when the thing it was drafting completes (`clearDraft(cartId)`
  after a successful commit).
- **The rules do not know which store answered.** `CheckoutContext` is
  `{ cart, brand, draft }`; the predicates in `src/domain/` read it and cannot tell
  where a value came from. Keep it that way — that is what lets an answer move
  between homes without touching a rule.

## Mocks

Everything is mocked behind `src/data/mock/`:

- `db.ts` — the rows. Realistic and varied; the deck screenshots them.
- `api.ts` — the fake server, including `getChaos` / `setChaos` so the dev panel
  can inject a fault or a rejection.
- `cache.ts` — keys, subscriptions, `reset()`.

Do not add a real network call, an SDK, or a service worker. If you need a new
behaviour from the "server", add it to the mock api and make the dev panel able to
trigger it.

## Failures

Three kinds, in `src/errors/failure.ts`, and they are handled differently on
purpose:

| Kind | Means | Goes to |
|---|---|---|
| `validation` | We can tell before asking | the field, inline |
| `rejection` | The backend said no for a business reason | a toast, plus `OPERATION_FAILED` |
| `fault` | Something broke | `FailurePanel` with a retry |

Copy always comes from `failureMessage(failure)`. A region resolves it; a presenter
receives finished strings. Never write user-facing error text at a call site.
