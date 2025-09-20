/**
 * Typography Components
 * Implements the Inked Draw typography system from State-Styles.md
 */

import React, { ReactNode } from 'react';
import {
  Text,
  TextStyle,
  TextProps,
} from 'react-native';
import { useInkedTheme } from '../../theme/ThemeProvider';

interface TypographyProps extends TextProps {
  children: ReactNode;
  style?: TextStyle;
}

// H1 (Screen Title): 28px/36px, Lora Regular, Alabaster
export const H1: React.FC<TypographyProps> = ({ children, style, ...props }) => {
  const theme = useInkedTheme();
  return (
    <Text style={[theme.textStyles.h1, style]} {...props}>
      {children}
    </Text>
  );
};

// H2 (Section Header): 22px/28px, Lora Regular, Alabaster
export const H2: React.FC<TypographyProps> = ({ children, style, ...props }) => {
  const theme = useInkedTheme();
  return (
    <Text style={[theme.textStyles.h2, style]} {...props}>
      {children}
    </Text>
  );
};

// H3 (Card Title): 18px/24px, Inter Semibold, Alabaster
export const H3: React.FC<TypographyProps> = ({ children, style, ...props }) => {
  const theme = useInkedTheme();
  return (
    <Text style={[theme.textStyles.h3, style]} {...props}>
      {children}
    </Text>
  );
};

// Body: 16px/24px, Inter Regular, Alabaster
export const Body: React.FC<TypographyProps> = ({ children, style, ...props }) => {
  const theme = useInkedTheme();
  return (
    <Text style={[theme.textStyles.body, style]} {...props}>
      {children}
    </Text>
  );
};

// Body (Secondary): 14px/20px, Inter Regular, Neutral-500
export const BodySecondary: React.FC<TypographyProps> = ({ children, style, ...props }) => {
  const theme = useInkedTheme();
  return (
    <Text style={[theme.textStyles.bodySecondary, style]} {...props}>
      {children}
    </Text>
  );
};

// Label/Caption: 12px/16px, Inter Regular, Neutral-500, All-Caps, Letter spacing 0.5px
export const Label: React.FC<TypographyProps> = ({ children, style, ...props }) => {
  const theme = useInkedTheme();
  return (
    <Text style={[theme.textStyles.label, style]} {...props}>
      {children}
    </Text>
  );
};

// Caption (without uppercase)
export const Caption: React.FC<TypographyProps> = ({ children, style, ...props }) => {
  const theme = useInkedTheme();
  return (
    <Text style={[theme.textStyles.caption, style]} {...props}>
      {children}
    </Text>
  );
};
