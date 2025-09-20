/**
 * Notification Bell Component
 * Shows notification count and dropdown with recent notifications
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Modal,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRealtime } from '../../contexts/RealtimeContext';
import { colors, typography, spacing } from '../../theme';

interface NotificationBellProps {
  onNotificationPress?: (notification: any) => void;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({
  onNotificationPress,
}) => {
  const { notifications, unreadCount, markNotificationsRead } = useRealtime();
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const [dropdownAnimation] = useState(new Animated.Value(0));

  const toggleDropdown = () => {
    if (isDropdownVisible) {
      Animated.timing(dropdownAnimation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => setIsDropdownVisible(false));
    } else {
      setIsDropdownVisible(true);
      Animated.timing(dropdownAnimation, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  };

  const handleNotificationPress = (notification: any) => {
    // Mark as read if unread
    if (!notification.isRead) {
      markNotificationsRead([notification.id]);
    }

    // Close dropdown
    toggleDropdown();

    // Call external handler
    onNotificationPress?.(notification);
  };

  const markAllAsRead = () => {
    const unreadIds = notifications
      .filter(n => !n.isRead)
      .map(n => n.id);
    
    if (unreadIds.length > 0) {
      markNotificationsRead(unreadIds);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'post': return 'document-text';
      case 'comment': return 'chatbubble';
      case 'like': return 'heart';
      case 'follow': return 'person-add';
      case 'message': return 'mail';
      case 'recommendation': return 'bulb';
      case 'system': return 'information-circle';
      default: return 'notifications';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return colors.error;
      case 'high': return colors.warning;
      case 'normal': return colors.primary;
      case 'low': return colors.textSecondary;
      default: return colors.primary;
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

  const renderNotificationItem = ({ item: notification }: { item: any }) => (
    <TouchableOpacity
      style={[
        styles.notificationItem,
        !notification.isRead && styles.unreadNotification,
      ]}
      onPress={() => handleNotificationPress(notification)}
    >
      <View style={styles.notificationIcon}>
        <Ionicons
          name={getNotificationIcon(notification.type)}
          size={20}
          color={getPriorityColor(notification.priority)}
        />
      </View>
      
      <View style={styles.notificationContent}>
        <Text style={[
          styles.notificationTitle,
          !notification.isRead && styles.unreadText,
        ]}>
          {notification.title}
        </Text>
        <Text style={styles.notificationMessage} numberOfLines={2}>
          {notification.message}
        </Text>
        <Text style={styles.notificationTime}>
          {formatTimeAgo(notification.createdAt)}
        </Text>
      </View>

      {!notification.isRead && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  return (
    <>
      <TouchableOpacity style={styles.bellContainer} onPress={toggleDropdown}>
        <Ionicons
          name={unreadCount > 0 ? 'notifications' : 'notifications-outline'}
          size={24}
          color={colors.text}
        />
        {unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {unreadCount > 99 ? '99+' : unreadCount.toString()}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      <Modal
        visible={isDropdownVisible}
        transparent
        animationType="none"
        onRequestClose={toggleDropdown}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={toggleDropdown}
        >
          <Animated.View
            style={[
              styles.dropdown,
              {
                opacity: dropdownAnimation,
                transform: [
                  {
                    translateY: dropdownAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-20, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={styles.dropdownHeader}>
              <Text style={styles.dropdownTitle}>Notifications</Text>
              {unreadCount > 0 && (
                <TouchableOpacity onPress={markAllAsRead}>
                  <Text style={styles.markAllReadText}>Mark all read</Text>
                </TouchableOpacity>
              )}
            </View>

            {notifications.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons
                  name="notifications-off-outline"
                  size={48}
                  color={colors.textSecondary}
                />
                <Text style={styles.emptyStateText}>No notifications yet</Text>
              </View>
            ) : (
              <FlatList
                data={notifications.slice(0, 10)} // Show only recent 10
                renderItem={renderNotificationItem}
                keyExtractor={(item) => item.id}
                style={styles.notificationsList}
                showsVerticalScrollIndicator={false}
              />
            )}

            <TouchableOpacity
              style={styles.viewAllButton}
              onPress={() => {
                toggleDropdown();
                // Navigate to full notifications screen
              }}
            >
              <Text style={styles.viewAllText}>View All Notifications</Text>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const { width: screenWidth } = Dimensions.get('window');

const styles = StyleSheet.create({
  bellContainer: {
    position: 'relative',
    padding: spacing.sm,
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: colors.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: 'bold',
    fontSize: 10,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 60,
    paddingRight: spacing.md,
  },
  dropdown: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    width: Math.min(screenWidth - 32, 360),
    maxHeight: 500,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  dropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dropdownTitle: {
    ...typography.h3,
    color: colors.text,
  },
  markAllReadText: {
    ...typography.body2,
    color: colors.primary,
    fontWeight: '600',
  },
  notificationsList: {
    maxHeight: 300,
  },
  notificationItem: {
    flexDirection: 'row',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    alignItems: 'flex-start',
  },
  unreadNotification: {
    backgroundColor: colors.primaryLight + '10',
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    ...typography.body1,
    color: colors.text,
    marginBottom: 2,
  },
  unreadText: {
    fontWeight: '600',
  },
  notificationMessage: {
    ...typography.body2,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  notificationTime: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginLeft: spacing.xs,
    marginTop: 6,
  },
  emptyState: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyStateText: {
    ...typography.body1,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  viewAllButton: {
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    alignItems: 'center',
  },
  viewAllText: {
    ...typography.body1,
    color: colors.primary,
    fontWeight: '600',
  },
});
