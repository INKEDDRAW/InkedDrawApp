/**
 * Product Detail Screen
 * Detailed view of a specific product with reviews and actions
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeProvider';
import { useAuth } from '../../contexts/AuthContext';
import { useOfflineQuery } from '../../hooks/useOfflineQuery';
import { useAddToCollection, useCreateRating } from '../../hooks/useOfflineMutation';
import { H1, H2, Body, Caption } from '../../components/ui/Typography';
import { Button } from '../../components/ui/Button';
import { StarRating } from '../../components/ui/StarRating';
import { ReviewCard } from '../../components/catalog/ReviewCard';
import { RatingModal } from '../../components/catalog/RatingModal';
import { ProductSpecs } from '../../components/catalog/ProductSpecs';
import { SimilarProducts } from '../../components/catalog/SimilarProducts';

interface ProductDetailScreenProps {
  productId: string;
  productType: 'cigar' | 'beer' | 'wine';
  onBack?: () => void;
  onSimilarProductPress?: (productId: string, productType: string) => void;
}

export const ProductDetailScreen: React.FC<ProductDetailScreenProps> = ({
  productId,
  productType,
  onBack,
  onSimilarProductPress,
}) => {
  const theme = useTheme();
  const { user } = useAuth();
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const addToCollection = useAddToCollection();
  const createRating = useCreateRating();

  // Fetch product details
  const { data: products, loading: productLoading } = useOfflineQuery(
    productType === 'cigar' ? 'cigars' : productType === 'beer' ? 'beers' : 'wines',
    {
      where: [['id', productId]],
      limit: 1,
    }
  );

  // Fetch product reviews
  const { data: reviews, loading: reviewsLoading, refresh: refreshReviews } = useOfflineQuery('ratings', {
    where: [
      ['product_id', productId],
      ['product_type', productType]
    ],
    sortBy: 'created_at',
    sortOrder: 'desc',
    limit: 20,
  });

  // Check if user has this product in collection
  const { data: collectionItems } = useOfflineQuery('collections', {
    where: [
      ['user_id', user?.id || ''],
      ['product_id', productId],
      ['product_type', productType]
    ],
    limit: 1,
  });

  // Check if user has rated this product
  const { data: userRatings } = useOfflineQuery('ratings', {
    where: [
      ['user_id', user?.id || ''],
      ['product_id', productId],
      ['product_type', productType]
    ],
    limit: 1,
  });

  const product = products[0];
  const isInCollection = collectionItems.length > 0;
  const userRating = userRatings[0];
  const hasUserRated = !!userRating;

  const productImages = useMemo(() => {
    const images = [];
    if (product?.imageUrl) {
      images.push(product.imageUrl);
    }
    // Add more images if available
    return images;
  }, [product]);

  const handleAddToCollection = useCallback(async () => {
    if (!user || !product) return;

    try {
      await addToCollection.mutate({
        productId: product.id,
        productType,
        status: 'owned',
        notes: '',
      });
      
      Alert.alert('Success', 'Added to your collection!');
    } catch (error) {
      Alert.alert('Error', 'Failed to add to collection. Please try again.');
    }
  }, [user, product, productType, addToCollection]);

  const handleCreateRating = useCallback(async (ratingData: any) => {
    if (!user || !product) return;

    try {
      await createRating.mutate({
        productId: product.id,
        productType,
        rating: ratingData.rating,
        review: ratingData.review,
        flavorNotes: ratingData.flavorNotes,
        images: ratingData.images,
      });
      
      setShowRatingModal(false);
      refreshReviews();
      Alert.alert('Success', 'Your review has been posted!');
    } catch (error) {
      Alert.alert('Error', 'Failed to post review. Please try again.');
    }
  }, [user, product, productType, createRating, refreshReviews]);

  const handleShare = useCallback(async () => {
    if (!product) return;

    try {
      await Share.share({
        message: `Check out this ${productType}: ${product.displayName || product.name}`,
        url: `https://inkeddraw.com/${productType}s/${product.id}`,
      });
    } catch (error) {
      console.error('Error sharing product:', error);
    }
  }, [product, productType]);

  const getProductIcon = (type: string) => {
    switch (type) {
      case 'cigar': return '🚬';
      case 'beer': return '🍺';
      case 'wine': return '🍷';
      default: return '📦';
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.onyx,
    },
    imageContainer: {
      height: 300,
      backgroundColor: theme.colors.charcoal,
      position: 'relative',
    },
    image: {
      width: '100%',
      height: '100%',
      resizeMode: 'cover',
    },
    placeholderContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    placeholderIcon: {
      fontSize: 64,
      opacity: 0.6,
    },
    backButton: {
      position: 'absolute',
      top: 44,
      left: 16,
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    backButtonText: {
      color: theme.colors.alabaster,
      fontSize: 18,
    },
    shareButton: {
      position: 'absolute',
      top: 44,
      right: 16,
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    shareButtonText: {
      color: theme.colors.alabaster,
      fontSize: 16,
    },
    content: {
      flex: 1,
      paddingHorizontal: 16,
      paddingTop: 20,
    },
    header: {
      marginBottom: 20,
    },
    title: {
      color: theme.colors.alabaster,
      marginBottom: 8,
    },
    subtitle: {
      color: theme.colors.alabaster,
      opacity: 0.8,
      fontSize: 16,
      marginBottom: 12,
    },
    ratingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    ratingText: {
      color: theme.colors.alabaster,
      fontSize: 18,
      fontWeight: '600',
      marginLeft: 8,
      marginRight: 4,
    },
    ratingCount: {
      color: theme.colors.alabaster,
      opacity: 0.7,
      fontSize: 14,
    },
    description: {
      color: theme.colors.alabaster,
      fontSize: 15,
      lineHeight: 22,
      marginBottom: 24,
    },
    actionsContainer: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 24,
    },
    actionButton: {
      flex: 1,
    },
    secondaryButton: {
      backgroundColor: theme.colors.charcoal,
      borderWidth: 1,
      borderColor: theme.colors.goldLeaf,
    },
    sectionTitle: {
      color: theme.colors.alabaster,
      marginBottom: 16,
      marginTop: 8,
    },
    reviewsContainer: {
      marginTop: 24,
    },
    emptyReviews: {
      alignItems: 'center',
      paddingVertical: 32,
    },
    emptyReviewsText: {
      color: theme.colors.alabaster,
      opacity: 0.7,
      textAlign: 'center',
    },
  });

  if (!product) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyReviews}>
          <Body style={styles.emptyReviewsText}>Product not found</Body>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Image */}
        <View style={styles.imageContainer}>
          {productImages.length > 0 ? (
            <Image source={{ uri: productImages[selectedImageIndex] }} style={styles.image} />
          ) : (
            <View style={styles.placeholderContainer}>
              <Body style={styles.placeholderIcon}>
                {getProductIcon(productType)}
              </Body>
            </View>
          )}
          
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Body style={styles.backButtonText}>←</Body>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
            <Body style={styles.shareButtonText}>↗</Body>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <H1 style={styles.title}>
              {product.displayName || product.name}
            </H1>
            
            <Body style={styles.subtitle}>
              {productType === 'cigar' && `${product.brand} • ${product.size}`}
              {productType === 'beer' && `${product.brewery} • ${product.style}`}
              {productType === 'wine' && `${product.winery} • ${product.vintage}`}
            </Body>

            {/* Rating */}
            <View style={styles.ratingContainer}>
              <StarRating
                rating={product.averageRating || 0}
                size={20}
                color={theme.colors.goldLeaf}
              />
              <Body style={styles.ratingText}>
                {(product.averageRating || 0).toFixed(1)}
              </Body>
              <Caption style={styles.ratingCount}>
                ({product.ratingCount || 0} reviews)
              </Caption>
            </View>
          </View>

          {/* Description */}
          {product.description && (
            <Body style={styles.description}>
              {product.description}
            </Body>
          )}

          {/* Actions */}
          <View style={styles.actionsContainer}>
            {!isInCollection && (
              <Button
                title="Add to Collection"
                onPress={handleAddToCollection}
                loading={addToCollection.loading}
                style={styles.actionButton}
              />
            )}
            
            <Button
              title={hasUserRated ? 'Update Review' : 'Write Review'}
              onPress={() => setShowRatingModal(true)}
              style={[styles.actionButton, styles.secondaryButton]}
            />
          </View>

          {/* Product Specifications */}
          <ProductSpecs product={product} productType={productType} />

          {/* Reviews */}
          <View style={styles.reviewsContainer}>
            <H2 style={styles.sectionTitle}>Reviews</H2>
            
            {reviews.length > 0 ? (
              reviews.map((review) => (
                <ReviewCard
                  key={review.id}
                  review={review}
                  productType={productType}
                />
              ))
            ) : (
              <View style={styles.emptyReviews}>
                <Body style={styles.emptyReviewsText}>
                  No reviews yet. Be the first to share your experience!
                </Body>
              </View>
            )}
          </View>

          {/* Similar Products */}
          <SimilarProducts
            currentProduct={product}
            productType={productType}
            onProductPress={onSimilarProductPress}
          />
        </View>
      </ScrollView>

      {/* Rating Modal */}
      <RatingModal
        visible={showRatingModal}
        product={product}
        productType={productType}
        existingRating={userRating}
        onSubmit={handleCreateRating}
        onClose={() => setShowRatingModal(false)}
        loading={createRating.loading}
      />
    </SafeAreaView>
  );
};
