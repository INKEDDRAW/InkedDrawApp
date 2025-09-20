/**
 * Social Feed Screen
 * Main social feed with posts, real-time updates, and offline support
 */

import React, { useState, useCallback, useRef } from 'react';
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
import { useOfflinePosts } from '../../hooks/useOfflineQuery';
import { useOffline } from '../../contexts/OfflineContext';
import { useAuth } from '../../contexts/AuthContext';
import { H1, Body } from '../../components/ui/Typography';
import { PostCard } from '../../components/social/PostCard';
import { CreatePostButton } from '../../components/social/CreatePostButton';
import { OfflineStatusBar } from '../../components/OfflineStatusBar';
import Post from '../../database/models/Post';

export const SocialFeedScreen: React.FC = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const { isOnline } = useOffline();
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'following' | 'cigars' | 'beers' | 'wines'>('all');
  
  const {
    data: posts,
    loading,
    refreshing,
    refresh,
    loadMore,
    hasMore,
    isEmpty,
  } = useOfflinePosts({
    limit: 20,
    refreshOnOnline: true,
    showLoadingOnRefresh: true,
  });

  const flatListRef = useRef<FlatList>(null);

  const handleRefresh = useCallback(async () => {
    try {
      await refresh();
    } catch (error) {
      console.error('Error refreshing feed:', error);
      Alert.alert('Error', 'Failed to refresh feed. Please try again.');
    }
  }, [refresh]);

  const handleLoadMore = useCallback(() => {
    if (hasMore && !loading && !refreshing) {
      loadMore();
    }
  }, [hasMore, loading, refreshing, loadMore]);

  const handlePostCreated = useCallback(() => {
    // Scroll to top when new post is created
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, []);

  const renderPost = useCallback(({ item }: { item: Post }) => (
    <PostCard
      post={item}
      onLike={() => {/* Handle like */}}
      onComment={() => {/* Handle comment */}}
      onShare={() => {/* Handle share */}}
    />
  ), []);

  const renderHeader = () => (
    <View style={styles.header}>
      <H1 style={styles.title}>Social Salon</H1>
      <View style={styles.filterContainer}>
        {(['all', 'following', 'cigars', 'beers', 'wines'] as const).map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterButton,
              selectedFilter === filter && styles.filterButtonActive,
            ]}
            onPress={() => setSelectedFilter(filter)}
          >
            <Body style={[
              styles.filterText,
              selectedFilter === filter && styles.filterTextActive,
            ]}>
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </Body>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Body style={styles.emptyText}>
        {isOnline 
          ? "No posts yet. Be the first to share your experience!"
          : "No posts available offline. Connect to see the latest content."
        }
      </Body>
    </View>
  );

  const renderFooter = () => {
    if (!hasMore) return null;
    
    return (
      <View style={styles.footerLoader}>
        <Body style={styles.loadingText}>Loading more posts...</Body>
      </View>
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.onyx,
    },
    header: {
      paddingHorizontal: 16,
      paddingVertical: 16,
      backgroundColor: theme.colors.charcoal,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.onyx,
    },
    title: {
      color: theme.colors.alabaster,
      marginBottom: 16,
    },
    filterContainer: {
      flexDirection: 'row',
      gap: 8,
    },
    filterButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: theme.colors.onyx,
      borderWidth: 1,
      borderColor: theme.colors.charcoal,
    },
    filterButtonActive: {
      backgroundColor: theme.colors.goldLeaf,
      borderColor: theme.colors.goldLeaf,
    },
    filterText: {
      color: theme.colors.alabaster,
      fontSize: 14,
      fontWeight: '500',
    },
    filterTextActive: {
      color: theme.colors.onyx,
      fontWeight: '600',
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 32,
      paddingVertical: 64,
    },
    emptyText: {
      color: theme.colors.alabaster,
      textAlign: 'center',
      opacity: 0.7,
    },
    footerLoader: {
      paddingVertical: 20,
      alignItems: 'center',
    },
    loadingText: {
      color: theme.colors.alabaster,
      opacity: 0.7,
    },
    createPostButton: {
      position: 'absolute',
      bottom: 24,
      right: 24,
      zIndex: 1000,
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <OfflineStatusBar />
      
      <FlatList
        ref={flatListRef}
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={isEmpty ? renderEmpty : null}
        ListFooterComponent={renderFooter}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.goldLeaf}
            colors={[theme.colors.goldLeaf]}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.1}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={isEmpty ? { flex: 1 } : undefined}
      />

      <View style={styles.createPostButton}>
        <CreatePostButton onPostCreated={handlePostCreated} />
      </View>
    </SafeAreaView>
  );
};
