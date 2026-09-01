import { buildTheme, type BrandTokens } from '../theme';

/**
 * KIOSK — a magazine rack. Pale blue-grey paper, white cards with a soft lift
 * and generous corners, a Didone serif for headings against a plain sans for
 * everything else, and pastel tags doing the colour work.
 *
 * The look comes from the covers, so the surfaces stay quiet: nothing here
 * competes with the photography.
 */
export const tokens: BrandTokens = {
  mode: 'light',
  /* Muted on purpose. In a magazine rack the colour is on the covers and the
     tags; the furniture around them stays quiet, or everything shouts. */
  primary: '#6f9585',
  secondary: '#e8927c',
  background: { page: '#eaeff6', card: '#ffffff' },
  text: { primary: '#1a1f2b', secondary: '#6b7280' },
  divider: '#e2e8f2',
  fontDisplay: "'Playfair Display', Georgia, serif",
  fontBody: "'Inter', system-ui, sans-serif",
  spacing: 9,
  radius: 14,
  elevation: 1,
  buttonCase: 'none',
  fontSize: 15,
  animates: true,
};

export const theme = buildTheme(tokens);
