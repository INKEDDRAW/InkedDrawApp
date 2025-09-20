/**
 * Live Feed Service
 * Manages real-time social feed updates
 */

import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { AnalyticsService } from '../analytics/analytics.service';

export interface FeedUpdate {
  id: string;
  type: 'post' | 'comment' | 'like' | 'follow' | 'rating' | 'collection_add';
  userId: string;
  targetId?: string;
  targetType?: string;
  content?: string;
  metadata?: any;
  createdAt: Date;
  user?: any;
  target?: any;
}

export interface FeedFilters {
  types?: string[];
  followingOnly?: boolean;
  productTypes?: string[];
  timeRange?: 'hour' | 'day' | 'week' | 'month';
}

@Injectable()
export class LiveFeedService {
  private readonly logger = new Logger(LiveFeedService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly analyticsService: AnalyticsService,
  ) {}

  /**
   * Get recent feed updates for user
   */
  async getRecentFeedUpdates(
    userId: string,
    limit: number = 50,
    filters: FeedFilters = {}
  ): Promise<FeedUpdate[]> {
    try {
      const {
        types = ['post', 'comment', 'like', 'follow', 'rating'],
        followingOnly = false,
        productTypes,
        timeRange = 'week',
      } = filters;

      let query = `
        WITH feed_activities AS (
          -- Posts
          SELECT 
            p.id,
            'post' as type,
            p.user_id,
            NULL as target_id,
            NULL as target_type,
            p.content,
            json_build_object(
              'images', p.images,
              'product_tags', p.product_tags,
              'like_count', p.like_count,
              'comment_count', p.comment_count
            ) as metadata,
            p.created_at,
            u.display_name as user_name,
            u.avatar_url as user_avatar
          FROM posts p
          JOIN users u ON p.user_id = u.id
          WHERE p.created_at >= NOW() - INTERVAL '1 ${timeRange}'
            ${followingOnly ? `AND p.user_id IN (
              SELECT following_id FROM follows WHERE follower_id = $1
              UNION SELECT $1
            )` : ''}
          
          UNION ALL
          
          -- Comments
          SELECT 
            c.id,
            'comment' as type,
            c.user_id,
            c.post_id as target_id,
            'post' as target_type,
            c.content,
            json_build_object(
              'post_title', p.content,
              'post_author', pu.display_name
            ) as metadata,
            c.created_at,
            u.display_name as user_name,
            u.avatar_url as user_avatar
          FROM comments c
          JOIN users u ON c.user_id = u.id
          JOIN posts p ON c.post_id = p.id
          JOIN users pu ON p.user_id = pu.id
          WHERE c.created_at >= NOW() - INTERVAL '1 ${timeRange}'
            ${followingOnly ? `AND c.user_id IN (
              SELECT following_id FROM follows WHERE follower_id = $1
              UNION SELECT $1
            )` : ''}
          
          UNION ALL
          
          -- Likes (only show likes from followed users)
          SELECT 
            l.id,
            'like' as type,
            l.user_id,
            l.target_id,
            l.target_type,
            NULL as content,
            json_build_object(
              'target_content', CASE 
                WHEN l.target_type = 'post' THEN p.content
                WHEN l.target_type = 'comment' THEN c.content
              END,
              'target_author', CASE 
                WHEN l.target_type = 'post' THEN pu.display_name
                WHEN l.target_type = 'comment' THEN cu.display_name
              END
            ) as metadata,
            l.created_at,
            u.display_name as user_name,
            u.avatar_url as user_avatar
          FROM likes l
          JOIN users u ON l.user_id = u.id
          LEFT JOIN posts p ON l.target_type = 'post' AND l.target_id = p.id
          LEFT JOIN users pu ON p.user_id = pu.id
          LEFT JOIN comments c ON l.target_type = 'comment' AND l.target_id = c.id
          LEFT JOIN users cu ON c.user_id = cu.id
          WHERE l.created_at >= NOW() - INTERVAL '1 ${timeRange}'
            AND l.user_id IN (
              SELECT following_id FROM follows WHERE follower_id = $1
            )
          
          UNION ALL
          
          -- Follows
          SELECT 
            f.id,
            'follow' as type,
            f.follower_id as user_id,
            f.following_id as target_id,
            'user' as target_type,
            NULL as content,
            json_build_object(
              'followed_user', fu.display_name,
              'followed_avatar', fu.avatar_url
            ) as metadata,
            f.created_at,
            u.display_name as user_name,
            u.avatar_url as user_avatar
          FROM follows f
          JOIN users u ON f.follower_id = u.id
          JOIN users fu ON f.following_id = fu.id
          WHERE f.created_at >= NOW() - INTERVAL '1 ${timeRange}'
            ${followingOnly ? `AND f.follower_id IN (
              SELECT following_id FROM follows WHERE follower_id = $1
              UNION SELECT $1
            )` : ''}
          
          UNION ALL
          
          -- Ratings
          SELECT 
            r.id,
            'rating' as type,
            r.user_id,
            r.product_id as target_id,
            r.product_type as target_type,
            r.review_text as content,
            json_build_object(
              'rating', r.rating,
              'product_name', COALESCE(c.name, b.name, w.name),
              'product_brand', COALESCE(c.brand, b.brewery, w.winery),
              'product_image', COALESCE(c.image_url, b.image_url, w.image_url),
              'flavor_notes', r.flavor_notes
            ) as metadata,
            r.created_at,
            u.display_name as user_name,
            u.avatar_url as user_avatar
          FROM user_ratings r
          JOIN users u ON r.user_id = u.id
          LEFT JOIN cigars c ON r.product_type = 'cigar' AND r.product_id = c.id
          LEFT JOIN beers b ON r.product_type = 'beer' AND r.product_id = b.id
          LEFT JOIN wines w ON r.product_type = 'wine' AND r.product_id = w.id
          WHERE r.created_at >= NOW() - INTERVAL '1 ${timeRange}'
            AND r.rating >= 4 -- Only show high ratings in feed
            ${followingOnly ? `AND r.user_id IN (
              SELECT following_id FROM follows WHERE follower_id = $1
              UNION SELECT $1
            )` : ''}
            ${productTypes ? `AND r.product_type = ANY($${followingOnly ? '2' : '1'})` : ''}
        )
        SELECT *
        FROM feed_activities
        WHERE type = ANY($${productTypes ? (followingOnly ? '3' : '2') : (followingOnly ? '2' : '1')})
        ORDER BY created_at DESC
        LIMIT $${productTypes ? (followingOnly ? '4' : '3') : (followingOnly ? '3' : '2')}
      `;

      const params = [];
      if (followingOnly) params.push(userId);
      if (productTypes) params.push(productTypes);
      params.push(types);
      params.push(limit);

      const results = await this.databaseService.query(query, params);

      return results.map(row => ({
        id: row.id,
        type: row.type,
        userId: row.user_id,
        targetId: row.target_id,
        targetType: row.target_type,
        content: row.content,
        metadata: row.metadata,
        createdAt: new Date(row.created_at),
        user: {
          id: row.user_id,
          displayName: row.user_name,
          avatarUrl: row.user_avatar,
        },
      }));
    } catch (error) {
      this.logger.error('Error getting recent feed updates:', error);
      return [];
    }
  }

