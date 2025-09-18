/**
 * INKED DRAW - Luxury Social Platform Theme System
 * 
 * Design Philosophy: Private member's lounge aesthetic with leather-bound journal feel
 * Motion: Deliberate, weighty, cinematic cross-fades (no bouncy animations)
 * Quality: Premium, tactile, sophisticated
 */

export const theme = {
  // === COLOR PALETTE ===
  colors: {
    // Primary Background & Surfaces
    background: '#000000',        // Pure Black - main background
    surface: '#111111',           // Dark Gray - cards and elevated surfaces
    
    // Text Colors
    text: '#F4F1ED',              // Parchment White - primary text
    textSecondary: '#B8B5B0',     // Muted parchment for secondary text
    textTertiary: '#8A8782',      // Subtle text for hints/placeholders
    
    // Brand Accent Colors (Updated to match CREME iOS 38.png inspiration)
    primary: '#c3a154',           // Golden Brass - primary buttons & actions (as specified)
    secondary: '#2A2A2A',         // Charcoal - secondary accents for subtle contrast
    premium: '#c3a154',           // Golden Brass - premium features & highlights (matching primary)
    
    // Functional Colors
    success: '#4A7C59',           // Muted green for success states
    warning: '#c3a154',           // Golden brass for warnings (consistent with brand)
    error: '#8B4513',             // Saddle brown for errors
    
    // Interactive States (Golden brass variations)
    primaryHover: '#d4b366',      // Lighter golden brass for hover
    primaryPressed: '#b29042',    // Darker golden brass for pressed
    premiumHover: '#d4b366',      // Lighter golden brass for hover
    premiumPressed: '#b29042',    // Darker golden brass for pressed
    secondaryHover: '#3A3A3A',    // Lighter charcoal for hover
    secondaryPressed: '#1A1A1A',  // Darker charcoal for pressed
    
    // Overlay & Borders
    overlay: 'rgba(26, 26, 26, 0.85)',     // Semi-transparent background
    border: 'rgba(244, 241, 237, 0.1)',    // Subtle borders
    borderActive: 'rgba(244, 241, 237, 0.2)', // Active borders
  },

  // === TYPOGRAPHY ===
  typography: {
    // Font Families
    heading: 'PlayfairDisplay-Bold',  // Luxury serif for headings
    body: 'Inter-Regular',            // Clean sans-serif for body text
    bodyMedium: 'Inter-Medium',       // Medium weight for emphasis
    bodyBold: 'Inter-Bold',           // Bold weight for strong emphasis
    
    // Font Sizes (following 8dp grid system)
    sizes: {
      xs: 12,     // Small labels, captions
      sm: 14,     // Body text, secondary info
      md: 16,     // Primary body text
      lg: 18,     // Subheadings
      xl: 24,     // Section headings
      xxl: 32,    // Page titles
      xxxl: 40,   // Brand wordmark
    },
    
    // Line Heights (1.5x font size for readability)
    lineHeights: {
      xs: 18,
      sm: 21,
      md: 24,
      lg: 27,
      xl: 36,
      xxl: 48,
      xxxl: 60,
    },
    
    // Font Weights
    weights: {
      regular: '400',
      medium: '500',
      bold: '700',
    },
  },

  // === SPACING SYSTEM (8dp grid) ===
  spacing: {
    xs: 4,      // 0.5 units
    sm: 8,      // 1 unit
    md: 16,     // 2 units
    lg: 24,     // 3 units
    xl: 32,     // 4 units
    xxl: 48,    // 6 units
    xxxl: 64,   // 8 units
  },

  // === BORDER RADIUS ===
  borderRadius: {
    sm: 4,      // Small elements
    md: 8,      // Buttons (as specified: 8dp)
    lg: 12,     // Cards (as specified: 12dp)
    xl: 16,     // Large cards
    round: 50,  // Circular elements (avatars, etc.)
  },

  // === COMPONENT DIMENSIONS ===
  dimensions: {
    // Touch Targets (minimum 44dp as specified)
    touchTarget: 44,
    
    // Button Heights
    buttonHeight: 48,     // As specified in prompt
    buttonHeightSmall: 40,
    buttonHeightLarge: 56,
    
    // Icon Sizes
    iconSmall: 16,
    iconMedium: 24,       // As specified: 24dp
    iconLarge: 32,
    
    // Avatar Sizes
    avatarSmall: 32,
    avatarMedium: 48,
    avatarLarge: 64,
    
    // Card Dimensions
    cardMinHeight: 120,
    cardPadding: 16,
  },

  // === SHADOWS & ELEVATION ===
  shadows: {
    // Subtle shadows for luxury feel
    card: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 4,
    },
    button: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 2,
    },
    overlay: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 8,
    },
  },

  // === ANIMATION TIMING ===
  animation: {
    // Deliberate, weighty timing (no bouncy animations)
    fast: 200,      // Quick transitions
    medium: 300,    // Standard transitions
    slow: 500,      // Cinematic cross-fades
    
    // Easing curves for sophisticated motion
    easing: {
      standard: 'ease-out',
      enter: 'ease-out',
      exit: 'ease-in',
    },
  },

  // === OPACITY LEVELS ===
  opacity: {
    disabled: 0.4,
    secondary: 0.7,
    overlay: 0.85,
    subtle: 0.1,
  },
};

// === UTILITY FUNCTIONS ===

/**
 * Get consistent spacing value
 * @param {string} size - xs, sm, md, lg, xl, xxl, xxxl
 * @returns {number} spacing value
 */
export const getSpacing = (size) => theme.spacing[size] || theme.spacing.md;

/**
 * Get typography style object
 * @param {string} variant - heading, body, bodyMedium, bodyBold
 * @param {string} size - xs, sm, md, lg, xl, xxl, xxxl
 * @returns {object} typography style
 */
export const getTypography = (variant = 'body', size = 'md') => ({
  fontFamily: theme.typography[variant] || theme.typography.body,
  fontSize: theme.typography.sizes[size],
  lineHeight: theme.typography.lineHeights[size],
  color: theme.colors.text,
});

/**
 * Get button style based on variant
 * @param {string} variant - primary, premium, secondary
 * @returns {object} button style
 */
export const getButtonStyle = (variant = 'primary') => {
  const baseStyle = {
    height: theme.dimensions.buttonHeight,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: theme.dimensions.touchTarget,
    ...theme.shadows.button,
  };

  switch (variant) {
    case 'premium':
      return {
        ...baseStyle,
        backgroundColor: theme.colors.premium,
      };
    case 'secondary':
      return {
        ...baseStyle,
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: theme.colors.border,
      };
    default: // primary
      return {
        ...baseStyle,
        backgroundColor: theme.colors.primary,
      };
  }
};

/**
 * Get card style with luxury aesthetic
 * @param {boolean} elevated - whether to apply shadow
 * @returns {object} card style
 */
export const getCardStyle = (elevated = true) => ({
  backgroundColor: theme.colors.surface,
  borderRadius: theme.borderRadius.lg,
  padding: theme.spacing.md,
  ...(elevated ? theme.shadows.card : {}),
});

export default theme;
