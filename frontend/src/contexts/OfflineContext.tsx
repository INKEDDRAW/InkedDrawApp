/**
 * Offline Context
 * Manages offline-first functionality and sync state
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { SyncManager, SyncResult } from '../database/sync/SyncManager';
import { DatabaseUtils } from '../database';
import { useAuth } from './AuthContext';

interface OfflineContextType {
  // Network state
  isOnline: boolean;
  isConnected: boolean;
  connectionType: string | null;
  
  // Sync state
  isSyncing: boolean;
  lastSyncTime?: Date;
  syncProgress?: number;
  syncError?: string;
  
  // Sync actions
  syncNow: () => Promise<SyncResult>;
  forceFullSync: () => Promise<SyncResult>;
  
  // Queue status
  pendingSyncItems: number;
  failedSyncItems: number;
  
  // Database stats
  databaseStats?: {
    totalRecords: number;
    tableStats: Record<string, number>;
    pendingSyncItems: number;
    lastSyncTime?: Date;
  };
  
  // Utilities
  refreshDatabaseStats: () => Promise<void>;
  clearOfflineData: () => Promise<void>;
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined);

interface OfflineProviderProps {
  children: ReactNode;
}

export const OfflineProvider: React.FC<OfflineProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [isOnline, setIsOnline] = useState(true);
  const [isConnected, setIsConnected] = useState(true);
  const [connectionType, setConnectionType] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | undefined>();
  const [syncProgress, setSyncProgress] = useState<number | undefined>();
  const [syncError, setSyncError] = useState<string | undefined>();
  const [pendingSyncItems, setPendingSyncItems] = useState(0);
  const [failedSyncItems, setFailedSyncItems] = useState(0);
  const [databaseStats, setDatabaseStats] = useState<any>();

  const syncManager = SyncManager.getInstance();

  // Initialize network monitoring
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected ?? false);
      setIsConnected(state.isInternetReachable ?? false);
      setConnectionType(state.type);
    });

    // Get initial network state
    NetInfo.fetch().then(state => {
      setIsOnline(state.isConnected ?? false);
      setIsConnected(state.isInternetReachable ?? false);
      setConnectionType(state.type);
    });

    return unsubscribe;
  }, []);

  // Initialize sync manager listeners
  useEffect(() => {
    const handleSyncResult = (result: SyncResult) => {
      setIsSyncing(false);
      setSyncProgress(undefined);
      
      if (result.success) {
        setLastSyncTime(result.timestamp);
        setSyncError(undefined);
      } else {
        setSyncError(result.error);
      }
      
      // Refresh stats after sync
      refreshDatabaseStats();
    };

    syncManager.addSyncListener(handleSyncResult);

    return () => {
      syncManager.removeSyncListener(handleSyncResult);
    };
  }, []);

  // Monitor sync manager state
  useEffect(() => {
    const interval = setInterval(() => {
      setIsSyncing(syncManager.getIsSyncing());
      setLastSyncTime(syncManager.getLastSyncTime());
      
      // Update sync queue status
      syncManager.getSyncQueueStatus().then(status => {
        setPendingSyncItems(status.pendingItems);
        setFailedSyncItems(status.failedItems);
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Load initial database stats
  useEffect(() => {
    if (user) {
      refreshDatabaseStats();
    }
  }, [user]);

  const syncNow = async (): Promise<SyncResult> => {
    if (!user) {
      return {
        success: false,
        error: 'User not authenticated',
        timestamp: new Date(),
      };
    }

    setIsSyncing(true);
    setSyncError(undefined);
    setSyncProgress(0);

    try {
      const result = await syncManager.syncWhenOnline();
      return result;
    } catch (error: any) {
      const errorResult: SyncResult = {
        success: false,
        error: error.message,
        timestamp: new Date(),
      };
      setSyncError(error.message);
      return errorResult;
    } finally {
      setIsSyncing(false);
      setSyncProgress(undefined);
    }
  };

  const forceFullSync = async (): Promise<SyncResult> => {
    if (!user) {
      return {
        success: false,
        error: 'User not authenticated',
        timestamp: new Date(),
      };
    }

    setIsSyncing(true);
    setSyncError(undefined);
    setSyncProgress(0);

    try {
      const result = await syncManager.forceFullSync();
      return result;
    } catch (error: any) {
      const errorResult: SyncResult = {
        success: false,
        error: error.message,
        timestamp: new Date(),
      };
      setSyncError(error.message);
      return errorResult;
    } finally {
      setIsSyncing(false);
      setSyncProgress(undefined);
    }
  };

  const refreshDatabaseStats = async (): Promise<void> => {
    try {
      const stats = await DatabaseUtils.getDatabaseStats();
      setDatabaseStats(stats);
    } catch (error) {
      console.error('Error refreshing database stats:', error);
    }
  };

  const clearOfflineData = async (): Promise<void> => {
    try {
      await DatabaseUtils.clearAllData();
      await refreshDatabaseStats();
      setPendingSyncItems(0);
      setFailedSyncItems(0);
      setLastSyncTime(undefined);
    } catch (error) {
      console.error('Error clearing offline data:', error);
      throw error;
    }
  };

  const value: OfflineContextType = {
    // Network state
    isOnline,
    isConnected,
    connectionType,
    
    // Sync state
    isSyncing,
    lastSyncTime,
    syncProgress,
    syncError,
    
    // Sync actions
    syncNow,
    forceFullSync,
    
    // Queue status
    pendingSyncItems,
    failedSyncItems,
    
    // Database stats
    databaseStats,
    
    // Utilities
    refreshDatabaseStats,
    clearOfflineData,
  };

  return (
    <OfflineContext.Provider value={value}>
      {children}
    </OfflineContext.Provider>
  );
};

export const useOffline = (): OfflineContextType => {
  const context = useContext(OfflineContext);
  if (context === undefined) {
    throw new Error('useOffline must be used within an OfflineProvider');
  }
  return context;
};

// Hook for checking if a specific feature works offline
export const useOfflineCapability = (feature: string): boolean => {
  const { isOnline } = useOffline();
  
  // Define which features work offline
  const offlineFeatures = [
    'browse_cigars',
    'browse_beers', 
    'browse_wines',
    'view_collection',
    'rate_products',
    'write_reviews',
    'search_local',
    'view_profile',
    'edit_preferences',
    'view_posts',
    'create_posts',
    'like_posts',
    'comment_posts',
  ];
  
  // If online, all features work
  if (isOnline) return true;
  
  // If offline, only certain features work
  return offlineFeatures.includes(feature);
};

// Hook for optimistic updates
export const useOptimisticUpdate = () => {
  const { isOnline } = useOffline();
  const syncManager = SyncManager.getInstance();
  
  const performOptimisticUpdate = async <T>(
    localUpdate: () => Promise<T>,
    syncAction: () => Promise<void>,
    rollbackAction?: () => Promise<void>
  ): Promise<T> => {
    // Always perform local update first (optimistic)
    const result = await localUpdate();
    
    if (isOnline) {
      try {
        // Try to sync immediately if online
        await syncAction();
      } catch (error) {
        console.error('Sync failed, will retry later:', error);
        // Don't rollback - let sync manager handle retry
      }
    } else {
      // Queue for later sync when online
      syncManager.queueForSync(syncAction);
    }
    
    return result;
  };
  
  return { performOptimisticUpdate };
};