  /**
   * Get followed users for feed subscription
   */
  async getFollowedUsers(userId: string): Promise<string[]> {
    try {
      const result = await this.databaseService.query(`
        SELECT following_id 
        FROM follows 
        WHERE follower_id = $1
      `, [userId]);

      return result.map(row => row.following_id);
    } catch (error) {
      this.logger.error('Error getting followed users:', error);
      return [];
    }
  }

  /**
   * Create feed activity for new post
   */
  async createPostActivity(post: any): Promise<void> {
    try {
      await this.databaseService.insert('feed_activities', {
        activity_type: 'post',
        user_id: post.userId,
        target_id: post.id,
        target_type: 'post',
        content: post.content,
        metadata: JSON.stringify({
          images: post.images,
          product_tags: post.productTags,
        }),
        created_at: new Date(),
      });

      // Track analytics
      await this.analyticsService.track(post.userId, 'feed_activity_created', {
        activity_type: 'post',
        target_id: post.id,
      });
    } catch (error) {
      this.logger.error('Error creating post activity:', error);
    }
  }

  /**
   * Create feed activity for new comment
   */
  async createCommentActivity(comment: any): Promise<void> {
    try {
      await this.databaseService.insert('feed_activities', {
        activity_type: 'comment',
        user_id: comment.userId,
        target_id: comment.id,
        target_type: 'comment',
        content: comment.content,
        metadata: JSON.stringify({
          post_id: comment.postId,
          post_author: comment.post?.userId,
        }),
        created_at: new Date(),
      });

      await this.analyticsService.track(comment.userId, 'feed_activity_created', {
        activity_type: 'comment',
        target_id: comment.id,
        post_id: comment.postId,
      });
    } catch (error) {
      this.logger.error('Error creating comment activity:', error);
    }
  }

