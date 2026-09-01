# Adding a vertical

A vertical is a kind of thing you can book: stays, flights, cars, cruises. Two of
roughly twenty are built. Adding the second one (flights) cost **three files and
228 lines**, and changed nothing that already existed. That is the number to beat.

## What a vertical does *not* get

Start here, because it is the whole point. A new vertical does **not** get:

- its own search page shape — `SearchLayout` already holds a filter rail, a
  toolbar and a list of results, and does not know what is in them
- its own filters, sort control, toolbar, skeletons, empty state or failure panel
- its own price display, rating, badge, or card shell (`ListItemLayout`)
- its own pricing rules — `src/domain/pricing.ts` is keyed on business model, not
  on what is being bought
- its own telemetry vocabulary — the catalog is shared, and `vertical` is an
  ambient dimension set once by `<Analytics>`
- its own error handling, cache, or loading orchestration

If you find yourself copying any of those, stop: something above is missing a slot.

## The three files

```
src/components/presenters/<Thing>ResultCard.tsx        what one of them looks like
src/components/presenters/<Thing>ResultCard.module.css the bits specific to it
src/regions/<Thing>SearchRegion.tsx                    what it loads and reports
```

Plus the small edits: a query in `src/data/queries.ts`, a model type in
`src/data/model.ts`, mock rows in `src/data/mock/db.ts`, a route in
`src/app/router.tsx`, and a `NavItem` in `src/app/App.tsx`.

## The result card

It is a **presenter**. Model it on `FlightResultCard`:

- Fill `ListItemLayout`'s three gaps — `media`, `body`, `aside`. Do not invent a
  row shape; if the row genuinely needs a fourth gap, add it to the layout so all
  three verticals get it.
- The `aside` is the price. Its column width and vertical alignment are tokens
  (`--list-aside-width`, `--list-aside-align`), so do not position it yourself.
- Offer actions, name none:
  ```ts
  track?: TrackMap<{ impression: ProductPayload; select: ProductPayload }>
  ```
- Use `PriceDisplay`; pass `unit` if the vertical says something other than
  "per night" ("one way").
- Two of the ~75 shared components are tied to a vertical — the two result cards.
  Keep it that way: anything you are tempted to make vertical-specific inside a
  layout or a primitive belongs as a prop instead.

## The region

Model it on `FlightSearchRegion`:

```ts
const { data, status, error, retry, Scope } = useLoad(
  { results: <thing>SearchQuery(criteria), models: businessModelsQuery(brand.businessModels) },
  { name: '<thing>.search', pageView: 'SEARCH_VIEWED' },
);
```

- One `useLoad`, everything in parallel, one status guard. Never two loads in one
  region.
- Read `sort` and `pay` from the route, and treat them as untrusted — validate
  against what this vertical actually supports before using them.
- Filter changes use `router.replace`, not `go`, so Back does not step through
  every keystroke. See `.claude/guides/routing.md`.
- Wrap the page in `<Analytics name="<thing>.search" vertical="<thing>">` at the
  route level in `App.tsx`. That names the region and tags every event beneath it.
  Do not pass `vertical` down as a prop.

## The data

Add to `src/data/model.ts` and `src/data/queries.ts`:

```ts
export const <thing>SearchQuery = (criteria: SearchCriteria): Query<Thing[]> => ({
  key: `<thing>.search:${criteria.destination}:${criteria.sort}`,
  run: () => api.search<Thing>('<thing>', criteria),
});
```

The **key is the cache identity** — everything the result depends on must be in it,
or two different searches will share an answer.

## Registering it

1. `src/data/model.ts` — the type.
2. `src/data/mock/db.ts` — a handful of realistic rows. Keep names plausible and
   varied; the deck screenshots these.
3. `src/data/queries.ts` — the query.
4. `src/app/router.tsx` — a `Route` variant carrying `destination`, `sort`, `pay`.
5. `src/app/App.tsx` — the route → region mapping, a `NavItem`, and
   `verticalFor()`.
6. `src/telemetry/catalog.ts` — **only** if the vertical needs a payload shape that
   does not exist. Prefer reusing `ProductPayload`.

## Then

- Confirm nothing existing changed: `git diff --stat` should show new files plus
  small additions, not edits inside the shared presenters or layouts.
- Check the vertical in **all six brands** — a new card must inherit every brand's
  surface, tag tints and motion without being told.
- Check it at 375px (`.claude/guides/mobile.md`).
- The deck's "Adding flights" chapter and the numbers slide both quote vertical
  cost — see `.claude/guides/slides.md`.
