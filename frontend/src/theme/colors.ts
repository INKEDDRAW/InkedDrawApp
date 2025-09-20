/**
 * Inked Draw Color Palette
 * Based on State-Styles.md specifications
 * Dark, warm, and sophisticated palette designed to feel like a private lounge or cellar
 */

export const colors = {
  // Primary Colors
  primary: {
    onyx: '#121212',           // Primary background - deep, near-black for immersive focus
    charcoal: '#1E1E1E',       // Primary surface color for cards, modals, and elevated panels
    alabaster: '#EAEAEA',      // Primary text color for high contrast and readability
  },

  // Accent Colors
  accent: {
    goldLeaf: '#C4A464',       // Primary brand accent for key actions, buttons, and highlights
    goldLeafLight: '#D4B880',  // Used for hover states on gold elements
  },

  // Functional Colors
  functional: {
    successGreen: '#3A8E5A',   // For confirmations, successful saves, and positive feedback
    errorRed: '#C75450',       // For errors, destructive actions, and validation failures
    warningAmber: '#D9A05B',   // For non-critical warnings and alerts, such as sync conflicts
  },

  // Neutral Colors (Grayscale)
  neutral: {
    700: '#333333',            // For borders, dividers, and disabled states
    500: '#888888',            // For secondary text, placeholders, and metadata
  },

  // Semantic aliases for easier usage
  background: {
    primary: '#121212',        // onyx
    surface: '#1E1E1E',        // charcoal
    elevated: '#333333',       // neutral-700
  },

  text: {
    primary: '#EAEAEA',        // alabaster
    secondary: '#888888',      // neutral-500
    accent: '#C4A464',         // goldLeaf
    inverse: '#121212',        // onyx (for text on gold backgrounds)
  },

  border: {
    default: '#333333',        // neutral-700
    focus: '#C4A464',          // goldLeaf
    error: '#C75450',          // errorRed
    success: '#3A8E5A',        // successGreen
  },

  button: {
    primary: {
      background: '#C4A464',   // goldLeaf
      backgroundHover: '#D4B880', // goldLeafLight
      backgroundActive: '#B39454', // darker gold
      text: '#121212',         // onyx
    },
    secondary: {
      background: 'transparent',
      backgroundHover: '#333333', // neutral-700
      backgroundActive: '#2A2A2A',
      border: '#333333',       // neutral-700
      text: '#EAEAEA',         // alabaster
    },
  },

  status: {
    success: '#3A8E5A',
    error: '#C75450',
    warning: '#D9A05B',
    info: '#C4A464',
  },

  // Sync status colors
  sync: {
    synced: '#3A8E5A',         // successGreen
    syncing: '#C4A464',        // goldLeaf
    conflict: '#D9A05B',       // warningAmber
    offline: '#888888',        // neutral-500
  },
} as const;

export type Colors = typeof colors;
