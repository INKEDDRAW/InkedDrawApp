/**
 * Follow Model
 * WatermelonDB model for user follows/following relationships
 */

import { Model } from '@nozbe/watermelondb';
import { field, readonly, date, relation } from '@nozbe/watermelondb/decorators';
import { Associations } from '@nozbe/watermelondb/Model';
import User from './User';

export default class Follow extends Model {
  static table = 'follows';
  static associations: Associations = {
    follower: { type: 'belongs_to', key: 'follower_id' },
    following: { type: 'belongs_to', key: 'following_id' },
  };

  @field('server_id') serverId!: string;
  @field('follower_id') followerId!: string;
  @field('following_id') followingId!: string;
  @readonly @date('created_at') createdAt!: Date;
  @date('last_synced_at') lastSyncedAt?: Date;
  @field('sync_status') syncStatus!: string;

  // Relationships
  @relation('users', 'follower_id') follower!: User;
  @relation('users', 'following_id') following!: User;

  // Computed properties
  get isOnline(): boolean {
    return this.syncStatus === 'synced';
  }

  get needsSync(): boolean {
    return this.syncStatus === 'pending';
  }

  get hasConflict(): boolean {
    return this.syncStatus === 'conflict';
  }

  get followDuration(): number {
    return Date.now() - this.createdAt.getTime();
  }

  get followDurationDays(): number {
    return Math.floor(this.followDuration / (1000 * 60 * 60 * 24));
  }

  // Helper methods
  async markForSync() {
    await this.update(follow => {
      follow.syncStatus = 'pending';
    });
  }

  async markAsSynced() {
    await this.update(follow => {
      follow.syncStatus = 'synced';
      follow.lastSyncedAt = new Date();
    });
  }

  async markAsConflicted() {
    await this.update(follow => {
      follow.syncStatus = 'conflict';
    });
  }
}
