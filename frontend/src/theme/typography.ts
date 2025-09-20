/**
 * Inked Draw Typography System
 * Based on State-Styles.md specifications
 * Pairs classic, readable serif for headings with clean, modern sans-serif for UI text
 */

export const fonts = {
  heading: 'Lora',           // Well-balanced serif with classic feel for major titles and headings
  body: 'Inter',             // Highly legible sans-serif for all UI text, from body copy to labels
} as const;

export const fontSizes = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 22,
  '2xl': 28,
  '3xl': 36,
  '4xl': 48,
} as const;

export const lineHeights = {
  xs: 16,
  sm: 20,
  base: 24,
  lg: 24,
  xl: 28,
  '2xl': 36,
  '3xl': 44,
  '4xl': 56,
} as const;

export const fontWeights = {
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const;

export const letterSpacing = {
  tight: -0.5,
  normal: 0,
  wide: 0.5,
  wider: 1,
} as const;

// Text style definitions based on State-Styles.md
export const textStyles = {
  // H1 (Screen Title): 28px/36px, Lora Regular, Alabaster
  h1: {
    fontFamily: fonts.heading,
    fontSize: fontSizes['2xl'],
    lineHeight: lineHeights['2xl'],
    fontWeight: fontWeights.normal,
    color: '#EAEAEA', // alabaster
  },

  // H2 (Section Header): 22px/28px, Lora Regular, Alabaster
  h2: {
    fontFamily: fonts.heading,
    fontSize: fontSizes.xl,
    lineHeight: lineHeights.xl,
    fontWeight: fontWeights.normal,
    color: '#EAEAEA', // alabaster
  },

  // H3 (Card Title): 18px/24px, Inter Semibold, Alabaster
  h3: {
    fontFamily: fonts.body,
    fontSize: fontSizes.lg,
    lineHeight: lineHeights.lg,
    fontWeight: fontWeights.semibold,
    color: '#EAEAEA', // alabaster
  },

  // Body: 16px/24px, Inter Regular, Alabaster
  body: {
    fontFamily: fonts.body,
    fontSize: fontSizes.base,
    lineHeight: lineHeights.base,
    fontWeight: fontWeights.normal,
    color: '#EAEAEA', // alabaster
  },

  // Body (Secondary): 14px/20px, Inter Regular, Neutral-500
  bodySecondary: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    fontWeight: fontWeights.normal,
    color: '#888888', // neutral-500
  },

  // Button Text: 16px/20px, Inter Medium, Onyx (on gold buttons)
  button: {
    fontFamily: fonts.body,
    fontSize: fontSizes.base,
    lineHeight: lineHeights.sm,
    fontWeight: fontWeights.medium,
    color: '#121212', // onyx
  },

  // Button Text Secondary
  buttonSecondary: {
    fontFamily: fonts.body,
    fontSize: fontSizes.base,
    lineHeight: lineHeights.sm,
    fontWeight: fontWeights.medium,
    color: '#EAEAEA', // alabaster
  },

  // Label/Caption: 12px/16px, Inter Regular, Neutral-500, All-Caps, Letter spacing 0.5px
  label: {
    fontFamily: fonts.body,
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
    fontWeight: fontWeights.normal,
    color: '#888888', // neutral-500
    textTransform: 'uppercase' as const,
    letterSpacing: letterSpacing.wide,
  },

  // Caption (without uppercase)
  caption: {
    fontFamily: fonts.body,
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
    fontWeight: fontWeights.normal,
    color: '#888888', // neutral-500
  },
} as const;

export type TextStyles = typeof textStyles;
export type FontSizes = typeof fontSizes;
export type LineHeights = typeof lineHeights;