  /**
   * Create feed activity for new rating
   */
  async createRatingActivity(rating: any): Promise<void> {
    try {
      // Only create feed activity for high ratings (4+ stars)
      if (rating.rating < 4) return;

      await this.databaseService.insert('feed_activities', {
        activity_type: 'rating',
        user_id: rating.userId,
        target_id: rating.id,
        target_type: 'rating',
        content: rating.reviewText,
        metadata: JSON.stringify({
          rating: rating.rating,
          product_id: rating.productId,
          product_type: rating.productType,
          flavor_notes: rating.flavorNotes,
        }),
        created_at: new Date(),
      });

      await this.analyticsService.track(rating.userId, 'feed_activity_created', {
        activity_type: 'rating',
        target_id: rating.id,
        product_id: rating.productId,
        product_type: rating.productType,
        rating: rating.rating,
      });
    } catch (error) {
      this.logger.error('Error creating rating activity:', error);
    }
  }

  /**
   * Get trending activities
   */
  async getTrendingActivities(limit: number = 20): Promise<FeedUpdate[]> {
    try {
      const query = `
        WITH trending_posts AS (
          SELECT 
            p.id,
            'post' as type,
            p.user_id,
            NULL as target_id,
            NULL as target_type,
            p.content,
            json_build_object(
              'images', p.images,
              'like_count', p.like_count,
              'comment_count', p.comment_count,
              'engagement_score', (p.like_count * 2 + p.comment_count * 3)
            ) as metadata,
            p.created_at,
            u.display_name as user_name,
            u.avatar_url as user_avatar,
            (p.like_count * 2 + p.comment_count * 3) as engagement_score
          FROM posts p
          JOIN users u ON p.user_id = u.id
          WHERE p.created_at >= NOW() - INTERVAL '24 hours'
            AND (p.like_count > 0 OR p.comment_count > 0)
        ),
        trending_ratings AS (
          SELECT 
            r.id,
            'rating' as type,
            r.user_id,
            r.product_id as target_id,
            r.product_type as target_type,
            r.review_text as content,
            json_build_object(
              'rating', r.rating,
              'product_name', COALESCE(c.name, b.name, w.name),
              'product_brand', COALESCE(c.brand, b.brewery, w.winery),
              'product_image', COALESCE(c.image_url, b.image_url, w.image_url)
            ) as metadata,
            r.created_at,
            u.display_name as user_name,
            u.avatar_url as user_avatar,
            r.rating as engagement_score
          FROM user_ratings r
          JOIN users u ON r.user_id = u.id
          LEFT JOIN cigars c ON r.product_type = 'cigar' AND r.product_id = c.id
          LEFT JOIN beers b ON r.product_type = 'beer' AND r.product_id = b.id
          LEFT JOIN wines w ON r.product_type = 'wine' AND r.product_id = w.id
          WHERE r.created_at >= NOW() - INTERVAL '24 hours'
            AND r.rating >= 4
        )
        SELECT * FROM (
          SELECT * FROM trending_posts
          UNION ALL
          SELECT * FROM trending_ratings
        ) combined
        ORDER BY engagement_score DESC, created_at DESC
        LIMIT $1
      `;

      const results = await this.databaseService.query(query, [limit]);

      return results.map(row => ({
        id: row.id,
        type: row.type,
        userId: row.user_id,
        targetId: row.target_id,
        targetType: row.target_type,
        content: row.content,
        metadata: row.metadata,
        createdAt: new Date(row.created_at),
        user: {
          id: row.user_id,
          displayName: row.user_name,
          avatarUrl: row.user_avatar,
        },
      }));
    } catch (error) {
      this.logger.error('Error getting trending activities:', error);
      return [];
    }
  }

  /**
   * Get feed statistics for analytics
   */
  async getFeedStatistics(userId: string): Promise<any> {
    try {
      const query = `
        SELECT 
          COUNT(CASE WHEN type = 'post' THEN 1 END) as post_count,
          COUNT(CASE WHEN type = 'comment' THEN 1 END) as comment_count,
          COUNT(CASE WHEN type = 'like' THEN 1 END) as like_count,
          COUNT(CASE WHEN type = 'rating' THEN 1 END) as rating_count,
          COUNT(*) as total_activities
        FROM feed_activities
        WHERE user_id = $1
          AND created_at >= NOW() - INTERVAL '30 days'
      `;

      const result = await this.databaseService.query(query, [userId]);
      return result[0] || {};
    } catch (error) {
      this.logger.error('Error getting feed statistics:', error);
      return {};
    }
  }

  /**
   * Clean up old feed activities
   */
  async cleanupOldActivities(): Promise<void> {
    try {
      // Remove activities older than 90 days
      await this.databaseService.query(`
        DELETE FROM feed_activities
        WHERE created_at < NOW() - INTERVAL '90 days'
      `);

      this.logger.log('Cleaned up old feed activities');
    } catch (error) {
      this.logger.error('Error cleaning up old activities:', error);
    }
  }
}
