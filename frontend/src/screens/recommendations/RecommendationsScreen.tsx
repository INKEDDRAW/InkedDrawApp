/**
 * Recommendations Screen
 * AI-powered product recommendations
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  FlatList,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeProvider';
import { useAuth } from '../../contexts/AuthContext';
import { useOfflineQuery } from '../../hooks/useOfflineQuery';
import { H1, H2, Body, Caption } from '../../components/ui/Typography';
import { ProductCard } from '../../components/catalog/ProductCard';
import { CategoryTabs } from '../../components/catalog/CategoryTabs';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { EmptyState } from '../../components/ui/EmptyState';

type RecommendationType = 'all' | 'personalized' | 'trending' | 'similar' | 'collaborative';
type ProductCategory = 'all' | 'cigars' | 'beers' | 'wines';

interface Recommendation {
  productId: string;
  productType: 'cigar' | 'beer' | 'wine';
  score: number;
  confidence: number;
  reason: string;
  algorithm: string;
  product?: any;
}

export const RecommendationsScreen: React.FC = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory>('all');
  const [recommendationType, setRecommendationType] = useState<RecommendationType>('all');
  const [refreshing, setRefreshing] = useState(false);

  // Fetch recommendations from API
  const { 
    data: recommendations, 
    loading, 
    error, 
    refresh 
  } = useOfflineQuery('recommendations', {
    endpoint: '/api/v1/recommendations',
    params: {
      type: selectedCategory !== 'all' ? selectedCategory.slice(0, -1) : undefined,
      limit: 20,
      diversity: 0.3,
      include_reasons: true,
    },
    enabled: !!user,
  });

  // Fetch trending products
  const { data: trendingProducts } = useOfflineQuery('trending-products', {
    endpoint: '/api/v1/recommendations/trending',
    params: {
      type: selectedCategory !== 'all' ? selectedCategory.slice(0, -1) : undefined,
      limit: 10,
    },
    enabled: !!user,
  });

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refresh();
    } catch (error) {
      Alert.alert('Error', 'Failed to refresh recommendations');
    } finally {
      setRefreshing(false);
    }
  }, [refresh]);

  const handleProductPress = useCallback((productId: string, productType: string) => {
    // Navigate to product detail screen
    // This would be implemented with your navigation system
    console.log('Navigate to product:', productId, productType);
  }, []);

  const handleRecommendationFeedback = useCallback(async (
    recommendationId: string,
    action: 'viewed' | 'liked' | 'dismissed'
  ) => {
    try {
      // Track recommendation feedback
      // This would call the feedback API endpoint
      console.log('Recommendation feedback:', recommendationId, action);
    } catch (error) {
      console.warn('Failed to track recommendation feedback:', error);
    }
  }, []);

  const getDisplayData = () => {
    switch (recommendationType) {
      case 'trending':
        return trendingProducts || [];
      case 'personalized':
        return recommendations?.recommendations?.filter((r: Recommendation) => 
          r.algorithm === 'personalized' || r.algorithm === 'hybrid'
        ) || [];
      case 'collaborative':
        return recommendations?.recommendations?.filter((r: Recommendation) => 
          r.algorithm === 'collaborative'
        ) || [];
      default:
        return recommendations?.recommendations || [];
    }
  };

  const renderRecommendationTypeSelector = () => (
    <View style={styles.typeSelector}>
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={[
          { key: 'all', label: 'For You', icon: '✨' },
          { key: 'personalized', label: 'Personal', icon: '🎯' },
          { key: 'trending', label: 'Trending', icon: '🔥' },
          { key: 'collaborative', label: 'Community', icon: '👥' },
        ]}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.typeButton,
              recommendationType === item.key && styles.activeTypeButton,
            ]}
            onPress={() => setRecommendationType(item.key as RecommendationType)}
          >
            <Body style={styles.typeIcon}>{item.icon}</Body>
            <Caption style={[
              styles.typeLabel,
              recommendationType === item.key && styles.activeTypeLabel,
            ]}>
              {item.label}
            </Caption>
          </TouchableOpacity>
        )}
        keyExtractor={(item) => item.key}
        contentContainerStyle={styles.typeSelectorContent}
      />
    </View>
  );

  const renderRecommendationCard = ({ item }: { item: Recommendation }) => (
    <View style={styles.recommendationContainer}>
      <ProductCard
        product={{
          id: item.productId,
          type: item.productType,
          name: item.product?.name || 'Unknown Product',
          brand: item.product?.brand || item.product?.brewery || item.product?.winery,
          imageUrl: item.product?.image_url,
          rating: item.product?.average_rating || 0,
          ratingCount: item.product?.rating_count || 0,
          priceRange: item.product?.price_range,
        }}
        onPress={() => handleProductPress(item.productId, item.productType)}
        style={styles.productCard}
      />
      
      {/* Recommendation reason */}
      <View style={styles.reasonContainer}>
        <Caption style={styles.reasonText}>
          {item.reason}
        </Caption>
        <View style={styles.confidenceContainer}>
          <Caption style={styles.confidenceText}>
            {Math.round(item.confidence * 100)}% match
          </Caption>
          <View style={[
            styles.confidenceBar,
            { width: `${item.confidence * 100}%` }
          ]} />
        </View>
      </View>

      {/* Action buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleRecommendationFeedback(item.productId, 'liked')}
        >
          <Body style={styles.actionIcon}>👍</Body>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleRecommendationFeedback(item.productId, 'dismissed')}
        >
          <Body style={styles.actionIcon}>👎</Body>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <H1 style={styles.title}>Recommendations</H1>
      <Caption style={styles.subtitle}>
        Discover your next favorite based on your taste
      </Caption>
      
      {renderRecommendationTypeSelector()}
      
      <CategoryTabs
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
      />
    </View>
  );

  const renderEmptyState = () => (
    <EmptyState
      icon="🤖"
      title="No Recommendations Yet"
      message="Rate some products to get personalized recommendations"
      actionText="Explore Catalog"
      onAction={() => {
        // Navigate to catalog
        console.log('Navigate to catalog');
      }}
    />
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
      marginBottom: 4,
    },
    subtitle: {
      color: theme.colors.alabaster,
      opacity: 0.7,
      marginBottom: 24,
    },
    typeSelector: {
      marginBottom: 16,
    },
    typeSelectorContent: {
      paddingRight: 16,
    },
    typeButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 8,
      marginRight: 12,
      borderRadius: 20,
      backgroundColor: theme.colors.charcoal,
    },
    activeTypeButton: {
      backgroundColor: theme.colors.goldLeaf,
    },
    typeIcon: {
      fontSize: 16,
      marginRight: 6,
    },
    typeLabel: {
      color: theme.colors.alabaster,
      fontSize: 12,
      fontWeight: '500',
    },
    activeTypeLabel: {
      color: theme.colors.onyx,
      fontWeight: '600',
    },
    recommendationContainer: {
      marginBottom: 24,
      paddingHorizontal: 16,
    },
    productCard: {
      marginBottom: 12,
    },
    reasonContainer: {
      backgroundColor: theme.colors.charcoal,
      borderRadius: 8,
      padding: 12,
      marginBottom: 8,
    },
    reasonText: {
      color: theme.colors.alabaster,
      fontSize: 12,
      lineHeight: 16,
      marginBottom: 8,
    },
    confidenceContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    confidenceText: {
      color: theme.colors.goldLeaf,
      fontSize: 11,
      fontWeight: '600',
    },
    confidenceBar: {
      height: 2,
      backgroundColor: theme.colors.goldLeaf,
      borderRadius: 1,
      flex: 1,
      marginLeft: 8,
    },
    actionButtons: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 16,
    },
    actionButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.charcoal,
      justifyContent: 'center',
      alignItems: 'center',
    },
    actionIcon: {
      fontSize: 16,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 32,
    },
    errorText: {
      color: theme.colors.alabaster,
      textAlign: 'center',
      marginBottom: 16,
    },
    retryButton: {
      backgroundColor: theme.colors.goldLeaf,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 8,
    },
    retryButtonText: {
      color: theme.colors.onyx,
      fontWeight: '600',
    },
  });

  if (loading && !recommendations) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <LoadingSpinner size="large" />
          <Caption style={{ color: theme.colors.alabaster, marginTop: 16 }}>
            Generating personalized recommendations...
          </Caption>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Body style={styles.errorText}>
            Failed to load recommendations. Please try again.
          </Body>
          <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
            <Body style={styles.retryButtonText}>Retry</Body>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const displayData = getDisplayData();

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={displayData}
        renderItem={renderRecommendationCard}
        keyExtractor={(item) => `${item.productId}_${item.productType}`}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.goldLeaf}
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      />
    </SafeAreaView>
  );
};
