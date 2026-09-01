import { buildTheme, type BrandTokens } from '../theme';

/** Mid-grey and bright teal. Flat: elevation 0, so Paper draws a border. */
export const tokens: BrandTokens = {
  mode: 'dark',
  primary: '#55d4c4',
  secondary: '#ff8b6f',
  background: { page: '#1d222a', card: '#242a33' },
  text: { primary: '#eef1f5', secondary: '#9aa4b4' },
  divider: '#353d4a',
  fontDisplay: "'Archivo', system-ui, sans-serif",
  fontBody: "'Archivo', system-ui, sans-serif",
  spacing: 8,
  radius: 6,
  elevation: 0,
  buttonCase: 'none',
  fontSize: 15,
};

/* No `animates`: this brand does not animate. Nothing else has to know. */
export const theme = buildTheme(tokens);
