/**
 * Inked Draw Design System
 * Complete theme configuration based on State-Styles.md specifications
 * 
 * This is the single source of truth for all design tokens in the application.
 * Import this theme in components to ensure consistency across the app.
 */

import { colors } from './colors';
import { textStyles, fonts, fontSizes, lineHeights, fontWeights, letterSpacing } from './typography';
import { spacing, semanticSpacing, borderRadius, dimensions } from './spacing';
import { animations, durations, easings, transforms, opacity, shadows } from './animations';

export const theme = {
  colors,
  textStyles,
  fonts,
  fontSizes,
  lineHeights,
  fontWeights,
  letterSpacing,
  spacing,
  semanticSpacing,
  borderRadius,
  dimensions,
  animations,
  durations,
  easings,
  transforms,
  opacity,
  shadows,
} as const;

// Component style presets based on State-Styles.md specifications
export const componentStyles = {
  // Primary Button (from State-Styles.md)
  primaryButton: {
    backgroundColor: colors.accent.goldLeaf,
    color: colors.primary.onyx,
    height: dimensions.button.height,
    borderRadius: dimensions.button.borderRadius,
    paddingHorizontal: semanticSpacing.buttonPaddingHorizontal,
    paddingVertical: semanticSpacing.buttonPaddingVertical,
    ...textStyles.button,
  },

  // Secondary Button (from State-Styles.md)
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.neutral[700],
    color: colors.text.primary,
    height: dimensions.button.height,
    borderRadius: dimensions.button.borderRadius,
    paddingHorizontal: semanticSpacing.buttonPaddingHorizontal,
    paddingVertical: semanticSpacing.buttonPaddingVertical,
    ...textStyles.buttonSecondary,
  },

  // Card (from State-Styles.md)
  card: {
    backgroundColor: colors.background.surface,
    borderRadius: dimensions.card.borderRadius,
    padding: dimensions.card.padding,
    ...shadows.sm,
  },

  // Input Field (from State-Styles.md)
  input: {
    backgroundColor: 'transparent',
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
    height: dimensions.input.height,
    color: colors.text.primary,
    ...textStyles.body,
  },

  // Input Field Focus State
  inputFocused: {
    borderBottomWidth: 2,
    borderBottomColor: colors.border.focus,
  },

  // Screen Container
  screenContainer: {
    flex: 1,
    backgroundColor: colors.background.primary,
    padding: semanticSpacing.screenPadding,
  },

  // Modal Container
  modalContainer: {
    backgroundColor: colors.background.surface,
    borderRadius: borderRadius.lg,
    padding: semanticSpacing.lg,
    margin: semanticSpacing.md,
    ...shadows.lg,
  },
} as const;

// Export individual theme parts for granular imports
export { colors } from './colors';
export { textStyles, fonts, fontSizes, lineHeights, fontWeights, letterSpacing } from './typography';
export { spacing, semanticSpacing, borderRadius, dimensions } from './spacing';
export { animations, durations, easings, transforms, opacity, shadows } from './animations';

// Type exports for TypeScript support
export type Theme = typeof theme;
export type ComponentStyles = typeof componentStyles;

// Default export
export default theme;
