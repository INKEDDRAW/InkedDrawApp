/**
 * Social Service
 * Main service for social features coordination
 */

import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { AnalyticsService } from '../analytics/analytics.service';

export interface SocialStats {
  totalPosts: number;
  totalComments: number;
  totalLikes: number;
  totalFollows: number;
  activeUsers: number;
  engagementRate: number;
}

export interface UserSocialProfile {
  userId: string;
  postsCount: number;
  followersCount: number;
  followingCount: number;
  likesReceived: number;
  commentsReceived: number;
  engagementScore: number;
}

@Injectable()
export class SocialService {
  private readonly logger = new Logger(SocialService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly analyticsService: AnalyticsService,
  ) {}

  /**
   * Get overall social platform statistics
   */
  async getSocialStats(): Promise<SocialStats> {
    try {
      const [
        totalPosts,
        totalComments,
        totalLikes,
        totalFollows,
        activeUsers,
      ] = await Promise.all([
        this.databaseService.count('posts'),
        this.databaseService.count('comments'),
        this.databaseService.count('post_likes'),
        this.databaseService.count('user_follows'),
        this.databaseService.count('users', { is_active: true }),
      ]);

      const engagementRate = totalPosts > 0 
        ? ((totalComments + totalLikes) / totalPosts) * 100 
        : 0;

      return {
        totalPosts,
        totalComments,
        totalLikes,
        totalFollows,
        activeUsers,
        engagementRate: Math.round(engagementRate * 100) / 100,
      };
    } catch (error) {
      this.logger.error('Error getting social stats:', error);
      throw error;
    }
  }

