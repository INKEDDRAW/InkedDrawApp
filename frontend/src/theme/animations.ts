/**
 * Inked Draw Animation System
 * Based on State-Styles.md specifications
 * Subtle, physics-based animations with 300ms ease-in-out curve
 */

// Animation durations
export const durations = {
  fast: 150,
  normal: 300,    // Standard transition from State-Styles.md
  slow: 500,
  screenTransition: 250, // Screen transitions from State-Styles.md
} as const;

// Easing curves
export const easings = {
  easeInOut: 'ease-in-out',  // Standard curve from State-Styles.md
  easeIn: 'ease-in',
  easeOut: 'ease-out',
  linear: 'linear',
  spring: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)', // Spring physics for modals
} as const;

// Animation presets for common interactions
export const animations = {
  // Standard state change (from State-Styles.md)
  stateChange: {
    duration: durations.normal,
    easing: easings.easeInOut,
  },

  // Screen transitions (from State-Styles.md)
  screenTransition: {
    duration: durations.screenTransition,
    easing: easings.easeInOut,
  },

  // Modal transitions with spring physics (from State-Styles.md)
  modalTransition: {
    duration: durations.normal,
    easing: easings.spring,
  },

  // Button interactions
  buttonPress: {
    duration: durations.fast,
    easing: easings.easeOut,
  },

  // Focus states
  focus: {
    duration: durations.fast,
    easing: easings.easeInOut,
  },

  // Loading states
  loading: {
    duration: durations.slow,
    easing: easings.linear,
  },

  // Toast notifications
  toast: {
    duration: durations.normal,
    easing: easings.easeOut,
  },
} as const;

// Transform values for interactive elements
export const transforms = {
  // Button hover scale (from State-Styles.md)
  buttonHover: 1.02,
  
  // Button active scale (from State-Styles.md)
  buttonActive: 0.98,
  
  // Card hover
  cardHover: 1.01,
  
  // Icon press
  iconPress: 0.95,
} as const;

// Opacity values for different states
export const opacity = {
  disabled: 0.5,
  loading: 0.7,
  overlay: 0.8,
  pressed: 0.8,
  hidden: 0,
  visible: 1,
} as const;

// Shadow configurations for elevation
export const shadows = {
  none: {
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  xl: {
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 16,
  },
} as const;

export type Durations = typeof durations;
export type Easings = typeof easings;
export type Animations = typeof animations;
