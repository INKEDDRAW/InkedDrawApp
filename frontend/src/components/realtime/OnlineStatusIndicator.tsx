/**
 * Online Status Indicator Component
 * Shows connection status and online user count
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRealtime } from '../../contexts/RealtimeContext';
import { useOffline } from '../../contexts/OfflineContext';
import { colors, typography, spacing } from '../../theme';

interface OnlineStatusIndicatorProps {
  showUserCount?: boolean;
  compact?: boolean;
  onPress?: () => void;
}

export const OnlineStatusIndicator: React.FC<OnlineStatusIndicatorProps> = ({
  showUserCount = false,
  compact = false,
  onPress,
}) => {
  const { isConnected, connectionStatus, onlineUsers } = useRealtime();
  const { isOnline: isNetworkOnline } = useOffline();
  
  const [pulseAnimation] = useState(new Animated.Value(1));
  const [slideAnimation] = useState(new Animated.Value(0));

  // Pulse animation for connecting state
  useEffect(() => {
    if (connectionStatus === 'connecting') {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnimation, {
            toValue: 0.6,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnimation, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      pulseAnimation.setValue(1);
    }
  }, [connectionStatus, pulseAnimation]);

  // Slide animation for status changes
  useEffect(() => {
    Animated.timing(slideAnimation, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [connectionStatus, slideAnimation]);

  const getStatusConfig = () => {
    if (!isNetworkOnline) {
      return {
        icon: 'cloud-offline',
        color: colors.textSecondary,
        text: 'Offline',
        description: 'No internet connection',
      };
    }

    switch (connectionStatus) {
      case 'connected':
        return {
          icon: 'cloud-done',
          color: colors.success,
          text: 'Online',
          description: 'Connected to live updates',
        };
      case 'connecting':
        return {
          icon: 'cloud-upload',
          color: colors.warning,
          text: 'Connecting',
          description: 'Establishing connection...',
        };
      case 'error':
        return {
          icon: 'cloud-offline',
          color: colors.error,
          text: 'Connection Error',
          description: 'Failed to connect',
        };
      default:
        return {
          icon: 'cloud-offline',
          color: colors.textSecondary,
          text: 'Disconnected',
          description: 'Not connected to live updates',
        };
    }
  };

  const statusConfig = getStatusConfig();

  if (compact) {
    return (
      <TouchableOpacity
        style={[styles.compactContainer, onPress && styles.pressable]}
        onPress={onPress}
        disabled={!onPress}
      >
        <Animated.View
          style={[
            styles.statusDot,
            { backgroundColor: statusConfig.color },
            connectionStatus === 'connecting' && {
              opacity: pulseAnimation,
            },
          ]}
        />
        {showUserCount && onlineUsers.length > 0 && (
          <Text style={styles.userCountCompact}>
            {onlineUsers.length}
          </Text>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.container, onPress && styles.pressable]}
      onPress={onPress}
      disabled={!onPress}
    >
      <Animated.View
        style={[
          styles.content,
          {
            opacity: slideAnimation,
            transform: [
              {
                translateX: slideAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-20, 0],
                }),
              },
            ],
          },
        ]}
      >
        <Animated.View
          style={[
            styles.iconContainer,
            connectionStatus === 'connecting' && {
              opacity: pulseAnimation,
            },
          ]}
        >
          <Ionicons
            name={statusConfig.icon}
            size={16}
            color={statusConfig.color}
          />
        </Animated.View>

        <View style={styles.textContainer}>
          <Text style={[styles.statusText, { color: statusConfig.color }]}>
            {statusConfig.text}
          </Text>
          <Text style={styles.descriptionText}>
            {statusConfig.description}
          </Text>
        </View>

        {showUserCount && isConnected && (
          <View style={styles.userCountContainer}>
            <Ionicons
              name="people"
              size={14}
              color={colors.textSecondary}
            />
            <Text style={styles.userCountText}>
              {onlineUsers.length}
            </Text>
          </View>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: spacing.sm,
    marginVertical: spacing.xs,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  pressable: {
    opacity: 0.8,
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.xs,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    marginRight: spacing.xs,
  },
  textContainer: {
    flex: 1,
  },
  statusText: {
    ...typography.body2,
    fontWeight: '600',
    marginBottom: 1,
  },
  descriptionText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.xs,
  },
  userCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: 12,
  },
  userCountText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginLeft: 2,
    fontWeight: '600',
  },
  userCountCompact: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
    fontSize: 10,
  },
});

// Hook for using status indicator in other components
export const useConnectionStatus = () => {
  const { isConnected, connectionStatus } = useRealtime();
  const { isOnline } = useOffline();

  return {
    isFullyOnline: isOnline && isConnected,
    isNetworkOnline: isOnline,
    isRealtimeConnected: isConnected,
    connectionStatus,
    statusText: !isOnline ? 'Offline' : 
                connectionStatus === 'connected' ? 'Online' :
                connectionStatus === 'connecting' ? 'Connecting' :
                connectionStatus === 'error' ? 'Connection Error' :
                'Disconnected',
  };
};
