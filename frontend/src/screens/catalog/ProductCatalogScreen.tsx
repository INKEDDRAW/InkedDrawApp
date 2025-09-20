/**
 * Product Catalog Screen
 * Main catalog screen with search, filtering, and product discovery
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeProvider';
import { useOfflineQuery } from '../../hooks/useOfflineQuery';
import { H1, Body, Caption } from '../../components/ui/Typography';
import { SearchBar } from '../../components/ui/SearchBar';
import { FilterChips } from '../../components/ui/FilterChips';
import { ProductCard } from '../../components/catalog/ProductCard';
import { CategoryTabs } from '../../components/catalog/CategoryTabs';
import { SortModal } from '../../components/catalog/SortModal';

type ProductCategory = 'all' | 'cigars' | 'beers' | 'wines';
type SortOption = 'name' | 'rating' | 'price' | 'newest';
type PriceRange = 'all' | 'budget' | 'mid' | 'premium' | 'luxury';

interface ProductCatalogScreenProps {
  onProductPress: (productId: string, productType: string) => void;
  onSearchPress?: () => void;
}

export const ProductCatalogScreen: React.FC<ProductCatalogScreenProps> = ({
  onProductPress,
  onSearchPress,
}) => {
  const theme = useTheme();
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('rating');
  const [priceRange, setPriceRange] = useState<PriceRange>('all');
  const [showSortModal, setShowSortModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch products based on category
  const { data: cigars, loading: cigarsLoading, refresh: refreshCigars } = useOfflineQuery('cigars', {
    where: buildWhereClause('cigars'),
    sortBy: getSortField('cigars'),
    sortOrder: getSortOrder(),
    limit: 50,
  });

  const { data: beers, loading: beersLoading, refresh: refreshBeers } = useOfflineQuery('beers', {
    where: buildWhereClause('beers'),
    sortBy: getSortField('beers'),
    sortOrder: getSortOrder(),
    limit: 50,
  });

  const { data: wines, loading: winesLoading, refresh: refreshWines } = useOfflineQuery('wines', {
    where: buildWhereClause('wines'),
    sortBy: getSortField('wines'),
    sortOrder: getSortOrder(),
    limit: 50,
  });

  // Combine and filter products
  const allProducts = useMemo(() => {
    const products: any[] = [];

    if (selectedCategory === 'all' || selectedCategory === 'cigars') {
      cigars.forEach(cigar => {
        products.push({
          ...cigar,
          type: 'cigar',
          displayName: `${cigar.brand} ${cigar.name}`,
          subtitle: `${cigar.size} • ${cigar.strength}`,
          price: cigar.price,
          rating: cigar.averageRating,
          ratingCount: cigar.ratingCount,
        });
      });
    }

    if (selectedCategory === 'all' || selectedCategory === 'beers') {
      beers.forEach(beer => {
        products.push({
          ...beer,
          type: 'beer',
          displayName: `${beer.brewery} ${beer.name}`,
          subtitle: `${beer.style} • ${beer.formattedAbv}`,
          price: beer.price,
          rating: beer.averageRating,
          ratingCount: beer.ratingCount,
        });
      });
    }

    if (selectedCategory === 'all' || selectedCategory === 'wines') {
      wines.forEach(wine => {
        products.push({
          ...wine,
          type: 'wine',
          displayName: wine.fullName,
          subtitle: `${wine.type} • ${wine.region}`,
          price: wine.price,
          rating: wine.averageRating,
          ratingCount: wine.ratingCount,
        });
      });
    }

    return products.filter(product => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          product.displayName.toLowerCase().includes(query) ||
          product.subtitle.toLowerCase().includes(query) ||
          (product.description && product.description.toLowerCase().includes(query))
        );
      }
      return true;
    });
  }, [cigars, beers, wines, selectedCategory, searchQuery]);

  function buildWhereClause(productType: string) {
    const clauses: any[] = [];

    // Price range filter
    if (priceRange !== 'all') {
      if (productType === 'cigars') {
        clauses.push(['price_range', priceRange]);
      } else {
        clauses.push(['price_range', priceRange]);
      }
    }

    return clauses.length > 0 ? clauses : undefined;
  }

  function getSortField(productType: string): string {
    switch (sortBy) {
      case 'name':
        return 'name';
      case 'rating':
        return 'average_rating';
      case 'price':
        return 'price';
      case 'newest':
        return 'created_at';
      default:
        return 'average_rating';
    }
  }

  function getSortOrder(): 'asc' | 'desc' {
    switch (sortBy) {
      case 'name':
        return 'asc';
      case 'rating':
        return 'desc';
      case 'price':
        return 'asc';
      case 'newest':
        return 'desc';
      default:
        return 'desc';
    }
  }

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refreshCigars(),
        refreshBeers(),
        refreshWines(),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [refreshCigars, refreshBeers, refreshWines]);

  const handleProductPress = useCallback((product: any) => {
    onProductPress(product.id, product.type);
  }, [onProductPress]);

  const handleSortChange = useCallback((newSortBy: SortOption) => {
    setSortBy(newSortBy);
    setShowSortModal(false);
  }, []);

  const renderProduct = useCallback(({ item }: { item: any }) => (
    <ProductCard
      product={item}
      onPress={() => handleProductPress(item)}
    />
  ), [handleProductPress]);

  const renderHeader = () => (
    <View style={styles.header}>
      <H1 style={styles.title}>Discover</H1>
      
      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search products..."
        onPress={onSearchPress}
      />

      <CategoryTabs
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
      />

      <View style={styles.filtersRow}>
        <FilterChips
          selectedPriceRange={priceRange}
          onPriceRangeChange={setPriceRange}
        />
        
        <TouchableOpacity
          style={styles.sortButton}
          onPress={() => setShowSortModal(true)}
        >
          <Body style={styles.sortButtonText}>Sort</Body>
          <Body style={styles.sortIcon}>⇅</Body>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <Body style={styles.emptyIcon}>🔍</Body>
      <Body style={styles.emptyTitle}>No products found</Body>
      <Caption style={styles.emptySubtitle}>
        Try adjusting your search or filters
      </Caption>
    </View>
  );

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.onyx,
    },
    header: {
      paddingHorizontal: 16,
      paddingBottom: 16,
    },
    title: {
      color: theme.colors.alabaster,
      marginBottom: 16,
    },
    filtersRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 12,
    },
    sortButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 8,
      backgroundColor: theme.colors.charcoal,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.colors.goldLeaf,
    },
    sortButtonText: {
      color: theme.colors.goldLeaf,
      fontSize: 14,
      fontWeight: '500',
      marginRight: 4,
    },
    sortIcon: {
      color: theme.colors.goldLeaf,
      fontSize: 16,
    },
    list: {
      flex: 1,
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 32,
    },
    emptyIcon: {
      fontSize: 48,
      marginBottom: 16,
    },
    emptyTitle: {
      color: theme.colors.alabaster,
      fontSize: 18,
      fontWeight: '600',
      marginBottom: 8,
      textAlign: 'center',
    },
    emptySubtitle: {
      color: theme.colors.alabaster,
      opacity: 0.7,
      textAlign: 'center',
    },
  });

  const isLoading = cigarsLoading || beersLoading || winesLoading;

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        style={styles.list}
        data={allProducts}
        renderItem={renderProduct}
        keyExtractor={(item) => `${item.type}-${item.id}`}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={!isLoading ? renderEmpty : null}
        numColumns={2}
        columnWrapperStyle={{ paddingHorizontal: 8 }}
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.goldLeaf}
            colors={[theme.colors.goldLeaf]}
          />
        }
      />

      <SortModal
        visible={showSortModal}
        selectedSort={sortBy}
        onSortChange={handleSortChange}
        onClose={() => setShowSortModal(false)}
      />
    </SafeAreaView>
  );
};
