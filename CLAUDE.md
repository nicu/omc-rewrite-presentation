# Working in this repository

This is a **proof of concept and a presentation prop**, not a product. It exists to
argue one thing to a team: that a multi-brand booking site with ~50 brands and
~20 verticals can be *composed* rather than written brand by brand. Every file is
evidence for that argument, so *how* something is written matters as much as
whether it works.

Two deliverables, kept in step:

| | |
|---|---|
| `src/` | the running prototype — six brands, two verticals, one build |
| `slides/` | a reveal.js deck describing `src/`, quoting numbers counted from it |

The POC's own instruments — the dev panel and the event log — live in `src/app/`
and are counted on their own line, not as shared code. They are props for showing
the prototype off; nothing a brand ships. Keep new ones there and out of
`src/components` and `src/regions`, or the counts stop meaning what the deck says
they mean.

## Read before you build

Each guide covers a whole task. Load the one you need; don't work from memory.

| Doing this | Read |
|---|---|
| Adding or changing a brand | `.claude/guides/brands.md` |
| Adding a vertical (cars, cruises, …) | `.claude/guides/verticals.md` |
| Adding a page, region, layout or presenter | `.claude/guides/pages.md` |
| Loading, shaping or storing data | `.claude/guides/data.md` |
| Business rules, prices, eligibility, checkout steps | `.claude/guides/logic.md` |
| Telemetry | `.claude/guides/telemetry.md` |
| Routing and the URL | `.claude/guides/routing.md` |
| Tokens, theming, styling | `.claude/guides/tokens.md` |
| Animation | `.claude/guides/motion.md` |
| Anything that renders — before you call it done | `.claude/guides/mobile.md` |
| Proving your change works | `.claude/guides/verifying.md` |
| Touching the deck | `.claude/guides/slides.md` |

---

## Vocabulary

Use these words exactly; the deck defines them on its first slide.

- **Brand** — one of the ~50 websites we run. Atlas Rewards, Cabana Travel.
- **Vertical** — a kind of thing you can book. Stays, flights, cars, cruises.
- **Business model** — how a brand lets you pay. Points, member rate, certificate,
  plain cash.
- **Layout** — a page shape with named gaps in it.
- **Region** — the piece that owns data and events for one area of a page.

## What the prototype is judged on

Five things that should be easy. Any change that makes one of them harder is a
regression, whatever else it improves.

1. Add a **brand** without writing any components.
2. Add a **vertical** without copying a page.
3. Know quickly **where each thing is loaded**.
4. Know quickly **what a page sends to analytics**.
5. Keep the logs and events **exactly as they are** today.

Styling is deliberately not on that list. MUI plus an MUI theme per brand, the same
as today; MUI publishes its theme as CSS variables and our few stylesheets read
them.

---

## The one question to ask

Before writing anything, for any request from any brand: **what is actually
different?** The rows are in cost order. Go *down* the list, never up — move to the
next row only when the one above genuinely cannot do it.

| What is different | Where it belongs |
|---|---|
| It looks different | the brand's **theme** / its **brand stylesheet** |
| It offers different things | **config** — which ways to pay, which sections, which steps |
| It is arranged differently | a **layout** |
| It shows different information | a **presenter** |
| It needs different data | a **region** |
| It behaves differently | real work — plan it properly, and say so |

The whole argument of this repo is that today only the last row exists, because
writing a component is the only lever available. Four of the six brands never get
past row two.

---

## Non-negotiables

Break one of these and the change is wrong even if it works.

1. **No component may know which brand it is running as.** No `if (brand === 'halo')`,
   no `brandId` prop, no map keyed by brand inside shared code. A brand differs
   through tokens, theme values, config, or by filling a named slot. If you cannot
   express a difference that way, the shared component is missing a slot — add the
   slot. This must stay true:
   `grep -riE "atlas|meridian|cabana|halo|folio|kiosk" src --include=*.tsx | grep -v src/brands/`
   returns only explanatory comments.

2. **No `useEffect` for anything that is not a subscription.** We prefer imperative
   code, callbacks and events; effects that synchronise state are an anti-pattern
   here. If you reach for one, the answer is almost always a callback (`onReady`,
   `onDone`, `onFailure`) or doing the work in the handler that caused it. The only
   legitimate uses in this repo: subscribing to something external
   (`IntersectionObserver`, the hash) and deciding something before paint
   (`useLayoutEffect`).

3. **Never use Application Insights or any real analytics.** Every adapter in
   `src/telemetry/adapters.ts` is a mock writing to an in-memory log the dev panel
   reads. `appInsightsAdapter` carries that name only to mirror the legacy naming
   in the real repo. No SDK, no network call, no key.

4. **No PII in the URL.** The address bar is for navigation: which page, which step,
   which sort order. Names, addresses and billing details leak into logs, referrers
   and analytics the moment they are in a URL. Card numbers are stored nowhere at
   all. See `.claude/guides/data.md`.

5. **No raw numbers at a call site.** Spacing, radius, duration, distance, colour,
   column widths — all tokens. `gap: var(--space-4)`, never `gap: 16px`;
   `<Stack gap={4}>`, never `style={{ gap: 16 }}`. A brand retunes the scale, it
   does not edit call sites. If a value has no token, add the token.

