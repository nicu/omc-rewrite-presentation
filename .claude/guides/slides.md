# The deck

`slides/index.html` — reveal.js on a 1280×720 canvas with a 5.5% margin.
`slides/deck.css` holds the styles, `slides/deck.tsx` the config, and
`slides/CONVENTIONS.md` is the house style: read that before writing a slide.

There is one deck. Earlier versions — `attic.html`, `claude.html` and the
`composition-alternative` app — were removed once this one replaced them; `git
log` still has them if an argument needs recovering.

The deck **describes `src/`**, so a change to the code can make a slide false.
That is the main thing to watch.

## Chapters

```
00 Title                    06 Working with it
01 Where we are             07 A harder change · the checkout wizard
02 What we want             08 Where logic lives
03 The pieces               09 In the code we have
04 Let us build one         10 What it took
05 What a change costs
```

Multi-slide chapters are **vertical stacks** (`<section>` inside `<section>`),
so each chapter moves down and the deck moves right. `navigationMode: 'linear'`
cancels that — leave the default.

## The theme

One idea, stated four times: **a fixed run of something can only be shown or
hidden; a list can be reordered, filtered, added to, and drawn differently.**
Presentation, data, analytics and animation are four subjects; that is the move
they have in common, and it is the reason this is one talk.

## What goes stale, and when

| If you change | Re-check |
|---|---|
| `BrandOverrides` | ch 05 — the slot count and the code sample |
| A brand's config | ch 05 — the table of what each brand fills |
| A brand stylesheet | ch 05 — the token examples |
| `Chrome.tsx` or a chrome slot | ch 03 — the header slides |
| `useLoad`, `cache` or a query | ch 04 — every sample there is quoted from those files |
| `Analytics`, the catalog or an adapter | ch 04 |
| `Reveal.tsx` or a motion token | ch 05 |
| The checkout flow or its steps | ch 06, 07, 08 |
| `src/domain` | ch 08 — the four jobs, and ch 09 which mirrors them |
| Brand-name greps | ch 01, ch 10 |

Numbers the deck still quotes come from the repository, not from memory:

```bash
node scripts/counts.mjs
```

**No line counts.** The old deck leaned on them and they proved nothing: this is
a prototype, and comparing its size to a production codebase is not an argument.
Counts of *things* — brands, slots, verticals, components that talk to the
server — are fine, because they are what the argument is about.

## Rules learned the hard way

- **Simple English.** No slide that needs the previous one to parse. No
  melodrama in a heading — the audience is being asked to make a decision, not
  read a thriller.
- **Say the thing, then the evidence.** A heading that states the claim, a lede
  that explains it, then the code or the picture.
- **Code samples are trimmed, not fabricated.** Eliding with `…` is fine;
  showing an API that does not exist is not.
- **Draw it wherever the reader would otherwise have to picture it**, and
  animate it wherever the thing being explained is a change over time.
- **`.cols` on its own is not a grid.** It needs `cols-2`, `cols-3`, `cols-2-1`
  or `cols-1-1`. Without one, both columns stack and the slide silently
  overflows. This has bitten.

## Check for overflow

Content that runs past the bottom is invisible and it happens constantly. On the
current slide:

```js
const s = [...document.querySelectorAll('.reveal section.present')].pop();
const body = s.querySelector('.body') || s;
body.scrollHeight - body.clientHeight;      // must be 0
```

Sweep every chapter after editing. `Reveal` is not exposed globally — navigate
by assigning `location.hash = '#/<h>/<v>'`, and split the sweep across calls so
it does not time out.

Fixing overflow: trim a line of copy or a line from a code sample first. Do not
shrink type — the deck's scale is deliberate.

## Deployment

GitHub Pages via GitHub Actions (**not** branch/`docs`). The workflow needs
**Node 24** — Node 22's npm 10 cannot install this lockfile and fails `npm ci`
with a `yaml` version mismatch that looks like a dependency problem and is not.