  /**
   * Get user's social profile statistics
   */
  async getUserSocialProfile(userId: string): Promise<UserSocialProfile> {
    try {
      const [
        postsCount,
        followersCount,
        followingCount,
        likesReceived,
        commentsReceived,
      ] = await Promise.all([
        this.databaseService.count('posts', { user_id: userId }),
        this.databaseService.count('user_follows', { following_id: userId }),
        this.databaseService.count('user_follows', { follower_id: userId }),
        this.databaseService.query(`
          SELECT COUNT(*) as count 
          FROM post_likes pl 
          JOIN posts p ON pl.post_id = p.id 
          WHERE p.user_id = $1
        `, [userId]).then(result => parseInt(result[0]?.count || '0')),
        this.databaseService.query(`
          SELECT COUNT(*) as count 
          FROM comments c 
          JOIN posts p ON c.post_id = p.id 
          WHERE p.user_id = $1
        `, [userId]).then(result => parseInt(result[0]?.count || '0')),
      ]);

      // Calculate engagement score (weighted formula)
      const engagementScore = this.calculateEngagementScore({
        postsCount,
        followersCount,
        likesReceived,
        commentsReceived,
      });

      return {
        userId,
        postsCount,
        followersCount,
        followingCount,
        likesReceived,
        commentsReceived,
        engagementScore,
      };
    } catch (error) {
      this.logger.error(`Error getting user social profile for ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get trending posts based on engagement
   */
  async getTrendingPosts(limit: number = 20): Promise<any[]> {
    try {
      const query = `
        SELECT 
          p.*,
          u.username,
          u.display_name,
          u.avatar_url,
          COUNT(DISTINCT pl.id) as like_count,
          COUNT(DISTINCT c.id) as comment_count,
          (COUNT(DISTINCT pl.id) * 1.0 + COUNT(DISTINCT c.id) * 2.0) as engagement_score
        FROM posts p
        LEFT JOIN users u ON p.user_id = u.id
        LEFT JOIN post_likes pl ON p.id = pl.post_id
        LEFT JOIN comments c ON p.id = c.post_id
        WHERE p.created_at >= NOW() - INTERVAL '7 days'
          AND p.visibility = 'public'
        GROUP BY p.id, u.id
        ORDER BY engagement_score DESC, p.created_at DESC
        LIMIT $1
      `;

      return await this.databaseService.query(query, [limit]);
    } catch (error) {
      this.logger.error('Error getting trending posts:', error);
      throw error;
    }
  }

  /**
   * Get user's personalized feed
   */
  async getPersonalizedFeed(userId: string, limit: number = 20, offset: number = 0): Promise<any[]> {
    try {
      const query = `
        SELECT DISTINCT
          p.*,
          u.username,
          u.display_name,
          u.avatar_url,
          COUNT(DISTINCT pl.id) as like_count,
          COUNT(DISTINCT c.id) as comment_count,
          EXISTS(SELECT 1 FROM post_likes WHERE post_id = p.id AND user_id = $1) as is_liked_by_user
        FROM posts p
        LEFT JOIN users u ON p.user_id = u.id
        LEFT JOIN user_follows uf ON p.user_id = uf.following_id
        LEFT JOIN post_likes pl ON p.id = pl.post_id
        LEFT JOIN comments c ON p.id = c.post_id
        WHERE (
          uf.follower_id = $1 OR 
          p.user_id = $1 OR 
          p.visibility = 'public'
        )
        GROUP BY p.id, u.id
        ORDER BY 
          CASE WHEN uf.follower_id = $1 THEN 1 ELSE 2 END,
          p.created_at DESC
        LIMIT $2 OFFSET $3
      `;

      return await this.databaseService.query(query, [userId, limit, offset]);
    } catch (error) {
      this.logger.error(`Error getting personalized feed for ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get suggested users to follow
   */
  async getSuggestedUsers(userId: string, limit: number = 10): Promise<any[]> {
    try {
      const query = `
        SELECT 
          u.*,
          COUNT(DISTINCT p.id) as posts_count,
          COUNT(DISTINCT f.follower_id) as followers_count,
          COUNT(DISTINCT mutual.following_id) as mutual_follows
        FROM users u
        LEFT JOIN posts p ON u.id = p.user_id
        LEFT JOIN user_follows f ON u.id = f.following_id
        LEFT JOIN user_follows mutual ON u.id = mutual.following_id
        LEFT JOIN user_follows user_following ON mutual.follower_id = user_following.following_id
        WHERE u.id != $1
          AND u.id NOT IN (
            SELECT following_id FROM user_follows WHERE follower_id = $1
          )
          AND u.is_active = true
          AND user_following.follower_id = $1
        GROUP BY u.id
        ORDER BY 
          mutual_follows DESC,
          followers_count DESC,
          posts_count DESC
        LIMIT $2
      `;

      return await this.databaseService.query(query, [userId, limit]);
    } catch (error) {
      this.logger.error(`Error getting suggested users for ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Track social interaction for analytics
   */
  async trackSocialInteraction(
    userId: string,
    action: string,
    targetType: 'post' | 'comment' | 'user',
    targetId: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      await this.analyticsService.trackSocialInteraction(userId, {
        action,
        targetType,
        targetId,
        ...metadata,
      });
    } catch (error) {
      this.logger.error('Error tracking social interaction:', error);
      // Don't throw - analytics failures shouldn't break social features
    }
  }

  /**
   * Calculate engagement score for a user
   */
  private calculateEngagementScore(data: {
    postsCount: number;
    followersCount: number;
    likesReceived: number;
    commentsReceived: number;
  }): number {
    const { postsCount, followersCount, likesReceived, commentsReceived } = data;

    // Weighted formula for engagement score
    const postWeight = 1.0;
    const followerWeight = 0.5;
    const likeWeight = 0.3;
    const commentWeight = 0.7;

    const score = 
      (postsCount * postWeight) +
      (followersCount * followerWeight) +
      (likesReceived * likeWeight) +
      (commentsReceived * commentWeight);

    return Math.round(score * 100) / 100;
  }

  /**
   * Clean up old social data
   */
  async cleanupOldData(daysOld: number = 90): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      // Clean up old notifications
      await this.databaseService.query(`
        DELETE FROM notifications 
        WHERE created_at < $1 AND is_read = true
      `, [cutoffDate]);

      // Clean up old analytics events
      await this.databaseService.query(`
        DELETE FROM analytics_events 
        WHERE created_at < $1
      `, [cutoffDate]);

      this.logger.log(`Cleaned up social data older than ${daysOld} days`);
    } catch (error) {
      this.logger.error('Error cleaning up old social data:', error);
      throw error;
    }
  }
}
