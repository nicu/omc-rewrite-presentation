import { ThemeProvider } from '@mui/material/styles';
import { createRoot } from 'react-dom/client';
import Reveal from 'reveal.js';
import RevealNotes from 'reveal.js/plugin/notes';
import 'reveal.js/reveal.css';

// The deck is styled by the application's own tokens and by the same MUI
// themes the app uses. Mounting a brand's ThemeProvider publishes its
// --mui-* variables on :root, which is what our stylesheets read — so the
// slides and the app cannot drift apart.
import { BRANDS, type BrandId } from '../src/brands';
import { showLive } from './live';
import '../src/tokens';
import './deck.css';

const themeHolder = document.createElement('div');
themeHolder.style.display = 'none';
document.body.appendChild(themeHolder);
const themeRoot = createRoot(themeHolder);

const applyBrand = (id: BrandId) => {
  document.documentElement.dataset.brand = id;
  themeRoot.render(<ThemeProvider theme={BRANDS[id].theme}><span /></ThemeProvider>);
  showLive(id);
  for (const b of document.querySelectorAll<HTMLButtonElement>('#brands button')) {
    b.setAttribute('aria-pressed', String(b.dataset.brand === id));
  }
};

applyBrand('atlas');

const deck = new Reveal({
  width: 1280,
  height: 720,
  margin: 0.055,
  // Slides lay themselves out top-down; reveal must not re-centre them.
  center: false,
  hash: true,
  slideNumber: 'c/t',
  // Sections with several slides are vertical stacks, so Left/Right move
  // between sections and Up/Down move inside one. Space still walks the whole
  // deck in reading order, and Esc shows the sections as a grid.
  transition: 'fade',
  transitionSpeed: 'fast',
  controls: true,
  progress: true,
  // Press S for the speaker view; add <aside class="notes"> to any slide.
  plugins: [RevealNotes],
});

const foot = document.getElementById('foot');
const syncFooter = () => {
  const current = deck.getCurrentSlide();
  const parts = [...(current?.querySelectorAll('.eyebrow > span') ?? [])]
    .map((n) => n.textContent?.trim())
    .filter(Boolean);
  if (foot) foot.textContent = parts.join('  ·  ');
};

/* The picker is in the footer rather than on a slide: every slide with a live
   component is worth seeing in more than one brand, and a control you have to
   navigate back to is a control nobody uses. */
const brands = document.getElementById('brands');
if (brands) {
  brands.innerHTML = Object.values(BRANDS)
    .map((b) => `<button data-brand="${b.id}" aria-pressed="false">${b.name}</button>`)
    .join('');
  brands.addEventListener('click', (event) => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>('button[data-brand]');
    if (button) applyBrand(button.dataset.brand as BrandId);
  });
}

deck.initialize().then(() => {
  syncFooter();
  applyBrand('atlas');
  /* Slides are only in the DOM once reveal has laid them out, and a specimen
     on a slide you have not reached yet has nothing to mount into. */
  deck.on('slidechanged', () => { syncFooter(); showLive(current()); });
});

const current = () => (document.documentElement.dataset.brand ?? 'atlas') as BrandId;

// Brand switcher — swaps the MUI theme, exactly as the app does.
document.getElementById('switcher')?.addEventListener('click', (event) => {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>('button[data-brand]');
  if (!button) return;
  applyBrand(button.dataset.brand as BrandId);
  button.parentElement?.querySelectorAll('button').forEach((b) => {
    b.setAttribute('aria-pressed', String(b === button));
  });
});
