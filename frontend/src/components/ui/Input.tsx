/**
 * Input Component
 * Implements the Inked Draw input styles from State-Styles.md
 */

import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TextInputProps,
} from 'react-native';
import { useInkedTheme } from '../../theme/ThemeProvider';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  labelStyle?: TextStyle;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  containerStyle,
  inputStyle,
  labelStyle,
  ...textInputProps
}) => {
  const theme = useInkedTheme();
  const [isFocused, setIsFocused] = useState(false);

  const getLabelStyle = (): TextStyle => ({
    ...theme.textStyles.label,
    marginBottom: theme.semanticSpacing.labelSpacing,
    color: error ? theme.colors.status.error : theme.colors.text.secondary,
  });

  const getInputStyle = (): TextStyle => ({
    ...theme.textStyles.body,
    backgroundColor: 'transparent',
    borderBottomWidth: isFocused ? 2 : 1,
    borderBottomColor: error 
      ? theme.colors.border.error 
      : isFocused 
        ? theme.colors.border.focus 
        : theme.colors.border.default,
    height: theme.dimensions.input.height,
    paddingHorizontal: 0,
    paddingVertical: theme.spacing[3],
    color: theme.colors.text.primary,
  });

  const getErrorStyle = (): TextStyle => ({
    ...theme.textStyles.caption,
    color: theme.colors.status.error,
    marginTop: theme.spacing[1],
  });

  return (
    <View style={[containerStyle]}>
      {label && (
        <Text style={[getLabelStyle(), labelStyle]}>
          {label}
        </Text>
      )}
      <TextInput
        {...textInputProps}
        style={[getInputStyle(), inputStyle]}
        onFocus={(e) => {
          setIsFocused(true);
          textInputProps.onFocus?.(e);
        }}
        onBlur={(e) => {
          setIsFocused(false);
          textInputProps.onBlur?.(e);
        }}
        placeholderTextColor={theme.colors.text.secondary}
      />
      {error && (
        <Text style={getErrorStyle()}>
          {error}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  // Additional styles can be added here if needed
});
