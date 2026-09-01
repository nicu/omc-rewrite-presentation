# Adding or changing a brand

A brand is **a folder plus a stylesheet**. Nothing in either is required, and no
shared component learns that the brand exists.

## The ladder

Work down it. Only move to the next rung when the one above genuinely cannot do the
job. The size of each brand in the repo shows the ladder working:

| Brand | What you see | What it took | Size |
|---|---|---|---|
| Atlas | Dark, pink, points and miles | Theme only | 3 files, 67 lines |
| Meridian | Light, green, tiers and certificates | Theme, plus one more checkout step and one more account tab | 3 files, 71 lines |
| Cabana | Flat teal, cash only, no membership | Theme, plus its own search layout | 5 files, 90 lines |
| Halo | Dark liquid glass, floating chrome | Theme, a glass surface token, its own shell, and a shared sign-in layout it did not write | 5 files, 147 lines |
| Folio | A magazine: ink on paper, off the grid | Theme, plus its own landing page | 5 files, 249 lines |
| Kiosk | A pastel rack, covers with type on them | Theme, plus its own cards, landing page and sign-in | 11 files, 593 lines |

1. **Theme values** — `brands/<id>/theme.ts`. Colour, mode, radius, elevation,
   button case, fonts, `animates`, and the `surface` treatment.
2. **Brand tokens** — `src/tokens/brands/<id>.css`. The scale everything picks
   from: `--space-unit`, `--radius-unit`, fonts, motion, and any semantic token
   this brand retunes (`--card-padding`, `--list-aside-align`, `--surface-blur`).
3. **Config** — `brands/<id>/brand.tsx`. Which business models, which account
   sections, which checkout steps, which landing sections.
4. **Slots** — `overrides`. A component with the same props as the default.
5. **Its own component** — only when the thing itself is different, not when it
   merely looks different.

## The files

A brand folder is **sorted by kind, exactly like `src/components/`**. Two brands
have one component each today, but a real brand will have twenty, and "which of
these files is a layout?" has to stay answerable by looking.

```
src/brands/<id>/
  brand.tsx              the BrandConfig — what it offers
  theme.ts               BrandTokens + buildTheme(tokens) — how it looks
  layouts/               arrangements this brand replaced
    AppShell.tsx  AppShell.module.css
  presenters/            things this brand draws differently
    HotelResultCard.tsx  HotelResultCard.module.css
    slots.tsx            the one-line slots: MembershipBanner, SignInAside, FooterNote
  primitives/            (rare — a brand wanting its own control is a smell)
  regions/               (rarer still — see below)
src/tokens/brands/<id>.css   the scale it retunes
```

The kind folder is the same kind as the shared component being replaced, decided by
the rules in `CLAUDE.md`, not by which folder the shared version happens to sit in.
Landing sections are **presenters** — they take `data` and `onSearch` as props and
draw — even though the shared ones live under `src/regions/landing/` because they
belong to that region.

A brand owning a **region** means it fetches something no other brand fetches. That
is the top of the ladder and it should be argued for, not assumed.

### Two naming rules

**Name a brand component after the slot it fills, never after what it looks like.**
`presenters/HotelResultCard.tsx`, not `RackRow.tsx`. The name is what tells the next
person — and the `grep` in the non-negotiables — that this is *the same thing*, drawn
differently. A brand file whose name matches no slot is either misnamed or is doing
something no slot sanctions.

**The moment a second brand wants it, it moves.** Out of the brand folder, into
`src/components/<kind>/`, and it loses its brand identity — it becomes an option any
brand may select. `CanvasSignIn` is the worked example: Halo's *shell* is a floating
glass pill nobody else wants and stays in `brands/halo/layouts/`, but its *sign-in
arrangement* — picture behind, form floating on it — is a shape any brand could pick,
so it lives in `components/layouts/` and Halo merely selects it. **Two brands
importing from a third's folder is the bug**, and it is the signal to promote.

## Registering it

**One edit.** Add the id to `BRAND_IDS` in `src/brands/types.ts`.

That array is the single source: `BrandId` is derived from it, and it also sets
the order the brands appear in. Everything else is found rather than listed —
`src/brands/index.ts` globs `./*/brand.tsx`, and `src/tokens/index.ts` globs
`./brands/*.css`. A folder without an entry in `BRAND_IDS` is ignored; an entry
without a folder throws at startup, by name, rather than rendering a blank page.

