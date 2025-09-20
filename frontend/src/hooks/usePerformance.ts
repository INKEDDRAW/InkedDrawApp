/**
 * Performance Hook
 * React hook for performance monitoring and optimization
 */

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface PerformanceMetrics {
  responseTime: number;
  throughput: number;
  errorRate: number;
  cacheHitRate: number;
  memoryUsage: number;
  cpuUsage: number;
  activeConnections: number;
  queueLength: number;
}

export interface PerformanceAlert {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  metric: string;
  value: number;
  threshold: number;
  message: string;
  timestamp: Date;
}

export interface PerformanceTrend {
  metric: string;
  direction: 'up' | 'down' | 'stable';
  change: number;
  period: string;
}

export interface PerformanceSummary {
  current: PerformanceMetrics;
  alerts: number;
  trends: PerformanceTrend[];
  uptime: number;
}

export interface CacheStats {
  hitRate: number;
  missRate: number;
  totalRequests: number;
  totalHits: number;
  totalMisses: number;
  memoryUsage: number;
  keyCount: number;
}

export interface OptimizationResult {
  strategy: string;
  applied: boolean;
  impact: string;
  metrics: {
    before: any;
    after: any;
  };
  timestamp: Date;
}

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3000';

/**
 * Performance monitoring hook
 */
