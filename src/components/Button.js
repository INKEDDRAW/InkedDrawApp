import React, { useRef } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
  Animated,
} from 'react-native';
import { theme, getButtonStyle, getTypography } from '../theme';

/**
 * INKED DRAW Button Component
 * 
 * Luxury button with primary (Leather Brown) and premium (Antique Gold) variants
 * Follows 8dp corner radius, 48dp height specifications
 * Minimum 44dp touch target for accessibility
 */

const Button = ({
  title,
  onPress,
  variant = 'primary', // 'primary', 'premium', 'secondary'
  size = 'medium',     // 'small', 'medium', 'large'
  disabled = false,
  loading = false,
  icon = null,
  iconPosition = 'left', // 'left', 'right'
  style = {},
  textStyle = {},
  ...props
}) => {
  // Animation values for sophisticated press feedback
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const shadowAnim = useRef(new Animated.Value(0)).current;
  const colorAnim = useRef(new Animated.Value(0)).current;

  // Get base button style based on variant
  const buttonStyle = getButtonStyle(variant);
  
  // Adjust height based on size
  const sizeStyles = {
    small: { height: theme.dimensions.buttonHeightSmall },
    medium: { height: theme.dimensions.buttonHeight },
    large: { height: theme.dimensions.buttonHeightLarge },
  };

  // Get text color based on variant
  const getTextColor = () => {
    if (disabled) return theme.colors.textTertiary;
    
    switch (variant) {
      case 'secondary':
        return theme.colors.text;
      case 'premium':
      case 'primary':
      default:
        return theme.colors.background; // Dark text on light button
    }
  };

  // Get typography based on size
  const getTextSize = () => {
    switch (size) {
      case 'small': return 'sm';
      case 'large': return 'lg';
      default: return 'md';
    }
  };

  const textTypography = getTypography('bodyMedium', getTextSize());

  // Sophisticated press animation handlers
  const handlePressIn = () => {
    if (disabled || loading) return;

    // Transform animations (can use native driver)
    Animated.timing(scaleAnim, {
      toValue: 0.96,
      duration: theme.animation.fast,
      useNativeDriver: true,
    }).start();

    // Shadow and color animations (cannot use native driver)
    Animated.parallel([
      Animated.timing(shadowAnim, {
        toValue: 1,
        duration: theme.animation.fast,
        useNativeDriver: false,
      }),
      Animated.timing(colorAnim, {
        toValue: 1,
        duration: theme.animation.fast,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    if (disabled || loading) return;

    // Transform animations (can use native driver)
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: theme.animation.medium,
      useNativeDriver: true,
    }).start();

    // Shadow and color animations (cannot use native driver)
    Animated.parallel([
      Animated.timing(shadowAnim, {
        toValue: 0,
        duration: theme.animation.medium,
        useNativeDriver: false,
      }),
      Animated.timing(colorAnim, {
        toValue: 0,
        duration: theme.animation.medium,
        useNativeDriver: false,
      }),
    ]).start();
  };

  // Dynamic styles based on animation values
  const getAnimatedBackgroundColor = () => {
    if (disabled) return buttonStyle.backgroundColor;

    const pressedColor = variant === 'primary' ? theme.colors.primaryPressed :
                        variant === 'premium' ? theme.colors.premiumPressed :
                        theme.colors.secondaryPressed;

    return colorAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [buttonStyle.backgroundColor, pressedColor],
    });
  };

  const getAnimatedShadow = () => {
    return {
      shadowOpacity: shadowAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [theme.shadows.button.shadowOpacity, theme.shadows.button.shadowOpacity * 1.5],
      }),
      elevation: shadowAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [theme.shadows.button.elevation, theme.shadows.button.elevation * 1.5],
      }),
    };
  };

  const renderContent = () => {
    if (loading) {
      return (
        <ActivityIndicator 
          size="small" 
          color={getTextColor()} 
        />
      );
    }

    const textElement = (
      <Text 
        style={[
          styles.buttonText,
          textTypography,
          { color: getTextColor() },
          textStyle,
        ]}
      >
        {title}
      </Text>
    );

    if (!icon) {
      return textElement;
    }

    const iconElement = React.cloneElement(icon, {
      size: theme.dimensions.iconMedium,
      color: getTextColor(),
    });

    return (
      <View style={styles.contentContainer}>
        {iconPosition === 'left' && iconElement}
        {iconPosition === 'left' && <View style={styles.iconSpacing} />}
        {textElement}
        {iconPosition === 'right' && <View style={styles.iconSpacing} />}
        {iconPosition === 'right' && iconElement}
      </View>
    );
  };

  return (
    <Animated.View
      style={[
        {
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <TouchableOpacity
        style={[
          buttonStyle,
          sizeStyles[size],
          disabled && styles.disabled,
          style,
        ]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        activeOpacity={1} // We handle opacity through our animations
        {...props}
      >
        <Animated.View
          style={[
            StyleSheet.absoluteFillObject,
            {
              backgroundColor: getAnimatedBackgroundColor(),
              borderRadius: buttonStyle.borderRadius,
              ...getAnimatedShadow(),
            },
          ]}
        />
        <View style={styles.contentWrapper}>
          {renderContent()}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  buttonText: {
    textAlign: 'center',
    fontWeight: theme.typography.weights.medium,
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1, // Ensure content appears above animated background
  },
  iconSpacing: {
    width: theme.spacing.sm,
  },
  disabled: {
    opacity: theme.opacity.disabled,
  },
});

export default Button;

// === USAGE EXAMPLES ===
/*

// Primary Button (Leather Brown)
<Button 
  title="SIGN UP" 
  onPress={handleSignUp}
  variant="primary"
/>

// Premium Button (Antique Gold)
<Button 
  title="UPGRADE TO PRO" 
  onPress={handleUpgrade}
  variant="premium"
/>

// Secondary Button (Outline)
<Button 
  title="SIGN IN" 
  onPress={handleSignIn}
  variant="secondary"
/>

// Button with Icon
<Button 
  title="Scan Cigar"
  onPress={handleScan}
  variant="primary"
  icon={<ScanIcon />}
  iconPosition="left"
/>

// Loading State
<Button 
  title="Creating Account..."
  onPress={handleSignUp}
  variant="primary"
  loading={true}
/>

// Disabled State
<Button 
  title="Complete Profile"
  onPress={handleComplete}
  variant="primary"
  disabled={!isFormValid}
/>

*/
