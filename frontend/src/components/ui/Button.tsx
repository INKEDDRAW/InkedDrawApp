/**
 * Button Component
 * Implements the Inked Draw button styles from State-Styles.md
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from 'react-native';
import { useInkedTheme } from '../../theme/ThemeProvider';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  style,
  textStyle,
}) => {
  const theme = useInkedTheme();

  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      height: theme.dimensions.button.height,
      borderRadius: theme.dimensions.button.borderRadius,
      paddingHorizontal: theme.semanticSpacing.buttonPaddingHorizontal,
      paddingVertical: theme.semanticSpacing.buttonPaddingVertical,
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'row',
    };

    if (variant === 'primary') {
      return {
        ...baseStyle,
        backgroundColor: disabled 
          ? theme.colors.neutral[700] 
          : theme.colors.accent.goldLeaf,
      };
    } else {
      return {
        ...baseStyle,
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: disabled 
          ? theme.colors.neutral[700] 
          : theme.colors.border.default,
      };
    }
  };

  const getTextStyle = (): TextStyle => {
    const baseStyle: TextStyle = {
      fontFamily: theme.fonts.body,
      fontSize: theme.fontSizes.base,
      fontWeight: theme.fontWeights.medium,
      textAlign: 'center',
    };

    if (variant === 'primary') {
      return {
        ...baseStyle,
        color: disabled 
          ? theme.colors.text.secondary 
          : theme.colors.text.inverse,
      };
    } else {
      return {
        ...baseStyle,
        color: disabled 
          ? theme.colors.text.secondary 
          : theme.colors.text.primary,
      };
    }
  };

  return (
    <TouchableOpacity
      style={[getButtonStyle(), style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={theme.opacity.pressed}
    >
      {loading && (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? theme.colors.text.inverse : theme.colors.text.primary}
          style={{ marginRight: theme.spacing[2] }}
        />
      )}
      <Text style={[getTextStyle(), textStyle]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  // Additional styles can be added here if needed
});
