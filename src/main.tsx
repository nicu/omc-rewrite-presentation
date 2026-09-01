import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import './tokens/index.css';
import { cache } from './data/cache';
import { App } from './app/App';

// Handy while evaluating: `__cache.timings()` in the console shows when each
// request started and finished, so you can see the overlap for yourself.
(window as unknown as { __cache: typeof cache }).__cache = cache;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
