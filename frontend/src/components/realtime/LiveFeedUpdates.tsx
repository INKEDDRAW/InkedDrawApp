/**
 * Live Feed Updates Component
 * Shows real-time activity updates in the social feed
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Animated,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRealtime } from '../../contexts/RealtimeContext';
import { colors, typography, spacing } from '../../theme';

interface FeedUpdate {
  id: string;
  type: 'post' | 'comment' | 'like' | 'follow' | 'rating';
  userId: string;
  targetId?: string;
  targetType?: string;
  content?: string;
  metadata?: any;
  createdAt: Date;
  user?: {
    id: string;
    displayName: string;
    avatarUrl?: string;
  };
}

interface LiveFeedUpdatesProps {
  onUpdatePress?: (update: FeedUpdate) => void;
  maxUpdates?: number;
  showFilters?: boolean;
}

export const LiveFeedUpdates: React.FC<LiveFeedUpdatesProps> = ({
  onUpdatePress,
  maxUpdates = 50,
  showFilters = true,
}) => {
  const { socket, isConnected } = useRealtime();
  const [updates, setUpdates] = useState<FeedUpdate[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filters, setFilters] = useState({
    types: ['post', 'comment', 'like', 'follow', 'rating'],
    followingOnly: false,
  });
  const [newUpdatesCount, setNewUpdatesCount] = useState(0);
  
  const fadeAnimation = useRef(new Animated.Value(1)).current;
  const slideAnimation = useRef(new Animated.Value(0)).current;

  // Listen for real-time updates
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleNewPost = (post: any) => {
      const update: FeedUpdate = {
        id: `post-${post.id}`,
        type: 'post',
        userId: post.userId,
        content: post.content,
        metadata: {
          images: post.images,
          productTags: post.productTags,
          likeCount: post.likeCount || 0,
          commentCount: post.commentCount || 0,
        },
        createdAt: new Date(post.createdAt),
        user: post.user,
      };
      addUpdate(update);
    };

    const handleNewComment = (comment: any) => {
      const update: FeedUpdate = {
        id: `comment-${comment.id}`,
        type: 'comment',
        userId: comment.userId,
        targetId: comment.postId,
        targetType: 'post',
        content: comment.content,
        metadata: {
          postTitle: comment.post?.content?.substring(0, 50),
          postAuthor: comment.post?.user?.displayName,
        },
        createdAt: new Date(comment.createdAt),
        user: comment.user,
      };
      addUpdate(update);
    };

    const handleNewLike = (like: any) => {
      const update: FeedUpdate = {
        id: `like-${like.id}`,
        type: 'like',
        userId: like.userId,
        targetId: like.targetId,
        targetType: like.targetType,
        metadata: {
          targetContent: like.targetContent?.substring(0, 50),
          targetAuthor: like.targetAuthor,
        },
        createdAt: new Date(like.createdAt),
        user: like.user,
      };
      addUpdate(update);
    };

    const handleNewFollow = (follow: any) => {
      const update: FeedUpdate = {
        id: `follow-${follow.id}`,
        type: 'follow',
        userId: follow.followerId,
        targetId: follow.followingId,
        targetType: 'user',
        metadata: {
          followedUser: follow.following?.displayName,
          followedAvatar: follow.following?.avatarUrl,
        },
        createdAt: new Date(follow.createdAt),
        user: follow.follower,
      };
      addUpdate(update);
    };

    socket.on('feed:new_post', handleNewPost);
    socket.on('feed:new_comment', handleNewComment);
    socket.on('feed:new_like', handleNewLike);
    socket.on('social:new_follower', handleNewFollow);

    return () => {
      socket.off('feed:new_post', handleNewPost);
      socket.off('feed:new_comment', handleNewComment);
      socket.off('feed:new_like', handleNewLike);
      socket.off('social:new_follower', handleNewFollow);
    };
  }, [socket, isConnected]);

  const addUpdate = (update: FeedUpdate) => {
    // Check if update type is in filters
    if (!filters.types.includes(update.type)) return;

    setUpdates(prev => {
      const newUpdates = [update, ...prev].slice(0, maxUpdates);
      return newUpdates;
    });

    setNewUpdatesCount(prev => prev + 1);

    // Animate new update
    slideAnimation.setValue(-50);
    Animated.timing(slideAnimation, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setNewUpdatesCount(0);
    
    // Simulate API call to get latest updates
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  const toggleFilter = (type: string) => {
    setFilters(prev => ({
      ...prev,
      types: prev.types.includes(type)
        ? prev.types.filter(t => t !== type)
        : [...prev.types, type],
    }));
  };

  const toggleFollowingOnly = () => {
    setFilters(prev => ({
      ...prev,
      followingOnly: !prev.followingOnly,
    }));
  };

  const getUpdateIcon = (type: string) => {
    switch (type) {
      case 'post': return 'document-text';
      case 'comment': return 'chatbubble';
      case 'like': return 'heart';
      case 'follow': return 'person-add';
      case 'rating': return 'star';
      default: return 'pulse';
    }
  };

  const getUpdateColor = (type: string) => {
    switch (type) {
      case 'post': return colors.primary;
      case 'comment': return colors.info;
      case 'like': return colors.error;
      case 'follow': return colors.success;
      case 'rating': return colors.warning;
      default: return colors.textSecondary;
    }
  };

  const formatUpdateText = (update: FeedUpdate) => {
    const userName = update.user?.displayName || 'Someone';
    
    switch (update.type) {
      case 'post':
        return `${userName} shared a new post`;
      case 'comment':
        return `${userName} commented on ${update.metadata?.postAuthor || 'a post'}`;
      case 'like':
        return `${userName} liked ${update.metadata?.targetAuthor || 'a post'}`;
      case 'follow':
        return `${userName} started following ${update.metadata?.followedUser || 'someone'}`;
      case 'rating':
        return `${userName} rated a product`;
      default:
        return `${userName} did something`;
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const renderUpdateItem = ({ item: update, index }: { item: FeedUpdate; index: number }) => (
    <Animated.View
      style={[
        styles.updateItem,
        index === 0 && {
          transform: [{ translateY: slideAnimation }],
        },
      ]}
    >
      <TouchableOpacity
        style={styles.updateContent}
        onPress={() => onUpdatePress?.(update)}
      >
        <View style={[styles.updateIcon, { backgroundColor: getUpdateColor(update.type) + '20' }]}>
          <Ionicons
            name={getUpdateIcon(update.type)}
            size={16}
            color={getUpdateColor(update.type)}
          />
        </View>

        <View style={styles.updateText}>
          <Text style={styles.updateDescription}>
            {formatUpdateText(update)}
          </Text>
          {update.content && (
            <Text style={styles.updateContent} numberOfLines={2}>
              "{update.content}"
            </Text>
          )}
          <Text style={styles.updateTime}>
            {formatTimeAgo(update.createdAt)}
          </Text>
        </View>

        <View style={styles.updateIndicator}>
          <View style={[styles.typeDot, { backgroundColor: getUpdateColor(update.type) }]} />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderFilters = () => {
    if (!showFilters) return null;

    const filterTypes = [
      { key: 'post', label: 'Posts', icon: 'document-text' },
      { key: 'comment', label: 'Comments', icon: 'chatbubble' },
      { key: 'like', label: 'Likes', icon: 'heart' },
      { key: 'follow', label: 'Follows', icon: 'person-add' },
      { key: 'rating', label: 'Ratings', icon: 'star' },
    ];

    return (
      <View style={styles.filtersContainer}>
        <FlatList
          horizontal
          data={filterTypes}
          keyExtractor={(item) => item.key}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterChip,
                filters.types.includes(item.key) && styles.filterChipActive,
              ]}
              onPress={() => toggleFilter(item.key)}
            >
              <Ionicons
                name={item.icon}
                size={14}
                color={filters.types.includes(item.key) ? colors.white : colors.textSecondary}
              />
              <Text
                style={[
                  styles.filterChipText,
                  filters.types.includes(item.key) && styles.filterChipTextActive,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />

        <TouchableOpacity
          style={[
            styles.followingFilter,
            filters.followingOnly && styles.followingFilterActive,
          ]}
          onPress={toggleFollowingOnly}
        >
          <Ionicons
            name="people"
            size={14}
            color={filters.followingOnly ? colors.white : colors.textSecondary}
          />
          <Text
            style={[
              styles.followingFilterText,
              filters.followingOnly && styles.followingFilterTextActive,
            ]}
          >
            Following
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {renderFilters()}

      {newUpdatesCount > 0 && (
        <TouchableOpacity style={styles.newUpdatesBar} onPress={() => setNewUpdatesCount(0)}>
          <Ionicons name="arrow-up" size={16} color={colors.primary} />
          <Text style={styles.newUpdatesText}>
            {newUpdatesCount} new update{newUpdatesCount > 1 ? 's' : ''}
          </Text>
        </TouchableOpacity>
      )}

      <FlatList
        data={updates}
        renderItem={renderUpdateItem}
        keyExtractor={(item) => item.id}
        style={styles.updatesList}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons
              name="pulse-outline"
              size={48}
              color={colors.textSecondary}
            />
            <Text style={styles.emptyStateText}>
              {isConnected ? 'No live updates yet' : 'Connect to see live updates'}
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filtersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    marginRight: spacing.xs,
    borderRadius: 16,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  filterChipTextActive: {
    color: colors.white,
  },
  followingFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    marginLeft: 'auto',
    borderRadius: 16,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  followingFilterActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  followingFilterText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  followingFilterTextActive: {
    color: colors.white,
  },
  newUpdatesBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    backgroundColor: colors.primaryLight + '20',
    borderBottomWidth: 1,
    borderBottomColor: colors.primary + '30',
  },
  newUpdatesText: {
    ...typography.body2,
    color: colors.primary,
    marginLeft: spacing.xs,
    fontWeight: '600',
  },
  updatesList: {
    flex: 1,
  },
  updateItem: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.md,
    marginVertical: spacing.xs,
    borderRadius: 8,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  updateContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.sm,
  },
  updateIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  updateText: {
    flex: 1,
  },
  updateDescription: {
    ...typography.body2,
    color: colors.text,
    fontWeight: '500',
    marginBottom: 2,
  },
  updateContent: {
    ...typography.body2,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginBottom: 4,
  },
  updateTime: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  updateIndicator: {
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.xs,
  },
  typeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl * 2,
  },
  emptyStateText: {
    ...typography.body1,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
});
