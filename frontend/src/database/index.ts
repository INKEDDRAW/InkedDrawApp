/**
 * WatermelonDB Database Configuration
 * Initializes the offline-first database
 */

import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import { schema } from './schema';

// Import all models
import User from './models/User';
import Cigar from './models/Cigar';
import Beer from './models/Beer';
import Wine from './models/Wine';
import Rating from './models/Rating';
import Collection from './models/Collection';
import Post from './models/Post';
import Comment from './models/Comment';
import Follow from './models/Follow';
import SyncQueue from './models/SyncQueue';
import AppSetting from './models/AppSetting';

// Database adapter configuration
const adapter = new SQLiteAdapter({
  schema,
  // Database file name
  dbName: 'InkedDrawDB',
  // Migration settings
  migrations: [],
  // Performance settings
  jsi: true, // Use JSI for better performance (React Native 0.61+)
  onSetUpError: (error) => {
    console.error('Database setup error:', error);
  },
});

// Initialize database
export const database = new Database({
  adapter,
  modelClasses: [
    User,
    Cigar,
    Beer,
    Wine,
    Rating,
    Collection,
    Post,
    Comment,
    Follow,
    SyncQueue,
    AppSetting,
  ],
});

// Database collections for easy access
export const collections = {
  users: database.collections.get<User>('users'),
  cigars: database.collections.get<Cigar>('cigars'),
  beers: database.collections.get<Beer>('beers'),
  wines: database.collections.get<Wine>('wines'),
  ratings: database.collections.get<Rating>('ratings'),
  collections: database.collections.get<Collection>('collections'),
  posts: database.collections.get<Post>('posts'),
  comments: database.collections.get<Comment>('comments'),
  follows: database.collections.get<Follow>('follows'),
  syncQueue: database.collections.get<SyncQueue>('sync_queue'),
  appSettings: database.collections.get<AppSetting>('app_settings'),
};

// Database utilities
export class DatabaseUtils {
  /**
   * Clear all data (for logout or reset)
   */
  static async clearAllData(): Promise<void> {
    await database.write(async () => {
      await database.unsafeResetDatabase();
    });
  }

  /**
   * Get database size and statistics
   */
  static async getDatabaseStats(): Promise<{
    totalRecords: number;
    tableStats: Record<string, number>;
    pendingSyncItems: number;
    lastSyncTime?: Date;
  }> {
    const tableStats: Record<string, number> = {};
    let totalRecords = 0;

    // Count records in each table
    for (const [tableName, collection] of Object.entries(collections)) {
      const count = await collection.query().fetchCount();
      tableStats[tableName] = count;
      totalRecords += count;
    }

    // Count pending sync items
    const pendingSyncItems = await collections.syncQueue.query().fetchCount();

    // Get last sync time from app settings
    const lastSyncSetting = await collections.appSettings
      .query()
      .where('key', 'last_sync_time')
      .fetch();
    
    const lastSyncTime = lastSyncSetting.length > 0 
      ? new Date(lastSyncSetting[0].value) 
      : undefined;

    return {
      totalRecords,
      tableStats,
      pendingSyncItems,
      lastSyncTime,
    };
  }

  /**
   * Compact database (remove deleted records)
   */
  static async compactDatabase(): Promise<void> {
    // WatermelonDB handles this automatically, but we can trigger it
    await database.adapter.unsafeExecute({
      sql: 'VACUUM',
      args: [],
    });
  }

  /**
   * Export database for backup
   */
  static async exportDatabase(): Promise<string> {
    // This would export the database to a JSON format
    // Implementation depends on specific backup requirements
    const stats = await this.getDatabaseStats();
    return JSON.stringify({
      exportDate: new Date().toISOString(),
      stats,
      // Add actual data export here if needed
    });
  }

  /**
   * Check database integrity
   */
  static async checkIntegrity(): Promise<boolean> {
    try {
      const result = await database.adapter.unsafeExecute({
        sql: 'PRAGMA integrity_check',
        args: [],
      });
      return result.length === 1 && result[0].integrity_check === 'ok';
    } catch (error) {
      console.error('Database integrity check failed:', error);
      return false;
    }
  }

  /**
   * Get app setting value
   */
  static async getAppSetting(key: string, defaultValue?: string): Promise<string | undefined> {
    const settings = await collections.appSettings
      .query()
      .where('key', key)
      .fetch();
    
    return settings.length > 0 ? settings[0].value : defaultValue;
  }

  /**
   * Set app setting value
   */
  static async setAppSetting(key: string, value: string): Promise<void> {
    await database.write(async () => {
      const existingSettings = await collections.appSettings
        .query()
        .where('key', key)
        .fetch();

      if (existingSettings.length > 0) {
        await existingSettings[0].update(setting => {
          setting.value = value;
          setting.updatedAt = new Date();
        });
      } else {
        await collections.appSettings.create(setting => {
          setting.key = key;
          setting.value = value;
          setting.updatedAt = new Date();
        });
      }
    });
  }

  /**
   * Get current user from local database
   */
  static async getCurrentUser(): Promise<User | null> {
    const currentUserId = await this.getAppSetting('current_user_id');
    if (!currentUserId) return null;

    const users = await collections.users
      .query()
      .where('server_id', currentUserId)
      .fetch();

    return users.length > 0 ? users[0] : null;
  }

  /**
   * Set current user in local database
   */
  static async setCurrentUser(userId: string): Promise<void> {
    await this.setAppSetting('current_user_id', userId);
  }

  /**
   * Clear current user (logout)
   */
  static async clearCurrentUser(): Promise<void> {
    await database.write(async () => {
      // Remove current user setting
      const userSettings = await collections.appSettings
        .query()
        .where('key', 'current_user_id')
        .fetch();

      for (const setting of userSettings) {
        await setting.destroyPermanently();
      }
    });
  }

  /**
   * Search across multiple tables
   */
  static async globalSearch(query: string, limit: number = 20): Promise<{
    cigars: Cigar[];
    beers: Beer[];
    wines: Wine[];
    posts: Post[];
    users: User[];
  }> {
    const searchTerm = query.toLowerCase();

    const [cigars, beers, wines, posts, users] = await Promise.all([
      collections.cigars
        .query()
        .where('name', 'LIKE', `%${searchTerm}%`)
        .orWhere('brand', 'LIKE', `%${searchTerm}%`)
        .limit(limit)
        .fetch(),
      
      collections.beers
        .query()
        .where('name', 'LIKE', `%${searchTerm}%`)
        .orWhere('brewery', 'LIKE', `%${searchTerm}%`)
        .limit(limit)
        .fetch(),
      
      collections.wines
        .query()
        .where('name', 'LIKE', `%${searchTerm}%`)
        .orWhere('winery', 'LIKE', `%${searchTerm}%`)
        .limit(limit)
        .fetch(),
      
      collections.posts
        .query()
        .where('content', 'LIKE', `%${searchTerm}%`)
        .limit(limit)
        .fetch(),
      
      collections.users
        .query()
        .where('username', 'LIKE', `%${searchTerm}%`)
        .orWhere('display_name', 'LIKE', `%${searchTerm}%`)
        .limit(limit)
        .fetch(),
    ]);

    return { cigars, beers, wines, posts, users };
  }
}

export default database;
