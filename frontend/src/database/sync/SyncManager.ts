/**
 * Sync Manager
 * Handles synchronization between local WatermelonDB and remote server
 */

import { synchronize } from '@nozbe/watermelondb/sync';
import NetInfo from '@react-native-community/netinfo';
import { database, collections, DatabaseUtils } from '../index';
import { supabase } from '../../lib/supabase';

export interface SyncOptions {
  pullChanges?: boolean;
  pushChanges?: boolean;
  sendCreatedAsUpdated?: boolean;
  log?: (...args: any[]) => void;
  conflictResolver?: (table: string, local: any, remote: any) => any;
}

export interface SyncResult {
  success: boolean;
  changes?: {
    created: number;
    updated: number;
    deleted: number;
  };
  error?: string;
  timestamp: Date;
}

export class SyncManager {
  private static instance: SyncManager;
  private isOnline: boolean = true;
  private isSyncing: boolean = false;
  private syncQueue: Array<() => Promise<void>> = [];
  private lastSyncTime?: Date;
  private syncListeners: Array<(result: SyncResult) => void> = [];

  private constructor() {
    this.initializeNetworkListener();
    this.initializePeriodicSync();
  }

  static getInstance(): SyncManager {
    if (!SyncManager.instance) {
      SyncManager.instance = new SyncManager();
    }
    return SyncManager.instance;
  }

  /**
   * Initialize network connectivity listener
   */
  private initializeNetworkListener(): void {
    NetInfo.addEventListener(state => {
      const wasOnline = this.isOnline;
      this.isOnline = state.isConnected ?? false;

      if (!wasOnline && this.isOnline) {
        // Just came back online, trigger sync
        this.syncWhenOnline();
      }
    });
  }

  /**
   * Initialize periodic sync (every 5 minutes when online)
   */
  private initializePeriodicSync(): void {
    setInterval(() => {
      if (this.isOnline && !this.isSyncing) {
        this.syncWhenOnline();
      }
    }, 5 * 60 * 1000); // 5 minutes
  }

  /**
   * Add sync result listener
   */
  addSyncListener(listener: (result: SyncResult) => void): void {
    this.syncListeners.push(listener);
  }

  /**
   * Remove sync result listener
   */
  removeSyncListener(listener: (result: SyncResult) => void): void {
    this.syncListeners = this.syncListeners.filter(l => l !== listener);
  }

  /**
   * Notify all listeners of sync result
   */
  private notifyListeners(result: SyncResult): void {
    this.syncListeners.forEach(listener => {
      try {
        listener(result);
      } catch (error) {
        console.error('Error in sync listener:', error);
      }
    });
  }

  /**
   * Check if device is online
   */
  getIsOnline(): boolean {
    return this.isOnline;
  }

  /**
   * Check if sync is in progress
   */
  getIsSyncing(): boolean {
    return this.isSyncing;
  }

  /**
   * Get last sync time
   */
  getLastSyncTime(): Date | undefined {
    return this.lastSyncTime;
  }

