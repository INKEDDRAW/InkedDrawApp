/**
 * Inked Draw Spacing System
 * Based on State-Styles.md specifications
 * 8px grid system for consistent spacing throughout the application
 */

export const spacing = {
  0: 0,
  1: 4,    // 0.5 * 8px
  2: 8,    // 1 * 8px (base unit)
  3: 12,   // 1.5 * 8px
  4: 16,   // 2 * 8px
  5: 20,   // 2.5 * 8px
  6: 24,   // 3 * 8px
  7: 28,   // 3.5 * 8px
  8: 32,   // 4 * 8px
  9: 36,   // 4.5 * 8px
  10: 40,  // 5 * 8px
  12: 48,  // 6 * 8px
  14: 56,  // 7 * 8px
  16: 64,  // 8 * 8px
  20: 80,  // 10 * 8px
  24: 96,  // 12 * 8px
  32: 128, // 16 * 8px
  40: 160, // 20 * 8px
  48: 192, // 24 * 8px
  56: 224, // 28 * 8px
  64: 256, // 32 * 8px
} as const;

// Semantic spacing aliases for common use cases
export const semanticSpacing = {
  // Component internal spacing
  xs: spacing[1],    // 4px
  sm: spacing[2],    // 8px
  md: spacing[4],    // 16px
  lg: spacing[6],    // 24px
  xl: spacing[8],    // 32px
  '2xl': spacing[10], // 40px

  // Layout spacing
  screenPadding: spacing[4],      // 16px - Standard screen edge padding
  cardPadding: spacing[4],        // 16px - Card internal padding (from State-Styles.md)
  sectionSpacing: spacing[6],     // 24px - Space between major sections
  componentSpacing: spacing[4],   // 16px - Space between components

  // Button spacing
  buttonPaddingVertical: spacing[3],   // 12px - For 50px height buttons
  buttonPaddingHorizontal: spacing[6], // 24px - Horizontal button padding

  // Form spacing
  inputSpacing: spacing[4],       // 16px - Space between form inputs
  labelSpacing: spacing[2],       // 8px - Space between label and input

  // List spacing
  listItemSpacing: spacing[3],    // 12px - Space between list items
  listSectionSpacing: spacing[6], // 24px - Space between list sections
} as const;

// Border radius values
export const borderRadius = {
  none: 0,
  sm: 4,
  md: 8,    // Standard button radius from State-Styles.md
  lg: 12,   // Card radius from State-Styles.md
  xl: 16,
  '2xl': 24,
  full: 9999,
} as const;

// Component-specific dimensions
export const dimensions = {
  // Button dimensions (from State-Styles.md)
  button: {
    height: 50,
    borderRadius: borderRadius.md, // 8px
  },

  // Card dimensions (from State-Styles.md)
  card: {
    borderRadius: borderRadius.lg, // 12px
    padding: spacing[4], // 16px
  },

  // Input dimensions
  input: {
    height: 48,
    borderRadius: borderRadius.md, // 8px
  },

  // Tab bar
  tabBar: {
    height: 80,
    paddingBottom: 20, // For safe area
  },

  // Header
  header: {
    height: 56,
  },
} as const;

export type Spacing = typeof spacing;
export type SemanticSpacing = typeof semanticSpacing;
export type BorderRadius = typeof borderRadius;
