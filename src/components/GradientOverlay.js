import React from 'react';
import { View, StyleSheet } from 'react-native';
import { theme } from '../theme';

/**
 * INKED DRAW Gradient Overlay Component
 * 
 * Implements the black-to-clear gradient effect as specified in the design requirements
 * Inspired by CREME iOS 38.png reference image
 */

const GradientOverlay = ({
  style = {},
  variant = 'default', // 'default', 'subtle', 'strong'
  position = 'bottom', // 'bottom', 'top', 'full'
  height = '50%', // Height of the gradient overlay
  children,
  ...props
}) => {
  
  const getGradientStyle = () => {
    const baseStyle = {
      position: 'absolute',
      left: 0,
      right: 0,
      zIndex: 1,
    };

    // Position-specific styles
    const positionStyles = {
      bottom: {
        bottom: 0,
        height: height,
      },
      top: {
        top: 0,
        height: height,
      },
      full: {
        top: 0,
        bottom: 0,
        height: '100%',
      },
    };

    // Variant-specific background colors (black-to-clear gradients)
    const variantStyles = {
      default: {
        backgroundColor: 'transparent',
        // In React Native, we simulate gradients with multiple overlapping views
        // or use react-native-linear-gradient for true gradients
      },
      subtle: {
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
      },
      strong: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
      },
    };

    return {
      ...baseStyle,
      ...positionStyles[position],
      ...variantStyles[variant],
    };
  };

  return (
    <View style={[getGradientStyle(), style]} {...props}>
      {/* Gradient simulation using multiple layers */}
      {variant === 'default' && (
        <>
          <View style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: position === 'bottom' 
                ? 'linear-gradient(180deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.9) 100%)'
                : 'linear-gradient(0deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.9) 100%)',
            }
          ]} />
        </>
      )}
      {children}
    </View>
  );
};

// Preset gradient overlays for common use cases
export const BottomGradientOverlay = (props) => (
  <GradientOverlay position="bottom" variant="default" {...props} />
);

export const TopGradientOverlay = (props) => (
  <GradientOverlay position="top" variant="default" {...props} />
);

export const FullGradientOverlay = (props) => (
  <GradientOverlay position="full" variant="subtle" {...props} />
);

// Enhanced gradient overlay with golden brass accent
export const PremiumGradientOverlay = ({ style = {}, ...props }) => (
  <View style={[styles.premiumContainer, style]}>
    <GradientOverlay variant="default" {...props} />
    <View style={styles.premiumAccent} />
  </View>
);

// Dramatic bottom fade gradient (like the reference image)
export const BottomFadeGradient = ({ style = {}, height = '60%', children, ...props }) => (
  <View style={[styles.bottomFadeContainer, { height }, style]} {...props}>
    <View style={[StyleSheet.absoluteFill, styles.bottomFadeLayer1]} />
    <View style={[StyleSheet.absoluteFill, styles.bottomFadeLayer2]} />
    <View style={[StyleSheet.absoluteFill, styles.bottomFadeLayer3]} />
    {children}
  </View>
);

const styles = StyleSheet.create({
  premiumContainer: {
    position: 'relative',
  },
  premiumAccent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: theme.colors.primary, // Golden brass accent line
    opacity: 0.6,
  },

  // Dramatic bottom fade styles (like reference image)
  bottomFadeContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  bottomFadeLayer1: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    bottom: '60%',
    height: '40%',
  },
  bottomFadeLayer2: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    bottom: '30%',
    height: '70%',
  },
  bottomFadeLayer3: {
    backgroundColor: 'rgba(0, 0, 0, 1)',
    bottom: 0,
    height: '40%',
  },
});

export default GradientOverlay;

// === USAGE EXAMPLES ===
/*

// Basic bottom gradient overlay (black-to-clear)
<View style={{ position: 'relative' }}>
  <Image source={backgroundImage} style={styles.backgroundImage} />
  <BottomGradientOverlay height="60%">
    <Text style={styles.overlayText}>Content over gradient</Text>
  </BottomGradientOverlay>
</View>

// Premium gradient with golden brass accent
<View style={{ position: 'relative' }}>
  <Image source={collectionImage} style={styles.collectionImage} />
  <PremiumGradientOverlay>
    <Text style={styles.premiumText}>Premium Collection</Text>
  </PremiumGradientOverlay>
</View>

// Custom gradient overlay
<GradientOverlay 
  variant="strong" 
  position="top" 
  height="40%"
  style={{ borderRadius: theme.borderRadius.lg }}
>
  <Text>Custom overlay content</Text>
</GradientOverlay>

*/
