/**
 * Card Component
 * Implements the Inked Draw card styles from State-Styles.md
 */

import React, { ReactNode } from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { useInkedTheme } from '../../theme/ThemeProvider';

interface CardProps {
  children: ReactNode;
  style?: ViewStyle;
  elevated?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  elevated = false,
}) => {
  const theme = useInkedTheme();

  const cardStyle: ViewStyle = {
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.dimensions.card.borderRadius,
    padding: theme.dimensions.card.padding,
    ...(elevated ? theme.shadows.md : theme.shadows.sm),
  };

  return (
    <View style={[cardStyle, style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  // Additional styles can be added here if needed
});
