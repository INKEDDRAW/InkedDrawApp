/**
 * Comment Model
 * WatermelonDB model for post comments
 */

import { Model } from '@nozbe/watermelondb';
import { field, readonly, date, relation } from '@nozbe/watermelondb/decorators';
import { Associations } from '@nozbe/watermelondb/Model';
import User from './User';
import Post from './Post';

export default class Comment extends Model {
  static table = 'comments';
  static associations: Associations = {
    user: { type: 'belongs_to', key: 'user_id' },
    post: { type: 'belongs_to', key: 'post_id' },
    parent_comment: { type: 'belongs_to', key: 'parent_comment_id' },
  };

  @field('server_id') serverId!: string;
  @field('post_id') postId!: string;
  @field('user_id') userId!: string;
  @field('content') content!: string;
  @field('parent_comment_id') parentCommentId?: string;
  @field('like_count') likeCount!: number;
  @field('is_liked_by_user') isLikedByUser!: boolean;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
  @date('last_synced_at') lastSyncedAt?: Date;
  @field('sync_status') syncStatus!: string;

  // Relationships
  @relation('users', 'user_id') user!: User;
  @relation('posts', 'post_id') post!: Post;

  // Computed properties
  get isReply(): boolean {
    return !!this.parentCommentId;
  }

  get isTopLevel(): boolean {
    return !this.parentCommentId;
  }

  get timeAgo(): string {
    const now = new Date();
    const diffMs = now.getTime() - this.createdAt.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return this.createdAt.toLocaleDateString();
  }

  get isOnline(): boolean {
    return this.syncStatus === 'synced';
  }

  get needsSync(): boolean {
    return this.syncStatus === 'pending';
  }

  get hasConflict(): boolean {
    return this.syncStatus === 'conflict';
  }

  // Helper methods
  async toggleLike() {
    await this.update(comment => {
      comment.isLikedByUser = !comment.isLikedByUser;
      comment.likeCount += comment.isLikedByUser ? 1 : -1;
      comment.syncStatus = 'pending';
    });
  }

  async updateContent(newContent: string) {
    await this.update(comment => {
      comment.content = newContent;
      comment.syncStatus = 'pending';
    });
  }

  async markForSync() {
    await this.update(comment => {
      comment.syncStatus = 'pending';
    });
  }

  async markAsSynced() {
    await this.update(comment => {
      comment.syncStatus = 'synced';
      comment.lastSyncedAt = new Date();
    });
  }

  async markAsConflicted() {
    await this.update(comment => {
      comment.syncStatus = 'conflict';
    });
  }

  // Search helpers
  matchesSearch(query: string): boolean {
    const searchTerm = query.toLowerCase();
    return this.content.toLowerCase().includes(searchTerm);
  }
}
