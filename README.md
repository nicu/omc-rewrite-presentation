# Component architecture POC

### 📊 [The slides](https://nicu.github.io/omc-rewrite-presentation/slides/) &nbsp;·&nbsp; 🖥️ [The demo](https://nicu.github.io/omc-rewrite-presentation/)

Start with the slides; the demo is the prototype they describe. Both are the same
build, so anything claimed on a slide can be clicked on next door.

---

A working prototype for evaluating the component API of a rewrite of our frontend.
Two verticals (stays and flights), three brands, four ways of paying, six pages,
**zero brand-specific components**.

Flights was built _after_ stays, deliberately, to measure what a new vertical costs:
3 new files and 228 lines, with the layout, pricing, filters, skeletons, loading,
analytics and error handling reused untouched.

```bash
npm install
npm run dev
```

Locally the app is at `/` and the deck at `/slides/`.

## Deploying to GitHub Pages

`.github/workflows/deploy.yml` builds and publishes on every push to `main`. Enable
it once under **Settings → Pages → Build and deployment → Source → GitHub Actions**.

There is no `docs/` folder and no build output in git: the workflow builds `dist/`
on a runner and uploads it straight to Pages. Committing the build instead would
mean rebuilding before every push and a few thousand changed lines in each diff.
Both routes are free; this one is less to remember.

The build uses `base: './'`, so every URL is relative to the page that loads it
and the same output works at the root and under `https://<user>.github.io/<repo>/`.
That is also why photographs live in `src/assets/images` and are imported through
`import.meta.glob` rather than sitting in `public/` and being referenced by an
absolute path — Vite rewrites imported URLs for the deployed base, but it cannot
rewrite a string like `/images/foo.jpg`.

To check a subpath build locally before pushing:

```bash
npm run build && mkdir -p /tmp/pages/repo && cp -R dist/. /tmp/pages/repo/ && npx http-server /tmp/pages -p 8899
```

then open `http://localhost:8899/repo/`.

## Photographs

