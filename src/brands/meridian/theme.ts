import { buildTheme, type BrandTokens } from '../theme';

/** Warm paper and deep forest. Fully rounded, roomy. */
export const tokens: BrandTokens = {
  mode: 'light',
  primary: '#2b5440',
  secondary: '#a56132',
  background: { page: '#faf8f4', card: '#ffffff' },
  text: { primary: '#1f1a14', secondary: '#6b5f4c' },
  divider: '#e6e0d5',
  fontDisplay: "'Outfit', system-ui, sans-serif",
  fontBody: "'Outfit', system-ui, sans-serif",
  spacing: 10,
  radius: 22,
  elevation: 1,
  buttonCase: 'none',
  fontSize: 16,
};

export const theme = buildTheme(tokens);
