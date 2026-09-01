/* ============================================================================
   TOKENS
   Three layers, in this order: the raw scale, what things mean, and then the
   reset. Brand stylesheets are *found*, not listed — adding a brand should
   not mean editing a file every other brand also edits. Fifty brands and fifty
   teams make a hand-written import list a merge conflict on every launch.

   Load order does not decide which brand wins, specificity does:
   `:root[data-brand='kiosk']` outranks `:root` wherever it lands.
   ========================================================================= */

import './primitives.css';
import './semantic.css';
import './reset.css';

import.meta.glob('./brands/*.css', { eager: true });
