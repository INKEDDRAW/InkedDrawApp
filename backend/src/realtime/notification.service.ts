/**
 * Notification Service
 * Handles push notifications and real-time alerts
 */

import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { AnalyticsService } from '../analytics/analytics.service';

export interface NotificationData {
  id?: string;
  userId: string;
  type: 'post' | 'comment' | 'like' | 'follow' | 'message' | 'recommendation' | 'system';
  title: string;
  message: string;
  data?: any;
  imageUrl?: string;
  actionUrl?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  scheduledFor?: Date;
  expiresAt?: Date;
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  image?: string;
  badge?: number;
  data?: any;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly analyticsService: AnalyticsService,
  ) {}

  /**
   * Create and send a notification
   */
  async createNotification(notificationData: NotificationData): Promise<any> {
    try {
      // Save notification to database
      const notification = await this.databaseService.insert('notifications', {
        user_id: notificationData.userId,
        type: notificationData.type,
        title: notificationData.title,
        message: notificationData.message,
        data: notificationData.data ? JSON.stringify(notificationData.data) : null,
        image_url: notificationData.imageUrl,
        action_url: notificationData.actionUrl,
        priority: notificationData.priority,
        scheduled_for: notificationData.scheduledFor || new Date(),
        expires_at: notificationData.expiresAt,
        is_read: false,
        created_at: new Date(),
      });

      // Send push notification if user has enabled them
      await this.sendPushNotification(notificationData.userId, {
        title: notificationData.title,
        body: notificationData.message,
        icon: '/icons/icon-192x192.png',
        image: notificationData.imageUrl,
        data: {
          notificationId: notification.id,
          type: notificationData.type,
          actionUrl: notificationData.actionUrl,
          ...notificationData.data,
        },
      });

      // Track notification analytics
      await this.analyticsService.track(notificationData.userId, 'notification_sent', {
        notification_id: notification.id,
        type: notificationData.type,
        priority: notificationData.priority,
      });

      return notification;
    } catch (error) {
      this.logger.error('Error creating notification:', error);
      throw error;
    }
  }

  /**
   * Send push notification to user's devices
   */
  async sendPushNotification(userId: string, payload: PushNotificationPayload): Promise<void> {
    try {
      // Get user's push subscriptions
      const subscriptions = await this.getUserPushSubscriptions(userId);
      
      if (subscriptions.length === 0) {
        this.logger.debug(`No push subscriptions found for user ${userId}`);
        return;
      }

      // Check user's notification preferences
      const preferences = await this.getUserNotificationPreferences(userId);
      if (!preferences.pushEnabled) {
        this.logger.debug(`Push notifications disabled for user ${userId}`);
        return;
      }

      // Send to each subscription
      const sendPromises = subscriptions.map(subscription => 
        this.sendToSubscription(subscription, payload)
      );

      await Promise.allSettled(sendPromises);
    } catch (error) {
      this.logger.error('Error sending push notification:', error);
    }
  }

  /**
   * Send notification for new post
   */
  async sendPostNotifications(post: any): Promise<void> {
    try {
      // Get followers of the post author
      const followers = await this.getFollowers(post.userId);
      
      const notifications = followers.map(followerId => ({
        userId: followerId,
        type: 'post' as const,
        title: `${post.user?.displayName || 'Someone'} shared a new post`,
        message: post.content?.substring(0, 100) || 'Check out this new post!',
        data: {
          postId: post.id,
          authorId: post.userId,
          authorName: post.user?.displayName,
        },
        imageUrl: post.images?.[0]?.url,
        actionUrl: `/posts/${post.id}`,
        priority: 'normal' as const,
      }));

      // Send notifications in batches
      await this.sendBatchNotifications(notifications);
    } catch (error) {
      this.logger.error('Error sending post notifications:', error);
    }
  }

  /**
   * Send notification for new comment
   */
  async sendCommentNotification(comment: any): Promise<void> {
    try {
      // Notify post author (if not the commenter)
      if (comment.userId !== comment.post?.userId) {
        await this.createNotification({
          userId: comment.post.userId,
          type: 'comment',
          title: `${comment.user?.displayName || 'Someone'} commented on your post`,
          message: comment.content?.substring(0, 100) || 'New comment on your post',
          data: {
            commentId: comment.id,
            postId: comment.postId,
            commenterId: comment.userId,
            commenterName: comment.user?.displayName,
          },
          actionUrl: `/posts/${comment.postId}#comment-${comment.id}`,
          priority: 'normal',
        });
      }

      // Notify other commenters (excluding the new commenter and post author)
      const otherCommenters = await this.getOtherCommenters(comment.postId, [
        comment.userId,
        comment.post?.userId,
      ]);

      const notifications = otherCommenters.map(commenterId => ({
        userId: commenterId,
        type: 'comment' as const,
        title: `${comment.user?.displayName || 'Someone'} also commented`,
        message: comment.content?.substring(0, 100) || 'New comment on a post you commented on',
        data: {
          commentId: comment.id,
          postId: comment.postId,
          commenterId: comment.userId,
          commenterName: comment.user?.displayName,
        },
        actionUrl: `/posts/${comment.postId}#comment-${comment.id}`,
        priority: 'low' as const,
      }));

      await this.sendBatchNotifications(notifications);
    } catch (error) {
      this.logger.error('Error sending comment notification:', error);
    }
  }

  /**
   * Send notification for new like
   */
  async sendLikeNotification(like: any): Promise<void> {
    try {
      // Don't notify if user liked their own content
      if (like.userId === like.targetUserId) return;

      await this.createNotification({
        userId: like.targetUserId,
        type: 'like',
        title: `${like.user?.displayName || 'Someone'} liked your ${like.targetType}`,
        message: like.targetType === 'post' ? 'Your post got a new like!' : 'Your comment got a new like!',
        data: {
          likeId: like.id,
          likerId: like.userId,
          likerName: like.user?.displayName,
          targetId: like.targetId,
          targetType: like.targetType,
        },
        actionUrl: like.targetType === 'post' ? `/posts/${like.targetId}` : `/posts/${like.postId}#comment-${like.targetId}`,
        priority: 'low',
      });
    } catch (error) {
      this.logger.error('Error sending like notification:', error);
    }
  }

  /**
   * Send notification for new follow
   */
  async sendFollowNotification(follow: any): Promise<void> {
    try {
      await this.createNotification({
        userId: follow.followingId,
        type: 'follow',
        title: `${follow.follower?.displayName || 'Someone'} started following you`,
        message: 'You have a new follower!',
        data: {
          followId: follow.id,
          followerId: follow.followerId,
          followerName: follow.follower?.displayName,
        },
        imageUrl: follow.follower?.avatarUrl,
        actionUrl: `/users/${follow.followerId}`,
        priority: 'normal',
      });
    } catch (error) {
      this.logger.error('Error sending follow notification:', error);
    }
  }

  /**
   * Send chat notifications to offline users
   */
  async sendChatNotifications(roomId: string, message: any, senderId: string): Promise<void> {
    try {
      // Get room participants (excluding sender)
      const participants = await this.getChatRoomParticipants(roomId, senderId);
      
      // Filter to offline users only
      const offlineParticipants = await this.filterOfflineUsers(participants);
      
      const notifications = offlineParticipants.map(userId => ({
        userId,
        type: 'message' as const,
        title: `${message.user?.displayName || 'Someone'} sent you a message`,
        message: message.content?.substring(0, 100) || 'New message',
        data: {
          messageId: message.id,
          roomId,
          senderId,
          senderName: message.user?.displayName,
        },
        actionUrl: `/chat/${roomId}`,
        priority: 'high' as const,
      }));

      await this.sendBatchNotifications(notifications);
    } catch (error) {
      this.logger.error('Error sending chat notifications:', error);
    }
  }

  /**
   * Send recommendation notifications
   */
  async sendRecommendationNotification(userId: string, recommendations: any[]): Promise<void> {
    try {
      if (recommendations.length === 0) return;

      const topRec = recommendations[0];
      
      await this.createNotification({
        userId,
        type: 'recommendation',
        title: 'New recommendations for you!',
        message: `We found ${recommendations.length} products you might love, including ${topRec.product?.name}`,
        data: {
          recommendationCount: recommendations.length,
          topRecommendation: topRec,
        },
        imageUrl: topRec.product?.imageUrl,
        actionUrl: '/recommendations',
        priority: 'low',
      });
    } catch (error) {
      this.logger.error('Error sending recommendation notification:', error);
    }
  }

  /**
   * Get unread notifications for user
   */
  async getUnreadNotifications(userId: string, limit: number = 50): Promise<any[]> {
    try {
      const query = `
        SELECT 
          n.*,
          EXTRACT(EPOCH FROM (NOW() - n.created_at)) as seconds_ago
        FROM notifications n
        WHERE n.user_id = $1 
          AND n.is_read = false
          AND (n.expires_at IS NULL OR n.expires_at > NOW())
        ORDER BY n.created_at DESC
        LIMIT $2
      `;

      const notifications = await this.databaseService.query(query, [userId, limit]);
      
      return notifications.map(notification => ({
        ...notification,
        data: notification.data ? JSON.parse(notification.data) : null,
        timeAgo: this.formatTimeAgo(notification.seconds_ago),
      }));
    } catch (error) {
      this.logger.error('Error getting unread notifications:', error);
      return [];
    }
  }

  /**
   * Mark notifications as read
   */
  async markNotificationsRead(userId: string, notificationIds: string[]): Promise<void> {
    try {
      await this.databaseService.query(`
        UPDATE notifications 
        SET is_read = true, read_at = NOW()
        WHERE user_id = $1 AND id = ANY($2)
      `, [userId, notificationIds]);

      // Track analytics
      await this.analyticsService.track(userId, 'notifications_read', {
        count: notificationIds.length,
        notification_ids: notificationIds,
      });
    } catch (error) {
      this.logger.error('Error marking notifications as read:', error);
      throw error;
    }
  }

  /**
   * Get user's notification preferences
   */
  async getUserNotificationPreferences(userId: string): Promise<any> {
    try {
      const result = await this.databaseService.query(`
        SELECT notification_preferences 
        FROM user_profiles 
        WHERE user_id = $1
      `, [userId]);

      const preferences = result[0]?.notification_preferences || {};
      
      // Default preferences
      return {
        pushEnabled: true,
        emailEnabled: true,
        posts: true,
        comments: true,
        likes: true,
        follows: true,
        messages: true,
        recommendations: true,
        ...preferences,
      };
    } catch (error) {
      this.logger.error('Error getting notification preferences:', error);
      return { pushEnabled: true, emailEnabled: true };
    }
  }

  /**
   * Update user's notification preferences
   */
  async updateNotificationPreferences(userId: string, preferences: any): Promise<void> {
    try {
      await this.databaseService.query(`
        UPDATE user_profiles 
        SET notification_preferences = $2
        WHERE user_id = $1
      `, [userId, JSON.stringify(preferences)]);
    } catch (error) {
      this.logger.error('Error updating notification preferences:', error);
      throw error;
    }
  }

  /**
   * Send batch notifications efficiently
   */
  private async sendBatchNotifications(notifications: NotificationData[]): Promise<void> {
    const batchSize = 10;
    
    for (let i = 0; i < notifications.length; i += batchSize) {
      const batch = notifications.slice(i, i + batchSize);
      const promises = batch.map(notification => this.createNotification(notification));
      
      await Promise.allSettled(promises);
      
      // Small delay between batches to avoid overwhelming the system
      if (i + batchSize < notifications.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
  }

  /**
   * Helper methods
   */
  private async getUserPushSubscriptions(userId: string): Promise<any[]> {
    const result = await this.databaseService.query(`
      SELECT subscription_data 
      FROM push_subscriptions 
      WHERE user_id = $1 AND is_active = true
    `, [userId]);

    return result.map(row => JSON.parse(row.subscription_data));
  }

  private async sendToSubscription(subscription: any, payload: PushNotificationPayload): Promise<void> {
    // This would integrate with a push notification service like Firebase FCM
    // For now, we'll just log it
    this.logger.debug('Sending push notification:', { subscription: subscription.endpoint, payload });
  }

  private async getFollowers(userId: string): Promise<string[]> {
    const result = await this.databaseService.query(`
      SELECT follower_id FROM follows WHERE following_id = $1
    `, [userId]);

    return result.map(row => row.follower_id);
  }

  private async getOtherCommenters(postId: string, excludeUserIds: string[]): Promise<string[]> {
    const result = await this.databaseService.query(`
      SELECT DISTINCT user_id 
      FROM comments 
      WHERE post_id = $1 AND user_id != ALL($2)
    `, [postId, excludeUserIds]);

    return result.map(row => row.user_id);
  }

  private async getChatRoomParticipants(roomId: string, excludeUserId: string): Promise<string[]> {
    const result = await this.databaseService.query(`
      SELECT user_id 
      FROM chat_participants 
      WHERE room_id = $1 AND user_id != $2
    `, [roomId, excludeUserId]);

    return result.map(row => row.user_id);
  }

  private async filterOfflineUsers(userIds: string[]): Promise<string[]> {
    // This would check against the presence service
    // For now, return all users (they'll get notifications if offline)
    return userIds;
  }

  private formatTimeAgo(seconds: number): string {
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  }
}
