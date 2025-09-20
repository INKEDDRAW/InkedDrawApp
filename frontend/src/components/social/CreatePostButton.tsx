/**
 * Create Post Button Component
 * Floating action button for creating new posts
 */

import React, { useState } from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  Animated,
  View,
} from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { useOfflineCapability } from '../../contexts/OfflineContext';
import { Body } from '../ui/Typography';
import { CreatePostModal } from './CreatePostModal';

interface CreatePostButtonProps {
  onPostCreated?: () => void;
}

export const CreatePostButton: React.FC<CreatePostButtonProps> = ({
  onPostCreated,
}) => {
  const theme = useTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const [scaleAnim] = useState(new Animated.Value(1));
  const canCreatePosts = useOfflineCapability('create_posts');

  const handlePress = () => {
    if (!canCreatePosts) {
      return;
    }

    // Animate button press
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    setModalVisible(true);
  };

  const handlePostCreated = () => {
    setModalVisible(false);
    onPostCreated?.();
  };

  const styles = StyleSheet.create({
    container: {
      position: 'relative',
    },
    button: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: theme.colors.goldLeaf,
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 8,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.3,
      shadowRadius: 8,
    },
    buttonDisabled: {
      backgroundColor: theme.colors.charcoal,
      opacity: 0.6,
    },
    icon: {
      color: theme.colors.onyx,
      fontSize: 24,
      fontWeight: '600',
    },
    iconDisabled: {
      color: theme.colors.alabaster,
    },
    tooltip: {
      position: 'absolute',
      bottom: 64,
      right: 0,
      backgroundColor: theme.colors.charcoal,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      minWidth: 120,
    },
    tooltipText: {
      color: theme.colors.alabaster,
      fontSize: 12,
      textAlign: 'center',
    },
    tooltipArrow: {
      position: 'absolute',
      bottom: -6,
      right: 20,
      width: 0,
      height: 0,
      borderLeftWidth: 6,
      borderRightWidth: 6,
      borderTopWidth: 6,
      borderLeftColor: 'transparent',
      borderRightColor: 'transparent',
      borderTopColor: theme.colors.charcoal,
    },
  });

  return (
    <View style={styles.container}>
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <TouchableOpacity
          style={[
            styles.button,
            !canCreatePosts && styles.buttonDisabled,
          ]}
          onPress={handlePress}
          disabled={!canCreatePosts}
          activeOpacity={0.8}
        >
          <Body style={[
            styles.icon,
            !canCreatePosts && styles.iconDisabled,
          ]}>
            ✏️
          </Body>
        </TouchableOpacity>
      </Animated.View>

      {!canCreatePosts && (
        <View style={styles.tooltip}>
          <Body style={styles.tooltipText}>
            Requires internet connection
          </Body>
          <View style={styles.tooltipArrow} />
        </View>
      )}

      <CreatePostModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onPostCreated={handlePostCreated}
      />
    </View>
  );
};
