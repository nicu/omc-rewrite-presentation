# Motion

Animation is the first thing that tempts everyone into writing a brand-specific
component. It does not have to be, as long as **four questions stay with four
different owners**.

| The question | Answered in | Applies to |
|---|---|---|
| Does this brand move at all? | `theme.animates` | A yes or no. Leave it out and the brand does not move — and no wrapper renders at all |
| How far, how fast, how far apart? | **design tokens** | The scale everything picks from, retuned per brand beside `--space-unit` |
| Which way, and which step of each? | **the call site** | That section, in every brand |
| Is this section a different thing entirely? | **overrides** | That section, in that brand — a carousel instead of a grid |

Fold motion into the third row — `AnimatedFeaturedDestinations` — and the other two
multiply into it: next comes `CarouselFeaturedDestinations`, then
`AnimatedCarouselFeaturedDestinations`, each re-implementing the section body. That
is how eight headers happen. Kept apart, a new component is needed only when the
*thing* changes, never when the motion does.

## Two components, not one

```
<Entrance>  arrives when it mounts, on screen or not.
            For something meant to be watched: a card at the top of a page,
            the contents of a dialog, a row just added.

<Reveal>    arrives when you scroll to it, and does nothing at all if it was
            already on screen when the page loaded — unless the call site
            says `eager`, which is the only way to turn that last clause off.
```

Each has a **group** form — `<EntranceGroup>`, `<RevealGroup>` — which answers "are
we there yet" once and shares it, so several parts of one thing arrive as a
sequence instead of drifting apart.

```tsx
<RevealGroup>
  {items.map((item, i) => (
    <Reveal key={item.id} direction="left" distance="lg" speed="normal" order={i}>…</Reveal>
  ))}
</RevealGroup>
```

`<Reveal stagger>` is the standalone form for a list, where each box watches for
itself — so a list running past the fold reveals the part you scrolled to rather
than waiting on whichever item happens to be first.

## `eager` — the one way out of "already on screen does not animate"

```tsx
<Reveal eager stagger direction="up" distance="sm" speed="fast">…</Reveal>
<RevealGroup eager>…</RevealGroup>
```

The default stands: what the reader is already looking at is left `idle`. `eager`
is one call site saying it wants this one watched anyway — a hero, or a summary
card that lands after the page did. Everything else about the component is
unchanged, and everything it refuses to do it still refuses:

- Below the fold it changes **nothing**. An eager box that is off screen is an
  ordinary reveal and still waits to be scrolled to — measured on a 375px
  account page, the first trip played on arrival and the second and third sat
  `hidden` until `scrollY` reached 900.
- A brand without `theme.animates` still renders no wrapper at all, and reduced
  motion still renders the children unwrapped.
- It stands down for an `Arrival`, which an ordinary reveal never had to. That
  used to be true for free: what is on screen is `idle` and what is below the
  fold is not being looked at. An eager reveal is by definition something above
  the fold that wants to move, which is the one thing an arrival cannot share
  the screen with.
- The stand-down is **latched at mount**, not watched. Read live, the flag flips
  when the arrival settles and the entrance fires a second and a half late —
  the same collision, moved. `Entrance` behaves the same way for the same
  reason: it goes `idle` → `shown`, which changes nothing on screen.

`eager` belongs on a group, not on one box inside it: within a `RevealGroup` the
trigger is the group's, and one member deciding for itself that it is on screen
is how a sequence stops being one.

### Why `Entrance` and `EntranceGroup` do not take it

Because they already do it. An entrance arrives when it mounts, **on screen or
not** — that is the entire difference between the two components, and the whole
reason `BalanceSummary` is an `EntranceGroup`. Measured on the atlas account
page at 900px tall, its four boxes sit at 164–262px, well above the fold, and go
`hidden` → `shown` on mount with no prop asked for.

So `eager` on an `Entrance` would be a control that does nothing, which
`CLAUDE.md` forbids outright. The one case where an entrance does not play is an
`Arrival` carrying the page — and overriding *that* is not what `eager` is for.
It is what the stand-down above refuses, eager reveals included.

### The trap: hide in the render, not in the effect

An eager reveal starts `hidden` in the `useState` initializer, exactly as
`useEntrance` does. Setting it from the layout effect instead — which is where
the below-the-fold path sets it, and which is still "before paint" — is
measurably wrong here. The effect has to read the box to know whether it is on
screen, and asking for the box resolves the element's style, which hands the
browser a "before" to transition *from*. Sampled per frame, a trips row then
animated *out* of the state it was already in for the two frames it takes to
flip, and came back: opacity 1.00 → 0.88 → 1.00, a flicker rather than an
entrance. Set in the render, the hidden state is the element's first computed
style, and a first computed style never transitions — the same rows then
measured 0.00 → 1.00 over the full duration, travelling 24px.

