/**
 * Post Card Component
 * Individual post display with interactions (like, comment, share)
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
  Alert,
} from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { useAuth } from '../../contexts/AuthContext';
import { useLikePost } from '../../hooks/useOfflineMutation';
import { Body, Caption } from '../ui/Typography';
import { Card } from '../ui/Card';
import Post from '../../database/models/Post';

interface PostCardProps {
  post: Post;
  onLike?: () => void;
  onComment?: () => void;
  onShare?: () => void;
  onUserPress?: (userId: string) => void;
  onProductPress?: (productId: string, productType: string) => void;
}

const { width: screenWidth } = Dimensions.get('window');
const imageWidth = screenWidth - 32; // Account for padding

export const PostCard: React.FC<PostCardProps> = ({
  post,
  onLike,
  onComment,
  onShare,
  onUserPress,
  onProductPress,
}) => {
  const theme = useTheme();
  const { user } = useAuth();
  const likePost = useLikePost();
  const [imageError, setImageError] = useState(false);

  const handleLike = useCallback(async () => {
    if (!user) return;

    try {
      await likePost.mutate({
        postId: post.id,
        isLiked: !post.isLikedByUser,
      });
      onLike?.();
    } catch (error) {
      console.error('Error liking post:', error);
      Alert.alert('Error', 'Failed to like post. Please try again.');
    }
  }, [post.id, post.isLikedByUser, user, likePost, onLike]);

  const handleUserPress = useCallback(() => {
    onUserPress?.(post.userId);
  }, [post.userId, onUserPress]);

  const handleProductPress = useCallback(() => {
    if (post.productId && post.productType) {
      onProductPress?.(post.productId, post.productType);
    }
  }, [post.productId, post.productType, onProductPress]);

  const renderImages = () => {
    if (!post.hasImages) return null;

    const images = post.images;
    const imageHeight = 200;

    if (images.length === 1) {
      return (
        <Image
          source={{ uri: images[0].url }}
          style={[styles.singleImage, { height: imageHeight }]}
          resizeMode="cover"
          onError={() => setImageError(true)}
        />
      );
    }

    // Multiple images - show in grid
    return (
      <View style={styles.imageGrid}>
        {images.slice(0, 4).map((image, index) => (
          <View key={index} style={styles.gridImageContainer}>
            <Image
              source={{ uri: image.url }}
              style={styles.gridImage}
              resizeMode="cover"
              onError={() => setImageError(true)}
            />
            {index === 3 && images.length > 4 && (
              <View style={styles.moreImagesOverlay}>
                <Body style={styles.moreImagesText}>+{images.length - 4}</Body>
              </View>
            )}
          </View>
        ))}
      </View>
    );
  };

  const renderProductTag = () => {
    if (!post.hasProduct) return null;

    return (
      <TouchableOpacity style={styles.productTag} onPress={handleProductPress}>
        <View style={styles.productTagIcon}>
          <Body style={styles.productTagIconText}>
            {post.productType === 'cigar' ? '🚬' : 
             post.productType === 'beer' ? '🍺' : '🍷'}
          </Body>
        </View>
        <Body style={styles.productTagText}>
          Tagged {post.productType}
        </Body>
      </TouchableOpacity>
    );
  };

  const renderTags = () => {
    if (!post.hasTags) return null;

    return (
      <View style={styles.tagsContainer}>
        {post.tags.slice(0, 3).map((tag, index) => (
          <View key={index} style={styles.tag}>
            <Caption style={styles.tagText}>#{tag}</Caption>
          </View>
        ))}
        {post.tags.length > 3 && (
          <Caption style={styles.moreTagsText}>+{post.tags.length - 3} more</Caption>
        )}
      </View>
    );
  };

  const styles = StyleSheet.create({
    container: {
      marginHorizontal: 16,
      marginVertical: 8,
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
      fontSize: 16,
    },
    timeAndLocation: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 2,
    },
    timeText: {
      color: theme.colors.alabaster,
      opacity: 0.7,
      fontSize: 14,
    },
    locationText: {
      color: theme.colors.goldLeaf,
      fontSize: 14,
      marginLeft: 8,
    },
    syncIndicator: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginLeft: 8,
    },
    synced: {
      backgroundColor: '#4ECDC4',
    },
    pending: {
      backgroundColor: '#FFE66D',
    },
    conflict: {
      backgroundColor: '#FF6B6B',
    },
    content: {
      color: theme.colors.alabaster,
      fontSize: 16,
      lineHeight: 24,
      marginBottom: 12,
    },
    singleImage: {
      width: '100%',
      borderRadius: 8,
      marginBottom: 12,
    },
    imageGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 4,
      marginBottom: 12,
    },
    gridImageContainer: {
      width: (imageWidth - 4) / 2,
      height: 120,
      position: 'relative',
    },
    gridImage: {
      width: '100%',
      height: '100%',
      borderRadius: 8,
    },
    moreImagesOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
    },
    moreImagesText: {
      color: theme.colors.alabaster,
      fontWeight: '600',
      fontSize: 18,
    },
    productTag: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.onyx,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      alignSelf: 'flex-start',
      marginBottom: 12,
    },
    productTagIcon: {
      marginRight: 6,
    },
    productTagIconText: {
      fontSize: 16,
    },
    productTagText: {
      color: theme.colors.alabaster,
      fontSize: 14,
      fontWeight: '500',
    },
    tagsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      marginBottom: 12,
      gap: 8,
    },
    tag: {
      backgroundColor: theme.colors.onyx,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    tagText: {
      color: theme.colors.goldLeaf,
      fontSize: 12,
      fontWeight: '500',
    },
    moreTagsText: {
      color: theme.colors.alabaster,
      opacity: 0.7,
      fontSize: 12,
    },
    actions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: theme.colors.onyx,
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 8,
    },
    actionButtonActive: {
      backgroundColor: theme.colors.onyx,
    },
    actionIcon: {
      fontSize: 18,
      marginRight: 6,
    },
    actionText: {
      color: theme.colors.alabaster,
      fontSize: 14,
      fontWeight: '500',
    },
    actionTextActive: {
      color: theme.colors.goldLeaf,
    },
  });

  return (
    <Card style={styles.container}>
      {/* Header */}
      <TouchableOpacity style={styles.header} onPress={handleUserPress}>
        <View style={styles.avatar}>
          <Body style={styles.avatarText}>
            {post.user?.displayName?.charAt(0) || 'U'}
          </Body>
        </View>
        <View style={styles.userInfo}>
          <Body style={styles.username}>
            {post.user?.displayName || 'Unknown User'}
          </Body>
          <View style={styles.timeAndLocation}>
            <Caption style={styles.timeText}>{post.timeAgo}</Caption>
            {post.hasLocation && (
              <Caption style={styles.locationText}>📍 {post.location}</Caption>
            )}
            <View style={[
              styles.syncIndicator,
              post.isOnline ? styles.synced : 
              post.needsSync ? styles.pending : styles.conflict
            ]} />
          </View>
        </View>
      </TouchableOpacity>

      {/* Content */}
      <Body style={styles.content}>{post.content}</Body>

      {/* Images */}
      {renderImages()}

      {/* Product Tag */}
      {renderProductTag()}

      {/* Tags */}
      {renderTags()}

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, post.isLikedByUser && styles.actionButtonActive]}
          onPress={handleLike}
          disabled={likePost.loading}
        >
          <Body style={[
            styles.actionIcon,
            post.isLikedByUser && styles.actionTextActive
          ]}>
            {post.isLikedByUser ? '❤️' : '🤍'}
          </Body>
          <Body style={[
            styles.actionText,
            post.isLikedByUser && styles.actionTextActive
          ]}>
            {post.likeCount}
          </Body>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={onComment}>
          <Body style={styles.actionIcon}>💬</Body>
          <Body style={styles.actionText}>{post.commentCount}</Body>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={onShare}>
          <Body style={styles.actionIcon}>📤</Body>
          <Body style={styles.actionText}>{post.shareCount}</Body>
        </TouchableOpacity>
      </View>
    </Card>
  );
};
