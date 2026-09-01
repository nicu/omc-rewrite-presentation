import { buildTheme, type BrandTokens } from '../theme';

/**
 * HALO — liquid glass, dark. Translucent surfaces over a lit background,
 * generous corners, quiet type. Everything is soft and slow; the page behind
 * the glass is painted in this brand's brand stylesheet, because glass over
 * a flat colour is just a grey box.
 */
export const tokens: BrandTokens = {
  mode: 'dark',
  primary: '#7aa2ff',
  secondary: '#c9a7ff',
  background: { page: '#05060a', card: 'rgba(255,255,255,0.06)' },
  text: { primary: '#f5f7ff', secondary: '#a6adc4' },
  divider: 'rgba(255,255,255,0.12)',
  fontDisplay: "'Outfit', system-ui, sans-serif",
  fontBody: "'Inter', system-ui, sans-serif",
  spacing: 9,
  radius: 20,
  elevation: 0,
  buttonCase: 'none',
  fontSize: 15,
  animates: true,
  surface: { kind: 'glass', blur: 22, tint: 'rgba(255,255,255,0.06)', edge: 'rgba(255,255,255,0.14)' },
};

export const theme = buildTheme(tokens);
