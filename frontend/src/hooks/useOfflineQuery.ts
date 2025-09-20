/**
 * Offline Query Hook
 * React hook for querying WatermelonDB with offline-first capabilities
 */

import { useEffect, useState, useCallback, useMemo } from 'react';
import { Observable } from 'rxjs';
import { Model, Q } from '@nozbe/watermelondb';
import { collections } from '../database';
import { useOffline } from '../contexts/OfflineContext';

export interface OfflineQueryOptions<T extends Model> {
  // Query configuration
  where?: any[];
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
  
  // Offline behavior
  fallbackToCache?: boolean;
  refreshOnOnline?: boolean;
  
  // Loading states
  showLoadingOnRefresh?: boolean;
  
  // Error handling
  retryOnError?: boolean;
  maxRetries?: number;
}

export interface OfflineQueryResult<T extends Model> {
  data: T[];
  loading: boolean;
  error: Error | null;
  refreshing: boolean;
  
  // Actions
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
  
  // State
  hasMore: boolean;
  isEmpty: boolean;
  isStale: boolean;
  lastUpdated?: Date;
}

export function useOfflineQuery<T extends Model>(
  tableName: keyof typeof collections,
  options: OfflineQueryOptions<T> = {}
): OfflineQueryResult<T> {
  const {
    where = [],
    sortBy = 'created_at',
    sortOrder = 'desc',
    limit = 20,
    offset = 0,
    fallbackToCache = true,
    refreshOnOnline = true,
    showLoadingOnRefresh = false,
    retryOnError = true,
    maxRetries = 3,
  } = options;

  const { isOnline, syncNow } = useOffline();
  
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>();
  const [retryCount, setRetryCount] = useState(0);

  const collection = collections[tableName] as any;

  // Build query
  const query = useMemo(() => {
    let q = collection.query();
    
    // Apply where conditions
    if (where.length > 0) {
      q = q.where(...where);
    }
    
    // Apply sorting
    if (sortBy) {
      q = q.sortBy(sortBy, sortOrder === 'desc' ? Q.desc : Q.asc);
    }
    
    // Apply pagination
    if (limit) {
      q = q.take(limit);
    }
    
    if (offset) {
      q = q.skip(offset);
    }
    
    return q;
  }, [collection, where, sortBy, sortOrder, limit, offset]);

  // Load data from local database
  const loadLocalData = useCallback(async () => {
    try {
      const results = await query.fetch();
      setData(results);
      setHasMore(results.length === limit);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      console.error('Error loading local data:', err);
      setError(err as Error);
    }
  }, [query, limit]);

  // Refresh data (sync + reload)
  const refresh = useCallback(async () => {
    if (showLoadingOnRefresh) {
      setRefreshing(true);
    }
    
    try {
      // Try to sync if online
      if (isOnline) {
        await syncNow();
      }
      
      // Reload local data
      await loadLocalData();
      setRetryCount(0);
    } catch (err) {
      console.error('Error refreshing data:', err);
      setError(err as Error);
      
      // Retry logic
      if (retryOnError && retryCount < maxRetries) {
        setRetryCount(prev => prev + 1);
        setTimeout(() => refresh(), Math.pow(2, retryCount) * 1000);
      }
    } finally {
      setRefreshing(false);
    }
  }, [isOnline, syncNow, loadLocalData, showLoadingOnRefresh, retryOnError, retryCount, maxRetries]);

  // Load more data (pagination)
  const loadMore = useCallback(async () => {
    if (!hasMore || loading || refreshing) return;
    
    try {
      const moreQuery = collection.query()
        .where(...where)
        .sortBy(sortBy, sortOrder === 'desc' ? Q.desc : Q.asc)
        .skip(data.length)
        .take(limit);
      
      const moreResults = await moreQuery.fetch();
      
      if (moreResults.length > 0) {
        setData(prev => [...prev, ...moreResults]);
        setHasMore(moreResults.length === limit);
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error('Error loading more data:', err);
      setError(err as Error);
    }
  }, [collection, where, sortBy, sortOrder, data.length, limit, hasMore, loading, refreshing]);

  // Initial load
  useEffect(() => {
    setLoading(true);
    loadLocalData().finally(() => setLoading(false));
  }, [loadLocalData]);

  // Auto-refresh when coming online
  useEffect(() => {
    if (isOnline && refreshOnOnline && !loading) {
      refresh();
    }
  }, [isOnline, refreshOnOnline, loading, refresh]);

  // Subscribe to real-time updates
  useEffect(() => {
    const subscription = query.observe().subscribe({
      next: (results: T[]) => {
        if (!loading && !refreshing) {
          setData(results);
          setHasMore(results.length === limit);
          setLastUpdated(new Date());
        }
      },
      error: (err: Error) => {
        console.error('Query observation error:', err);
        setError(err);
      },
    });

    return () => subscription.unsubscribe();
  }, [query, loading, refreshing, limit]);

  // Computed properties
  const isEmpty = data.length === 0 && !loading;
  const isStale = lastUpdated ? (Date.now() - lastUpdated.getTime()) > 5 * 60 * 1000 : true; // 5 minutes

  return {
    data,
    loading,
    error,
    refreshing,
    refresh,
    loadMore,
    hasMore,
    isEmpty,
    isStale,
    lastUpdated,
  };
}

// Specialized hooks for common queries
export function useOfflineCigars(options: OfflineQueryOptions<any> = {}) {
  return useOfflineQuery('cigars', options);
}

export function useOfflineBeers(options: OfflineQueryOptions<any> = {}) {
  return useOfflineQuery('beers', options);
}

export function useOfflineWines(options: OfflineQueryOptions<any> = {}) {
  return useOfflineQuery('wines', options);
}

export function useOfflinePosts(options: OfflineQueryOptions<any> = {}) {
  return useOfflineQuery('posts', {
    sortBy: 'created_at',
    sortOrder: 'desc',
    ...options,
  });
}

export function useOfflineUserCollection(userId: string, options: OfflineQueryOptions<any> = {}) {
  return useOfflineQuery('collections', {
    where: [Q.where('user_id', userId)],
    sortBy: 'created_at',
    sortOrder: 'desc',
    ...options,
  });
}

export function useOfflineUserRatings(userId: string, options: OfflineQueryOptions<any> = {}) {
  return useOfflineQuery('ratings', {
    where: [Q.where('user_id', userId)],
    sortBy: 'created_at',
    sortOrder: 'desc',
    ...options,
  });
}
