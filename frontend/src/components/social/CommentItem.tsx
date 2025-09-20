/**
 * Comment Item Component
 * Individual comment display with reply and like functionality
 */

import React, { useCallback } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { useAuth } from '../../contexts/AuthContext';
import { useLikeComment } from '../../hooks/useOfflineMutation';
import { Body, Caption } from '../ui/Typography';
import Comment from '../../database/models/Comment';

interface CommentItemProps {
  comment: Comment;
  onReply?: () => void;
  onLike?: () => void;
  level?: number; // For nested replies
}

export const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  onReply,
  onLike,
  level = 0,
}) => {
  const theme = useTheme();
  const { user } = useAuth();
  const likeComment = useLikeComment();

  const handleLike = useCallback(async () => {
    if (!user) return;

    try {
      await likeComment.mutate({
        commentId: comment.id,
        isLiked: !comment.isLikedByUser,
      });
      onLike?.();
    } catch (error) {
      console.error('Error liking comment:', error);
      Alert.alert('Error', 'Failed to like comment. Please try again.');
    }
  }, [comment.id, comment.isLikedByUser, user, likeComment, onLike]);

  const handleReply = useCallback(() => {
    onReply?.();
  }, [onReply]);

  const styles = StyleSheet.create({
    container: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      marginLeft: level * 24, // Indent nested replies
      backgroundColor: level > 0 ? theme.colors.charcoal : 'transparent',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    avatar: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.colors.goldLeaf,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    avatarText: {
      color: theme.colors.onyx,
      fontWeight: '600',
      fontSize: 14,
    },
    userInfo: {
      flex: 1,
    },
    username: {
      color: theme.colors.alabaster,
      fontWeight: '600',
      fontSize: 14,
    },
    timeAndSync: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 2,
    },
    timeText: {
      color: theme.colors.alabaster,
      opacity: 0.7,
      fontSize: 12,
    },
    syncIndicator: {
      width: 6,
      height: 6,
      borderRadius: 3,
      marginLeft: 6,
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
      fontSize: 15,
      lineHeight: 20,
      marginBottom: 8,
    },
    actions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 4,
      paddingHorizontal: 8,
      borderRadius: 6,
    },
    actionButtonActive: {
      backgroundColor: theme.colors.onyx,
    },
    actionIcon: {
      fontSize: 14,
      marginRight: 4,
    },
    actionText: {
      color: theme.colors.alabaster,
      fontSize: 12,
      fontWeight: '500',
    },
    actionTextActive: {
      color: theme.colors.goldLeaf,
    },
    replyIndicator: {
      position: 'absolute',
      left: 8,
      top: 0,
      bottom: 0,
      width: 2,
      backgroundColor: theme.colors.goldLeaf,
      opacity: 0.3,
    },
  });

  return (
    <View style={styles.container}>
      {level > 0 && <View style={styles.replyIndicator} />}
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Body style={styles.avatarText}>
            {comment.user?.displayName?.charAt(0) || 'U'}
          </Body>
        </View>
        <View style={styles.userInfo}>
          <Body style={styles.username}>
            {comment.user?.displayName || 'Unknown User'}
          </Body>
          <View style={styles.timeAndSync}>
            <Caption style={styles.timeText}>{comment.timeAgo}</Caption>
            <View style={[
              styles.syncIndicator,
              comment.isOnline ? styles.synced : 
              comment.needsSync ? styles.pending : styles.conflict
            ]} />
          </View>
        </View>
      </View>

      {/* Content */}
      <Body style={styles.content}>{comment.content}</Body>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[
            styles.actionButton,
            comment.isLikedByUser && styles.actionButtonActive
          ]}
          onPress={handleLike}
          disabled={likeComment.loading}
        >
          <Body style={[
            styles.actionIcon,
            comment.isLikedByUser && styles.actionTextActive
          ]}>
            {comment.isLikedByUser ? '❤️' : '🤍'}
          </Body>
          <Caption style={[
            styles.actionText,
            comment.isLikedByUser && styles.actionTextActive
          ]}>
            {comment.likeCount}
          </Caption>
        </TouchableOpacity>

        {level < 2 && ( // Limit reply nesting to 2 levels
          <TouchableOpacity style={styles.actionButton} onPress={handleReply}>
            <Body style={styles.actionIcon}>💬</Body>
            <Caption style={styles.actionText}>Reply</Caption>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};