Starting hidden means every way out of that effect has to put it back, or a
browser with no `IntersectionObserver` leaves the content invisible. That branch
shows it explicitly; the rule is still "it fails visible".

## …and one arrival

```
<Arrival active>  the whole page settling into place, once, after something
                  changed who you are. Fades in while easing back from
                  slightly enlarged, blur clearing as it goes.
```

One prop, because there is only one way to arrive — **and one appearance, for
every brand.** This is the deliberate exception to the four questions above: how
far it pulls back, how soft it starts and how long it takes are declared on the
element in `Reveal.module.css`, outside the scale a brand retunes.

An arrival is a moment in the product — the first sight of the app after signing
in — not a brand's house style, so a brisk brand does not get a brisk arrival. A
brand decides only *whether* it happens, through `theme.animates`; one without it
renders the children unwrapped as usual.

That the values are unreachable is structural, not a convention: a brand
stylesheet can only set custom properties on `:root`, and a property declared on
the element itself wins for that subtree. Put them in `primitives.css` and a
brand could quietly retune them — which is exactly where they started.

**Everything else stands down while it runs.** An `Entrance` firing at the same
moment fights the arrival — a dozen things each starting from somewhere else,
inside something that is itself moving. So `Arrival` publishes "the page is
arriving" through context, and `Entrance` and `EntranceGroup` render `idle`
(visible, no transition) until it settles. An ordinary `Reveal` is left alone:
what is on screen is already `idle`, and what is below the fold is not being
looked at. `<Reveal eager>` is the exception that proves it — it is the one
reveal with something above the fold to move, so it reads the same context and
stands down too.

**Scale about the centre of what is visible.** Measured before paint from
`visualViewport.height` (falling back to `innerHeight`) plus `scrollY`, with
`50dvh` in the stylesheet as the value it starts from. Two traps, both hit:
`vh` is the *tallest* the viewport ever gets, so on a phone showing browser
chrome half of it sits below the true centre — hence `dvh`. And guard on the
number being **usable, not merely present**: an embedded or not-yet-painted view
reports a `visualViewport.height` of `0`, which `??` happily accepts, and an
origin of `0px` is the top of the page — the exact fault this is here to avoid.

**Scale about the viewport, not the element.** `transform-origin` is resolved
against the element's own box, and our pages are several screens tall — so a
percentage origin lands far below the fold, and scaling about a point nobody can
see is a *translation*, not a zoom. Measured at `50% 40%` on a 6282px page: the
top edge moved 151px up and the bottom of the viewport 97px up — both edges the
same way, which reads as the page sliding down into place. `50% 50vh` anchors it
to the middle of the screen, and the visible edges then move apart
symmetrically (±24px on a 7731px page, ±27px on a 3762px one — page height stops
mattering). This is the difference between the effect working and not.

Three things about it are not decoration:

- **It stops being transformed when it is done.** A transform makes the element
  the containing block for every `position: fixed` descendant, and the sticky
  header sits inside it. Left in place it would quietly break both for the rest
  of the session — so there is a third state, `settled`, that carries no
  transform, no filter and no transition. `transform: scale(1)` is **not**
  `none`: an identity transform still creates the containing block, which is why
  `shown` is not the end state.
- **It settles whether or not the transition reports.** `transitionend` is a
  maybe — a page that is not being rendered runs no transitions — and the cost
  of missing it is not a missed animation, it is that transform left behind. So
  there is a timer as well as the event, the same "fails visible" rule the
  reveals follow.

The moment is handed across by a one-shot flag (`src/app/arrival.ts`): sign-in
arms it in the handler that caused it, the next page takes it on mount, and
taking it clears it. Nothing watches anything. When it should fire only on a
member's *first ever* sign-in, that answer comes from the account and only the
arming changes.

**A one-shot read in a `useState` initializer needs care.** StrictMode runs
initializers twice and keeps the second answer, so a flag that cleared on the
first call answered `true` then `false` and the animation never ran. `takeArrival`
gives the same answer for the rest of the tick, which makes the pair agree.

## …and one swap

```
<Swap name={status}>  one thing becoming another — a skeleton becoming
                      results, results becoming a failure panel, a failure
                      becoming results after a retry.
```

The hard edge between those is not the fade, it is the **height**: a skeleton is
tall, "1 result" is short, and the page jumps hundreds of pixels in one frame.
So `Swap` animates the box between two measured heights and fades the incoming
content in. `height: auto` is not animatable and `interpolate-size` does not
help here — `auto → auto` never changes the computed value — so the heights are
measured, which is why the previous one is recorded on every render rather than
read after the change.

