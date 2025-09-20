/**
 * Review Card Component
 * Displays individual product reviews
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
} from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { useAuth } from '../../contexts/AuthContext';
import { useLikeReview } from '../../hooks/useOfflineMutation';
import { Body, Caption } from '../ui/Typography';
import { StarRating } from '../ui/StarRating';
import { FlavorTags } from './FlavorTags';

interface ReviewCardProps {
  review: {
    id: string;
    userId: string;
    rating: number;
    review: string;
    flavorNotes?: string[];
    images?: string[];
    specificRatings?: Record<string, number>;
    likeCount: number;
    isLikedByUser: boolean;
    createdAt: Date;
    user?: {
      id: string;
      username: string;
      displayName: string;
      avatarUrl?: string;
    };
  };
  productType: 'cigar' | 'beer' | 'wine';
  onUserPress?: (userId: string) => void;
}

export const ReviewCard: React.FC<ReviewCardProps> = ({
  review,
  productType,
  onUserPress,
}) => {
  const theme = useTheme();
  const { user } = useAuth();
  const [showFullReview, setShowFullReview] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const likeReview = useLikeReview();

  const handleLike = useCallback(async () => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to like reviews.');
      return;
    }

    try {
      await likeReview.mutate({
        reviewId: review.id,
        isLiked: !review.isLikedByUser,
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to update like status. Please try again.');
    }
  }, [user, review.id, review.isLikedByUser, likeReview]);

  const handleUserPress = useCallback(() => {
    if (review.user?.id && onUserPress) {
      onUserPress(review.user.id);
    }
  }, [review.user?.id, onUserPress]);

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return date.toLocaleDateString();
  };

  const getSpecificRatingCategories = () => {
    switch (productType) {
      case 'cigar':
        return [
          { key: 'construction', label: 'Construction' },
          { key: 'burn', label: 'Burn' },
          { key: 'draw', label: 'Draw' },
          { key: 'flavor', label: 'Flavor' },
        ];
      case 'beer':
        return [
          { key: 'appearance', label: 'Appearance' },
          { key: 'aroma', label: 'Aroma' },
          { key: 'taste', label: 'Taste' },
          { key: 'mouthfeel', label: 'Mouthfeel' },
        ];
      case 'wine':
        return [
          { key: 'appearance', label: 'Appearance' },
          { key: 'aroma', label: 'Aroma' },
          { key: 'taste', label: 'Taste' },
          { key: 'finish', label: 'Finish' },
        ];
      default:
        return [];
    }
  };

  const shouldTruncateReview = review.review.length > 200;
  const displayReview = showFullReview || !shouldTruncateReview 
    ? review.review 
    : review.review.substring(0, 200) + '...';

  const styles = StyleSheet.create({
    container: {
      backgroundColor: theme.colors.charcoal,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.goldLeaf,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    avatarImage: {
      width: 40,
      height: 40,
      borderRadius: 20,
    },
    avatarText: {
      color: theme.colors.onyx,
      fontWeight: '600',
      fontSize: 16,
    },
    userInfo: {
      flex: 1,
    },
    username: {
      color: theme.colors.alabaster,
      fontWeight: '600',
      fontSize: 14,
    },
    timeAndRating: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 2,
    },
    timeText: {
      color: theme.colors.alabaster,
      opacity: 0.7,
      fontSize: 12,
      marginRight: 8,
    },
    ratingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    ratingText: {
      color: theme.colors.alabaster,
      fontSize: 12,
      fontWeight: '600',
      marginLeft: 4,
    },
    reviewText: {
      color: theme.colors.alabaster,
      fontSize: 15,
      lineHeight: 20,
      marginBottom: 12,
    },
    readMoreButton: {
      alignSelf: 'flex-start',
    },
    readMoreText: {
      color: theme.colors.goldLeaf,
      fontSize: 14,
      fontWeight: '500',
    },
    specificRatings: {
      marginBottom: 12,
    },
    specificRatingRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 4,
    },
    specificRatingLabel: {
      color: theme.colors.alabaster,
      opacity: 0.8,
      fontSize: 12,
      flex: 1,
    },
    imagesContainer: {
      marginBottom: 12,
    },
    imagesList: {
      flexDirection: 'row',
      gap: 8,
    },
    reviewImage: {
      width: 80,
      height: 80,
      borderRadius: 8,
    },
    flavorNotesContainer: {
      marginBottom: 12,
    },
    actions: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    likeButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 20,
      backgroundColor: theme.colors.onyx,
    },
    likeButtonActive: {
      backgroundColor: theme.colors.goldLeaf + '20',
    },
    likeIcon: {
      fontSize: 16,
      marginRight: 4,
    },
    likeText: {
      color: theme.colors.alabaster,
      fontSize: 12,
      fontWeight: '500',
    },
    likeTextActive: {
      color: theme.colors.goldLeaf,
    },
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.avatar} onPress={handleUserPress}>
          {review.user?.avatarUrl ? (
            <Image source={{ uri: review.user.avatarUrl }} style={styles.avatarImage} />
          ) : (
            <Body style={styles.avatarText}>
              {review.user?.displayName?.charAt(0) || 'U'}
            </Body>
          )}
        </TouchableOpacity>
        
        <View style={styles.userInfo}>
          <TouchableOpacity onPress={handleUserPress}>
            <Body style={styles.username}>
              {review.user?.displayName || 'Anonymous User'}
            </Body>
          </TouchableOpacity>
          
          <View style={styles.timeAndRating}>
            <Caption style={styles.timeText}>
              {formatDate(review.createdAt)}
            </Caption>
            
            <View style={styles.ratingContainer}>
              <StarRating
                rating={review.rating}
                size={12}
                color={theme.colors.goldLeaf}
              />
              <Caption style={styles.ratingText}>
                {review.rating}.0
              </Caption>
            </View>
          </View>
        </View>
      </View>

      {/* Review Text */}
      <Body style={styles.reviewText}>
        {displayReview}
      </Body>
      
      {shouldTruncateReview && (
        <TouchableOpacity
          style={styles.readMoreButton}
          onPress={() => setShowFullReview(!showFullReview)}
        >
          <Body style={styles.readMoreText}>
            {showFullReview ? 'Show less' : 'Read more'}
          </Body>
        </TouchableOpacity>
      )}

      {/* Specific Ratings */}
      {review.specificRatings && Object.keys(review.specificRatings).length > 0 && (
        <View style={styles.specificRatings}>
          {getSpecificRatingCategories().map((category) => {
            const rating = review.specificRatings?.[category.key];
            if (!rating) return null;
            
            return (
              <View key={category.key} style={styles.specificRatingRow}>
                <Caption style={styles.specificRatingLabel}>
                  {category.label}
                </Caption>
                <StarRating
                  rating={rating}
                  size={10}
                  color={theme.colors.goldLeaf}
                />
              </View>
            );
          })}
        </View>
      )}

      {/* Images */}
      {review.images && review.images.length > 0 && (
        <View style={styles.imagesContainer}>
          <View style={styles.imagesList}>
            {review.images.slice(0, 3).map((imageUrl, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => setSelectedImageIndex(index)}
              >
                <Image source={{ uri: imageUrl }} style={styles.reviewImage} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Flavor Notes */}
      {review.flavorNotes && review.flavorNotes.length > 0 && (
        <View style={styles.flavorNotesContainer}>
          <FlavorTags
            notes={review.flavorNotes}
            productType={productType}
          />
        </View>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[
            styles.likeButton,
            review.isLikedByUser && styles.likeButtonActive,
          ]}
          onPress={handleLike}
          disabled={likeReview.loading}
        >
          <Body style={[
            styles.likeIcon,
            review.isLikedByUser && styles.likeTextActive,
          ]}>
            {review.isLikedByUser ? '❤️' : '🤍'}
          </Body>
          <Caption style={[
            styles.likeText,
            review.isLikedByUser && styles.likeTextActive,
          ]}>
            {review.likeCount}
          </Caption>
        </TouchableOpacity>
      </View>
    </View>
  );
};
