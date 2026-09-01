# Proving your change works

Not optional. Every rule here exists because an assertion turned out to be wrong.

## The gates

```bash
npm run build                     # tsc -b, then a real production build
npm run lint                      # 0 errors; the fast-refresh warnings are pre-existing
npm test                          # 7 tests
npm run counts                    # only if you touched anything the deck quotes
```

**Run the build, not just the typecheck.** The dev server resolves things the
bundler will not: deleting `src/tokens/index.css` left the slide deck importing a
file that no longer existed, and dev, `tsc -b` and lint were all green while
`npm run build` failed. If you moved, renamed or deleted a file, the build is the
gate that proves it.

**`npx tsc --noEmit` checks nothing.** `tsconfig.json` is a solution file — `"files": []`
plus two project references — so that command type-checks zero files and exits 0
whatever the state of the code. It looks like a passing gate and is not one, and a
broken import did survive it in this repo. Use `npx tsc -b`, which follows the
references, or `npm run build`, which runs it first.

`npm run lint` reports pre-existing `only-export-components` warnings. **Zero
errors** is the bar, not zero warnings.

## Use the running app

Never ask the user to check something manually. The dev server is a browser preview
(`.claude/launch.json`, port 5199) — drive it.

Brand and route are both in the URL, so you can go straight there:

```
http://localhost:5199/?brand=halo#/search?destination=
```

To sweep **without** reloading (a reload kills an in-page script), switch brand by
clicking the dev-panel chips and change route by assigning `location.hash`. A full
`location.href` navigation per brand means one tool call per brand.

The brand chips are MUI Chips, not `<button>`s — select them with
`'button,[role="button"],.MuiChip-root'`. A selector that misses them silently
"passes" every brand while actually testing one; that has happened.

## Measure, do not look

The browser pane intermittently serves stale or blank frames. **DOM geometry is
always trustworthy; a screenshot sometimes is not.** When they disagree, believe the
measurement — and say in your report that you could not produce a picture.

Techniques that have each caught a real bug:

| To check | Do this |
|---|---|
| Horizontal overflow | `document.documentElement.scrollWidth - clientWidth`, after ~2.5s and again scrolled to the bottom |
| Which element overflows | Walk the tree; **do not descend into** anything with `overflow-x: auto/scroll/clip`, or a deliberate shelf is a false positive |
| Alignment arguments | `getBoundingClientRect()` on both things and compare the numbers |
| A column being ragged | Measure the same element on every card in the list, not one |
| Motion that looks wrong | Sample opacity/transform **per frame** with `requestAnimationFrame` |
| Progressive reveal | Set `scrollTop`, then assert `data-state` — do not watch it |
| Slide overflow | Compare `.body`'s `scrollHeight` to its `clientHeight` on the current slide |
| Effective styles | `getComputedStyle`, not what the stylesheet says |
| What is painted at a point | `document.elementFromPoint(x, y)` |

`javascript_tool` is for **inspection only**. Never implement a fix by mutating the
page — edit the source.

## Sweep, do not spot-check

The unit of verification is **all six brands × every page you touched**. Two bugs
were missed by checking Atlas alone: Folio and Kiosk both had horizontal overflow
while Atlas measured clean.

That sweep is scripted — use it rather than re-deriving it:

```js
const src = await fetch('/scripts/sweep.js').then((r) => r.text());
(0, eval)(src);
await sweep({ brands: ['atlas', 'meridian'] });   // two at a time, see below
```

It walks brands × routes at the current width and reports horizontal overflow, a
page that did not render, and a page with no way to navigate. `failures` empty is
the bar. Run it at **375px and again at 1280px**; resize between runs.

It finds the brand switcher by `[data-poc="controls"]`, not by class name — CSS
module names are hashed, and `[class*="_panel_"]` also matches the sign-in form's
own panel, which made an earlier version silently walk the wrong list and report
nothing wrong.

## Long sweeps time out

The tool caps at 45s. Split a full sweep into two or three calls (brands 1–3, then
4–6) rather than letting one call die and losing all of it.

## Report honestly

- If you could not reproduce something the user reported, **say so plainly**, say
  what you measured, and say what you changed anyway and why.
- If a screenshot came back blank or stale, say that rather than implying you looked.
- If you fixed something adjacent that they did not report, name it separately.
- Never present a number you did not measure this session. Counts drift.
