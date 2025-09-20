/**
 * User Profile Screen
 * Shows user profile with posts, followers, following, and follow button
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeProvider';
import { useAuth } from '../../contexts/AuthContext';
import { useOfflineQuery } from '../../hooks/useOfflineQuery';
import { useFollowUser, useUnfollowUser } from '../../hooks/useOfflineMutation';
import { H1, H2, Body, Caption } from '../../components/ui/Typography';
import { Button } from '../../components/ui/Button';
import { PostCard } from '../../components/social/PostCard';
import { StatsCard } from '../../components/social/StatsCard';
import User from '../../database/models/User';

interface UserProfileScreenProps {
  userId: string;
  onBack?: () => void;
}

export const UserProfileScreen: React.FC<UserProfileScreenProps> = ({
  userId,
  onBack,
}) => {
  const theme = useTheme();
  const { user: currentUser } = useAuth();
  const [selectedTab, setSelectedTab] = useState<'posts' | 'collection' | 'ratings'>('posts');
  const followUser = useFollowUser();
  const unfollowUser = useUnfollowUser();

  // Fetch user profile
  const { data: users, loading: userLoading, refresh: refreshUser } = useOfflineQuery('users', {
    where: [['id', userId]],
    limit: 1,
  });

  // Fetch user's posts
  const { data: posts, loading: postsLoading, refresh: refreshPosts } = useOfflineQuery('posts', {
    where: [['user_id', userId]],
    sortBy: 'created_at',
    sortOrder: 'desc',
    limit: 20,
  });

  // Fetch user's collection
  const { data: collection } = useOfflineQuery('collections', {
    where: [['user_id', userId]],
    sortBy: 'created_at',
    sortOrder: 'desc',
    limit: 20,
  });

  // Fetch user's ratings
  const { data: ratings } = useOfflineQuery('ratings', {
    where: [['user_id', userId]],
    sortBy: 'created_at',
    sortOrder: 'desc',
    limit: 20,
  });

  // Check if current user follows this user
  const { data: followRelation } = useOfflineQuery('follows', {
    where: [
      ['follower_id', currentUser?.id || ''],
      ['following_id', userId]
    ],
    limit: 1,
  });

  // Get follower/following counts
  const { data: followers } = useOfflineQuery('follows', {
    where: [['following_id', userId]],
  });

  const { data: following } = useOfflineQuery('follows', {
    where: [['follower_id', userId]],
  });

  const user = users[0];
  const isFollowing = followRelation.length > 0;
  const isOwnProfile = currentUser?.id === userId;

  const stats = useMemo(() => ({
    posts: posts.length,
    followers: followers.length,
    following: following.length,
    collection: collection.length,
    ratings: ratings.length,
  }), [posts.length, followers.length, following.length, collection.length, ratings.length]);

  const handleFollow = useCallback(async () => {
    if (!currentUser || isOwnProfile) return;

    try {
      if (isFollowing) {
        await unfollowUser.mutate({ userId });
      } else {
        await followUser.mutate({ userId });
      }
    } catch (error) {
      console.error('Error following/unfollowing user:', error);
      Alert.alert('Error', 'Failed to update follow status. Please try again.');
    }
  }, [currentUser, isOwnProfile, isFollowing, userId, followUser, unfollowUser]);

  const handleRefresh = useCallback(async () => {
    await Promise.all([
      refreshUser(),
      refreshPosts(),
    ]);
  }, [refreshUser, refreshPosts]);

  const renderTabContent = () => {
    switch (selectedTab) {
      case 'posts':
        return (
          <View style={styles.tabContent}>
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onUserPress={() => {/* Already on user profile */}}
              />
            ))}
            {posts.length === 0 && (
              <View style={styles.emptyState}>
                <Body style={styles.emptyText}>
                  {isOwnProfile ? "You haven't posted anything yet" : "No posts yet"}
                </Body>
              </View>
            )}
          </View>
        );

      case 'collection':
        return (
          <View style={styles.tabContent}>
            <StatsCard
              title="Collection"
              stats={[
                { label: 'Total Items', value: collection.length },
                { label: 'Cigars', value: collection.filter(c => c.productType === 'cigar').length },
                { label: 'Beers', value: collection.filter(c => c.productType === 'beer').length },
                { label: 'Wines', value: collection.filter(c => c.productType === 'wine').length },
              ]}
            />
            {collection.length === 0 && (
              <View style={styles.emptyState}>
                <Body style={styles.emptyText}>
                  {isOwnProfile ? "Your collection is empty" : "Collection is private or empty"}
                </Body>
              </View>
            )}
          </View>
        );

      case 'ratings':
        return (
          <View style={styles.tabContent}>
            <StatsCard
              title="Ratings & Reviews"
              stats={[
                { label: 'Total Reviews', value: ratings.length },
                { label: 'Average Rating', value: ratings.length > 0 ? (ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length).toFixed(1) : '0' },
                { label: 'With Photos', value: ratings.filter(r => r.hasPhotos).length },
                { label: 'With Notes', value: ratings.filter(r => r.hasFlavorNotes).length },
              ]}
            />
            {ratings.length === 0 && (
              <View style={styles.emptyState}>
                <Body style={styles.emptyText}>
                  {isOwnProfile ? "You haven't rated anything yet" : "No ratings yet"}
                </Body>
              </View>
            )}
          </View>
        );

      default:
        return null;
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.onyx,
    },
    header: {
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 24,
      backgroundColor: theme.colors.charcoal,
    },
    avatar: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: theme.colors.goldLeaf,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
    },
    avatarText: {
      color: theme.colors.onyx,
      fontSize: 32,
      fontWeight: '600',
    },
    displayName: {
      color: theme.colors.alabaster,
      marginBottom: 4,
    },
    username: {
      color: theme.colors.alabaster,
      opacity: 0.7,
      marginBottom: 8,
    },
    bio: {
      color: theme.colors.alabaster,
      textAlign: 'center',
      marginBottom: 16,
      paddingHorizontal: 16,
    },
    statsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      width: '100%',
      marginBottom: 16,
    },
    statItem: {
      alignItems: 'center',
    },
    statValue: {
      color: theme.colors.alabaster,
      fontSize: 20,
      fontWeight: '600',
    },
    statLabel: {
      color: theme.colors.alabaster,
      opacity: 0.7,
      fontSize: 12,
      marginTop: 2,
    },
    followButton: {
      minWidth: 120,
    },
    followingButton: {
      backgroundColor: theme.colors.charcoal,
      borderWidth: 1,
      borderColor: theme.colors.goldLeaf,
    },
    tabs: {
      flexDirection: 'row',
      backgroundColor: theme.colors.charcoal,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.onyx,
    },
    tab: {
      flex: 1,
      paddingVertical: 16,
      alignItems: 'center',
      borderBottomWidth: 2,
      borderBottomColor: 'transparent',
    },
    activeTab: {
      borderBottomColor: theme.colors.goldLeaf,
    },
    tabText: {
      color: theme.colors.alabaster,
      fontSize: 16,
      fontWeight: '500',
    },
    activeTabText: {
      color: theme.colors.goldLeaf,
      fontWeight: '600',
    },
    tabContent: {
      flex: 1,
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 32,
      paddingVertical: 64,
    },
    emptyText: {
      color: theme.colors.alabaster,
      opacity: 0.7,
      textAlign: 'center',
    },
  });

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyState}>
          <Body style={styles.emptyText}>User not found</Body>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={userLoading || postsLoading}
            onRefresh={handleRefresh}
            tintColor={theme.colors.goldLeaf}
            colors={[theme.colors.goldLeaf]}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Body style={styles.avatarText}>
              {user.displayName?.charAt(0) || 'U'}
            </Body>
          </View>

          <H1 style={styles.displayName}>{user.displayName}</H1>
          <Body style={styles.username}>@{user.username}</Body>

          {user.bio && (
            <Body style={styles.bio}>{user.bio}</Body>
          )}

          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Body style={styles.statValue}>{stats.posts}</Body>
              <Caption style={styles.statLabel}>Posts</Caption>
            </View>
            <View style={styles.statItem}>
              <Body style={styles.statValue}>{stats.followers}</Body>
              <Caption style={styles.statLabel}>Followers</Caption>
            </View>
            <View style={styles.statItem}>
              <Body style={styles.statValue}>{stats.following}</Body>
              <Caption style={styles.statLabel}>Following</Caption>
            </View>
          </View>

          {/* Follow Button */}
          {!isOwnProfile && currentUser && (
            <Button
              title={isFollowing ? 'Following' : 'Follow'}
              onPress={handleFollow}
              loading={followUser.loading || unfollowUser.loading}
              style={[
                styles.followButton,
                isFollowing && styles.followingButton,
              ]}
            />
          )}
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          {(['posts', 'collection', 'ratings'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, selectedTab === tab && styles.activeTab]}
              onPress={() => setSelectedTab(tab)}
            >
              <Body style={[
                styles.tabText,
                selectedTab === tab && styles.activeTabText,
              ]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Body>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Content */}
        {renderTabContent()}
      </ScrollView>
    </SafeAreaView>
  );
};
