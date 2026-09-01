# Mobile

Read this before calling any rendering change done. Every rule here comes from a
bug that was actually shipped in this repo.

## Never hide function

**`display: none` on something that carries function is a bug, not a breakpoint.**
The header nav was `display: none` below 700px with nothing in its place — all four
destinations simply gone, on every brand, on every page.

The fix is not a smaller version of the row; it is that **the same list gets a
second form**:

```tsx
<nav className={styles.nav}>{nav.map(…)}</nav>          {/* the row */}
<button className={styles.menuButton}>…</button>         {/* and the menu */}
```

with exactly one of the two on screen at any width, so nothing is reachable in one
and not the other.

This is why `nav` is `NavItem[]` and not children. **A slot holding opaque children
can only be shown or hidden** — and hiding it is how the items were lost. If you are
about to hide something on narrow screens, first check whether it should be a list.

## The layout was doing the spacing

When you hide a flexible child, whatever it was spacing collapses. The nav was the
bar's only `flex: 1` child, so hiding it let the logo and the actions bunch up on the
left and the burger ended up 65px short of the right edge. Hiding something means
checking what it was holding apart.

## Reuse the brand's own surfaces

The mobile menu is the existing `Modal` primitive, so it is **the brand's own surface** —
glass on Halo, paper on Kiosk — with no brand-specific code, and focus trapping and
Escape come free. Prefer an existing primitive over a new drawer.

## Units and insets

- **`dvh`, not `vh`,** for anything sized to the viewport on a phone. `vh` is the
  *tallest* the viewport ever gets, so a bottom sheet sized in `vh` hides its own
  bottom edge under the browser's toolbar.
- **`env(safe-area-inset-bottom, 0px)`** on anything pinned to the bottom. Always
  with the `0px` fallback, so it is a no-op everywhere that has no inset.
- **`overflow-x: clip`, not `hidden`,** on page-level containers — `hidden` makes it
  a scroll container and breaks `position: sticky` outside it. See
  `.claude/guides/motion.md` for why it is needed at all.

## A dev control still has to be reachable

The dev panel was `display: none` below 1100px — and the button that reopens it only
renders when the panel is closed, while the panel started open. On a phone the
controls were **unreachable by design**. It is now a bottom sheet at that width, and
it starts closed at every width:

```ts
const [open, setOpen] = useState(() => sessionStorage.getItem(PANEL_KEY) === 'open');
```

It used to open itself on anything wider than 1100px, which put the instrument on
screen before the app was — most obviously over the arrival after signing in. The
choice is remembered for the tab so a demonstration does not mean reopening it after
every reload; a stored choice is not the same as opening on its own. Read once at
mount, so no resize listener and no effect.

## Deliberate horizontal scrolling

A shelf that scrolls sideways needs three things, and the third is the one everyone
forgets:

```css
scroll-snap-type: x mandatory;      /* on the scroller */
scroll-snap-align: start;           /* on each child */
scroll-padding-inline: var(--page-gutter);   /* or every snap ignores the padding */
```

Without `scroll-padding`, `scroll-snap-align: start` aligns to the **scrollport's**
edge and throws the container's padding away, so the first cover parks hard against
the side of the screen, out of line with the heading above it.

## Before you finish

Sweep, do not spot-check. Two separate bugs were missed by checking Atlas only.

**All six brands × every page you touched, at 375px**, and confirm for each:

1. `document.documentElement.scrollWidth - clientWidth === 0`
2. every nav item is reachable
3. the burger is flush right (0 inset in the shared bar; 16px inside Halo's pill,
   matching its logo)
4. no element wider than the viewport once motion has settled

**Wait ~2.5s before measuring overflow.** A mid-flight `Reveal` transform reads as
overflow and will send you chasing a layout bug that does not exist. Then scroll to
the bottom and measure again, so every reveal has actually fired.

**Skip elements inside a scroll container** when hunting overflow, or a deliberately
scrolling shelf reads as a false positive. Walk the tree and do not descend into
anything whose `overflow-x` is `auto`, `scroll` or `clip`.

Then check **320px** and **440px** too — they catch different things.