Then it is switchable in the dev panel and reachable at `?brand=<id>`.

## The theme

`BrandTokens` in `src/brands/theme.ts` is the whole vocabulary. Prefer adding a
*field there* over reaching into MUI at a call site, because a field is available to
all six brands and a one-off is not.

`surface` is a discriminated union for treatments the flat fields cannot express:

```ts
surface: { kind: 'glass', blur: 22, tint: 'rgba(255,255,255,0.06)', edge: 'rgba(255,255,255,0.14)' }
surface: { kind: 'sticker', ink: '#111', width: 2, offset: 4 }
```

Two traps, both paid for already:

- **`theme.motion` is MUI's.** It holds `reducedMotion`, and anything you put there
  is silently replaced. Ours is `theme.animates`.
- **`createTheme` turns `undefined` into `{}`.** Check `t.surface?.kind`, never
  truthiness of the object.
- **A `Surface` is not a MUI `Paper`.** It is a plain div reading `--surface-raised`,
  so a `MuiPaper` override does not reach it. Anything that must apply to both goes
  in a **token**, which is why glass is `--surface-blur` and not only a Paper rule.

## The slots

`BrandOverrides` in `src/brands/types.ts`. **Grouped by area, with the per-vertical
slots kept separately** — that split is the whole design. A flat map grows with
verticals *multiplied by* replaceable things, which is exactly how the live repo
reached a 48-value ComponentType enum. Here a new vertical adds one entry under
`verticals` and no group gets longer.

```ts
overrides: {
  chrome:    { AppShell?, MembershipBanner?, FooterNote? },
  auth:      { Layout?, Aside? },
  landing:   { DestinationCard?, FeaturedDestinations? },
  search:    { Layout? },
  checkout:  { PaymentChoice? },
  verticals: { hotel?: { ResultCard? }, air?: { ResultCard? } },
}
```

Read at the call site as `brand.overrides?.chrome?.AppShell ?? DefaultAppShell`.
There is deliberately **no string-path `useSlot('chrome.AppShell')` helper**: it
would read more neatly and would throw away the type checking, which is the thing
making a slot safer than a config key.

**Eleven slots today, against 22 component types in the live repo.** The count is a
canary, not a mechanism — watch the *shape* too. A slot that fits no group is a sign
the group is missing or the change belongs a rung lower on the ladder.

| Group | Size of change |
|---|---|
| `chrome.MembershipBanner`, `chrome.FooterNote`, `auth.Aside` | a line of copy |
| `checkout.PaymentChoice` | how one control is drawn |
| `landing.DestinationCard`, `verticals.<v>.ResultCard` | what one card shows |
| `landing.FeaturedDestinations` | a whole section — you now own how it enters |
| `search.Layout`, `auth.Layout` | the shape of a page |
| `chrome.AppShell` | the chrome around every page |

Rules:

- A slot takes **the same props as the default**, so the page rendering it does not
  change. Type it against the default's prop type.
- Replacing a **card** keeps the grid and the stagger around it. Replacing a
  **section** means you now own how it enters. Pick the smaller one.
- A brand component still `offers` actions and names none. Kiosk's result card
  names five events on the search page and two on the landing page, exactly like
  the shared one, because tracking is the call site's.
- A brand component may use `useBrand()`. It may not check the brand id.

## A page of its own

When a brand's page is a different *arrangement*, give the region a layout slot
rather than forking the region. The two worked examples:

- **Landing** — `BrandConfig.landing?: LandingSection[]`. Folio hands back four
  sections in its own order; `HotelLandingRegion` is a `sections.map()` and does not
  know.
- **Sign-in** — `SignInLayout` receives `media`, `copy`, `aside` and the finished
  form as children. `CanvasSignIn` is shared and selectable by anyone; Kiosk's is
  its own and ignores `media` entirely, because it wants a masthead above the form
  rather than a picture beside it. **Neither builds a form**, so both inherit the
  validation, the field errors and the tracking.

That is the test for a good slot: taking it should not make you responsible for
anything except arrangement.

## Before you finish

- `grep` for the brand's name outside its folder — nothing should match.
- Switch through **all six** brands on every page you touched
  (`.claude/guides/verifying.md`).
- Check the new brand at 375px (`.claude/guides/mobile.md`).
- Update the brands table and the counts on the deck
  (`.claude/guides/slides.md`).
