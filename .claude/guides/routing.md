# Routing and the URL

A hash router in `src/app/router.tsx`. Small on purpose — it is not the argument
this repo is making, but the URL rules below are.

## Everything has an address

Every page, every wizard step, every filter and sort choice. Not because the demo
needs deep links, but because a page whose state is not in the URL cannot support
Back, cannot be shared, and ends up faking navigation with a step counter.

```ts
export type Route =
  | { name: 'landing' }
  | { name: 'search'; destination: string; sort?: string; pay?: string }
  | { name: 'stay';   id: string; pay?: string }
  | { name: 'checkout'; step?: string; auth?: string }
  | { name: 'account'; section?: string }
  | …
```

## A path segment for identity, a query parameter for refinement

`#/stays` is the list and `#/stays/h-alcazar` is one of them: the id is **what the
page is**, so it is a path segment. `pay` is **how the page is being viewed**, so it
is a query parameter — and it rides along from the search page, because leaving a
list and opening one of its rows should not silently change the way you are being
quoted.

The parser tells the two apart by whether there is a segment after the vertical,
which is why adding a details page needed no new path and no new `PATHS` entry.

## `go` versus `replace`

| | Use for |
|---|---|
| `router.go(route)` | Somewhere a person chose to be: a page, a wizard step, a search |
| `router.replace(route)` | A refinement of where they already are: a sort, a filter, dropping a spent token |

Filters use `replace`. Otherwise Back steps through every keystroke of a filter
change instead of leaving the page, which is the single most annoying bug this class
of app has.

## Values from the address bar are untrusted

Always. A route value is whatever someone typed or pasted.

- Validate it against what exists before using it — a `sort` the vertical does not
  support, a `step` not in this brand's flow, a `brand` that is not a brand.
- Fall back silently to the sensible default; do not throw and do not show an error.
- Deep-link guards belong in **`useLoad`'s `onReady`**, where the data needed to
  judge them has arrived. Never an effect.

```ts
// brand from the query string, checked against the brands that exist
const asked = new URLSearchParams(window.location.search).get('brand');
return asked && asked in BRANDS ? (asked as BrandId) : 'atlas';
```

### An id is untrusted too, and it is checked against the data

The router hands `#/stays/h-nope` on as `{ name: 'stay', id: 'h-nope' }` without
comment, because whether `h-nope` names a property is not a question about the URL —
it is a question about the catalogue, and only the region has the answer.

So the two kinds of value from the address bar are checked differently:

| | Checked against | When it is wrong |
|---|---|---|
| `sort`, `pay`, `step`, `section`, `brand` | a list the code already has | fall back silently to the default |
| `id` | the data, once it has arrived | a "not found" page, with a way onwards |

`HotelDetailsRegion` does both: `payingWith(brand, pay)` falls back to the brand's
default without saying anything, and an absent property renders a page that offers
"See all stays" rather than a retry. Neither of those is an error state, so neither
goes near `FailurePanel` — see `.claude/guides/data.md`.

## What may never go in a URL

**No PII. Ever.** No names, addresses, contact or billing details. A URL is
captured by logs, referrers and analytics; putting a billing address in one leaks
it into all three. This came up explicitly and the answer is settled: the URL
carries navigation, the cart and the draft carry answers. See
`.claude/guides/data.md`.

## Brand is a query parameter, not a route

```
http://localhost:5199/?brand=halo#/search?destination=
```

`?brand=<id>` sits **outside** the hash, because a brand is not a page: every route
exists in every brand, and the route should not have to carry it. Written with
`replaceState` when someone switches — switching brand is changing which demo you
are looking at, not somewhere you should press Back through — and read once at
startup so a reload or a hot reload comes back as the brand you were on.

## Wizard steps

- `#/checkout?step=billing`. The wizard **only keeps count**; it does not know what
  a step is.
- Arriving is the trigger, not the step number: `CheckoutRegion` is keyed on
  `` `${route.step}${route.auth ? ':return' : ''}` `` so opening a step by link, by
  Back, or by being sent back from a bank all run the region's checks. The cart is
  cached, so this is not a refetch.
- A step the flow says does not apply is not reachable — `firstUnfinished` decides
  where the person goes instead.
- A spent 3DS token is removed with `router.replace` so a refresh cannot replay it.
