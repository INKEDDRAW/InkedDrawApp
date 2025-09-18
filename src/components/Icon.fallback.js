import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { theme } from '../theme';

/**
 * INKED DRAW Icon Component - Fallback Version
 * 
 * Uses emoji/text icons instead of SVG to avoid native module dependencies
 * Maintains the same API as the original Icon component
 */

// Icon mapping using emoji and symbols
const ICON_MAP = {
  // Navigation icons
  home: '🏠',
  'book-open': '📚',
  scan: '📷',
  'map-pin': '📍',
  user: '👤',
  
  // Social icons
  heart: '❤️',
  'message-circle': '💬',
  share: '📤',
  camera: '📸',
  search: '🔍',
  
  // UI icons
  settings: '⚙️',
  'chevron-right': '›',
  'chevron-left': '‹',
  plus: '+',
  minus: '−',
  x: '×',
  check: '✓',
  star: '⭐',
  
  // Product icons
  wine: '🍷',
  coffee: '☕',
  cigarette: '🚬',
  zap: '⚡',
};

const Icon = ({ 
  name, 
  size = 'medium', 
  color, 
  style = {},
  ...props 
}) => {
  const sizeMap = {
    small: 16,
    medium: 24,
    large: 32,
    xl: 40,
  };

  const iconSize = typeof size === 'number' ? size : sizeMap[size];
  const iconColor = color || theme.colors.text;
  const iconSymbol = ICON_MAP[name] || '?';

  return (
    <View 
      style={[
        styles.container,
        { width: iconSize, height: iconSize },
        style
      ]}
      {...props}
    >
      <Text 
        style={[
          styles.icon,
          { 
            fontSize: iconSize * 0.8,
            color: iconColor,
            lineHeight: iconSize,
          }
        ]}
      >
        {iconSymbol}
      </Text>
    </View>
  );
};

// Tab Icon Component
const TabIcon = ({ name, active = false, size = 'medium', style = {} }) => {
  return (
    <Icon
      name={name}
      size={size}
      color={active ? theme.colors.primary : theme.colors.textSecondary}
      style={[
        styles.tabIcon,
        active && styles.activeTabIcon,
        style
      ]}
    />
  );
};

// Social Icon Component (with count)
const SocialIcon = ({ 
  name, 
  active = false, 
  count = 0, 
  size = 'medium',
  onPress,
  style = {} 
}) => {
  return (
    <View style={[styles.socialIconContainer, style]}>
      <Icon
        name={name}
        size={size}
        color={active ? theme.colors.primary : theme.colors.textSecondary}
      />
      {count > 0 && (
        <Text style={styles.socialCount}>{count}</Text>
      )}
    </View>
  );
};

// Premium Icon Component
const PremiumIcon = ({ name, size = 'medium', style = {} }) => {
  return (
    <Icon
      name={name}
      size={size}
      color={theme.colors.primary}
      style={[styles.premiumIcon, style]}
    />
  );
};

// Navigation Icon Component
const NavIcon = ({ name, size = 'medium', style = {} }) => {
  return (
    <Icon
      name={name}
      size={size}
      color={theme.colors.textSecondary}
      style={[styles.navIcon, style]}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    textAlign: 'center',
  },
  tabIcon: {
    // Tab-specific styling
  },
  activeTabIcon: {
    transform: [{ scale: 1.1 }],
  },
  socialIconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialCount: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: theme.colors.primary,
    color: theme.colors.background,
    fontSize: 10,
    fontWeight: '600',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 8,
    minWidth: 16,
    textAlign: 'center',
  },
  premiumIcon: {
    // Premium-specific styling
  },
  navIcon: {
    // Navigation-specific styling
  },
});

// Available icons list
const AVAILABLE_ICONS = Object.keys(ICON_MAP);

export default Icon;
export { TabIcon, SocialIcon, PremiumIcon, NavIcon, AVAILABLE_ICONS };
