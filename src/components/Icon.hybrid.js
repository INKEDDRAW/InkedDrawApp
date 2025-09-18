import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { theme } from '../theme';

/**
 * INKED DRAW Icon Component - Hybrid Version
 * 
 * Tries to use Lucide React Native icons, falls back to emoji if not available
 * This allows the app to work with or without native SVG support
 */

// Try to import Lucide icons, but handle gracefully if they fail
let LucideIcons = {};
try {
  const lucide = require('lucide-react-native');
  LucideIcons = {
    Home: lucide.Home,
    BookOpen: lucide.BookOpen,
    Scan: lucide.Scan,
    MapPin: lucide.MapPin,
    User: lucide.User,
    Heart: lucide.Heart,
    MessageCircle: lucide.MessageCircle,
    Share: lucide.Share,
    Camera: lucide.Camera,
    Search: lucide.Search,
    Settings: lucide.Settings,
    ChevronRight: lucide.ChevronRight,
    ChevronLeft: lucide.ChevronLeft,
    Plus: lucide.Plus,
    Minus: lucide.Minus,
    X: lucide.X,
    Check: lucide.Check,
    Star: lucide.Star,
    Wine: lucide.Wine,
    Coffee: lucide.Coffee,
    Cigarette: lucide.Cigarette,
    Zap: lucide.Zap,
  };
  console.log('Lucide icons loaded successfully');
} catch (error) {
  console.log('Lucide icons not available, using emoji fallback:', error.message);
}

// Fallback emoji mapping
const EMOJI_FALLBACK = {
  home: '🏠',
  'book-open': '📚',
  scan: '📷',
  'map-pin': '📍',
  user: '👤',
  heart: '❤️',
  'message-circle': '💬',
  share: '📤',
  camera: '📸',
  search: '🔍',
  settings: '⚙️',
  'chevron-right': '›',
  'chevron-left': '‹',
  plus: '+',
  minus: '−',
  x: '×',
  check: '✓',
  star: '⭐',
  wine: '🍷',
  coffee: '☕',
  cigarette: '🚬',
  zap: '⚡',
};

// Convert kebab-case to PascalCase for Lucide component names
const toPascalCase = (str) => {
  return str.split('-').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join('');
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

  // Try to use Lucide icon first
  const LucideComponent = LucideIcons[toPascalCase(name)];
  
  if (LucideComponent) {
    try {
      return (
        <View style={[{ width: iconSize, height: iconSize }, style]} {...props}>
          <LucideComponent 
            size={iconSize} 
            color={iconColor}
          />
        </View>
      );
    } catch (error) {
      console.log(`Lucide icon ${name} failed, using fallback`);
    }
  }

  // Fallback to emoji
  const emojiIcon = EMOJI_FALLBACK[name] || '?';
  
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
        {emojiIcon}
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
const AVAILABLE_ICONS = Object.keys(EMOJI_FALLBACK);

export default Icon;
export { TabIcon, SocialIcon, PremiumIcon, NavIcon, AVAILABLE_ICONS };
