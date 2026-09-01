/* ============================================================================
   THE SWEEP
   Every brand × every page × two widths, asserting the things that have
   actually broken in this repo: horizontal overflow, a lost nav, a page that
   did not render.

   It runs *in the page* rather than in Node, so it needs no browser driver and
   no dependency. Two ways to use it:

     · a person — open the app, paste this file in, then call `sweep()`
     · an agent — evaluate the file, then call `sweep({ brands: [...] })`

   It defines `window.sweep` and runs nothing on its own. Pass a subset of
   brands to stay inside a tool call's time budget: six brands × five routes ×
   the settle below is over a minute, which is longer than an agent gets.

   It returns a report object and logs a table. Anything in `failures` is a bug.

   Why this exists: "adding a brand is safe" is the claim this prototype makes,
   and it is only credible if something checks it. Two separate overflow bugs
   reached this repo because a change was verified in one brand.
   ========================================================================= */

window.sweep = async ({ brands: only, routes } = {}) => {
  /* These are hashes, so they have to match router.tsx's PATHS, not the route
     names. `/search` was in this list for months: the parser does not know that
     word, so it fell through to the landing page and every sweep quietly tested
     the landing twice and the stays search never. A route that does not exist
     does not fail here — it renders something else, and passes. */
  const ROUTES = routes ?? [
    '/', '/stays?to=', '/stays/h-alcazar', '/flights?destination=', '/account', '/signin',
  ];
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  /* Scoped to the dev panel by a stable attribute. Pages have chips of their
     own (amenities, tags), and CSS-module class names are hashed — matching on
     `[class*="_panel_"]` also catches the sign-in form's panel, which is how an
     earlier version of this walked the wrong list and reported nothing. */
  const panel = () => document.querySelector('[data-poc="controls"]');
  const chips = () => [...(panel()?.querySelectorAll('.MuiChip-root') ?? [])];
  const chip = (id) => chips().find((c) => c.textContent.trim().toLowerCase().startsWith(id));

  /* Motion that travels sideways sits translated until it is revealed, and a
     mid-flight transform reads as overflow. Wait for it to land. */
  const SETTLE = 2500;

  /* A shelf that scrolls sideways on purpose is not overflow, so do not descend
     into anything that scrolls. */
  const overflowing = () => {
    const vw = document.documentElement.clientWidth;
    const hits = [];
    const walk = (el) => {
      for (const child of el.children) {
        const style = getComputedStyle(child);
        if (style.display === 'none') continue;
        const box = child.getBoundingClientRect();
        if (box.height > 0 && box.right > vw + 1) {
          hits.push(`${child.tagName}.${String(child.className).split(' ')[0]} → ${Math.round(box.right)}px`);
        }
        if (['auto', 'scroll', 'clip'].includes(style.overflowX)) continue;
        walk(child);
      }
    };
    walk(document.body);
    return hits;
  };

  const pick = () => chips()
    .map((c) => c.textContent.trim().toLowerCase().split(' ')[0])
    .filter((id) => !only || only.includes(id));

  let brands = pick();
  if (!brands.length) {
    document.querySelector('[data-poc="reopen"]')?.click();
    await sleep(600);
    if (!chips().length) {
      console.warn('Open the POC controls first — the brand switcher is how this walks the brands.');
      return { failures: ['dev panel closed'] };
    }
    brands = pick();
  }

  const report = [];
  const failures = [];

  for (const id of brands) {
    chip(id).click();
    await sleep(700);

    for (const route of ROUTES) {
      location.hash = route;
      await sleep(SETTLE);

      const doc = document.documentElement;
      const overflowX = doc.scrollWidth - doc.clientWidth;
      const rendered = Boolean(document.querySelector('#root > *'));
      const navItems = document.querySelectorAll('header [class*="_nav_"] > *').length;
      const menuButton = Boolean(document.querySelector('[class*="_menuButton_"]'));
      const reachable = route === '/signin' || navItems > 0 || menuButton;

      const row = { brand: id, route, width: innerWidth, overflowX, rendered, reachable };
      report.push(row);

      if (overflowX > 0) failures.push(`${id} ${route} @${innerWidth}: overflows by ${overflowX}px — ${overflowing()[0] ?? '?'}`);
      if (!rendered) failures.push(`${id} ${route} @${innerWidth}: nothing rendered`);
      if (!reachable) failures.push(`${id} ${route} @${innerWidth}: no way to navigate`);
    }
  }

  console.table(report);
  if (failures.length) console.error(`${failures.length} failure(s):\n` + failures.join('\n'));
  else console.log(`✓ ${report.length} checks passed at ${innerWidth}px`);

  return { checks: report.length, failures };
};

console.log('sweep() ready — call sweep() for every brand, or sweep({ brands: ["atlas"] }) for some.');