  /**
   * Sync when online (main sync method)
   */
  async syncWhenOnline(options: SyncOptions = {}): Promise<SyncResult> {
    if (!this.isOnline) {
      return {
        success: false,
        error: 'Device is offline',
        timestamp: new Date(),
      };
    }

    if (this.isSyncing) {
      return {
        success: false,
        error: 'Sync already in progress',
        timestamp: new Date(),
      };
    }

    this.isSyncing = true;
    const startTime = new Date();

    try {
      const result = await this.performSync(options);
      this.lastSyncTime = new Date();
      await DatabaseUtils.setAppSetting('last_sync_time', this.lastSyncTime.toISOString());
      
      this.notifyListeners(result);
      return result;
    } catch (error: any) {
      const errorResult: SyncResult = {
        success: false,
        error: error.message || 'Unknown sync error',
        timestamp: new Date(),
      };
      
      this.notifyListeners(errorResult);
      return errorResult;
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Perform the actual synchronization
   */
  private async performSync(options: SyncOptions): Promise<SyncResult> {
    const session = supabase.auth.getSession();
    if (!session) {
      throw new Error('User not authenticated');
    }

    let totalChanges = { created: 0, updated: 0, deleted: 0 };

    await synchronize({
      database,
      pullChanges: async ({ lastPulledAt, schemaVersion, migration }) => {
        const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/sync/pull`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.data.session?.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            lastPulledAt,
            schemaVersion,
            migration,
          }),
        });

        if (!response.ok) {
          throw new Error(`Pull sync failed: ${response.status}`);
        }

        const data = await response.json();
        
        // Count changes
        Object.values(data.changes).forEach((tableChanges: any) => {
          totalChanges.created += tableChanges.created?.length || 0;
          totalChanges.updated += tableChanges.updated?.length || 0;
          totalChanges.deleted += tableChanges.deleted?.length || 0;
        });

        return data;
      },

      pushChanges: async ({ changes, lastPulledAt }) => {
        const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/sync/push`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.data.session?.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            changes,
            lastPulledAt,
          }),
        });

        if (!response.ok) {
          throw new Error(`Push sync failed: ${response.status}`);
        }

        // Count outgoing changes
        Object.values(changes).forEach((tableChanges: any) => {
          totalChanges.created += tableChanges.created?.length || 0;
          totalChanges.updated += tableChanges.updated?.length || 0;
          totalChanges.deleted += tableChanges.deleted?.length || 0;
        });

        return response.json();
      },

      sendCreatedAsUpdated: options.sendCreatedAsUpdated ?? true,
      log: options.log,
      
      // Conflict resolution
      conflictResolver: options.conflictResolver || this.defaultConflictResolver,
    });

    return {
      success: true,
      changes: totalChanges,
      timestamp: new Date(),
    };
  }

  /**
   * Default conflict resolution strategy
   */
  private defaultConflictResolver = (table: string, local: any, remote: any): any => {
    // Strategy: Server wins for most cases, but preserve user's personal data
    switch (table) {
      case 'ratings':
        // User's personal ratings always win
        return local.user_id === remote.user_id ? local : remote;
      
      case 'collections':
        // User's personal collection always wins
        return local.user_id === remote.user_id ? local : remote;
      
      case 'users':
        // Merge user preferences, server wins for other fields
        return {
          ...remote,
          preferences: local.preferences || remote.preferences,
        };
      
      default:
        // Server wins by default (last write wins)
        return remote.updated_at > local.updated_at ? remote : local;
    }
  };

  /**
   * Force full sync (re-download everything)
   */
  async forceFullSync(): Promise<SyncResult> {
    // Clear last sync time to force full re-sync
    await DatabaseUtils.setAppSetting('last_sync_time', '');
    return this.syncWhenOnline();
  }

  /**
   * Queue an action for when online
   */
  queueForSync(action: () => Promise<void>): void {
    this.syncQueue.push(action);
    
    if (this.isOnline) {
      this.processSyncQueue();
    }
  }

  /**
   * Process queued sync actions
   */
  private async processSyncQueue(): Promise<void> {
    while (this.syncQueue.length > 0 && this.isOnline) {
      const action = this.syncQueue.shift();
      if (action) {
        try {
          await action();
        } catch (error) {
          console.error('Error processing sync queue item:', error);
        }
      }
    }
  }

  /**
   * Add item to sync queue table
   */
  async addToSyncQueue(
    tableName: string,
    recordId: string,
    action: 'create' | 'update' | 'delete',
    data: any,
    priority: number = 1
  ): Promise<void> {
    await database.write(async () => {
      await collections.syncQueue.create(item => {
        item.tableName = tableName;
        item.recordId = recordId;
        item.action = action;
        item.data = JSON.stringify(data);
        item.priority = priority;
        item.retryCount = 0;
        item.createdAt = new Date();
      });
    });

    // Try to sync immediately if online
    if (this.isOnline) {
      this.syncWhenOnline();
    }
  }

  /**
   * Get sync queue status
   */
  async getSyncQueueStatus(): Promise<{
    totalItems: number;
    pendingItems: number;
    failedItems: number;
    oldestItem?: Date;
  }> {
    const allItems = await collections.syncQueue.query().fetch();
    const pendingItems = allItems.filter(item => item.retryCount < 3);
    const failedItems = allItems.filter(item => item.retryCount >= 3);
    
    const oldestItem = allItems.length > 0 
      ? new Date(Math.min(...allItems.map(item => item.createdAt.getTime())))
      : undefined;

    return {
      totalItems: allItems.length,
      pendingItems: pendingItems.length,
      failedItems: failedItems.length,
      oldestItem,
    };
  }

  /**
   * Clear sync queue (for testing or reset)
   */
  async clearSyncQueue(): Promise<void> {
    await database.write(async () => {
      const allItems = await collections.syncQueue.query().fetch();
      for (const item of allItems) {
        await item.destroyPermanently();
      }
    });
  }
}