19 photographs in `src/assets/images`, from [Openverse](https://openverse.org)
under licences permitting commercial use. Attribution for each file is in
`src/assets/images/CREDITS.md`. They are demo content, not production assets.

Use the **POC controls** panel (bottom right) to switch tenant, switch slot API,
inject failures, and watch the events each destination adapter emits.

---

## The three component categories

|                                             | Owns                                      | Never has                                   |
| ------------------------------------------- | ----------------------------------------- | ------------------------------------------- |
| **Region** (`src/regions`)                  | data loading, slot filling, event _names_ | styling, tokens                             |
| **Layout** (`src/components/layouts`)       | structure, token-driven spacing, slots    | data, telemetry, tenant or vertical meaning |
| **Presenter** (`src/components/presenters`) | rendering, payload _building_             | store access, event names, tenant knowledge |

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

The load boundary is a _place in the tree_, so it moves freely — put a region inside
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

### How far a brand can go

| What a brand wants to change                     | Costs us  | Where it lives                     |
| ------------------------------------------------ | --------- | ---------------------------------- |
| Colour, type, spacing, corners, shadows, density | nothing   | the theme                          |
| Which ways to pay, which account sections        | one line  | the brand file                     |
| A banner, footer note, sign-in message           | ~15 lines | a component in the brand folder    |
| A different control (buttons, pills, dropdown)   | one line  | name one of ours, or pass your own |
| Rearrange a page (filters on top, not the side)  | ~28 lines | the brand's own layout             |
| A page that needs different data                 | ~90 lines | the brand's own region             |
| Different rules or booking flow                  | real work | unavoidable in any architecture    |

Everything above the last two rows happens inside the brand's own folder — no
shared file is edited, so no other brand can break. Cabana takes the fifth row:
it sells one way to pay, so it supplies its own `SearchLayout` putting filters
and the toolbar in a bar across the top. The filter control, the toolbar and
every result card are the shared ones, untouched.

| Brand         | Mode  | Character                                                          |
| ------------- | ----- | ------------------------------------------------------------------ |
| Meridian Club | light | warm paper, deep forest, fully rounded, roomy                      |
| Cabana Travel | dark  | slate and bright teal, `elevation: 0` so Paper draws borders       |
| Atlas Rewards | dark  | near-black, pastel pink and periwinkle, square, uppercase controls |

## Routing — the URL is the state

`src/app/router.tsx`. Hash routing, so the build works from any subpath without server
rewrites. Every screen has an address, including each wizard step, each account tab and
each set of search filters:

```
#/stays?to=Los+Cabos&sort=price-low&pay=earn-burn
#/checkout/billing
#/account/certificates
```

Regions do not hold this in `useState`; they read it off the route and write it back:

- `router.go(...)` — a new place. Adds a history entry, so Back returns to the previous one.
- `router.replace(...)` — the same place seen differently (a filter, a sort). Overwrites the
  entry, so five filter changes still take one Back press to leave the page.

Everything in the address bar is untrusted input, so the region validates it — it is the
part that knows which sorts exist for its vertical and which ways of paying the brand
supports. `pay=earn-burn` on a cash-only brand quietly becomes cash.

The wizard gets Back for free from this: `CheckoutRegion` reads `step` from the route,
and each step's answers survive because they were saved to the cart, not held in a
component.

## Checkout — a flow is a list

`src/regions/checkout/`. `Flow` is `{ id, label, Step }[]`. `CHECKOUT` is three steps;
`CHECKOUT_WITH_CERTIFICATES` is the same list with one more entry, and Meridian names it
in its brand config. Each step is an ordinary region — its own `useLoad`, its own name
(`checkout.details`, `checkout.billing`, …), so the funnel exists without anyone
instrumenting it. `WizardLayout` is a layout with four gaps and no opinions.

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

Presenters _offer_ actions and build a payload per action. Instances _name_ the catalog
event, or omit it and pay nothing:

```tsx
<HotelResultCard hotel={h} position={i}
  track={{ impression: 'PRODUCT_VIEWED', select: 'PRODUCT_SELECTED', expand: 'PRODUCT_EXPANDED' }} />

<HotelResultCard hotel={h} />   {/* same component, uninstrumented */}
```

`TrackMap` only permits catalog events whose payload the action actually satisfies,
so `track={{ select: 'SEARCH_SORTED' }}` on a product card is a compile error.

### Routing, and engineering health

`src/telemetry/catalog.ts` ends with a `DESTINATIONS` table saying which tools an
event belongs to. Anything not listed goes everywhere, which is what happens today.

Two signals are routed to App Insights alone, because they are engineering health
rather than product behaviour, and `useLoad` emits them from data it already has:

| Event               | Carries                                                                  |
| ------------------- | ------------------------------------------------------------------------ |
| `REQUEST_COMPLETED` | one per query: its key, how long it took, whether it worked              |
| `PAGE_READY`        | how long the region waited before it could render, and how many requests |

Nothing at a call site asks for these. The region already knows what it fetched and
the cache already timed it.

The point is the table: deciding whether App Insights should carry product analytics
is one line here, not an edit across the 58 files that call `useAppInsights` today.
**Every destination in this prototype is a mock** that writes to the in-memory log
behind the POC controls panel — no SDK, no network.

Adapters (`src/telemetry/adapters.ts`) format one semantic event per destination —
including reproducing the legacy App Insights name
`${partnerKey}_${brandKey}_${vertical}_${eventType}` in a single place.

## Slot APIs — both, for comparison

`SearchLayout.tsx` (named-prop slots) and `SearchLayoutCompound.tsx` (compound
components) render identical output from the same CSS module. Toggle between them in
the POC controls; both call sites live side by side in
`src/regions/HotelSearchRegion.tsx`.

## The deck

`slides/` is a reveal.js deck covering the whole argument — 55 slides, SVG
diagrams, `http://localhost:5173/slides/` while the dev server runs.

Slides are grouped into vertical stacks, one per numbered section, so the horizontal
axis is the table of contents and `Esc` gives a grid of the whole talk. Navigation is
`linear`, so Left/Right step through every slide in reading order and nothing is
skipped by arrowing past a stack; Up/Down move inside one.

It imports `src/tokens/index.css` directly rather than copying values, so the slides
are themed by the same cascade as the application. The "Two brands, side by side"
slide has a tenant switcher that rethemes the deck itself. Press `S` for the speaker
view.

## What to look at first

- `src/regions/HotelSearchRegion.tsx` — a page's entire data and telemetry surface in one file
- `src/components/presenters/PriceDisplay.tsx` — one presenter, four business models
- `src/components/presenters/HotelResultCard.tsx` — five actions, per-action typed payloads
- `src/app/tenant.tsx` — the complete surface area of brand-specific code