export const usePerformance = () => {
  const queryClient = useQueryClient();
  const [isMonitoring, setIsMonitoring] = useState(false);

  // Get performance summary
  const {
    data: performanceSummary,
    isLoading: isLoadingSummary,
    error: summaryError,
    refetch: refetchSummary,
  } = useQuery<PerformanceSummary>({
    queryKey: ['performance', 'summary'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/api/performance/summary`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch performance summary');
      return response.json();
    },
    refetchInterval: isMonitoring ? 30000 : false, // Refetch every 30 seconds when monitoring
    staleTime: 25000, // Consider data stale after 25 seconds
  });

  // Get detailed metrics
  const {
    data: detailedMetrics,
    isLoading: isLoadingMetrics,
    error: metricsError,
  } = useQuery({
    queryKey: ['performance', 'metrics'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/api/performance/metrics`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch detailed metrics');
      return response.json();
    },
    enabled: isMonitoring,
    refetchInterval: isMonitoring ? 60000 : false, // Refetch every minute when monitoring
  });

  // Get cache statistics
  const {
    data: cacheStats,
    isLoading: isLoadingCache,
    error: cacheError,
  } = useQuery<CacheStats>({
    queryKey: ['performance', 'cache', 'stats'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/api/performance/cache/stats`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch cache stats');
      return response.json();
    },
    refetchInterval: isMonitoring ? 30000 : false,
  });

  // Get optimization history
  const {
    data: optimizationHistory,
    isLoading: isLoadingOptimization,
    error: optimizationError,
  } = useQuery<OptimizationResult[]>({
    queryKey: ['performance', 'optimization', 'history'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/api/performance/optimization/history?limit=20`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch optimization history');
      return response.json();
    },
    refetchInterval: isMonitoring ? 300000 : false, // Refetch every 5 minutes
  });

  // Get optimization recommendations
  const {
    data: recommendations,
    isLoading: isLoadingRecommendations,
    error: recommendationsError,
  } = useQuery<string[]>({
    queryKey: ['performance', 'optimization', 'recommendations'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/api/performance/optimization/recommendations`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch recommendations');
      return response.json();
    },
    refetchInterval: isMonitoring ? 600000 : false, // Refetch every 10 minutes
  });

  // Run optimization mutation
  const runOptimizationMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`${API_BASE}/api/performance/optimization/run`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) throw new Error('Failed to run optimization');
      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch performance data
      queryClient.invalidateQueries({ queryKey: ['performance'] });
    },
  });

  // Clear cache mutation
  const clearCacheMutation = useMutation({
    mutationFn: async (pattern?: string) => {
      const url = pattern 
        ? `${API_BASE}/api/performance/cache/pattern`
        : `${API_BASE}/api/performance/cache`;
      
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: pattern ? JSON.stringify({ pattern }) : undefined,
      });
      if (!response.ok) throw new Error('Failed to clear cache');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['performance', 'cache'] });
    },
  });

  // Optimize cache mutation
  const optimizeCacheMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`${API_BASE}/api/performance/cache/optimize`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to optimize cache');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['performance', 'cache'] });
    },
  });

  // Clear alerts mutation
  const clearAlertsMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`${API_BASE}/api/performance/alerts`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to clear alerts');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['performance'] });
    },
  });

  // Start/stop monitoring
  const startMonitoring = useCallback(() => {
    setIsMonitoring(true);
  }, []);

  const stopMonitoring = useCallback(() => {
    setIsMonitoring(false);
  }, []);

  // Get performance status
  const getPerformanceStatus = useCallback(() => {
    if (!performanceSummary) return 'unknown';
    
    const { current } = performanceSummary;
    
    // Critical issues
    if (current.errorRate > 0.1 || current.responseTime > 5000 || current.memoryUsage > 0.95) {
      return 'critical';
    }
    
    // Warning issues
    if (current.errorRate > 0.05 || current.responseTime > 2000 || current.memoryUsage > 0.8) {
      return 'warning';
    }
    
    // Good performance
    if (current.errorRate < 0.01 && current.responseTime < 500 && current.cacheHitRate > 0.8) {
      return 'excellent';
    }
    
    return 'good';
  }, [performanceSummary]);

  // Get performance score (0-100)
  const getPerformanceScore = useCallback(() => {
    if (!performanceSummary) return 0;
    
    const { current } = performanceSummary;
    let score = 100;
    
    // Deduct points for poor metrics
    if (current.responseTime > 1000) score -= 20;
    if (current.errorRate > 0.05) score -= 30;
    if (current.memoryUsage > 0.8) score -= 15;
    if (current.cacheHitRate < 0.7) score -= 15;
    if (current.cpuUsage > 0.8) score -= 10;
    if (performanceSummary.alerts > 0) score -= 10;
    
    return Math.max(0, score);
  }, [performanceSummary]);

  // Format metrics for display
  const formatMetric = useCallback((value: number, type: 'time' | 'percentage' | 'count' | 'rate') => {
    switch (type) {
      case 'time':
        return value < 1000 ? `${Math.round(value)}ms` : `${(value / 1000).toFixed(1)}s`;
      case 'percentage':
        return `${(value * 100).toFixed(1)}%`;
      case 'count':
        return value.toLocaleString();
      case 'rate':
        return `${value.toFixed(2)}/s`;
      default:
        return value.toString();
    }
  }, []);

  return {
    // Data
    performanceSummary,
    detailedMetrics,
    cacheStats,
    optimizationHistory,
    recommendations,
    
    // Loading states
    isLoadingSummary,
    isLoadingMetrics,
    isLoadingCache,
    isLoadingOptimization,
    isLoadingRecommendations,
    
    // Error states
    summaryError,
    metricsError,
    cacheError,
    optimizationError,
    recommendationsError,
    
    // Monitoring state
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    
    // Actions
    runOptimization: runOptimizationMutation.mutate,
    clearCache: clearCacheMutation.mutate,
    optimizeCache: optimizeCacheMutation.mutate,
    clearAlerts: clearAlertsMutation.mutate,
    refetchSummary,
    
    // Mutation states
    isRunningOptimization: runOptimizationMutation.isPending,
    isClearingCache: clearCacheMutation.isPending,
    isOptimizingCache: optimizeCacheMutation.isPending,
    isClearingAlerts: clearAlertsMutation.isPending,
    
    // Computed values
    performanceStatus: getPerformanceStatus(),
    performanceScore: getPerformanceScore(),
    formatMetric,
  };
};

/**
 * Performance dashboard hook
 */
export const usePerformanceDashboard = () => {
  const {
    data: dashboardData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['performance', 'dashboard'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/api/performance/dashboard`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch dashboard data');
      return response.json();
    },
    refetchInterval: 60000, // Refetch every minute
    staleTime: 50000, // Consider data stale after 50 seconds
  });

  return {
    dashboardData,
    isLoading,
    error,
    refetch,
  };
};
