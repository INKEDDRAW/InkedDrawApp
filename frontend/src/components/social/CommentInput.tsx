/**
 * Comment Input Component
 * Input field for creating comments and replies
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { useAuth } from '../../contexts/AuthContext';
import { useOfflineCapability } from '../../contexts/OfflineContext';
import { Body, Caption } from '../ui/Typography';
import Comment from '../../database/models/Comment';

interface CommentInputProps {
  onSubmit: (content: string) => Promise<void>;
  loading?: boolean;
  replyingTo?: Comment | null;
  onCancelReply?: () => void;
  placeholder?: string;
}

export const CommentInput: React.FC<CommentInputProps> = ({
  onSubmit,
  loading = false,
  replyingTo,
  onCancelReply,
  placeholder = "Add a comment...",
}) => {
  const theme = useTheme();
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const canComment = useOfflineCapability('comment_posts');

  // Animate reply indicator
  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: replyingTo ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [replyingTo, slideAnim]);

  // Focus input when replying
  useEffect(() => {
    if (replyingTo) {
      inputRef.current?.focus();
    }
  }, [replyingTo]);

  const handleSubmit = useCallback(async () => {
    if (!content.trim() || loading || !canComment) return;

    try {
      await onSubmit(content.trim());
      setContent('');
      inputRef.current?.blur();
    } catch (error) {
      // Error handling is done in parent component
    }
  }, [content, loading, canComment, onSubmit]);

  const handleCancelReply = useCallback(() => {
    onCancelReply?.();
    inputRef.current?.blur();
  }, [onCancelReply]);

  const styles = StyleSheet.create({
    container: {
      backgroundColor: theme.colors.charcoal,
      borderTopWidth: 1,
      borderTopColor: theme.colors.onyx,
    },
    replyIndicator: {
      backgroundColor: theme.colors.onyx,
      paddingHorizontal: 16,
      paddingVertical: 8,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    replyText: {
      color: theme.colors.alabaster,
      fontSize: 14,
    },
    replyUsername: {
      color: theme.colors.goldLeaf,
      fontWeight: '600',
    },
    cancelReplyButton: {
      padding: 4,
    },
    cancelReplyText: {
      color: theme.colors.alabaster,
      fontSize: 16,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      paddingHorizontal: 16,
      paddingVertical: 12,
      gap: 12,
    },
    avatar: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.colors.goldLeaf,
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarText: {
      color: theme.colors.onyx,
      fontWeight: '600',
      fontSize: 14,
    },
    inputWrapper: {
      flex: 1,
      backgroundColor: theme.colors.onyx,
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 8,
      minHeight: 36,
      maxHeight: 100,
      justifyContent: 'center',
    },
    inputWrapperFocused: {
      borderWidth: 1,
      borderColor: theme.colors.goldLeaf,
    },
    inputWrapperDisabled: {
      opacity: 0.6,
    },
    input: {
      color: theme.colors.alabaster,
      fontSize: 15,
      lineHeight: 20,
      textAlignVertical: 'center',
    },
    sendButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.colors.goldLeaf,
      justifyContent: 'center',
      alignItems: 'center',
    },
    sendButtonDisabled: {
      backgroundColor: theme.colors.charcoal,
      opacity: 0.6,
    },
    sendButtonText: {
      color: theme.colors.onyx,
      fontSize: 16,
      fontWeight: '600',
    },
    sendButtonTextDisabled: {
      color: theme.colors.alabaster,
    },
    offlineIndicator: {
      backgroundColor: theme.colors.onyx,
      paddingHorizontal: 16,
      paddingVertical: 8,
      alignItems: 'center',
    },
    offlineText: {
      color: theme.colors.alabaster,
      opacity: 0.7,
      fontSize: 12,
    },
  });

  if (!user) {
    return (
      <View style={styles.offlineIndicator}>
        <Caption style={styles.offlineText}>
          Sign in to join the conversation
        </Caption>
      </View>
    );
  }

  if (!canComment) {
    return (
      <View style={styles.offlineIndicator}>
        <Caption style={styles.offlineText}>
          Comments require an internet connection
        </Caption>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Reply Indicator */}
      <Animated.View
        style={{
          height: slideAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 40],
          }),
          opacity: slideAnim,
        }}
      >
        {replyingTo && (
          <View style={styles.replyIndicator}>
            <Body style={styles.replyText}>
              Replying to{' '}
              <Body style={styles.replyUsername}>
                {replyingTo.user?.displayName || 'Unknown User'}
              </Body>
            </Body>
            <TouchableOpacity
              style={styles.cancelReplyButton}
              onPress={handleCancelReply}
            >
              <Body style={styles.cancelReplyText}>×</Body>
            </TouchableOpacity>
          </View>
        )}
      </Animated.View>

      {/* Input Container */}
      <View style={styles.inputContainer}>
        <View style={styles.avatar}>
          <Body style={styles.avatarText}>
            {user.displayName?.charAt(0) || 'U'}
          </Body>
        </View>

        <View style={[
          styles.inputWrapper,
          focused && styles.inputWrapperFocused,
          loading && styles.inputWrapperDisabled,
        ]}>
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder={replyingTo ? `Reply to ${replyingTo.user?.displayName}...` : placeholder}
            placeholderTextColor={theme.colors.alabaster + '60'}
            value={content}
            onChangeText={setContent}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            multiline
            maxLength={500}
            editable={!loading}
            returnKeyType="send"
            onSubmitEditing={handleSubmit}
            blurOnSubmit={false}
          />
        </View>

        <TouchableOpacity
          style={[
            styles.sendButton,
            (!content.trim() || loading) && styles.sendButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={!content.trim() || loading}
        >
          <Body style={[
            styles.sendButtonText,
            (!content.trim() || loading) && styles.sendButtonTextDisabled,
          ]}>
            {loading ? '⏳' : '➤'}
          </Body>
        </TouchableOpacity>
      </View>
    </View>
  );
};