**It animates a collapse, not a growth.** Growing means clipping the incoming
content for the whole animation, which is precisely what "the last items are cut
off" looks like — and no easing fixes it. A collapse is the one worth softening
anyway: it yanks the page up under the reader. Growth just appears, and the fade
carries it. The box is also only clipped *while it is moving*; left clipped it
trimmed the shadow off every card in the list.

**Wrapping a list breaks its spacing.** The gap belonged to the parent and
applied to its children — insert a wrapper and it suddenly applies to one child
instead, and every gap in the list disappears. `gap: inherit` on both wrappers
hands it down, so the list keeps its rhythm and `Swap` still does not need to
know what it is wrapping.

**It does not keep the outgoing subtree mounted.** A true crossfade would, and
the old content can contain regions and impression observers — holding it alive
for another half second would report things the reader never saw. A fade-in over
a moving height is not worth lying to analytics for.

**Its release is not effect cleanup.** The effect runs on every render, so a
cleanup cancelled the release on the very next one and left the box clamped at a
height the content had outgrown — measured stranded at 716px while rendering
1825px, clipping everything. The next swap cancels the previous one instead, and
a timer covers a view that never runs the transition.

## `direction` names travel, not origin

The prop says which way the element **moves as it arrives**, not the edge it comes
from. So:

- `direction="up"` rises into place **from below**
- `direction="left"` slides in **from the right**

This is documented on the type because it is genuinely counter-intuitive and it has
already been got wrong once.

## Props are steps on a scale, never numbers

`distance="sm|md|lg"`, `speed="fast|normal|slow"`. They resolve to
`--motion-distance-*` and `--duration-*`, which each brand retunes. Meridian is
22px/260ms; Folio is 96px/640ms. A call site says *which way and which step*, never
how far in pixels.

## The rules the wrapper will not break

Most of the work in a reveal is not the animation — it is refusing to do it at the
wrong moment. Do not "simplify" any of these away.

1. **What is already on screen does not animate.** Content at the top of the page is
   where the reader is already looking; moving it is a distraction, not an entrance —
   and to animate it in you first have to take it away. Already-visible content is
   left `idle`. This is the one rule with a documented way out, `eager`, because it
   is a good default rather than a safety property — see above. The rest of this
   list holds for an eager reveal exactly as it does for every other one.
2. **Hide before the first paint, or not at all.** Deciding to hide something after
   the browser has painted is exactly what makes a section appear, animate out and
   animate back. The decision happens in `useLayoutEffect`.
3. **It fails visible.** No observer, a silent observer, a background tab: the
   content shows. An `IntersectionObserver` that exists is not one that reports, so
   there is a backstop as well as a fallback — and the backstop is cancelled on the
   observer's **first callback of any kind**, because `observe()` always delivers one
   immediately. Cancelling only on an *intersecting* entry reveals the whole page on
   a timer.
4. **Reduced motion wins.** Checked in the component, not the theme, so no brand can
   decide it is the exception. It then renders what a brand with no motion renders:
   the children, unwrapped.
5. **A group has no box.** It is `display: contents` so it cannot disturb the grid it
   sits in — which also means it cannot be measured and an observer on it never
   reports. It observes `firstElementChild` instead. This has bitten twice.
6. **`theme.motion` is MUI's.** Ours is `theme.animates`. See
   `.claude/guides/tokens.md`.

## Horizontal travel needs clipping

Something entering from the right **sits translated right while it waits**. Below the
fold on a narrow screen nothing has revealed it yet, so that offset becomes real page
width and the whole site gains a horizontal scrollbar into empty space. Kiosk's
categories sat exactly 56px right of the page — its `--motion-distance-lg`.

`.main` carries `overflow-x: clip` in both shells. **`clip`, not `hidden`**: it does
not make the element a scroll container, so the sticky header outside it keeps
working. If you add a third shell, it needs the same line.

## Easing

`--easing-entrance` is `cubic-bezier(0.33, 1, 0.68, 1)`. A curve like
`cubic-bezier(0, 0, 0, 1)` at a short duration spends its whole budget in the first
frame — sampled per frame, Meridian went 0 → 0.49 opacity in one frame and read as
"appearing from nowhere". If motion looks instant, sample it frame by frame before
changing durations.

## Checklist

- Brand moves? `animates: true` in its theme. Absent means no wrapper renders.
- Scale retuned in its brand stylesheet.
- Call site picks direction, distance step, speed step, order.
- Above the fold and meant to be watched? `<Entrance>`, or `<Reveal eager>` if the
  same thing is a scroll reveal elsewhere. Never a second component.
- Travelling sideways? The shell clips.
- Verify by **scroll position**, not by watching: `.claude/guides/verifying.md`.
