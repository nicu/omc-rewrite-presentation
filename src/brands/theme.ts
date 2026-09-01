/* ============================================================================
   BRAND THEME
   One function turns a brand's raw values into an MUI theme. MUI is told to
   emit CSS variables, so `--mui-palette-primary-main` and friends exist at
   runtime and our own layout CSS can use them alongside MUI components.

   This is the file that carries the visual difference between brands. If a
   brand needs a component of its own, it is because this could not express it.
   ========================================================================= */

import { createTheme, type Theme } from '@mui/material/styles';

/* Whether this brand animates at all. How far, how fast and which way are
   not a brand's business — those are tokens, and the page picks from them.
   A brand that wants a different feel retunes --duration-* and
   --motion-distance-* in its brand stylesheet, where it already retunes
   --space-unit and --font-size-base. */

/* Whether a brand animates lives on the theme, beside the colours and the
   corner radius, rather than in a component's props.

   Not called `motion`: MUI already owns `theme.motion` (it holds
   `reducedMotion`), and a value put there is silently replaced by MUI's own. */
declare module '@mui/material/styles' {
  interface Theme { animates?: boolean }
  interface ThemeOptions { animates?: boolean }
}

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
  /** Leave it out and the brand does not animate, anywhere. */
  animates?: boolean;
  /**
   * How surfaces are drawn, when "a border or a shadow" is not the answer.
   * A union rather than a pile of flags: a brand is one of these, and the
   * fields that come with it are the ones that treatment actually needs.
   */
  surface?:
    | { kind: 'sticker'; ink: string; width: number; offset: number }
    | { kind: 'glass'; blur: number; tint: string; edge: string };
};

export const buildTheme = (t: BrandTokens): Theme =>
  createTheme({
    cssVariables: true,
    ...(t.animates && { animates: true }),
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
    /* `elevation: 0` has to mean flat everywhere, not just on Paper. Without
       this, any `boxShadow: n` written anywhere would still resolve to a real
       shadow and quietly undo the brand's choice. */
    ...(t.elevation === 0 && { shadows: Array(25).fill('none') as never }),
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
          root: {
            backgroundImage: 'none',
            /* Accordion is a Paper, but a disclosure is not a card: it wants a
               rule above it and nothing else. Without this exclusion the flat
               treatments box it in on all four sides, hard against text that
               is deliberately flush to the edge. */
            '&.MuiAccordion-root': {
              borderInline: 'none', borderBlockEnd: 'none', boxShadow: 'none', backdropFilter: 'none',
            },
            ...(!t.surface && t.elevation === 0 && { '&:not(.MuiAccordion-root)': { border: `1px solid ${t.divider}` } }),

            /* Hard line, hard drop, no blur: the sticker look. */
            ...(t.surface?.kind === 'sticker' && {
              '&:not(.MuiAccordion-root)': {
                border: `${t.surface.width}px solid ${t.surface.ink}`,
                boxShadow: `${t.surface.offset}px ${t.surface.offset}px 0 ${t.surface.ink}`,
              },
            }),

            /* Translucent, blurred, lit along one edge. Needs something behind
               it to be worth anything, which is why this brand paints the page
               rather than leaving it flat. */
            ...(t.surface?.kind === 'glass' && {
              '&:not(.MuiAccordion-root)': {
                backgroundColor: t.surface.tint,
                backdropFilter: `blur(${t.surface.blur}px) saturate(180%)`,
                WebkitBackdropFilter: `blur(${t.surface.blur}px) saturate(180%)`,
                border: `1px solid ${t.surface.edge}`,
                boxShadow: '0 8px 32px rgba(0,0,0,0.37)',
              },
            }),
          },
        },
      },
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: {
            borderRadius: t.radius,
            ...(t.surface?.kind === 'sticker' && {
              border: `${t.surface.width}px solid ${t.surface.ink}`,
              boxShadow: `${t.surface.offset}px ${t.surface.offset}px 0 ${t.surface.ink}`,
              '&:active': { transform: `translate(${t.surface.offset}px, ${t.surface.offset}px)`, boxShadow: 'none' },
            }),
            ...(t.surface?.kind === 'glass' && {
              backdropFilter: 'blur(12px)',
              border: `1px solid ${t.surface.edge}`,
            }),
          },
        },
      },
      /* Badges are small capitals in every brand so far. It lives here, not in
         the Badge primitive, so a brand that wants sentence case can say so. */
      MuiChip: {
        styleOverrides: {
          root: {
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            fontSize: '0.6875rem',
          },
        },
      },
      MuiToggleButton: {
        styleOverrides: { root: { textTransform: t.buttonCase, fontWeight: 600, border: 'none' } },
      },
    },
  });
