import React, { useRef } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Image,
  Animated,
} from 'react-native';
import { theme, getCardStyle } from '../theme';

/**
 * INKED DRAW Card Component
 * 
 * Luxury card component with Surface Gray background and 12dp corner radius
 * Supports various layouts: basic, image, collection, post
 * Feels like "precisely cut tiles" as specified in design
 */

const Card = ({
  children,
  style = {},
  variant = 'basic',     // 'basic', 'image', 'collection', 'post'
  elevated = true,       // Whether to show shadow
  onPress = null,        // Makes card touchable if provided
  imageSource = null,    // Image source for image variants
  imageStyle = {},       // Custom image styling
  contentStyle = {},     // Custom content area styling
  padding = 'medium',    // 'none', 'small', 'medium', 'large'
  ...props
}) => {
  // Animation values for sophisticated card interactions
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const elevationAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;
  // Get padding based on size
  const getPadding = () => {
    switch (padding) {
      case 'none': return 0;
      case 'small': return theme.spacing.sm;
      case 'large': return theme.spacing.lg;
      default: return theme.spacing.md; // medium
    }
  };

  // Base card style
  const cardStyle = {
    ...getCardStyle(elevated),
    padding: getPadding(),
  };

  // Sophisticated press animation handlers
  const handlePressIn = () => {
    if (!onPress) return;

    // Separate native driver animations from non-native driver animations
    Animated.parallel([
      // Transform and opacity animations (can use native driver)
      Animated.timing(scaleAnim, {
        toValue: 0.98,
        duration: theme.animation.fast,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0.95,
        duration: theme.animation.fast,
        useNativeDriver: true,
      }),
    ]).start();

    // Shadow/elevation animations (cannot use native driver)
    Animated.timing(elevationAnim, {
      toValue: 1,
      duration: theme.animation.fast,
      useNativeDriver: false,
    }).start();
  };

  const handlePressOut = () => {
    if (!onPress) return;

    // Separate native driver animations from non-native driver animations
    Animated.parallel([
      // Transform and opacity animations (can use native driver)
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: theme.animation.medium,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: theme.animation.medium,
        useNativeDriver: true,
      }),
    ]).start();

    // Shadow/elevation animations (cannot use native driver)
    Animated.timing(elevationAnim, {
      toValue: 0,
      duration: theme.animation.medium,
      useNativeDriver: false,
    }).start();
  };

  // Dynamic shadow based on elevation animation
  const getAnimatedShadow = () => {
    if (!elevated) return {};

    return {
      shadowOpacity: elevationAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [theme.shadows.card.shadowOpacity, theme.shadows.card.shadowOpacity * 1.8],
      }),
      elevation: elevationAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [theme.shadows.card.elevation, theme.shadows.card.elevation * 2],
      }),
      shadowRadius: elevationAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [theme.shadows.card.shadowRadius, theme.shadows.card.shadowRadius * 1.5],
      }),
    };
  };

  // Variant-specific styles
  const getVariantStyle = () => {
    switch (variant) {
      case 'image':
        return {
          padding: 0, // Image cards have no padding on container
          overflow: 'hidden',
        };
      case 'collection':
        return {
          minHeight: 200,
          padding: 0,
          overflow: 'hidden',
        };
      case 'post':
        return {
          marginBottom: theme.spacing.md,
        };
      default:
        return {};
    }
  };

  const renderContent = () => {
    if (variant === 'image' && imageSource) {
      return (
        <View style={styles.imageCardContainer}>
          <Image 
            source={imageSource} 
            style={[styles.cardImage, imageStyle]}
            resizeMode="cover"
          />
          {children && (
            <View style={[styles.imageCardContent, contentStyle]}>
              {children}
            </View>
          )}
        </View>
      );
    }

    if (variant === 'collection' && imageSource) {
      return (
        <View style={styles.collectionCardContainer}>
          <Image 
            source={imageSource} 
            style={[styles.collectionImage, imageStyle]}
            resizeMode="cover"
          />
          <View style={[styles.collectionOverlay, contentStyle]}>
            {children}
          </View>
        </View>
      );
    }

    // Basic and post variants
    return (
      <View style={[styles.contentContainer, contentStyle]}>
        {children}
      </View>
    );
  };

  // Render as TouchableOpacity if onPress is provided
  if (onPress) {
    return (
      <Animated.View
        style={[
          {
            transform: [{ scale: scaleAnim }],
            opacity: opacityAnim,
          },
        ]}
      >
        <TouchableOpacity
          style={[
            cardStyle,
            getVariantStyle(),
            getAnimatedShadow(),
            style,
          ]}
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={1} // We handle opacity through our animations
          {...props}
        >
          {renderContent()}
        </TouchableOpacity>
      </Animated.View>
    );
  }

  // Render as regular View
  return (
    <View
      style={[
        cardStyle,
        getVariantStyle(),
        style,
      ]}
      {...props}
    >
      {renderContent()}
    </View>
  );
};

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
  },
  
  // Image Card Styles
  imageCardContainer: {
    flex: 1,
  },
  cardImage: {
    width: '100%',
    height: 200,
    borderTopLeftRadius: theme.borderRadius.lg,
    borderTopRightRadius: theme.borderRadius.lg,
  },
  imageCardContent: {
    padding: theme.spacing.md,
  },
  
  // Collection Card Styles
  collectionCardContainer: {
    flex: 1,
    position: 'relative',
  },
  collectionImage: {
    width: '100%',
    height: '100%',
    borderRadius: theme.borderRadius.lg,
  },
  collectionOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)', // Updated to pure black for better gradient effect
    padding: theme.spacing.md,
    borderBottomLeftRadius: theme.borderRadius.lg,
    borderBottomRightRadius: theme.borderRadius.lg,
  },
});

export default Card;

// === USAGE EXAMPLES ===
/*

// Basic Card
<Card>
  <Text>Basic card content</Text>
</Card>

// Touchable Card
<Card onPress={handleCardPress}>
  <Text>Tap me!</Text>
</Card>

// Image Card (for posts)
<Card 
  variant="image"
  imageSource={{ uri: 'https://example.com/image.jpg' }}
>
  <Text>Image caption</Text>
</Card>

// Collection Card (with overlay)
<Card 
  variant="collection"
  imageSource={{ uri: 'https://example.com/humidor.jpg' }}
  onPress={handleCollectionPress}
>
  <Text style={{ color: theme.colors.text }}>My Virtual Humidor</Text>
  <Text style={{ color: theme.colors.textSecondary }}>142 Cigars | $8,400 Value</Text>
</Card>

// Post Card
<Card variant="post" padding="large">
  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
    <Avatar source={user.avatar} />
    <Text>{user.name}</Text>
  </View>
  <Image source={post.image} />
  <Text>{post.caption}</Text>
</Card>

// No padding card
<Card padding="none">
  <CustomContent />
</Card>

*/
