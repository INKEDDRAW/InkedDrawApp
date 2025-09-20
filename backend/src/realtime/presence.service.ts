/**
 * Presence Service
 * Manages user online/offline status and activity tracking
 */

import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { AnalyticsService } from '../analytics/analytics.service';

export interface UserPresence {
  userId: string;
  isOnline: boolean;
  lastSeen: Date;
  currentActivity?: string;
  metadata?: any;
}

export interface ActivityUpdate {
  userId: string;
  activity: string;
  metadata?: any;
  timestamp: Date;
}

@Injectable()
export class PresenceService {
  private readonly logger = new Logger(PresenceService.name);
  private readonly onlineUsers = new Map<string, UserPresence>();
  private readonly activityTimeouts = new Map<string, NodeJS.Timeout>();

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly analyticsService: AnalyticsService,
  ) {
    // Clean up stale presence data every 5 minutes
    setInterval(() => this.cleanupStalePresence(), 5 * 60 * 1000);
  }

  /**
   * Set user as online
   */
  async setUserOnline(userId: string, metadata?: any): Promise<void> {
    try {
      const presence: UserPresence = {
        userId,
        isOnline: true,
        lastSeen: new Date(),
        currentActivity: 'online',
        metadata,
      };

      // Update in-memory cache
      this.onlineUsers.set(userId, presence);

      // Update database
      await this.databaseService.query(`
        INSERT INTO user_presence (user_id, is_online, last_seen, current_activity, metadata)
        VALUES ($1, true, NOW(), 'online', $2)
        ON CONFLICT (user_id) 
        DO UPDATE SET 
          is_online = true,
          last_seen = NOW(),
          current_activity = 'online',
          metadata = $2
      `, [userId, JSON.stringify(metadata || {})]);

      // Track analytics
      await this.analyticsService.track(userId, 'user_online', {
        metadata,
        timestamp: new Date(),
      });

      this.logger.debug(`User ${userId} is now online`);
    } catch (error) {
      this.logger.error('Error setting user online:', error);
    }
  }

  /**
   * Set user as offline
   */
  async setUserOffline(userId: string): Promise<void> {
    try {
      const presence = this.onlineUsers.get(userId);
      if (presence) {
        presence.isOnline = false;
        presence.lastSeen = new Date();
        presence.currentActivity = 'offline';
      }

      // Update database
      await this.databaseService.query(`
        UPDATE user_presence 
        SET is_online = false, last_seen = NOW(), current_activity = 'offline'
        WHERE user_id = $1
      `, [userId]);

      // Remove from online users cache
      this.onlineUsers.delete(userId);

      // Clear any activity timeouts
      const timeout = this.activityTimeouts.get(userId);
      if (timeout) {
        clearTimeout(timeout);
        this.activityTimeouts.delete(userId);
      }

      // Track analytics
      await this.analyticsService.track(userId, 'user_offline', {
        timestamp: new Date(),
      });

      this.logger.debug(`User ${userId} is now offline`);
    } catch (error) {
      this.logger.error('Error setting user offline:', error);
    }
  }

  /**
   * Update user activity
   */
  async updateUserActivity(userId: string, activity: string, metadata?: any): Promise<void> {
    try {
      const presence = this.onlineUsers.get(userId);
      if (presence) {
        presence.currentActivity = activity;
        presence.lastSeen = new Date();
        presence.metadata = { ...presence.metadata, ...metadata };
      }

      // Update database
      await this.databaseService.query(`
        UPDATE user_presence 
        SET current_activity = $2, last_seen = NOW(), metadata = $3
        WHERE user_id = $1
      `, [userId, activity, JSON.stringify(metadata || {})]);

      // Set timeout to clear activity after 5 minutes of inactivity
      const existingTimeout = this.activityTimeouts.get(userId);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
      }

      const timeout = setTimeout(() => {
        this.clearUserActivity(userId);
      }, 5 * 60 * 1000); // 5 minutes

      this.activityTimeouts.set(userId, timeout);

      // Track specific activities
      if (['viewing_product', 'rating_product', 'creating_post', 'browsing_feed'].includes(activity)) {
        await this.analyticsService.track(userId, 'user_activity', {
          activity,
          metadata,
          timestamp: new Date(),
        });
      }

      this.logger.debug(`User ${userId} activity updated: ${activity}`);
    } catch (error) {
      this.logger.error('Error updating user activity:', error);
    }
  }

  /**
   * Clear user activity (set to idle)
   */
  private async clearUserActivity(userId: string): Promise<void> {
    try {
      const presence = this.onlineUsers.get(userId);
      if (presence && presence.isOnline) {
        presence.currentActivity = 'idle';
        
        await this.databaseService.query(`
          UPDATE user_presence 
          SET current_activity = 'idle'
          WHERE user_id = $1 AND is_online = true
        `, [userId]);
      }

      this.activityTimeouts.delete(userId);
    } catch (error) {
      this.logger.error('Error clearing user activity:', error);
    }
  }

  /**
   * Get user presence
   */
  async getUserPresence(userId: string): Promise<UserPresence | null> {
    try {
      // Check in-memory cache first
      const cachedPresence = this.onlineUsers.get(userId);
      if (cachedPresence) {
        return cachedPresence;
      }

      // Fallback to database
      const result = await this.databaseService.query(`
        SELECT user_id, is_online, last_seen, current_activity, metadata
        FROM user_presence
        WHERE user_id = $1
      `, [userId]);

      if (result.length === 0) return null;

      const row = result[0];
      return {
        userId: row.user_id,
        isOnline: row.is_online,
        lastSeen: new Date(row.last_seen),
        currentActivity: row.current_activity,
        metadata: row.metadata ? JSON.parse(row.metadata) : {},
      };
    } catch (error) {
      this.logger.error('Error getting user presence:', error);
      return null;
    }
  }

  /**
   * Get online friends
   */
  async getOnlineFriends(userId: string): Promise<string[]> {
    try {
      const result = await this.databaseService.query(`
        SELECT f.following_id
        FROM follows f
        JOIN user_presence up ON f.following_id = up.user_id
        WHERE f.follower_id = $1 
          AND up.is_online = true
          AND up.last_seen >= NOW() - INTERVAL '5 minutes'
      `, [userId]);

      return result.map(row => row.following_id);
    } catch (error) {
      this.logger.error('Error getting online friends:', error);
      return [];
    }
  }

  /**
   * Get online users count
   */
  getOnlineUsersCount(): number {
    return this.onlineUsers.size;
  }

  /**
   * Get all online users (for admin purposes)
   */
  async getAllOnlineUsers(): Promise<UserPresence[]> {
    try {
      const result = await this.databaseService.query(`
        SELECT 
          up.user_id,
          up.is_online,
          up.last_seen,
          up.current_activity,
          up.metadata,
          u.display_name,
          u.avatar_url
        FROM user_presence up
        JOIN users u ON up.user_id = u.id
        WHERE up.is_online = true
          AND up.last_seen >= NOW() - INTERVAL '5 minutes'
        ORDER BY up.last_seen DESC
      `);

      return result.map(row => ({
        userId: row.user_id,
        isOnline: row.is_online,
        lastSeen: new Date(row.last_seen),
        currentActivity: row.current_activity,
        metadata: row.metadata ? JSON.parse(row.metadata) : {},
        user: {
          displayName: row.display_name,
          avatarUrl: row.avatar_url,
        },
      }));
    } catch (error) {
      this.logger.error('Error getting all online users:', error);
      return [];
    }
  }

  /**
   * Get user activity history
   */
  async getUserActivityHistory(userId: string, limit: number = 50): Promise<ActivityUpdate[]> {
    try {
      const result = await this.databaseService.query(`
        SELECT activity_type, metadata, created_at
        FROM user_activity_log
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT $2
      `, [userId, limit]);

      return result.map(row => ({
        userId,
        activity: row.activity_type,
        metadata: row.metadata ? JSON.parse(row.metadata) : {},
        timestamp: new Date(row.created_at),
      }));
    } catch (error) {
      this.logger.error('Error getting user activity history:', error);
      return [];
    }
  }

  /**
   * Log user activity
   */
  async logUserActivity(userId: string, activity: string, metadata?: any): Promise<void> {
    try {
      await this.databaseService.insert('user_activity_log', {
        user_id: userId,
        activity_type: activity,
        metadata: JSON.stringify(metadata || {}),
        created_at: new Date(),
      });
    } catch (error) {
      this.logger.error('Error logging user activity:', error);
    }
  }

  /**
   * Get presence statistics
   */
  async getPresenceStatistics(): Promise<any> {
    try {
      const result = await this.databaseService.query(`
        SELECT 
          COUNT(CASE WHEN is_online = true THEN 1 END) as online_count,
          COUNT(CASE WHEN is_online = false THEN 1 END) as offline_count,
          COUNT(CASE WHEN current_activity = 'viewing_product' THEN 1 END) as viewing_products,
          COUNT(CASE WHEN current_activity = 'browsing_feed' THEN 1 END) as browsing_feed,
          COUNT(CASE WHEN current_activity = 'creating_post' THEN 1 END) as creating_posts,
          COUNT(CASE WHEN last_seen >= NOW() - INTERVAL '1 hour' THEN 1 END) as active_last_hour,
          COUNT(CASE WHEN last_seen >= NOW() - INTERVAL '24 hours' THEN 1 END) as active_last_day
        FROM user_presence
      `);

      return result[0] || {};
    } catch (error) {
      this.logger.error('Error getting presence statistics:', error);
      return {};
    }
  }

  /**
   * Clean up stale presence data
   */
  private async cleanupStalePresence(): Promise<void> {
    try {
      // Mark users as offline if they haven't been seen in 10 minutes
      await this.databaseService.query(`
        UPDATE user_presence 
        SET is_online = false, current_activity = 'offline'
        WHERE is_online = true 
          AND last_seen < NOW() - INTERVAL '10 minutes'
      `);

      // Clean up in-memory cache
      const staleUsers: string[] = [];
      this.onlineUsers.forEach((presence, userId) => {
        const timeSinceLastSeen = Date.now() - presence.lastSeen.getTime();
        if (timeSinceLastSeen > 10 * 60 * 1000) { // 10 minutes
          staleUsers.push(userId);
        }
      });

      staleUsers.forEach(userId => {
        this.onlineUsers.delete(userId);
        const timeout = this.activityTimeouts.get(userId);
        if (timeout) {
          clearTimeout(timeout);
          this.activityTimeouts.delete(userId);
        }
      });

      if (staleUsers.length > 0) {
        this.logger.debug(`Cleaned up ${staleUsers.length} stale presence records`);
      }
    } catch (error) {
      this.logger.error('Error cleaning up stale presence:', error);
    }
  }

  /**
   * Check if user is online
   */
  isUserOnline(userId: string): boolean {
    const presence = this.onlineUsers.get(userId);
    return presence?.isOnline || false;
  }

  /**
   * Get user's current activity
   */
  getUserActivity(userId: string): string | null {
    const presence = this.onlineUsers.get(userId);
    return presence?.currentActivity || null;
  }

  /**
   * Bulk update presence for multiple users
   */
  async bulkUpdatePresence(updates: Array<{ userId: string; isOnline: boolean; activity?: string }>): Promise<void> {
    try {
      const values = updates.map((update, index) => {
        const baseIndex = index * 4;
        return `($${baseIndex + 1}, $${baseIndex + 2}, NOW(), $${baseIndex + 3}, $${baseIndex + 4})`;
      }).join(', ');

      const params = updates.flatMap(update => [
        update.userId,
        update.isOnline,
        update.activity || (update.isOnline ? 'online' : 'offline'),
        JSON.stringify({}),
      ]);

      await this.databaseService.query(`
        INSERT INTO user_presence (user_id, is_online, last_seen, current_activity, metadata)
        VALUES ${values}
        ON CONFLICT (user_id) 
        DO UPDATE SET 
          is_online = EXCLUDED.is_online,
          last_seen = EXCLUDED.last_seen,
          current_activity = EXCLUDED.current_activity
      `, params);

      // Update in-memory cache
      updates.forEach(update => {
        if (update.isOnline) {
          this.onlineUsers.set(update.userId, {
            userId: update.userId,
            isOnline: true,
            lastSeen: new Date(),
            currentActivity: update.activity || 'online',
          });
        } else {
          this.onlineUsers.delete(update.userId);
        }
      });
    } catch (error) {
      this.logger.error('Error bulk updating presence:', error);
    }
  }
}
