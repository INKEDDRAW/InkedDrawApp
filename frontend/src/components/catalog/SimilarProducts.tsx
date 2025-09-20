/**
 * Similar Products Component
 * Displays similar products based on current product
 */

import React from 'react';
import {
  View,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { useOfflineQuery } from '../../hooks/useOfflineQuery';
import { H2, Body, Caption } from '../ui/Typography';
import { ProductCard } from './ProductCard';

interface SimilarProductsProps {
  currentProduct: any;
  productType: 'cigar' | 'beer' | 'wine';
  onProductPress?: (productId: string, productType: string) => void;
}

export const SimilarProducts: React.FC<SimilarProductsProps> = ({
  currentProduct,
  productType,
  onProductPress,
}) => {
  const theme = useTheme();

  // Fetch similar products based on type and characteristics
  const { data: similarProducts } = useOfflineQuery(
    productType === 'cigar' ? 'cigars' : productType === 'beer' ? 'beers' : 'wines',
    {
      where: getSimilarityFilters(),
      limit: 6,
      sortBy: 'average_rating',
      sortOrder: 'desc',
    }
  );

  function getSimilarityFilters() {
    const filters: any[] = [['id', '!=', currentProduct.id]];

    switch (productType) {
      case 'cigar':
        if (currentProduct.strength) {
          filters.push(['strength', currentProduct.strength]);
        }
        break;
      case 'beer':
        if (currentProduct.style) {
          filters.push(['style', currentProduct.style]);
        }
        break;
      case 'wine':
        if (currentProduct.type) {
          filters.push(['type', currentProduct.type]);
        }
        break;
    }

    return filters;
  }

  const handleProductPress = (product: any) => {
    if (onProductPress) {
      onProductPress(product.id, productType);
    }
  };

  const renderProduct = ({ item }: { item: any }) => (
    <View style={styles.productContainer}>
      <ProductCard
        product={{
          ...item,
          type: productType,
          displayName: getDisplayName(item),
          subtitle: getSubtitle(item),
          rating: item.averageRating,
          ratingCount: item.ratingCount,
        }}
        onPress={() => handleProductPress(item)}
        style={styles.productCard}
      />
    </View>
  );

  const getDisplayName = (product: any) => {
    switch (productType) {
      case 'cigar':
        return `${product.brand} ${product.name}`;
      case 'beer':
        return `${product.brewery} ${product.name}`;
      case 'wine':
        return `${product.winery} ${product.name}`;
      default:
        return product.name;
    }
  };

  const getSubtitle = (product: any) => {
    switch (productType) {
      case 'cigar':
        return `${product.size} • ${product.strength}`;
      case 'beer':
        return `${product.style} • ${product.abv?.toFixed(1)}% ABV`;
      case 'wine':
        return `${product.type} • ${product.vintage}`;
      default:
        return '';
    }
  };

  const styles = StyleSheet.create({
    container: {
      marginTop: 32,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    title: {
      color: theme.colors.alabaster,
    },
    viewAllButton: {
      paddingVertical: 8,
      paddingHorizontal: 12,
    },
    viewAllText: {
      color: theme.colors.goldLeaf,
      fontSize: 14,
      fontWeight: '500',
    },
    productContainer: {
      width: 160,
      marginRight: 12,
    },
    productCard: {
      margin: 0,
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: 32,
    },
    emptyText: {
      color: theme.colors.alabaster,
      opacity: 0.7,
      textAlign: 'center',
    },
  });

  if (similarProducts.length === 0) {
    return (
      <View style={styles.container}>
        <H2 style={styles.title}>Similar Products</H2>
        <View style={styles.emptyState}>
          <Caption style={styles.emptyText}>
            No similar products found
          </Caption>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <H2 style={styles.title}>Similar Products</H2>
        <TouchableOpacity style={styles.viewAllButton}>
          <Body style={styles.viewAllText}>View All</Body>
        </TouchableOpacity>
      </View>

      <FlatList
        data={similarProducts}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingRight: 16 }}
      />
    </View>
  );
};
