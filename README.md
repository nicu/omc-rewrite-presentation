# Component architecture POC

A working prototype for evaluating the component API of a rewrite of `~/Projects/Frontend`.
Two verticals (stays and flights), three brands, four ways of paying, five pages,
**zero brand-specific components**.

Flights was built *after* stays, deliberately, to measure what a new vertical costs:
3 new files and 211 lines, with the layout, pricing, filters, skeletons, loading,
analytics and error handling reused untouched.

```bash
npm install
npm run dev
```

Use the **POC controls** panel (bottom right) to switch tenant, switch slot API,
inject failures, and watch the events each destination adapter emits.

---

## The three component categories

| | Owns | Never has |
|---|---|---|
| **Region** (`src/regions`) | data loading, slot filling, event *names* | styling, tokens |
| **Layout** (`src/components/layouts`) | structure, token-driven spacing, slots | data, telemetry, tenant or vertical meaning |
| **Presenter** (`src/components/presenters`) | rendering, payload *building* | store access, event names, tenant knowledge |

Atoms (`src/components/atoms`) sit below presenters and are the only files that
read design tokens directly.

## Data loading — `useLoad`

One call declares everything a region needs. Queries start together (no waterfall),
there is one status to guard (no nesting), and the region names itself once.

```tsx
const { data, status, error, retry, Scope } = useLoad(
  { user: userQuery(), bookings: bookingsQuery(), methods: paymentMethodsQuery() },
  { name: 'account.overview', pageView: 'ACCOUNT_VIEWED' },
);

if (status === 'loading') return <AccountSkeleton />;
if (status === 'error')   return <FailurePanel {...copyFor(error)} onRetry={retry} />;

return <Scope><AccountLayout summary={…} nav={…}>{…}</AccountLayout></Scope>;
```

The load boundary is a *place in the tree*, so it moves freely — put a region inside
a modal and its data loads when the modal opens, not with the page.

`src/data/cache.ts` is a hand-rolled ~90-line cache (keyed entries, in-flight dedup,
ref-counted subscriptions, tag invalidation) shaped to map 1:1 onto RTK Query
`builder.query` + tags. It exists to keep the pattern readable, not to replace RTKQ.

## Styling

MUI, with one theme per brand in `src/brands/<id>/theme.ts`. `buildTheme` turns a
brand's raw values — colours, radius, spacing, fonts, whether cards have a shadow —
into an MUI theme with `cssVariables: true`, so MUI publishes `--mui-palette-*`,
`--mui-shape-*` and friends at runtime.

`src/tokens/semantic.css` gives those our own role names (`--surface-raised`,
`--text-muted`, `--border-subtle`) for the few stylesheets we still write — page
grids and layouts. **There is one source of truth:** change the theme and both the
MUI components and our layouts move together.

What is left in `src/tokens/tenants/*.css` is only what MUI does not publish:
the spacing unit, the radius unit and the font families our grids need.

| Brand | Mode | Character |
|---|---|---|
| Meridian Club | light | warm paper, deep forest, fully rounded, roomy |
| Cabana Travel | dark | slate and bright teal, `elevation: 0` so Paper draws borders |
| Atlas Rewards | dark | near-black, pastel pink and periwinkle, square, uppercase controls |

## Failures

`Fault | Rejection | Validation` (`src/errors/failure.ts`), split by what happened
rather than by who consumes it.

- Logged automatically by `useLoad`, stamped with the region — no `trackEvent` calls in regions
- Surfaced as a **toast**, like the current app's `useToastMessage` + `react-toastify`.
  The API returns messages rather than error codes, so there is no code→copy table:
  a rejection carries what the API said, and anything else falls back to a generic
  line that would come from the `errors` translations
- Where it appears is the region's choice: `onFailure: showFailure` for a toast, a
  `FailurePanel` when the page genuinely cannot render

## Telemetry

Ambient identity at the root (tenant, partner, business model, tier), ambient vertical
per route, explicit region name on `useLoad`. Nothing rebuilds a name or re-derives a
dimension at a call site.

Presenters *offer* actions and build a payload per action. Instances *name* the catalog
event, or omit it and pay nothing:

```tsx
<HotelResultCard hotel={h} position={i}
  track={{ impression: 'PRODUCT_VIEWED', select: 'PRODUCT_SELECTED', expand: 'PRODUCT_EXPANDED' }} />

<HotelResultCard hotel={h} />   {/* same component, uninstrumented */}
```

`TrackMap` only permits catalog events whose payload the action actually satisfies,
so `track={{ select: 'SEARCH_SORTED' }}` on a product card is a compile error.

Adapters (`src/telemetry/adapters.ts`) format one semantic event per destination —
including reproducing the legacy App Insights name
`${partnerKey}_${brandKey}_${vertical}_${eventType}` in a single place.

## Slot APIs — both, for comparison

`SearchLayout.tsx` (named-prop slots) and `SearchLayoutCompound.tsx` (compound
components) render identical output from the same CSS module. Toggle between them in
the POC controls; both call sites live side by side in
`src/regions/HotelSearchRegion.tsx`.

## The deck

`presentation/` is a reveal.js deck covering the whole argument — 24 slides, SVG
diagrams, `http://localhost:5173/presentation/` while the dev server runs.

It imports `src/tokens/index.css` directly rather than copying values, so the slides
are themed by the same cascade as the application. The Evidence slide has a tenant
switcher that retheme s the deck itself. Press `S` for the speaker view.

## What to look at first

- `src/regions/HotelSearchRegion.tsx` — a page's entire data and telemetry surface in one file
- `src/components/presenters/PriceDisplay.tsx` — one presenter, four business models
- `src/components/presenters/HotelResultCard.tsx` — five actions, per-action typed payloads
- `src/app/tenant.tsx` — the complete surface area of brand-specific code
