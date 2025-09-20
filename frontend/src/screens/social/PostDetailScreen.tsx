/**
 * Post Detail Screen
 * Shows individual post with comments and interactions
 */

import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeProvider';
import { useAuth } from '../../contexts/AuthContext';
import { PostCard } from '../../components/social/PostCard';
import { CommentItem } from '../../components/social/CommentItem';
import { CommentInput } from '../../components/social/CommentInput';
import { useOfflineQuery } from '../../hooks/useOfflineQuery';
import { useCreateComment } from '../../hooks/useOfflineMutation';
import { Body } from '../../components/ui/Typography';
import Post from '../../database/models/Post';
import Comment from '../../database/models/Comment';

interface PostDetailScreenProps {
  postId: string;
  onBack?: () => void;
}

export const PostDetailScreen: React.FC<PostDetailScreenProps> = ({
  postId,
  onBack,
}) => {
  const theme = useTheme();
  const { user } = useAuth();
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const createComment = useCreateComment();

  // Fetch post
  const { data: posts } = useOfflineQuery('posts', {
    where: [['id', postId]],
    limit: 1,
  });

  // Fetch comments
  const {
    data: comments,
    loading: commentsLoading,
    refresh: refreshComments,
  } = useOfflineQuery('comments', {
    where: [['post_id', postId]],
    sortBy: 'created_at',
    sortOrder: 'asc',
    refreshOnOnline: true,
  });

  const post = posts[0];

  const handleCreateComment = useCallback(async (content: string) => {
    if (!user || !post) return;

    try {
      await createComment.mutate({
        postId: post.id,
        content: content.trim(),
        parentCommentId: replyingTo?.id,
      });

      setReplyingTo(null);
      
      // Scroll to bottom to show new comment
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Error creating comment:', error);
      Alert.alert('Error', 'Failed to post comment. Please try again.');
    }
  }, [user, post, replyingTo, createComment]);

  const handleReply = useCallback((comment: Comment) => {
    setReplyingTo(comment);
  }, []);

  const handleCancelReply = useCallback(() => {
    setReplyingTo(null);
  }, []);

  const renderHeader = useCallback(() => {
    if (!post) return null;
    
    return (
      <PostCard
        post={post}
        onComment={() => {
          // Focus on comment input
        }}
      />
    );
  }, [post]);

  const renderComment = useCallback(({ item }: { item: Comment }) => (
    <CommentItem
      comment={item}
      onReply={() => handleReply(item)}
      onLike={() => {/* Handle comment like */}}
    />
  ), [handleReply]);

  const renderSeparator = useCallback(() => (
    <View style={styles.separator} />
  ), []);

  const renderEmpty = useCallback(() => (
    <View style={styles.emptyContainer}>
      <Body style={styles.emptyText}>
        No comments yet. Be the first to share your thoughts!
      </Body>
    </View>
  ), []);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.onyx,
    },
    separator: {
      height: 1,
      backgroundColor: theme.colors.charcoal,
      marginHorizontal: 16,
    },
    emptyContainer: {
      paddingVertical: 32,
      paddingHorizontal: 16,
      alignItems: 'center',
    },
    emptyText: {
      color: theme.colors.alabaster,
      opacity: 0.7,
      textAlign: 'center',
    },
    commentsSection: {
      backgroundColor: theme.colors.charcoal,
      paddingVertical: 16,
    },
    commentsSectionTitle: {
      color: theme.colors.alabaster,
      fontSize: 18,
      fontWeight: '600',
      paddingHorizontal: 16,
      marginBottom: 16,
    },
  });

  if (!post) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Body style={styles.emptyText}>Post not found</Body>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <FlatList
          ref={flatListRef}
          data={comments}
          renderItem={renderComment}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={
            <View>
              {renderHeader()}
              <View style={styles.commentsSection}>
                <Body style={styles.commentsSectionTitle}>
                  Comments ({comments.length})
                </Body>
              </View>
            </View>
          }
          ListEmptyComponent={renderEmpty}
          ItemSeparatorComponent={renderSeparator}
          showsVerticalScrollIndicator={false}
          onRefresh={refreshComments}
          refreshing={commentsLoading}
        />

        <CommentInput
          onSubmit={handleCreateComment}
          loading={createComment.loading}
          replyingTo={replyingTo}
          onCancelReply={handleCancelReply}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};
