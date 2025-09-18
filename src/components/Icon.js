import React from 'react';
import { View, StyleSheet } from 'react-native';
import { theme } from '../theme';

// Import lucide-react-native icons
import {
  Home,
  BookOpen,
  Scan,
  MapPin,
  User,
  Heart,
  MessageCircle,
  Share,
  Camera,
  Search,
  Settings,
  ChevronRight,
  ChevronLeft,
  Plus,
  Minus,
  X,
  Check,
  Star,
  Wine,
  Coffee,
  Cigarette,
  Zap,
} from 'lucide-react-native';

/**
 * INKED DRAW Icon Component
 * 
 * Standardized icon wrapper using lucide-react-native
 * 1.5dp stroke, 24dp size as specified
 * Consistent styling and theming
 */

// Icon mapping for easy reference
const ICON_MAP = {
  // Navigation
  home: Home,
  collections: BookOpen,
  scan: Scan,
  locator: MapPin,
  mapPin: MapPin,  // Add mapPin alias for MapPin
  'map-pin': MapPin,  // Add kebab-case alias for MapPin
  profile: User,

  // Social Actions
  heart: Heart,
  appreciate: Heart,
  discuss: MessageCircle,
  share: Share,

  // Utility
  camera: Camera,
  search: Search,
  settings: Settings,
  chevronRight: ChevronRight,
  chevronLeft: ChevronLeft,
  plus: Plus,
  minus: Minus,
  close: X,
  check: Check,
  star: Star,

  // Category Icons
  wine: Wine,
  coffee: Coffee,
  cigar: Cigarette,
  zap: Zap,
};

const Icon = ({
  name,                    // Icon name from ICON_MAP
  size = 'medium',         // 'small', 'medium', 'large'
  color = theme.colors.text,
  strokeWidth = 1.5,       // As specified: 1.5dp stroke
  style = {},
  containerStyle = {},
  ...props
}) => {
  // Get size value
  const getSizeValue = () => {
    switch (size) {
      case 'small': return theme.dimensions.iconSmall;
      case 'large': return theme.dimensions.iconLarge;
      default: return theme.dimensions.iconMedium; // 24dp as specified
    }
  };

  // Get the icon component
  const IconComponent = ICON_MAP[name];
  
  if (!IconComponent) {
    console.warn(`Icon "${name}" not found in ICON_MAP`);
    return null;
  }

  const sizeValue = getSizeValue();

  return (
    <View style={[styles.container, containerStyle]}>
      <IconComponent
        size={sizeValue}
        color={color}
        strokeWidth={strokeWidth}
        style={[{ width: sizeValue, height: sizeValue }, style]}
        {...props}
      />
    </View>
  );
};

// === SPECIALIZED ICON COMPONENTS ===

// Tab Bar Icons with active/inactive states
export const TabIcon = ({
  name,
  active = false,
  style = {},
  ...props
}) => (
  <Icon
    name={name}
    color={active ? theme.colors.primary : theme.colors.textTertiary}
    style={[
      active && styles.activeTabIcon,
      style,
    ]}
    {...props}
  />
);

// Social Action Icons (Heart, Comment, Share)
export const SocialIcon = ({
  name,
  active = false,
  count = null,
  onPress,
  style = {},
  ...props
}) => (
  <View style={styles.socialIconContainer}>
    <Icon
      name={name}
      color={active ? theme.colors.primary : theme.colors.textSecondary}
      size="medium"
      style={style}
      {...props}
    />
    {count !== null && (
      <Text style={styles.socialIconCount}>
        {count > 999 ? '999+' : count}
      </Text>
    )}
  </View>
);

// Premium Feature Icons (with gold accent)
export const PremiumIcon = ({
  name,
  style = {},
  ...props
}) => (
  <Icon
    name={name}
    color={theme.colors.premium}
    style={[styles.premiumIcon, style]}
    {...props}
  />
);

// Navigation Icons with consistent styling
export const NavIcon = ({
  name,
  direction = 'right', // 'left', 'right'
  style = {},
  ...props
}) => {
  const iconName = direction === 'left' ? 'chevronLeft' : 'chevronRight';
  
  return (
    <Icon
      name={iconName}
      color={theme.colors.textSecondary}
      size="medium"
      style={[styles.navIcon, style]}
      {...props}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTabIcon: {
    // Add any active state styling if needed
  },
  socialIconContainer: {
    alignItems: 'center',
    marginHorizontal: theme.spacing.sm,
  },
  socialIconCount: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textTertiary,
    marginTop: theme.spacing.xs / 2,
  },
  premiumIcon: {
    // Premium icons might have special styling
  },
  navIcon: {
    // Navigation icons styling
  },
});

export default Icon;

// === AVAILABLE ICONS ===
export const AVAILABLE_ICONS = Object.keys(ICON_MAP);

// === USAGE EXAMPLES ===
/*

// Basic Icon
<Icon name="home" />
<Icon name="heart" size="large" color={theme.colors.primary} />

// Tab Bar Icons
<TabIcon name="home" active={true} />
<TabIcon name="collections" active={false} />

// Social Icons with counts
<SocialIcon name="heart" active={true} count={24} />
<SocialIcon name="discuss" count={8} />
<SocialIcon name="share" />

// Premium Icons
<PremiumIcon name="star" />

// Navigation Icons
<NavIcon direction="left" />
<NavIcon direction="right" />

// Custom styling
<Icon 
  name="scan" 
  size="large"
  color={theme.colors.premium}
  strokeWidth={2}
  style={{ opacity: 0.8 }}
/>

*/
