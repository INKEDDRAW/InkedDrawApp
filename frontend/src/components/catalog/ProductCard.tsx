/**
 * Product Card Component
 * Displays product information in a card format for catalog views
 */

import React from 'react';
import {
  View,
  TouchableOpacity,
  Image,
  StyleSheet,
} from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { Body, Caption } from '../ui/Typography';
import { StarRating } from '../ui/StarRating';

interface ProductCardProps {
  product: {
    id: string;
    type: 'cigar' | 'beer' | 'wine';
    displayName: string;
    subtitle: string;
    imageUrl?: string;
    rating: number;
    ratingCount: number;
    price?: number;
    priceRange?: string;
  };
  onPress: () => void;
  style?: any;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onPress,
  style,
}) => {
  const theme = useTheme();

  const getProductIcon = (type: string) => {
    switch (type) {
      case 'cigar': return '🚬';
      case 'beer': return '🍺';
      case 'wine': return '🍷';
      default: return '📦';
    }
  };

  const getPriceDisplay = () => {
    if (product.price) {
      return `$${product.price.toFixed(2)}`;
    }
    if (product.priceRange) {
      switch (product.priceRange) {
        case 'budget': return '$';
        case 'mid': return '$$';
        case 'premium': return '$$$';
        case 'luxury': return '$$$$';
        default: return '';
      }
    }
    return '';
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.charcoal,
      borderRadius: 12,
      margin: 8,
      overflow: 'hidden',
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    imageContainer: {
      height: 120,
      backgroundColor: theme.colors.onyx,
      justifyContent: 'center',
      alignItems: 'center',
      position: 'relative',
    },
    image: {
      width: '100%',
      height: '100%',
      resizeMode: 'cover',
    },
    placeholderIcon: {
      fontSize: 32,
      opacity: 0.6,
    },
    typeIndicator: {
      position: 'absolute',
      top: 8,
      right: 8,
      backgroundColor: theme.colors.goldLeaf,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    typeText: {
      color: theme.colors.onyx,
      fontSize: 10,
      fontWeight: '600',
      textTransform: 'uppercase',
    },
    content: {
      padding: 12,
    },
    name: {
      color: theme.colors.alabaster,
      fontSize: 14,
      fontWeight: '600',
      marginBottom: 4,
      numberOfLines: 2,
    },
    subtitle: {
      color: theme.colors.alabaster,
      opacity: 0.7,
      fontSize: 12,
      marginBottom: 8,
      numberOfLines: 1,
    },
    ratingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    ratingCount: {
      color: theme.colors.alabaster,
      opacity: 0.7,
      fontSize: 11,
      marginLeft: 4,
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    price: {
      color: theme.colors.goldLeaf,
      fontSize: 14,
      fontWeight: '600',
    },
    addButton: {
      backgroundColor: theme.colors.goldLeaf,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
    },
    addButtonText: {
      color: theme.colors.onyx,
      fontSize: 12,
      fontWeight: '600',
    },
  });

  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {/* Image */}
      <View style={styles.imageContainer}>
        {product.imageUrl ? (
          <Image source={{ uri: product.imageUrl }} style={styles.image} />
        ) : (
          <Body style={styles.placeholderIcon}>
            {getProductIcon(product.type)}
          </Body>
        )}
        
        {/* Type Indicator */}
        <View style={styles.typeIndicator}>
          <Caption style={styles.typeText}>
            {product.type}
          </Caption>
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Body style={styles.name} numberOfLines={2}>
          {product.displayName}
        </Body>
        
        <Caption style={styles.subtitle} numberOfLines={1}>
          {product.subtitle}
        </Caption>

        {/* Rating */}
        <View style={styles.ratingContainer}>
          <StarRating
            rating={product.rating}
            size={12}
            color={theme.colors.goldLeaf}
          />
          <Caption style={styles.ratingCount}>
            ({product.ratingCount})
          </Caption>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Body style={styles.price}>
            {getPriceDisplay()}
          </Body>
          
          <TouchableOpacity style={styles.addButton}>
            <Caption style={styles.addButtonText}>
              View
            </Caption>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};
