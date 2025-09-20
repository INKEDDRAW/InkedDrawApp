/**
 * Product Selector Component
 * Allows users to search and select products to tag in posts
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Modal,
} from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { useOfflineCigars, useOfflineBeers, useOfflineWines } from '../../hooks/useOfflineQuery';
import { Body, Caption } from '../ui/Typography';
import { Card } from '../ui/Card';

interface Product {
  id: string;
  type: 'cigar' | 'beer' | 'wine';
  name: string;
  brand?: string;
  brewery?: string;
  winery?: string;
  imageUrl?: string;
}

interface ProductSelectorProps {
  selectedProduct: Product | null;
  onProductSelect: (product: Product | null) => void;
}

export const ProductSelector: React.FC<ProductSelectorProps> = ({
  selectedProduct,
  onProductSelect,
}) => {
  const theme = useTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'cigars' | 'beers' | 'wines'>('all');

  // Fetch products with search
  const { data: cigars } = useOfflineCigars({
    limit: 20,
    where: searchQuery ? [['name', 'LIKE', `%${searchQuery}%`]] : undefined,
  });

  const { data: beers } = useOfflineBeers({
    limit: 20,
    where: searchQuery ? [['name', 'LIKE', `%${searchQuery}%`]] : undefined,
  });

  const { data: wines } = useOfflineWines({
    limit: 20,
    where: searchQuery ? [['name', 'LIKE', `%${searchQuery}%`]] : undefined,
  });

  // Combine and filter products
  const allProducts = useMemo(() => {
    const products: Product[] = [];

    if (selectedCategory === 'all' || selectedCategory === 'cigars') {
      cigars.forEach(cigar => {
        products.push({
          id: cigar.id,
          type: 'cigar',
          name: cigar.name,
          brand: cigar.brand,
          imageUrl: cigar.imageUrl,
        });
      });
    }

    if (selectedCategory === 'all' || selectedCategory === 'beers') {
      beers.forEach(beer => {
        products.push({
          id: beer.id,
          type: 'beer',
          name: beer.name,
          brewery: beer.brewery,
          imageUrl: beer.imageUrl,
        });
      });
    }

    if (selectedCategory === 'all' || selectedCategory === 'wines') {
      wines.forEach(wine => {
        products.push({
          id: wine.id,
          type: 'wine',
          name: wine.name,
          winery: wine.winery,
          imageUrl: wine.imageUrl,
        });
      });
    }

    return products.sort((a, b) => a.name.localeCompare(b.name));
  }, [cigars, beers, wines, selectedCategory]);

  const handleProductSelect = useCallback((product: Product) => {
    onProductSelect(product);
    setModalVisible(false);
    setSearchQuery('');
  }, [onProductSelect]);

  const handleClearSelection = useCallback(() => {
    onProductSelect(null);
  }, [onProductSelect]);

  const renderProductItem = useCallback(({ item }: { item: Product }) => {
    const getProductIcon = (type: string) => {
      switch (type) {
        case 'cigar': return '🚬';
        case 'beer': return '🍺';
        case 'wine': return '🍷';
        default: return '📦';
      }
    };

    const getProductSubtitle = (product: Product) => {
      switch (product.type) {
        case 'cigar': return product.brand;
        case 'beer': return product.brewery;
        case 'wine': return product.winery;
        default: return '';
      }
    };

    return (
      <TouchableOpacity
        style={styles.productItem}
        onPress={() => handleProductSelect(item)}
      >
        <View style={styles.productIcon}>
          <Body style={styles.productIconText}>{getProductIcon(item.type)}</Body>
        </View>
        <View style={styles.productInfo}>
          <Body style={styles.productName}>{item.name}</Body>
          <Caption style={styles.productSubtitle}>
            {getProductSubtitle(item)}
          </Caption>
        </View>
        <Caption style={styles.productType}>
          {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
        </Caption>
      </TouchableOpacity>
    );
  }, [handleProductSelect]);

  const styles = StyleSheet.create({
    container: {
      marginVertical: 8,
    },
    selectedProduct: {
      backgroundColor: theme.colors.charcoal,
      borderRadius: 8,
      padding: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    selectedProductInfo: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
    },
    selectedProductIcon: {
      marginRight: 12,
    },
    selectedProductIconText: {
      fontSize: 20,
    },
    selectedProductText: {
      flex: 1,
    },
    selectedProductName: {
      color: theme.colors.alabaster,
      fontSize: 16,
      fontWeight: '500',
    },
    selectedProductSubtitle: {
      color: theme.colors.alabaster,
      opacity: 0.7,
      fontSize: 14,
      marginTop: 2,
    },
    clearButton: {
      padding: 8,
    },
    clearButtonText: {
      color: theme.colors.alabaster,
      fontSize: 18,
    },
    selectButton: {
      backgroundColor: theme.colors.charcoal,
      borderRadius: 8,
      padding: 16,
      alignItems: 'center',
      borderWidth: 2,
      borderColor: theme.colors.goldLeaf,
      borderStyle: 'dashed',
    },
    selectButtonText: {
      color: theme.colors.goldLeaf,
      fontSize: 16,
      fontWeight: '500',
    },
    modal: {
      flex: 1,
      backgroundColor: theme.colors.onyx,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.charcoal,
    },
    modalTitle: {
      color: theme.colors.alabaster,
      fontSize: 18,
      fontWeight: '600',
    },
    closeButton: {
      padding: 8,
    },
    closeButtonText: {
      color: theme.colors.alabaster,
      fontSize: 16,
    },
    searchContainer: {
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    searchInput: {
      backgroundColor: theme.colors.charcoal,
      color: theme.colors.alabaster,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 8,
      fontSize: 16,
      marginBottom: 12,
    },
    categoryFilter: {
      flexDirection: 'row',
      gap: 8,
    },
    categoryButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: theme.colors.charcoal,
      borderWidth: 1,
      borderColor: theme.colors.charcoal,
    },
    categoryButtonActive: {
      backgroundColor: theme.colors.goldLeaf,
      borderColor: theme.colors.goldLeaf,
    },
    categoryButtonText: {
      color: theme.colors.alabaster,
      fontSize: 14,
      fontWeight: '500',
    },
    categoryButtonTextActive: {
      color: theme.colors.onyx,
      fontWeight: '600',
    },
    productsList: {
      flex: 1,
    },
    productItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.charcoal,
    },
    productIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.charcoal,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    productIconText: {
      fontSize: 18,
    },
    productInfo: {
      flex: 1,
    },
    productName: {
      color: theme.colors.alabaster,
      fontSize: 16,
      fontWeight: '500',
    },
    productSubtitle: {
      color: theme.colors.alabaster,
      opacity: 0.7,
      fontSize: 14,
      marginTop: 2,
    },
    productType: {
      color: theme.colors.goldLeaf,
      fontSize: 12,
      fontWeight: '500',
      textTransform: 'uppercase',
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 32,
    },
    emptyStateText: {
      color: theme.colors.alabaster,
      opacity: 0.7,
      textAlign: 'center',
      fontSize: 16,
    },
  });

  const getSelectedProductSubtitle = (product: Product) => {
    switch (product.type) {
      case 'cigar': return product.brand;
      case 'beer': return product.brewery;
      case 'wine': return product.winery;
      default: return '';
    }
  };

  const getSelectedProductIcon = (type: string) => {
    switch (type) {
      case 'cigar': return '🚬';
      case 'beer': return '🍺';
      case 'wine': return '🍷';
      default: return '📦';
    }
  };

  return (
    <View style={styles.container}>
      {selectedProduct ? (
        <View style={styles.selectedProduct}>
          <View style={styles.selectedProductInfo}>
            <View style={styles.selectedProductIcon}>
              <Body style={styles.selectedProductIconText}>
                {getSelectedProductIcon(selectedProduct.type)}
              </Body>
            </View>
            <View style={styles.selectedProductText}>
              <Body style={styles.selectedProductName}>
                {selectedProduct.name}
              </Body>
              <Caption style={styles.selectedProductSubtitle}>
                {getSelectedProductSubtitle(selectedProduct)}
              </Caption>
            </View>
          </View>
          <TouchableOpacity style={styles.clearButton} onPress={handleClearSelection}>
            <Body style={styles.clearButtonText}>×</Body>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.selectButton}
          onPress={() => setModalVisible(true)}
        >
          <Body style={styles.selectButtonText}>🏷️ Tag a Product</Body>
        </TouchableOpacity>
      )}

      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modal}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Body style={styles.modalTitle}>Select Product</Body>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Body style={styles.closeButtonText}>Done</Body>
            </TouchableOpacity>
          </View>

          {/* Search and Filter */}
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search products..."
              placeholderTextColor={theme.colors.alabaster + '80'}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <View style={styles.categoryFilter}>
              {(['all', 'cigars', 'beers', 'wines'] as const).map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryButton,
                    selectedCategory === category && styles.categoryButtonActive,
                  ]}
                  onPress={() => setSelectedCategory(category)}
                >
                  <Caption style={[
                    styles.categoryButtonText,
                    selectedCategory === category && styles.categoryButtonTextActive,
                  ]}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </Caption>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Products List */}
          <FlatList
            style={styles.productsList}
            data={allProducts}
            renderItem={renderProductItem}
            keyExtractor={(item) => `${item.type}-${item.id}`}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Body style={styles.emptyStateText}>
                  {searchQuery 
                    ? `No products found for "${searchQuery}"`
                    : 'No products available'
                  }
                </Body>
              </View>
            }
            showsVerticalScrollIndicator={false}
          />
        </View>
      </Modal>
    </View>
  );
};
