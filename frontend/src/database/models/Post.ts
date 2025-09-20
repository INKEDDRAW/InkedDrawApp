/**
 * Post Model
 * WatermelonDB model for social posts
 */

import { Model } from '@nozbe/watermelondb';
import { field, readonly, date, relation, children } from '@nozbe/watermelondb/decorators';
import { Associations } from '@nozbe/watermelondb/Model';
import User from './User';

export interface PostImages {
  url: string;
  localPath?: string;
  caption?: string;
  uploaded: boolean;
  width?: number;
  height?: number;
}

export default class Post extends Model {
  static table = 'posts';
  static associations: Associations = {
    user: { type: 'belongs_to', key: 'user_id' },
    comments: { type: 'has_many', foreignKey: 'post_id' },
    cigar: { type: 'belongs_to', key: 'product_id' },
    beer: { type: 'belongs_to', key: 'product_id' },
    wine: { type: 'belongs_to', key: 'product_id' },
  };

  @field('server_id') serverId!: string;
  @field('user_id') userId!: string;
  @field('content') content!: string;
  @field('images') imagesRaw?: string;
  @field('product_id') productId?: string;
  @field('product_type') productType?: 'cigar' | 'beer' | 'wine';
  @field('location') location?: string;
  @field('tags') tagsRaw?: string;
  @field('like_count') likeCount!: number;
  @field('comment_count') commentCount!: number;
  @field('share_count') shareCount!: number;
  @field('is_liked_by_user') isLikedByUser!: boolean;
  @field('visibility') visibility!: 'public' | 'friends' | 'private';
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
  @date('last_synced_at') lastSyncedAt?: Date;
  @field('sync_status') syncStatus!: string;

  // Relationships
  @relation('users', 'user_id') user!: User;
  @children('comments') comments!: any;

  // Computed properties
  get images(): PostImages[] {
    try {
      return this.imagesRaw ? JSON.parse(this.imagesRaw) : [];
    } catch {
      return [];
    }
  }

  set images(value: PostImages[]) {
    this.imagesRaw = JSON.stringify(value);
  }

  get tags(): string[] {
    try {
      return this.tagsRaw ? JSON.parse(this.tagsRaw) : [];
    } catch {
      return [];
    }
  }

  set tags(value: string[]) {
    this.tagsRaw = JSON.stringify(value);
  }

  get hasImages(): boolean {
    return this.images.length > 0;
  }

  get hasProduct(): boolean {
    return !!(this.productId && this.productType);
  }

  get hasTags(): boolean {
    return this.tags.length > 0;
  }

  get hasLocation(): boolean {
    return !!(this.location && this.location.trim().length > 0);
  }

  get isPublic(): boolean {
    return this.visibility === 'public';
  }

  get isPrivate(): boolean {
    return this.visibility === 'private';
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

  get pendingImageUploads(): PostImages[] {
    return this.images.filter(image => !image.uploaded && image.localPath);
  }

  // Helper methods
  async toggleLike() {
    await this.update(post => {
      post.isLikedByUser = !post.isLikedByUser;
      post.likeCount += post.isLikedByUser ? 1 : -1;
      post.syncStatus = 'pending';
    });
  }

  async updateContent(newContent: string) {
    await this.update(post => {
      post.content = newContent;
      post.syncStatus = 'pending';
    });
  }

  async addImage(image: PostImages) {
    await this.update(post => {
      const currentImages = post.images;
      currentImages.push(image);
      post.images = currentImages;
      post.syncStatus = 'pending';
    });
  }

  async removeImage(imageUrl: string) {
    await this.update(post => {
      const currentImages = post.images;
      post.images = currentImages.filter(image => image.url !== imageUrl);
      post.syncStatus = 'pending';
    });
  }

  async markImageAsUploaded(imageUrl: string, serverUrl: string) {
    await this.update(post => {
      const currentImages = post.images;
      const imageIndex = currentImages.findIndex(image => image.url === imageUrl);
      if (imageIndex !== -1) {
        currentImages[imageIndex].uploaded = true;
        currentImages[imageIndex].url = serverUrl;
        post.images = currentImages;
      }
    });
  }

  async addTag(tag: string) {
    await this.update(post => {
      const currentTags = post.tags;
      if (!currentTags.includes(tag)) {
        currentTags.push(tag);
        post.tags = currentTags;
        post.syncStatus = 'pending';
      }
    });
  }

  async removeTag(tag: string) {
    await this.update(post => {
      const currentTags = post.tags;
      post.tags = currentTags.filter(t => t !== tag);
      post.syncStatus = 'pending';
    });
  }

  async updateLocation(newLocation: string) {
    await this.update(post => {
      post.location = newLocation;
      post.syncStatus = 'pending';
    });
  }

  async updateVisibility(newVisibility: 'public' | 'friends' | 'private') {
    await this.update(post => {
      post.visibility = newVisibility;
      post.syncStatus = 'pending';
    });
  }

  async incrementCommentCount() {
    await this.update(post => {
      post.commentCount += 1;
    });
  }

  async decrementCommentCount() {
    await this.update(post => {
      post.commentCount = Math.max(0, post.commentCount - 1);
    });
  }

  async incrementShareCount() {
    await this.update(post => {
      post.shareCount += 1;
      post.syncStatus = 'pending';
    });
  }

  async markForSync() {
    await this.update(post => {
      post.syncStatus = 'pending';
    });
  }

  async markAsSynced() {
    await this.update(post => {
      post.syncStatus = 'synced';
      post.lastSyncedAt = new Date();
    });
  }

  async markAsConflicted() {
    await this.update(post => {
      post.syncStatus = 'conflict';
    });
  }

  // Search helpers
  matchesSearch(query: string): boolean {
    const searchTerm = query.toLowerCase();
    return (
      this.content.toLowerCase().includes(searchTerm) ||
      (this.location && this.location.toLowerCase().includes(searchTerm)) ||
      this.tags.some(tag => tag.toLowerCase().includes(searchTerm))
    );
  }

  // Filter helpers
  matchesFilters(filters: {
    visibility?: string[];
    hasImages?: boolean;
    hasProduct?: boolean;
    productTypes?: string[];
    tags?: string[];
    dateRange?: [Date, Date];
    minLikes?: number;
    minComments?: number;
  }): boolean {
    if (filters.visibility && !filters.visibility.includes(this.visibility)) return false;
    if (filters.hasImages !== undefined && this.hasImages !== filters.hasImages) return false;
    if (filters.hasProduct !== undefined && this.hasProduct !== filters.hasProduct) return false;
    
    if (filters.productTypes && this.productType) {
      if (!filters.productTypes.includes(this.productType)) return false;
    }
    
    if (filters.tags && filters.tags.length > 0) {
      const hasMatchingTag = filters.tags.some(tag => this.tags.includes(tag));
      if (!hasMatchingTag) return false;
    }
    
    if (filters.dateRange) {
      const [startDate, endDate] = filters.dateRange;
      if (this.createdAt < startDate || this.createdAt > endDate) return false;
    }
    
    if (filters.minLikes !== undefined && this.likeCount < filters.minLikes) return false;
    if (filters.minComments !== undefined && this.commentCount < filters.minComments) return false;
    
    return true;
  }
}
