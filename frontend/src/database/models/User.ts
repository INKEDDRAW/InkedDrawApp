/**
 * User Model
 * WatermelonDB model for user data
 */

import { Model } from '@nozbe/watermelondb';
import { field, readonly, date, children, lazy } from '@nozbe/watermelondb/decorators';
import { Associations } from '@nozbe/watermelondb/Model';

export interface UserPreferences {
  cigars: string[];
  beers: string[];
  wines: string[];
  notifications: {
    posts: boolean;
    comments: boolean;
    follows: boolean;
    recommendations: boolean;
  };
  privacy: {
    profile_visibility: 'public' | 'friends' | 'private';
    collection_visibility: 'public' | 'friends' | 'private';
    activity_visibility: 'public' | 'friends' | 'private';
  };
}

export default class User extends Model {
  static table = 'users';
  static associations: Associations = {
    ratings: { type: 'has_many', foreignKey: 'user_id' },
    collections: { type: 'has_many', foreignKey: 'user_id' },
    posts: { type: 'has_many', foreignKey: 'user_id' },
    comments: { type: 'has_many', foreignKey: 'user_id' },
    followers: { type: 'has_many', foreignKey: 'following_id' },
    following: { type: 'has_many', foreignKey: 'follower_id' },
  };

  @field('server_id') serverId!: string;
  @field('email') email!: string;
  @field('username') username!: string;
  @field('display_name') displayName!: string;
  @field('avatar_url') avatarUrl?: string;
  @field('bio') bio?: string;
  @field('location') location?: string;
  @field('is_age_verified') isAgeVerified!: boolean;
  @field('preferences') preferencesRaw!: string;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
  @date('last_synced_at') lastSyncedAt?: Date;
  @field('sync_status') syncStatus!: string;

  // Relationships
  @children('ratings') ratings!: any;
  @children('collections') collections!: any;
  @children('posts') posts!: any;
  @children('comments') comments!: any;
  @children('follows') followers!: any;
  @children('follows') following!: any;

  // Computed properties
  get preferences(): UserPreferences {
    try {
      return JSON.parse(this.preferencesRaw);
    } catch {
      return {
        cigars: [],
        beers: [],
        wines: [],
        notifications: {
          posts: true,
          comments: true,
          follows: true,
          recommendations: true,
        },
        privacy: {
          profile_visibility: 'public',
          collection_visibility: 'public',
          activity_visibility: 'public',
        },
      };
    }
  }

  set preferences(value: UserPreferences) {
    this.preferencesRaw = JSON.stringify(value);
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

  // Lazy queries for related data
  @lazy followerCount = this.collections
    .get('follows')
    .query()
    .observeCount();

  @lazy followingCount = this.collections
    .get('follows')
    .query()
    .observeCount();

  @lazy ratingsCount = this.ratings.observeCount();

  @lazy postsCount = this.posts.observeCount();

  // Helper methods
  async updatePreferences(newPreferences: Partial<UserPreferences>) {
    await this.update(user => {
      const currentPrefs = user.preferences;
      user.preferences = { ...currentPrefs, ...newPreferences };
      user.syncStatus = 'pending';
    });
  }

  async markForSync() {
    await this.update(user => {
      user.syncStatus = 'pending';
    });
  }

  async markAsSynced() {
    await this.update(user => {
      user.syncStatus = 'synced';
      user.lastSyncedAt = new Date();
    });
  }

  async markAsConflicted() {
    await this.update(user => {
      user.syncStatus = 'conflict';
    });
  }
}
