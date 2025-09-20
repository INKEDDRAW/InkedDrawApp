/**
 * Posts Service
 * Business logic for social posts management
 */

import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreatePostDto, UpdatePostDto } from './dto/posts.dto';

@Injectable()
export class PostsService {
  private readonly logger = new Logger(PostsService.name);

  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Create a new post
   */
  async createPost(userId: string, createPostDto: CreatePostDto): Promise<any> {
    try {
      const postData = {
        id: this.generateUUID(),
        user_id: userId,
        content: createPostDto.content,
        images: createPostDto.images ? JSON.stringify(createPostDto.images) : null,
        product_id: createPostDto.productId,
        product_type: createPostDto.productType,
        location: createPostDto.location,
        tags: createPostDto.tags ? JSON.stringify(createPostDto.tags) : null,
        visibility: createPostDto.visibility || 'public',
        like_count: 0,
        comment_count: 0,
        share_count: 0,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const result = await this.databaseService.insert('posts', postData);
      
      // Get the created post with user info
      const post = await this.getPostById(result.id, userId);
      
      this.logger.log(`Post created: ${result.id} by user ${userId}`);
      return post;
    } catch (error) {
      this.logger.error('Error creating post:', error);
      throw error;
    }
  }

  /**
   * Get post by ID with user context
   */
  async getPostById(postId: string, currentUserId?: string): Promise<any> {
    try {
      const query = `
        SELECT 
          p.*,
          u.username,
          u.display_name,
          u.avatar_url,
          ${currentUserId ? `
            EXISTS(SELECT 1 FROM post_likes WHERE post_id = p.id AND user_id = $2) as is_liked_by_user
          ` : 'false as is_liked_by_user'}
        FROM posts p
        LEFT JOIN users u ON p.user_id = u.id
        WHERE p.id = $1
      `;

      const params = currentUserId ? [postId, currentUserId] : [postId];
      const result = await this.databaseService.query(query, params);

      if (result.length === 0) {
        throw new NotFoundException('Post not found');
      }

      return this.formatPost(result[0]);
    } catch (error) {
      this.logger.error(`Error getting post ${postId}:`, error);
      throw error;
    }
  }

  /**
   * Update a post
   */
  async updatePost(postId: string, userId: string, updatePostDto: UpdatePostDto): Promise<any> {
    try {
      // Check if post exists and user owns it
      const existingPost = await this.databaseService.findOne('posts', { id: postId });
      if (!existingPost) {
        throw new NotFoundException('Post not found');
      }
      if (existingPost.user_id !== userId) {
        throw new ForbiddenException('Not authorized to update this post');
      }

      const updateData: any = {
        updated_at: new Date(),
      };

      if (updatePostDto.content !== undefined) {
        updateData.content = updatePostDto.content;
      }
      if (updatePostDto.images !== undefined) {
        updateData.images = updatePostDto.images ? JSON.stringify(updatePostDto.images) : null;
      }
      if (updatePostDto.productId !== undefined) {
        updateData.product_id = updatePostDto.productId;
      }
      if (updatePostDto.productType !== undefined) {
        updateData.product_type = updatePostDto.productType;
      }
      if (updatePostDto.location !== undefined) {
        updateData.location = updatePostDto.location;
      }
      if (updatePostDto.tags !== undefined) {
        updateData.tags = updatePostDto.tags ? JSON.stringify(updatePostDto.tags) : null;
      }
      if (updatePostDto.visibility !== undefined) {
        updateData.visibility = updatePostDto.visibility;
      }

      await this.databaseService.update('posts', { id: postId }, updateData);
      
      // Return updated post
      const updatedPost = await this.getPostById(postId, userId);
      
      this.logger.log(`Post updated: ${postId} by user ${userId}`);
      return updatedPost;
    } catch (error) {
      this.logger.error(`Error updating post ${postId}:`, error);
      throw error;
    }
  }

  /**
   * Delete a post
   */
  async deletePost(postId: string, userId: string): Promise<void> {
    try {
      // Check if post exists and user owns it
      const existingPost = await this.databaseService.findOne('posts', { id: postId });
      if (!existingPost) {
        throw new NotFoundException('Post not found');
      }
      if (existingPost.user_id !== userId) {
        throw new ForbiddenException('Not authorized to delete this post');
      }

      // Delete related data first
      await Promise.all([
        this.databaseService.delete('post_likes', { post_id: postId }),
        this.databaseService.delete('comments', { post_id: postId }),
      ]);

      // Delete the post
      await this.databaseService.delete('posts', { id: postId });
      
      this.logger.log(`Post deleted: ${postId} by user ${userId}`);
    } catch (error) {
      this.logger.error(`Error deleting post ${postId}:`, error);
      throw error;
    }
  }

  /**
   * Toggle like on a post
   */
  async toggleLike(postId: string, userId: string, isLiked: boolean): Promise<any> {
    try {
      // Check if post exists
      const post = await this.databaseService.findOne('posts', { id: postId });
      if (!post) {
        throw new NotFoundException('Post not found');
      }

      const existingLike = await this.databaseService.findOne('post_likes', {
        post_id: postId,
        user_id: userId,
      });

      if (isLiked && !existingLike) {
        // Add like
        await this.databaseService.insert('post_likes', {
          id: this.generateUUID(),
          post_id: postId,
          user_id: userId,
          created_at: new Date(),
        });

        // Update like count
        await this.databaseService.query(
          'UPDATE posts SET like_count = like_count + 1 WHERE id = $1',
          [postId]
        );
      } else if (!isLiked && existingLike) {
        // Remove like
        await this.databaseService.delete('post_likes', {
          post_id: postId,
          user_id: userId,
        });

        // Update like count
        await this.databaseService.query(
          'UPDATE posts SET like_count = GREATEST(like_count - 1, 0) WHERE id = $1',
          [postId]
        );
      }

      // Return updated post
      return await this.getPostById(postId, userId);
    } catch (error) {
      this.logger.error(`Error toggling like on post ${postId}:`, error);
      throw error;
    }
  }

  /**
   * Get public posts
   */
  async getPublicPosts(limit: number = 20, offset: number = 0): Promise<any[]> {
    try {
      const query = `
        SELECT 
          p.*,
          u.username,
          u.display_name,
          u.avatar_url,
          false as is_liked_by_user
        FROM posts p
        LEFT JOIN users u ON p.user_id = u.id
        WHERE p.visibility = 'public'
        ORDER BY p.created_at DESC
        LIMIT $1 OFFSET $2
      `;

      const result = await this.databaseService.query(query, [limit, offset]);
      return result.map(post => this.formatPost(post));
    } catch (error) {
      this.logger.error('Error getting public posts:', error);
      throw error;
    }
  }

  /**
   * Get posts by user
   */
  async getUserPosts(userId: string, currentUserId?: string, limit: number = 20, offset: number = 0): Promise<any[]> {
    try {
      const query = `
        SELECT 
          p.*,
          u.username,
          u.display_name,
          u.avatar_url,
          ${currentUserId ? `
            EXISTS(SELECT 1 FROM post_likes WHERE post_id = p.id AND user_id = $3) as is_liked_by_user
          ` : 'false as is_liked_by_user'}
        FROM posts p
        LEFT JOIN users u ON p.user_id = u.id
        WHERE p.user_id = $1
          AND (p.visibility = 'public' OR p.user_id = $2)
        ORDER BY p.created_at DESC
        LIMIT $4 OFFSET $5
      `;

      const params = currentUserId 
        ? [userId, currentUserId, currentUserId, limit, offset]
        : [userId, userId, limit, offset];
      
      const result = await this.databaseService.query(query, params);
      return result.map(post => this.formatPost(post));
    } catch (error) {
      this.logger.error(`Error getting posts for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get post likes
   */
  async getPostLikes(postId: string, limit: number = 50, offset: number = 0): Promise<any[]> {
    try {
      const query = `
        SELECT 
          pl.*,
          u.username,
          u.display_name,
          u.avatar_url
        FROM post_likes pl
        LEFT JOIN users u ON pl.user_id = u.id
        WHERE pl.post_id = $1
        ORDER BY pl.created_at DESC
        LIMIT $2 OFFSET $3
      `;

      return await this.databaseService.query(query, [postId, limit, offset]);
    } catch (error) {
      this.logger.error(`Error getting likes for post ${postId}:`, error);
      throw error;
    }
  }

  /**
   * Format post data for response
   */
  private formatPost(post: any): any {
    return {
      id: post.id,
      userId: post.user_id,
      content: post.content,
      images: post.images ? JSON.parse(post.images) : null,
      productId: post.product_id,
      productType: post.product_type,
      location: post.location,
      tags: post.tags ? JSON.parse(post.tags) : null,
      likeCount: parseInt(post.like_count) || 0,
      commentCount: parseInt(post.comment_count) || 0,
      shareCount: parseInt(post.share_count) || 0,
      isLikedByUser: post.is_liked_by_user || false,
      visibility: post.visibility,
      createdAt: post.created_at,
      updatedAt: post.updated_at,
      user: {
        id: post.user_id,
        username: post.username,
        displayName: post.display_name,
        avatarUrl: post.avatar_url,
      },
    };
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
