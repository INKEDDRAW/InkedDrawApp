/**
 * Follows Service
 * Business logic for user following relationships
 */

import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class FollowsService {
  private readonly logger = new Logger(FollowsService.name);

  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Follow a user
   */
  async followUser(followerId: string, followingId: string): Promise<any> {
    try {
      // Check if trying to follow self
      if (followerId === followingId) {
        throw new BadRequestException('Cannot follow yourself');
      }

      // Check if target user exists
      const targetUser = await this.databaseService.findOne('users', { id: followingId });
      if (!targetUser) {
        throw new NotFoundException('User not found');
      }

      // Check if already following
      const existingFollow = await this.databaseService.findOne('user_follows', {
        follower_id: followerId,
        following_id: followingId,
      });

      if (existingFollow) {
        throw new BadRequestException('Already following this user');
      }

      // Create follow relationship
      const followData = {
        id: this.generateUUID(),
        follower_id: followerId,
        following_id: followingId,
        created_at: new Date(),
      };

      await this.databaseService.insert('user_follows', followData);
      
      this.logger.log(`User ${followerId} started following ${followingId}`);
      
      return {
        success: true,
        followerId,
        followingId,
        createdAt: followData.created_at,
      };
    } catch (error) {
      this.logger.error(`Error following user ${followingId}:`, error);
      throw error;
    }
  }

  /**
   * Unfollow a user
   */
  async unfollowUser(followerId: string, followingId: string): Promise<any> {
    try {
      // Check if follow relationship exists
      const existingFollow = await this.databaseService.findOne('user_follows', {
        follower_id: followerId,
        following_id: followingId,
      });

      if (!existingFollow) {
        throw new NotFoundException('Follow relationship not found');
      }

      // Remove follow relationship
      await this.databaseService.delete('user_follows', {
        follower_id: followerId,
        following_id: followingId,
      });
      
      this.logger.log(`User ${followerId} unfollowed ${followingId}`);
      
      return {
        success: true,
        followerId,
        followingId,
      };
    } catch (error) {
      this.logger.error(`Error unfollowing user ${followingId}:`, error);
      throw error;
    }
  }

  /**
   * Check if user is following another user
   */
  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    try {
      const follow = await this.databaseService.findOne('user_follows', {
        follower_id: followerId,
        following_id: followingId,
      });

      return !!follow;
    } catch (error) {
      this.logger.error(`Error checking follow status:`, error);
      return false;
    }
  }

  /**
   * Get user's followers
   */
  async getFollowers(userId: string, limit: number = 50, offset: number = 0): Promise<any[]> {
    try {
      const query = `
        SELECT 
          uf.created_at as followed_at,
          u.id,
          u.username,
          u.display_name,
          u.avatar_url,
          u.bio
        FROM user_follows uf
        LEFT JOIN users u ON uf.follower_id = u.id
        WHERE uf.following_id = $1
        ORDER BY uf.created_at DESC
        LIMIT $2 OFFSET $3
      `;

      return await this.databaseService.query(query, [userId, limit, offset]);
    } catch (error) {
      this.logger.error(`Error getting followers for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get users that a user is following
   */
  async getFollowing(userId: string, limit: number = 50, offset: number = 0): Promise<any[]> {
    try {
      const query = `
        SELECT 
          uf.created_at as followed_at,
          u.id,
          u.username,
          u.display_name,
          u.avatar_url,
          u.bio
        FROM user_follows uf
        LEFT JOIN users u ON uf.following_id = u.id
        WHERE uf.follower_id = $1
        ORDER BY uf.created_at DESC
        LIMIT $2 OFFSET $3
      `;

      return await this.databaseService.query(query, [userId, limit, offset]);
    } catch (error) {
      this.logger.error(`Error getting following for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get follow counts for a user
   */
  async getFollowCounts(userId: string): Promise<{ followersCount: number; followingCount: number }> {
    try {
      const [followersResult, followingResult] = await Promise.all([
        this.databaseService.query(
          'SELECT COUNT(*) as count FROM user_follows WHERE following_id = $1',
          [userId]
        ),
        this.databaseService.query(
          'SELECT COUNT(*) as count FROM user_follows WHERE follower_id = $1',
          [userId]
        ),
      ]);

      return {
        followersCount: parseInt(followersResult[0]?.count || '0'),
        followingCount: parseInt(followingResult[0]?.count || '0'),
      };
    } catch (error) {
      this.logger.error(`Error getting follow counts for user ${userId}:`, error);
      return { followersCount: 0, followingCount: 0 };
    }
  }

  /**
   * Get mutual follows between two users
   */
  async getMutualFollows(userId1: string, userId2: string, limit: number = 20): Promise<any[]> {
    try {
      const query = `
        SELECT DISTINCT
          u.id,
          u.username,
          u.display_name,
          u.avatar_url
        FROM users u
        WHERE u.id IN (
          SELECT uf1.following_id 
          FROM user_follows uf1
          WHERE uf1.follower_id = $1
          INTERSECT
          SELECT uf2.following_id 
          FROM user_follows uf2
          WHERE uf2.follower_id = $2
        )
        LIMIT $3
      `;

      return await this.databaseService.query(query, [userId1, userId2, limit]);
    } catch (error) {
      this.logger.error(`Error getting mutual follows:`, error);
      throw error;
    }
  }

  /**
   * Get follow suggestions for a user
   */
  async getFollowSuggestions(userId: string, limit: number = 10): Promise<any[]> {
    try {
      const query = `
        SELECT 
          u.id,
          u.username,
          u.display_name,
          u.avatar_url,
          u.bio,
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
      this.logger.error(`Error getting follow suggestions for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Batch check follow status for multiple users
   */
  async batchCheckFollowStatus(followerId: string, userIds: string[]): Promise<Record<string, boolean>> {
    try {
      if (userIds.length === 0) {
        return {};
      }

      const placeholders = userIds.map((_, index) => `$${index + 2}`).join(',');
      const query = `
        SELECT following_id
        FROM user_follows
        WHERE follower_id = $1 AND following_id IN (${placeholders})
      `;

      const result = await this.databaseService.query(query, [followerId, ...userIds]);
      const followingSet = new Set(result.map(row => row.following_id));

      const followStatus: Record<string, boolean> = {};
      userIds.forEach(userId => {
        followStatus[userId] = followingSet.has(userId);
      });

      return followStatus;
    } catch (error) {
      this.logger.error('Error batch checking follow status:', error);
      throw error;
    }
  }

  /**
   * Generate UUID
   */
  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
}