6. **Never claim something is built when it is not.** Not in a comment, not on a
   slide, not in a summary. If a control would do nothing, do not add it. If a
   number appears on a slide, count it from the repository first.

7. **Do not treat this as production code.** No error-reporting SDKs, no retry
   frameworks, no test framework, no abstraction added "for later". Everything is
   mocked behind `src/data/mock/`. Solve the demo's problem, not an imagined one.

---

## The four kinds of component

Every component is exactly one of these. Knowing which you are writing answers most
questions about what it may do.

| Kind | Lives in | May | May not |
|---|---|---|---|
| **Region** | `src/regions/` | Declare its data in one `useLoad`, own a mutation, guard a deep link, name catalog events, route | Take its data as props; be nested in another region for layout reasons |
| **Layout** | `src/components/layouts/` | Arrange named slots, own a grid, decide where things sit | Fetch, track, know what is in its slots, know the brand |
| **Presenter** | `src/components/presenters/` | Draw a thing from props, *offer* actions, own its own UI state | Fetch, name an event, read the router, know the brand |
| **Primitive** | `src/components/primitives/` | Be one control or building block | All of the above |

What follows from that:

- **A region is not a page loader.** `SignInRegion` loads nothing and is still a
  region: it owns a mutation and provides the telemetry scope.
- **A layout has no idea what it holds.** `ListItemLayout` takes `media`, `body`,
  `aside`; it cannot tell a hotel from a flight from a past booking. That is why one
  file serves three verticals across two pages. The moment a layout knows what is
  in its gaps, it needs one variant per brand.
- **A presenter offers, an instance names.** `HotelResultCard` offers `impression`
  and `select`; whether either is reported is the call site's `track` map. The same
  card names five events on search and two on the landing page, with no flag
  inside it. Omit `track` entirely and it reports nothing.
- **Data flows down as props.** Only regions talk to the server — 15 components in
  the whole app (`npm run counts`). Everything below takes props, which is what makes it testable and
  identical in every brand.

## Composition over configuration

The most repeated move in this codebase, and the first thing to reach for when
something feels stuck:

> **A fixed run of JSX can only be shown or hidden. A list can be reordered,
> filtered, extended, and drawn differently at different sizes.**

Applied four times so far, each time removing a fork:

| Was | Became | Bought us |
|---|---|---|
| A hardcoded checkout | `Flow = FlowStep[]` with `when` / `done` | A brand adds a step by adding a line |
| A hardcoded landing page | `LandingSection[]` | Folio reorders the page without forking the region |
| Four `<NavLink>` children | `NavItem[]` | The header draws a row *or* a menu — nothing is lost on mobile |
| One sign-in layout | a `SignInLayout` slot | Halo floats the form on a photo, Kiosk puts a masthead above it, both reuse the form |

That last row is the pattern in miniature: the mobile nav bug existed *because*
the nav was opaque children. Before adding a boolean prop, a variant name, or a
second copy of a component, ask whether the thing should be a list.

## Single responsibility, concretely

- One reason to change. `ListItemLayout` changes when a row's *shape* changes;
  `HotelResultCard` when a *hotel* changes. Neither changes when a brand wants the
  price at the top of the row — that is a token.
- A component that fetches does not arrange. One that arranges does not decide. One
  that decides does not draw.
- If a file needs the word "and" to describe it, split it.
- Prefer a token over a slot, and a slot over a prop. Never a brand check.

## Comments

Comments explain **why**, in prose, at the top of a file or above the line that
would otherwise look arbitrary. They are part of the argument — several are quoted
on slides. Match the voice: plain English, full sentences, no restating the code,
no decoration. A comment recording a trap you hit ("`display: contents` has no box,
so it cannot be measured") is worth more than three naming the obvious.

## Working style

- **Agree the API before writing it.** For anything with a public surface — a new
  slot, hook, or token — state the props/values and the intended behaviour, then
  build. Do not hand over a finished implementation of an interface nobody agreed.
- **Measure, don't assert.** "It should reflow" is not evidence.
  `.claude/guides/verifying.md` is not optional.
- **Sweep all six brands, not one.** Two bugs in this repo were missed because a
  change was checked in Atlas while Folio and Kiosk were broken.
- **No code without context.** No snippets to illustrate an idea, no helpers
  nothing calls.
- **Report faithfully.** If you could not reproduce something, say so. If you
  changed scope, say which part you left and why.
- **Keep the deck honest.** `.claude/guides/slides.md` lists which slides go stale
  when you change counts, files or slots.

## Known limits — do not try to "fix" these

On the deck as *What it does not fix*. Proposing these as work is a
misunderstanding, not an improvement.

1. **The API stays as it is.** Reads declared as writes, POST envelopes, prose
   instead of error codes. `useLoad` and the adapters wrap it; they cannot make an
   error brand-specific while the API hands us finished sentences.
2. **Some differences are real.** About 94 of the 229 overrides in the live repo
   are not restyling. Five different contact sections really are five different
   things. Slots make them cheaper to hold, not fewer.
3. **The number of brands.** 50 is a commercial decision. Each brand gets cheaper;
   the count and its testing burden do not drop.
4. **Behaviour is still expensive.** Appearance and arrangement are cheap here;
   rules are not. Step *order* became config; what money and inventory do cannot —
   that rule lives in the backend and a copy on the client is a copy that drifts.
5. **Eighteen verticals are untried.** Two of roughly twenty are built.
