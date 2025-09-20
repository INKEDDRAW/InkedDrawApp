/**
 * Comments Service
 * Business logic for post comments management
 */

import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateCommentDto, UpdateCommentDto } from './dto/posts.dto';

@Injectable()
export class CommentsService {
  private readonly logger = new Logger(CommentsService.name);

  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Create a new comment
   */
  async createComment(userId: string, postId: string, createCommentDto: CreateCommentDto): Promise<any> {
    try {
      // Check if post exists
      const post = await this.databaseService.findOne('posts', { id: postId });
      if (!post) {
        throw new NotFoundException('Post not found');
      }

      // If replying to a comment, check if parent comment exists
      if (createCommentDto.parentCommentId) {
        const parentComment = await this.databaseService.findOne('comments', { 
          id: createCommentDto.parentCommentId 
        });
        if (!parentComment) {
          throw new NotFoundException('Parent comment not found');
        }
      }

      const commentData = {
        id: this.generateUUID(),
        post_id: postId,
        user_id: userId,
        content: createCommentDto.content,
        parent_comment_id: createCommentDto.parentCommentId,
        like_count: 0,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const result = await this.databaseService.insert('comments', commentData);

      // Update post comment count
      await this.databaseService.query(
        'UPDATE posts SET comment_count = comment_count + 1 WHERE id = $1',
        [postId]
      );

      // Get the created comment with user info
      const comment = await this.getCommentById(result.id, userId);
      
      this.logger.log(`Comment created: ${result.id} by user ${userId} on post ${postId}`);
      return comment;
    } catch (error) {
      this.logger.error('Error creating comment:', error);
      throw error;
    }
  }

  /**
   * Get comment by ID with user context
   */
  async getCommentById(commentId: string, currentUserId?: string): Promise<any> {
    try {
      const query = `
        SELECT 
          c.*,
          u.username,
          u.display_name,
          u.avatar_url,
          ${currentUserId ? `
            EXISTS(SELECT 1 FROM comment_likes WHERE comment_id = c.id AND user_id = $2) as is_liked_by_user
          ` : 'false as is_liked_by_user'}
        FROM comments c
        LEFT JOIN users u ON c.user_id = u.id
        WHERE c.id = $1
      `;

      const params = currentUserId ? [commentId, currentUserId] : [commentId];
      const result = await this.databaseService.query(query, params);

      if (result.length === 0) {
        throw new NotFoundException('Comment not found');
      }

      return this.formatComment(result[0]);
    } catch (error) {
      this.logger.error(`Error getting comment ${commentId}:`, error);
      throw error;
    }
  }

  /**
   * Get comments for a post
   */
  async getPostComments(postId: string, currentUserId?: string, limit: number = 50, offset: number = 0): Promise<any[]> {
    try {
      const query = `
        SELECT 
          c.*,
          u.username,
          u.display_name,
          u.avatar_url,
          ${currentUserId ? `
            EXISTS(SELECT 1 FROM comment_likes WHERE comment_id = c.id AND user_id = $2) as is_liked_by_user
          ` : 'false as is_liked_by_user'}
        FROM comments c
        LEFT JOIN users u ON c.user_id = u.id
        WHERE c.post_id = $1
        ORDER BY c.created_at ASC
        LIMIT $${currentUserId ? '3' : '2'} OFFSET $${currentUserId ? '4' : '3'}
      `;

      const params = currentUserId 
        ? [postId, currentUserId, limit, offset]
        : [postId, limit, offset];
      
      const result = await this.databaseService.query(query, params);
      return result.map(comment => this.formatComment(comment));
    } catch (error) {
      this.logger.error(`Error getting comments for post ${postId}:`, error);
      throw error;
    }
  }

  /**
   * Update a comment
   */
  async updateComment(commentId: string, userId: string, updateCommentDto: UpdateCommentDto): Promise<any> {
    try {
      // Check if comment exists and user owns it
      const existingComment = await this.databaseService.findOne('comments', { id: commentId });
      if (!existingComment) {
        throw new NotFoundException('Comment not found');
      }
      if (existingComment.user_id !== userId) {
        throw new ForbiddenException('Not authorized to update this comment');
      }

      const updateData = {
        content: updateCommentDto.content,
        updated_at: new Date(),
      };

      await this.databaseService.update('comments', { id: commentId }, updateData);
      
      // Return updated comment
      const updatedComment = await this.getCommentById(commentId, userId);
      
      this.logger.log(`Comment updated: ${commentId} by user ${userId}`);
      return updatedComment;
    } catch (error) {
      this.logger.error(`Error updating comment ${commentId}:`, error);
      throw error;
    }
  }

  /**
   * Delete a comment
   */
  async deleteComment(commentId: string, userId: string): Promise<void> {
    try {
      // Check if comment exists and user owns it
      const existingComment = await this.databaseService.findOne('comments', { id: commentId });
      if (!existingComment) {
        throw new NotFoundException('Comment not found');
      }
      if (existingComment.user_id !== userId) {
        throw new ForbiddenException('Not authorized to delete this comment');
      }

      // Delete related data first
      await this.databaseService.delete('comment_likes', { comment_id: commentId });

      // Delete replies to this comment
      await this.databaseService.delete('comments', { parent_comment_id: commentId });

      // Delete the comment
      await this.databaseService.delete('comments', { id: commentId });

      // Update post comment count
      await this.databaseService.query(
        'UPDATE posts SET comment_count = GREATEST(comment_count - 1, 0) WHERE id = $1',
        [existingComment.post_id]
      );
      
      this.logger.log(`Comment deleted: ${commentId} by user ${userId}`);
    } catch (error) {
      this.logger.error(`Error deleting comment ${commentId}:`, error);
      throw error;
    }
  }

  /**
   * Toggle like on a comment
   */
  async toggleLike(commentId: string, userId: string, isLiked: boolean): Promise<any> {
    try {
      // Check if comment exists
      const comment = await this.databaseService.findOne('comments', { id: commentId });
      if (!comment) {
        throw new NotFoundException('Comment not found');
      }

      const existingLike = await this.databaseService.findOne('comment_likes', {
        comment_id: commentId,
        user_id: userId,
      });

      if (isLiked && !existingLike) {
        // Add like
        await this.databaseService.insert('comment_likes', {
          id: this.generateUUID(),
          comment_id: commentId,
          user_id: userId,
          created_at: new Date(),
        });

        // Update like count
        await this.databaseService.query(
          'UPDATE comments SET like_count = like_count + 1 WHERE id = $1',
          [commentId]
        );
      } else if (!isLiked && existingLike) {
        // Remove like
        await this.databaseService.delete('comment_likes', {
          comment_id: commentId,
          user_id: userId,
        });

        // Update like count
        await this.databaseService.query(
          'UPDATE comments SET like_count = GREATEST(like_count - 1, 0) WHERE id = $1',
          [commentId]
        );
      }

      // Return updated comment
      return await this.getCommentById(commentId, userId);
    } catch (error) {
      this.logger.error(`Error toggling like on comment ${commentId}:`, error);
      throw error;
    }
  }

  /**
   * Get comment replies
   */
  async getCommentReplies(commentId: string, currentUserId?: string, limit: number = 20, offset: number = 0): Promise<any[]> {
    try {
      const query = `
        SELECT 
          c.*,
          u.username,
          u.display_name,
          u.avatar_url,
          ${currentUserId ? `
            EXISTS(SELECT 1 FROM comment_likes WHERE comment_id = c.id AND user_id = $2) as is_liked_by_user
          ` : 'false as is_liked_by_user'}
        FROM comments c
        LEFT JOIN users u ON c.user_id = u.id
        WHERE c.parent_comment_id = $1
        ORDER BY c.created_at ASC
        LIMIT $${currentUserId ? '3' : '2'} OFFSET $${currentUserId ? '4' : '3'}
      `;

      const params = currentUserId 
        ? [commentId, currentUserId, limit, offset]
        : [commentId, limit, offset];
      
      const result = await this.databaseService.query(query, params);
      return result.map(comment => this.formatComment(comment));
    } catch (error) {
      this.logger.error(`Error getting replies for comment ${commentId}:`, error);
      throw error;
    }
  }

  /**
   * Format comment data for response
   */
  private formatComment(comment: any): any {
    return {
      id: comment.id,
      postId: comment.post_id,
      userId: comment.user_id,
      content: comment.content,
      parentCommentId: comment.parent_comment_id,
      likeCount: parseInt(comment.like_count) || 0,
      isLikedByUser: comment.is_liked_by_user || false,
      createdAt: comment.created_at,
      updatedAt: comment.updated_at,
      user: {
        id: comment.user_id,
        username: comment.username,
        displayName: comment.display_name,
        avatarUrl: comment.avatar_url,
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
