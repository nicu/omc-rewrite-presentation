# Adding a page, region, layout or presenter

## Which am I writing?

Answer in this order and stop at the first yes:

1. Does it need **data from the server**, own a **mutation**, or **name events**?
   → a **region**, in `src/regions/`.
2. Does it decide **where things sit**, with no idea what they are?
   → a **layout**, in `src/components/layouts/`.
3. Does it **draw a thing** from props?
   → a **presenter**, in `src/components/presenters/`.
4. Is it a single control or primitive?
   → a **primitive**, in `src/components/primitives/`.

If the answer is "two of those", you are writing two components.

## A new page

1. **A route.** Add a variant to `Route` in `src/app/router.tsx`, and handle it in
   `toHash` / the parser. See `.claude/guides/routing.md`.
2. **A region.** One `useLoad`, one status guard, a `pageView` event.
3. **Wire it** in `src/app/App.tsx`: the route → region mapping, a `NavItem` if it
   belongs in the nav, and `verticalFor()` if it is a new vertical.
4. **A layout**, only if no existing one fits. Check first: `SearchLayout`,
   `WizardLayout`, `AccountLayout`, `SplitLayout`, `HeroLayout`, `ListItemLayout`,
   `Grid`, `Section`, `Container`.

Sign-in shows the exception worth knowing: it is **full-bleed and opts out of the
shell** in `Pages`, rather than the shell growing a variant for it.

## Writing a region

```tsx
export const ThingRegion = () => {
  const brand = useBrand();
  const router = useRouter();

  const { data, status, error, retry, Scope } = useLoad(
    { a: aQuery(), b: bQuery() },
    { name: 'thing.page', pageView: 'THING_VIEWED' },
  );

  if (status === 'loading') return <ThingSkeleton />;
  if (status === 'error') {
    return <Container><FailurePanel surface="page" message={failureMessage(error)} onRetry={retry} /></Container>;
  }

  return <Scope>{/* layouts and presenters, fed from data */}</Scope>;
};
```

- **One `useLoad` per region.** Two calls means two status guards and a waterfall.
- **`Scope` wraps the output** — that is what tags every event below with the
  region name.
- **A skeleton per page shape**, not per component. `LandingSkeleton`,
  `ResultListSkeleton`, `CardGridSkeleton`, `AccountSkeleton` already exist.
- **Failures go to a toast**, and `FailurePanel` covers the page-level case. Copy
  comes from `failureMessage(error)` — never write user-facing error text at a call
  site.
- **Deep-link guards go in `onReady`**, never an effect:
  ```ts
  { name: 'checkout', onReady: (d) => { /* validate route.step against d, redirect if wrong */ } }
  ```

## Writing a layout

The rule that keeps them cheap: **a layout must be describable without naming a
single kind of content.** "An optional picture, the thing itself, and whatever sits
on the right." If you cannot describe it that way, it is a presenter.

```tsx
export type ThingLayoutProps = {
  media?: ReactNode;   // named slots, not children
  body: ReactNode;
  aside?: ReactNode;
};
```

- **Named slots, not `children`** for anything with more than one gap. Opaque
  children can only be shown or hidden — that is what broke the mobile nav.
- **Sides, not flags.** `mediaSide?: 'left' | 'right'`, not `reverse`. A call site
  should read as a layout choice, not a negation.
- **No content knowledge, no data, no tracking, no brand branching.** A layout may
  read `useBrand()` for a value that is genuinely part of the arrangement (the
  tagline over a sign-in photo), but never to branch on the id.
- **Spacing comes from tokens.** A layout is about 25 lines of grid; if it is
  much more, it is deciding something it should not.
- **Collapse deliberately.** Every layout needs a narrow-width form. Never
  `display: none` on something that carries function — see
  `.claude/guides/mobile.md`.

## Writing a presenter

- Props in, markup out. It may own **UI state** (an input's value, whether a
  disclosure is open) — that is not server state.
- **Offer actions, name none.** See `.claude/guides/telemetry.md`.
- **Errors arrive resolved.** `errors?: Record<string, string>` — the region did the
  lookup. A presenter never maps a failure code to copy.
- **No router.** If it needs to navigate, it takes `onSelect` / `onSearch`.
- Anything a brand might replace should be a **`ComponentType` prop with a default**
  (`Card = DestinationCard`), so a brand can swap the part without taking the whole.

## Adding a slot to something shared

Do this instead of forking. The pattern, every time:

1. Give the props a named optional slot, typed as the default's props.
2. Default it in the component:
   `const X = brand.overrides?.<group>?.X ?? DefaultX;`
3. Add it to `BrandOverrides` **inside the group it belongs to** — `chrome`,
   `auth`, `landing`, `search`, `checkout`, or `verticals.<vertical>` — with a
   comment saying what size of change it is for. A slot that fits no group means
   either the group is missing or the change belongs a rung lower on the ladder.
   Never add a slot at the top level: flat is how the live repo got to 48.
4. Do not exceed what the theme could have done. If a token would work, use the
   token.

## Before you finish

- Typecheck, lint, tests: `npx tsc -b` (**not** `--noEmit`, which checks nothing —
  see `.claude/guides/verifying.md`), `npm run lint`, `node --test src/domain/*.test.ts`.
- Walk the page in **all six brands** and at 375px.
- If you added a component, the deck's counts are now stale
  (`.claude/guides/slides.md`).
