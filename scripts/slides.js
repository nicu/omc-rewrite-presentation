/* ============================================================================
   SLIDE CHECK
   Walks the deck and reports every slide where something cannot be read.

       const src = await fetch('/scripts/slides.js').then((r) => r.text());
       (0, eval)(src);
       await slides();               // whole deck
       await slides({ from: 6 });    // from chapter 6 on, if the call times out

   Run it from http://localhost:5173/slides/.

   Three ways text goes missing, and all three have happened here:

     · the slide is taller than the canvas, so the bottom of it is off-screen;
     · a label sits outside its SVG's viewBox, so the SVG clips it — the body
       measures fine and the sentence is still half a line of grey;
     · an element with `overflow: hidden` is shorter than its content.

   Anything in `failures` is a slide somebody will read and not understand.
   ========================================================================= */

window.slides = async ({ from = 0, to = 99 } = {}) => {
  const failures = [];
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const chapters = [...document.querySelectorAll('.reveal .slides > section')];

  for (let h = from; h < Math.min(to, chapters.length); h += 1) {
    const stacked = chapters[h].querySelectorAll(':scope > section').length;
    for (let v = 0; v < (stacked || 1); v += 1) {
      location.hash = stacked ? `#/${h}/${v}` : `#/${h}`;
      /* Long enough for reveal to swap the .present class and lay the slide
         out. Measuring the outgoing slide reports nonsense. */
      await sleep(180);

      const slide = [...document.querySelectorAll('.reveal section.present')].pop();
      if (!slide) { failures.push(`${h}/${v}: no slide`); continue; }
      const where = `${h}/${v} "${(slide.querySelector('h1,h2')?.textContent ?? '').trim().slice(0, 32)}"`;

      const body = slide.querySelector('.body') ?? slide;
      const past = body.scrollHeight - body.clientHeight;
      if (past > 0) failures.push(`${where}: ${past}px past the bottom`);

      for (const svg of slide.querySelectorAll('svg')) {
        const box = (svg.getAttribute('viewBox') ?? '').split(/\s+/).map(Number);
        if (box.length !== 4) continue;
        const [x, y, w, h2] = box;
        for (const label of svg.querySelectorAll('text')) {
          let bb;
          try { bb = label.getBBox(); } catch { continue; }
          if (bb.width === 0) continue;
          const outside = bb.x < x - 1 || bb.y < y - 1
            || bb.x + bb.width > x + w + 1 || bb.y + bb.height > y + h2 + 1;
          if (outside) {
            failures.push(`${where}: "${label.textContent.trim().slice(0, 30)}" outside the viewBox`);
          }
        }
      }

      /* Clipping is only a bug when it was not asked for. Three kinds are
         deliberate and were all reported as failures until they were excluded:
         a scroll container, a line clamp, and anything collapsed to nothing —
         a closed disclosure is supposed to be 0px tall. */
      for (const el of slide.querySelectorAll('.body *')) {
        const style = getComputedStyle(el);
        if (['auto', 'scroll', 'visible'].includes(style.overflowY)) continue;
        if (style.webkitLineClamp && style.webkitLineClamp !== 'none') continue;
        if (el.clientHeight === 0) continue;
        const cut = el.scrollHeight - el.clientHeight;
        if (cut > 2) failures.push(`${where}: ${el.tagName.toLowerCase()} clips ${cut}px`);
      }
    }
  }

  failures.forEach((f) => console.warn(f));
  console.log(failures.length ? `${failures.length} problem(s)` : 'every slide readable');
  return { failures };
};
