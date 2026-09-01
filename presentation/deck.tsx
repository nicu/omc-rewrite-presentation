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
import '../src/tokens/index.css';
import './deck.css';

const themeHolder = document.createElement('div');
themeHolder.style.display = 'none';
document.body.appendChild(themeHolder);
const themeRoot = createRoot(themeHolder);

const applyBrand = (id: BrandId) => {
  document.documentElement.dataset.tenant = id;
  themeRoot.render(<ThemeProvider theme={BRANDS[id].theme}><span /></ThemeProvider>);
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

deck.initialize().then(() => {
  syncFooter();
  deck.on('slidechanged', syncFooter);
});

// Brand switcher — swaps the MUI theme, exactly as the app does.
document.getElementById('switcher')?.addEventListener('click', (event) => {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>('button[data-tenant]');
  if (!button) return;
  applyBrand(button.dataset.tenant as BrandId);
  button.parentElement?.querySelectorAll('button').forEach((b) => {
    b.setAttribute('aria-pressed', String(b === button));
  });
});
