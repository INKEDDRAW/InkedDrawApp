import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {
  Card,
  BodyText,
  Caption,
  SocialIcon,
  theme,
} from '../components';
import SocialService from '../services/SocialService';

/**
 * INKED DRAW Social Feed Screen
 * 
 * Instagram-style feed with luxury aesthetic
 * Features user posts with avatars, images, and social interactions
 */

const SocialFeedScreen = () => {
  const [posts, setPosts] = useState([]);
  const [likedPosts, setLikedPosts] = useState(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const [error, setError] = useState(null);

  // Pagination
  const [offset, setOffset] = useState(0);
  const limit = 10;

  useEffect(() => {
    loadFeed();
  }, []);

  const loadFeed = async (refresh = false) => {
    try {
      if (refresh) {
        setIsRefreshing(true);
        setOffset(0);
      } else if (!refresh && offset === 0) {
        setIsLoading(true);
      }

      const newPosts = await SocialService.getFeed(limit, refresh ? 0 : offset);
      const formattedPosts = newPosts.map(post => SocialService.formatPost(post));

      if (refresh) {
        setPosts(formattedPosts);
        setOffset(formattedPosts.length);
      } else {
        setPosts(prev => offset === 0 ? formattedPosts : [...prev, ...formattedPosts]);
        setOffset(prev => prev + formattedPosts.length);
      }

      setHasMorePosts(formattedPosts.length === limit);
      setError(null);

      // Extract liked posts from the data
      const userLikedPosts = new Set();
      formattedPosts.forEach(post => {
        if (post.user_has_liked) {
          userLikedPosts.add(post.id);
        }
      });
      setLikedPosts(userLikedPosts);

    } catch (err) {
      console.error('Error loading feed:', err);
      setError(err.message);
      if (offset === 0) {
        Alert.alert('Error', 'Failed to load social feed. Please try again.');
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = useCallback(() => {
    loadFeed(true);
  }, []);

  const handleLoadMore = useCallback(() => {
    if (!isLoadingMore && hasMorePosts && !isLoading) {
      setIsLoadingMore(true);
      loadFeed(false).finally(() => setIsLoadingMore(false));
    }
  }, [isLoadingMore, hasMorePosts, isLoading, offset]);

  const handleLike = async (postId) => {
    try {
      // Optimistic update
      const newLikedPosts = new Set(likedPosts);
      const wasLiked = newLikedPosts.has(postId);

      if (wasLiked) {
        newLikedPosts.delete(postId);
      } else {
        newLikedPosts.add(postId);
      }
      setLikedPosts(newLikedPosts);

      // Update posts array optimistically
      setPosts(prevPosts =>
        prevPosts.map(post =>
          post.id === postId
            ? {
                ...post,
                likes_count: wasLiked ? post.likes_count - 1 : post.likes_count + 1,
                user_has_liked: !wasLiked
              }
            : post
        )
      );

      // Make API call
      await SocialService.toggleLike(postId);

    } catch (error) {
      console.error('Error toggling like:', error);

      // Revert optimistic update on error
      const revertedLikedPosts = new Set(likedPosts);
      const wasLiked = !revertedLikedPosts.has(postId);

      if (wasLiked) {
        revertedLikedPosts.delete(postId);
      } else {
        revertedLikedPosts.add(postId);
      }
      setLikedPosts(revertedLikedPosts);

      setPosts(prevPosts =>
        prevPosts.map(post =>
          post.id === postId
            ? {
                ...post,
                likes_count: wasLiked ? post.likes_count - 1 : post.likes_count + 1,
                user_has_liked: wasLiked
              }
            : post
        )
      );

      Alert.alert('Error', 'Failed to update like. Please try again.');
    }
  };

  const renderPost = ({ item: post }) => (
    <Card variant="post" style={styles.postCard}>
      {/* User Header */}
      <View style={styles.userHeader}>
        <Image 
          source={{ uri: post.user.avatarUrl }}
          style={styles.avatar}
        />
        <View style={styles.userInfo}>
          <BodyText weight="medium" size="md">
            {post.user.name}
          </BodyText>
          <Caption>2h • Active</Caption>
        </View>
        <TouchableOpacity style={styles.moreButton}>
          <BodyText color={theme.colors.textTertiary}>•••</BodyText>
        </TouchableOpacity>
      </View>

      {/* Post Image */}
      {post.image_url && (
        <Image
          source={{ uri: post.image_url }}
          style={styles.postImage}
          resizeMode="cover"
        />
      )}

      {/* Social Actions */}
      <View style={styles.socialActions}>
        <TouchableOpacity 
          style={styles.socialButton}
          onPress={() => handleLike(post.id)}
        >
          <SocialIcon 
            name="heart" 
            active={likedPosts.has(post.id)}
            color={likedPosts.has(post.id) ? theme.colors.primary : theme.colors.textSecondary}
          />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.socialButton}>
          <SocialIcon 
            name="discuss" 
            color={theme.colors.textSecondary}
          />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.socialButton}>
          <SocialIcon 
            name="share" 
            color={theme.colors.textSecondary}
          />
        </TouchableOpacity>
      </View>

      {/* Engagement Stats */}
      <View style={styles.engagementStats}>
        <BodyText weight="medium" size="sm">
          {post.likes_count || 0} endorsements
        </BodyText>
        <BodyText color={theme.colors.textSecondary} size="sm">
          • {post.comments_count || 0} insights
        </BodyText>
      </View>

      {/* Post Caption */}
      <View style={styles.captionContainer}>
        <BodyText weight="medium" size="sm" style={styles.username}>
          {post.user.name}
        </BodyText>
        <BodyText size="sm" style={styles.caption}>
          {post.content}
        </BodyText>

        {post.item_type && post.item_name && (
          <View style={styles.itemInfo}>
            <BodyText
              size="sm"
              color={theme.colors.primary}
              style={styles.itemTag}
            >
              #{post.item_type} #{post.item_name}
            </BodyText>
          </View>
        )}
      </View>

      {/* View Comments */}
      <TouchableOpacity style={styles.viewComments}>
        <Caption>View all {post.comments_count || 0} insights</Caption>
      </TouchableOpacity>
    </Card>
  );

  // Show loading screen on initial load
  if (isLoading && posts.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <BodyText style={styles.loadingText}>Loading your feed...</BodyText>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <BodyText weight="bold" size="xl">
          Network Intelligence
        </BodyText>
        <TouchableOpacity>
          <SocialIcon name="search" color={theme.colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Feed */}
      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.feedContainer}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.1}
        ListFooterComponent={isLoadingMore ? (
          <View style={styles.loadingFooter}>
            <ActivityIndicator size="small" color={theme.colors.primary} />
          </View>
        ) : null}
        ListEmptyComponent={!isLoading && posts.length === 0 ? (
          <View style={styles.emptyState}>
            <BodyText size="lg" weight="medium" style={styles.emptyTitle}>
              No Posts Yet
            </BodyText>
            <BodyText size="md" color={theme.colors.textSecondary} style={styles.emptyText}>
              Follow other connoisseurs to see their luxury discoveries in your feed.
            </BodyText>
          </View>
        ) : null}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  feedContainer: {
    paddingVertical: theme.spacing.sm,
  },
  separator: {
    height: theme.spacing.sm,
  },
  
  // Post Card Styles
  postCard: {
    marginHorizontal: theme.spacing.lg,
    padding: 0,
    overflow: 'hidden',
  },
  
  // User Header
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: theme.spacing.sm,
  },
  userInfo: {
    flex: 1,
  },
  moreButton: {
    padding: theme.spacing.xs,
  },
  
  // Post Image
  postImage: {
    width: '100%',
    height: 300,
    backgroundColor: theme.colors.surface,
  },
  
  // Social Actions
  socialActions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.md,
  },
  socialButton: {
    marginRight: theme.spacing.lg,
    padding: theme.spacing.xs,
  },
  
  // Engagement Stats
  engagementStats: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.sm,
  },
  
  // Caption
  captionContainer: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.sm,
  },
  username: {
    marginRight: theme.spacing.xs,
  },
  caption: {
    lineHeight: 20,
    marginTop: theme.spacing.xs,
  },
  
  // Comments
  viewComments: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.xs,
    paddingBottom: theme.spacing.md,
  },

  // Loading states
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  loadingText: {
    marginTop: theme.spacing.md,
    color: theme.colors.textSecondary,
  },
  loadingFooter: {
    paddingVertical: theme.spacing.lg,
    alignItems: 'center',
  },

  // Empty state
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl * 2,
  },
  emptyTitle: {
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  emptyText: {
    textAlign: 'center',
    lineHeight: 24,
  },

  // Item info
  itemInfo: {
    marginTop: theme.spacing.sm,
  },
  itemTag: {
    fontStyle: 'italic',
  },
});

export default SocialFeedScreen;
