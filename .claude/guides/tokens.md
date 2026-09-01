# Tokens, theming and styling

## The rule

**No raw numbers at a call site.** A brand retunes the scale; it does not edit call
sites. `gap: var(--space-4)`, never `gap: 16px`. `<Stack gap={4}>`, never
`style={{ gap: 16 }}`. `<Card>`, never `sx={{ p: 2, boxShadow: 6 }}`.

If a value has no token, **add the token**. Every one of these started as a number
somebody wanted to vary per brand:

`--space-unit` · `--radius-unit` · `--card-padding` · `--page-gutter` ·
`--surface-blur` · `--tag-tint-1..4` / `--tag-ink-1..4` · `--cover-1..4` ·
`--list-aside-width` · `--list-aside-align` · `--motion-distance-sm|md|lg` ·
`--duration-fast|normal|slow` · `--motion-stagger` · `--easing-entrance`

## The three layers

| File | Holds |
|---|---|
| `src/tokens/primitives.css` | The raw scale and every token's **default**, on bare `:root` |
| `src/tokens/semantic.css` | What things mean: `--card-padding`, `--field-*`, `--list-aside-*`, `--page-gutter` |
| `src/tokens/brands/<id>.css` | What one brand retunes, under `:root[data-brand='<id>']` |

Six brand stylesheets, 208 lines in total. That is the entire visual difference
between a magazine, a glass app and a points programme, before a single component is
replaced.

### Adding a token

1. Default it in `primitives.css` (or `semantic.css` if it is a meaning, not a
   scale) **so every brand is unaffected**. A new token whose default changes
   existing brands is a bug. `--surface-glass-scrim` defaults to `transparent`;
   `--tag-tint-*` all default to the same grey, so they are invisible everywhere
   except the brand that asked for them.
2. Read it where it applies.
3. Retune it only in the brands that want it.

That sequence is why `--list-aside-align` could move the price to the top of every
row in every list Halo and Kiosk own, in one line each, with the other four
untouched.

## Where an override actually lands

**A token override only reaches the elements where the token is *read*, not the
elements where it is *derived*.** This bites the moment you try to theme part of a
page rather than all of it.

`--space-5: calc(var(--space-unit) * 6)` is declared on `:root`, so it is
substituted there, against `:root`'s `--space-unit`, and descendants inherit the
finished value. Set `--space-unit` on a wrapper div and **nothing happens** —
every `--space-*` was already resolved. That is the reason the app puts a brand's
tokens on `document.documentElement` and not on a themed div.

So:

- Retuning a brand → set the unit on `:root[data-brand='…']`. It works, because
  the semantic layer is on `:root` too.
- Scoping to a subtree → override the tokens that are **read** by what is inside
  it (`--card-padding`, `--list-aside-align`), or redeclare the derived steps on
  the wrapper.

The exception with no workaround is anything MUI resolves at theme-build time.
A `Card` is a `Paper` and bakes `shape.borderRadius` into its class, so
`--mui-shape-borderRadius` on a wrapper changes nothing — measured. Scoping a
corner to part of a page needs a nested `ThemeProvider`.

## MUI

MUI plus one theme per brand, the same as the live app. MUI publishes its theme as
CSS variables, and our stylesheets read them directly
(`var(--mui-shape-borderRadius)`, `var(--mui-palette-action-hover)`).

`buildTheme(tokens)` in `src/brands/theme.ts` turns `BrandTokens` into the MUI
theme and holds every component override. Traps already paid for:

- **`theme.motion` is MUI's** — it holds `reducedMotion`, and anything you put
  there is silently replaced. Ours is **`theme.animates`**.
- **`createTheme` turns `undefined` into `{}`** — check `t.surface?.kind`, never the
  object's truthiness.
- **A `Surface` is not a `Paper`.** `Surface` is a plain div reading
  `--surface-raised`, so a `MuiPaper` override never reaches it. Anything that must
  apply to both belongs in a **token** — which is why glass is `--surface-blur`.
- **`Accordion` is a `Paper`.** A surface treatment applied to every Paper wrapped a
  full border around "What's included" with no padding inside it. All three
  treatments now carry `&:not(.MuiAccordion-root)`. If you add a fourth, exclude it
  too.
- **Blur does not create contrast.** A 7% white tint over a light photograph leaves
  light text unreadable however much you blur it. Real glass UI is tinted:
  `--surface-glass-scrim`.
- **Nested glass does not blur twice.** A rectangular surface inside a rounded pill
  paints over the rounded ends and they come out sharp. Halo's pill sets
  `--surface-raised: transparent; --surface-blur: none` on its children so there is
  only ever one pane.

## Stylesheets

CSS modules, one beside the component that owns the shape. They may contain:
grid and flex, tokens, media queries, and `:global(body)` only when something
docked over the page must give the space back.

They may **not** contain: colours or sizes as literals, brand names, or selectors
reaching into another component's classes. If you need to change something inside a
child, pass it a **token** — Halo's pill switches off the shared header's gutter
with `--page-gutter: 0px` rather than reaching for the Container's class.

## Layout tokens worth knowing

- `--list-aside-width` — the fixed width of a row's right-hand column. Fixed, not
  shrink-to-fit, so every row in a list breaks at the same place: `$412` and
  `$1,240` must not move the column. It was `auto`, and every list in every brand
  was ragged.
- `--list-aside-align` — `start | center | end`, where the price sits in the row.
- `--page-gutter` — the page's side margin. Also the right value for
  `scroll-padding-inline` on anything that scroll-snaps, so a snapped item lands on
  the same column as the heading above it.
