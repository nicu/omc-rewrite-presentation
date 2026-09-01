/* ============================================================================
   BRAND THEME
   One function turns a brand's raw values into an MUI theme. MUI is told to
   emit CSS variables, so `--mui-palette-primary-main` and friends exist at
   runtime and our own layout CSS can use them alongside MUI components.

   This is the file that carries the visual difference between brands. If a
   brand needs a component of its own, it is because this could not express it.
   ========================================================================= */

import { createTheme, type Theme } from '@mui/material/styles';

export type BrandTokens = {
  mode: 'light' | 'dark';
  /** The brand colour: buttons, links, selected states. */
  primary: string;
  /** Used for figures that must not look clickable — points earned, badges. */
  secondary: string;
  background: { page: string; card: string };
  text: { primary: string; secondary: string };
  divider: string;

  fontDisplay: string;
  fontBody: string;
  /** 8 = tight, 10 = roomy. Feeds MUI's spacing() and our --space-* scale. */
  spacing: number;
  /** 0 = square, 24 = fully rounded. */
  radius: number;
  /** Brands that want a flat look set this to 0 and rely on borders. */
  elevation: 0 | 1;
  /** Atlas puts its buttons in capitals; the others do not. */
  buttonCase: 'none' | 'uppercase';
  /** Base body size in px. Feeds MUI's rem calculations. */
  fontSize: number;
};

export const buildTheme = (t: BrandTokens): Theme =>
  createTheme({
    cssVariables: true,
    palette: {
      mode: t.mode,
      primary: { main: t.primary },
      secondary: { main: t.secondary },
      background: { default: t.background.page, paper: t.background.card },
      text: { primary: t.text.primary, secondary: t.text.secondary },
      divider: t.divider,
    },
    spacing: t.spacing / 2,
    shape: { borderRadius: t.radius },
    /* Our seven roles, expressed as MUI variants. A presenter asks for
       "title"; this is the only place a size is decided. */
    typography: {
      fontFamily: t.fontBody,
      fontSize: t.fontSize,
      h1: { fontFamily: t.fontDisplay, fontWeight: 700, fontSize: '3rem',     lineHeight: 1.1,  letterSpacing: '-0.02em' },
      h2: { fontFamily: t.fontDisplay, fontWeight: 700, fontSize: '2.25rem',  lineHeight: 1.15, letterSpacing: '-0.02em' },
      h3: { fontFamily: t.fontDisplay, fontWeight: 600, fontSize: '1.625rem', lineHeight: 1.25 },
      h6: { fontFamily: t.fontBody,    fontWeight: 600, fontSize: '1.125rem', lineHeight: 1.3 },
      body1:    { fontSize: '0.9375rem', lineHeight: 1.55 },
      body2:    { fontSize: '0.8125rem', lineHeight: 1.5 },
      button:   { textTransform: t.buttonCase, fontWeight: 600 },
      overline: { fontSize: '0.6875rem', letterSpacing: '0.12em', fontWeight: 600, lineHeight: 1.6 },
    },
    components: {
      MuiPaper: {
        defaultProps: { elevation: t.elevation },
        styleOverrides: {
          root: { backgroundImage: 'none', ...(t.elevation === 0 && { border: `1px solid ${t.divider}` }) },
        },
      },
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: { root: { borderRadius: t.radius } },
      },
      MuiChip: { styleOverrides: { root: { fontWeight: 600 } } },
      MuiToggleButton: {
        styleOverrides: { root: { textTransform: t.buttonCase, fontWeight: 600, border: 'none' } },
      },
    },
  });
