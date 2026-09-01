# Writing a chapter of the deck

You are writing **one chapter** as a standalone HTML fragment. Someone else
assembles the file, so write only `<section>` elements and nothing around them.

Read `slides/index.html` for markup examples. Earlier decks were removed once
this one replaced them; `git log` has them if you want an argument back.

## The one rule

**Never show an API, a number or a behaviour that does not exist.** Open the
source and check. Trimming a real sample with `…` is fine; inventing one is not.
If you want to show something the POC does not do, say so on the slide.

## Voice

This is the rule that gets broken most, so it is mechanical.

- **No sentence longer than about 20 words.** If it runs on, it becomes two
  sentences. Count them.
- **One clause per sentence where you can manage it.** Two at most. A sentence
  with three commas and a dash is a paragraph pretending to be a sentence.
- **No clever endings.** Delete "which is the whole point", "and that is on
  purpose", "that is the only reason", "it is not X, it is Y". State the fact
  and stop. If the point needs underlining, it was not stated plainly enough.
- **No em-dash asides stacked on a sentence that already finished.**
- No melodrama, no "a harder change", no "derive / decide / commit". Say what
  the thing is.
- A slide is read at a glance from across a room. Prose that needs a second
  pass has failed, however well it is written.
- Say the claim, then show the evidence. Heading states it, lede explains it,
  then the code or the picture.
- Nobody will narrate this. Every slide has to stand alone.
- No line counts. No "716 components" style statistics beyond chapter 01.
- British spelling.

## Structure of a slide

```html
<section>
  <div class="eyebrow"><span class="num">/ 06</span><span>Data</span></div>
  <h2>One call, four requests</h2>
  <p class="lede">One sentence saying why this slide exists.</p>
  <div class="body">
    …
  </div>
</section>
```

A chapter with several slides is a **vertical stack**: wrap them in one outer
`<section>` and put each slide in a nested `<section>`.

`/ NN` and the chapter word must be identical on every slide of the chapter —
the footer reads them.

## What you may use

| Class | For |
|---|---|
| `.body` | the slide's content area. Everything below the lede goes in it |
| `.cols.cols-2` | two equal columns. **`.cols` alone is not a grid** — it needs `cols-2`, `cols-3`, `cols-2-1` or `cols-1-1` |
| `table.rules` | anything with parallel structure. Cells: `.who` (mono, brand colour), `.owns` (primary text), `.instead` (muted), `.varies` (muted) |
| `.rules--brands`, `--four`, `--homes`, `--dials`, `--two-col` | column-width variants; see `deck.css` |
| `ul.rules > li` | the same, without a table |
| `.card` + `.tag` | a short aside. `.tag--ok`, `.tag--warn`, `.tag--bad` for green / amber / red |
| `.metrics > .metric` | big numbers. `<span class="n">`, `<span class="k">` label, `<span class="src">` where it came from |
| `<pre><code>` | code. Colour with `<span class="k">` keyword, `<span class="s">` string, `<span class="c">` comment, `<span class="h">` name being highlighted |
| `.codelabel` | the file path above a code block |
| `<figure>` + `<figcaption>` | an illustration and its caption |
| `.lede--wide` | a closing line under the body |

Escape `<` `>` `&` inside `<code>` as `&lt;` `&gt;` `&amp;`.

**Never show a fragment on its own.** Every excerpt carries the file it came
from and the declaration it sits inside — the function, the component, the
exported object. A reader who cannot say where a line lives cannot tell whether
it is the argument or an example of it. Cut the *middle* of a body to
`/* ...what is omitted... */`; never cut the signature that names it.

## Illustrations

**Draw one wherever the reader would otherwise have to picture something.**
Inline `<svg>` only — no libraries, no external files.

```html
<svg viewBox="0 0 1000 400" role="img" aria-label="what this shows">
```

Available classes: `.box` (outline), `.box-fill` (solid), `.box-sub` (nested),
`.rule` (hairline), and text classes `.t-mono .t-tiny .t-small .t-muted
.t-second .t-brand .t-onfill`. Use tokens for colour, never literals.

**Animate anything that changes over time** — a request arriving, a list
filling, an event travelling up a tree, a card growing into a page. Two ways:

1. **Reveal fragments** for stepping: `class="fragment"` on a group, so the
   speaker advances through the states. Best for "then this, then this".
2. **CSS animation** inside the SVG for continuous motion. Put the keyframes in
   a `<style>` block inside the `<svg>`, scope them to that slide's classes, and
   respect `@media (prefers-reduced-motion: reduce)`.

Do not animate for decoration. Animate when the movement *is* the explanation.

## Checking your work

The deck is a 1280×720 canvas. **Content that runs past the bottom is invisible**
and it happens constantly.

```js
const s = [...document.querySelectorAll('.reveal section.present')].pop();
const b = s.querySelector('.body') || s;
b.scrollHeight - b.clientHeight;      // must be 0
```

Check every slide you write, at `http://localhost:5173/slides/`. If it overflows,
cut a line of copy or a line of code — never shrink the type.
