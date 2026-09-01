import { buildTheme, type BrandTokens } from '../theme';

/** Near-black with pastel pink and periwinkle. Square, tight, capitals. */
export const tokens: BrandTokens = {
  mode: 'dark',
  primary: '#f2c4dc',
  secondary: '#c6d4f0',
  background: { page: '#100e10', card: '#1d1b1d' },
  text: { primary: '#eff4f5', secondary: '#8f9ca3' },
  divider: '#282527',
  fontDisplay: "'Playfair Display', Georgia, serif",
  fontBody: "'Inter', system-ui, sans-serif",
  spacing: 8,
  radius: 2,
  elevation: 1,
  buttonCase: 'uppercase',
  fontSize: 15,
  /** This brand animates. What that looks like is the page's decision. */
  animates: true,
};

export const theme = buildTheme(tokens);
