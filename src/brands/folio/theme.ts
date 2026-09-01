import { buildTheme, type BrandTokens } from '../theme';

/**
 * FOLIO — a magazine. Ink on paper, a serif that means it, and a lot of air.
 * No shadows and almost no radius: the structure comes from the type and the
 * whitespace, not from boxes. Motion is heavy, because the point of this brand
 * is to see whether our layouts survive being pushed off the grid.
 */
export const tokens: BrandTokens = {
  mode: 'light',
  primary: '#1a1a1a',
  secondary: '#b4451f',
  background: { page: '#f3f0e9', card: '#faf8f4' },
  text: { primary: '#141414', secondary: '#5d574c' },
  divider: '#d8d2c6',
  fontDisplay: "'Fraunces', Georgia, serif",
  fontBody: "'Inter', system-ui, sans-serif",
  spacing: 11,
  radius: 2,
  elevation: 0,
  buttonCase: 'none',
  fontSize: 16,
  animates: true,
};

export const theme = buildTheme(tokens);
