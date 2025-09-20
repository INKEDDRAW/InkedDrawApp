/**
 * Recommendations Hook
 * Custom hook for AI-powered recommendations
 */

import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useOfflineQuery } from './useOfflineQuery';
import { useOfflineMutation } from './useOfflineMutation';
import { database, collections } from '../database';

export interface RecommendationRequest {
  productType?: 'cigar' | 'beer' | 'wine';
  limit?: number;
  diversityWeight?: number;
  includeReasons?: boolean;
}

export interface Recommendation {
  productId: string;
  productType: 'cigar' | 'beer' | 'wine';
  score: number;
  confidence: number;
  reason: string;
  algorithm: string;
  product?: any;
}

export interface RecommendationResponse {
  recommendations: Recommendation[];
  totalCount: number;
  algorithms: string[];
  userProfile?: any;
}

export function useRecommendations(request: RecommendationRequest = {}) {
  const { user } = useAuth();
  const [lastFetchTime, setLastFetchTime] = useState<Date | null>(null);

  // Fetch recommendations from server
  const {
    data: serverRecommendations,
    loading: serverLoading,
    error: serverError,
    refresh: refreshServer,
  } = useOfflineQuery('recommendations', {
    endpoint: '/api/v1/recommendations',
    params: {
      type: request.productType,
      limit: request.limit || 20,
      diversity: request.diversityWeight || 0.3,
      include_reasons: request.includeReasons !== false,
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Get cached recommendations from local database
  const {
    data: cachedRecommendations,
    loading: cacheLoading,
  } = useOfflineQuery('cached_recommendations', {
    where: [
      ['user_id', user?.id || ''],
      ...(request.productType ? [['product_type', request.productType]] : []),
    ],
    sortBy: 'score',
    sortOrder: 'desc',
    limit: request.limit || 20,
  });

  // Combine server and cached recommendations
  const recommendations = serverRecommendations?.recommendations || cachedRecommendations || [];
  const loading = serverLoading || cacheLoading;
  const error = serverError;

  // Cache recommendations locally
  const cacheRecommendations = useCallback(async (recs: Recommendation[]) => {
    if (!user || !recs.length) return;

    try {
      await database.write(async () => {
        // Clear old recommendations for this user
        const oldRecs = await collections.recommendations
          .query()
          .where('user_id', user.id)
          .fetch();

        for (const oldRec of oldRecs) {
          await oldRec.destroyPermanently();
        }

        // Add new recommendations
        for (const rec of recs) {
          await collections.recommendations.create(record => {
            record.serverId = `rec_${Date.now()}_${Math.random()}`;
            record.userId = user.id;
            record.productId = rec.productId;
            record.productType = rec.productType;
            record.score = rec.score;
            record.confidence = rec.confidence;
            record.reason = rec.reason;
            record.algorithm = rec.algorithm;
            record.createdAt = new Date();
            record.syncStatus = 'synced';
          });
        }
      });

      setLastFetchTime(new Date());
    } catch (error) {
      console.warn('Failed to cache recommendations:', error);
    }
  }, [user]);

  // Cache recommendations when they arrive from server
  useEffect(() => {
    if (serverRecommendations?.recommendations) {
      cacheRecommendations(serverRecommendations.recommendations);
    }
  }, [serverRecommendations, cacheRecommendations]);

  const refresh = useCallback(async () => {
    await refreshServer();
  }, [refreshServer]);

  return {
    recommendations,
    loading,
    error,
    refresh,
    lastFetchTime,
    userProfile: serverRecommendations?.userProfile,
    algorithms: serverRecommendations?.algorithms || [],
  };
}

export function useSimilarProducts(productId: string, productType: 'cigar' | 'beer' | 'wine') {
  return useOfflineQuery('similar_products', {
    endpoint: `/api/v1/recommendations/similar/${productType}/${productId}`,
    params: { limit: 10 },
    enabled: !!productId && !!productType,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useTrendingProducts(productType?: 'cigar' | 'beer' | 'wine') {
  return useOfflineQuery('trending_products', {
    endpoint: '/api/v1/recommendations/trending',
    params: {
      type: productType,
      limit: 15,
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
}

export function useUserTasteProfile() {
  const { user } = useAuth();

  return useOfflineQuery('user_taste_profile', {
    endpoint: '/api/v1/recommendations/profile/taste',
    enabled: !!user,
    staleTime: 60 * 60 * 1000, // 1 hour
  });
}

export function useRecommendationFeedback() {
  return useOfflineMutation(
    async (variables: {
      recommendationId: string;
      rating?: number;
      action: 'viewed' | 'liked' | 'purchased' | 'dismissed';
    }) => {
      // Track feedback locally first
      await database.write(async () => {
        await collections.recommendationFeedback.create(record => {
          record.serverId = `feedback_${Date.now()}_${Math.random()}`;
          record.recommendationId = variables.recommendationId;
          record.rating = variables.rating;
          record.action = variables.action;
          record.createdAt = new Date();
          record.syncStatus = 'pending';
        });
      });

      return { success: true };
    },
    {
      syncPriority: 3,
      optimisticUpdate: true,
    }
  );
}

export function usePersonalizedRecommendations(options: {
  productType?: 'cigar' | 'beer' | 'wine';
  timeWindow?: number;
  limit?: number;
} = {}) {
  return useOfflineQuery('personalized_recommendations', {
    endpoint: '/api/v1/recommendations/personalized',
    params: {
      type: options.productType,
      time_window: options.timeWindow || 90,
      limit: options.limit || 15,
    },
    staleTime: 15 * 60 * 1000, // 15 minutes
  });
}

export function useCollaborativeRecommendations(type: 'user-based' | 'item-based' | 'hybrid' = 'hybrid') {
  return useOfflineQuery('collaborative_recommendations', {
    endpoint: `/api/v1/recommendations/collaborative/${type}`,
    params: { limit: 15 },
    staleTime: 20 * 60 * 1000, // 20 minutes
  });
}

export function useRecommendationStats() {
  return useOfflineQuery('recommendation_stats', {
    endpoint: '/api/v1/recommendations/stats',
    staleTime: 60 * 60 * 1000, // 1 hour
  });
}

// Hook for managing recommendation preferences
export function useRecommendationPreferences() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState({
    enablePersonalized: true,
    enableCollaborative: true,
    enableTrending: true,
    diversityWeight: 0.3,
    maxRecommendations: 20,
    categories: {
      cigars: true,
      beers: true,
      wines: true,
    },
    priceRanges: {
      budget: true,
      mid: true,
      premium: true,
      luxury: true,
    },
  });

  // Load preferences from local storage
  useEffect(() => {
    const loadPreferences = async () => {
      if (!user) return;

      try {
        const userPrefs = await collections.userPreferences
          .query()
          .where('user_id', user.id)
          .where('preference_type', 'recommendations')
          .fetch();

        if (userPrefs.length > 0) {
          const prefs = JSON.parse(userPrefs[0].preferences);
          setPreferences(prev => ({ ...prev, ...prefs }));
        }
      } catch (error) {
        console.warn('Failed to load recommendation preferences:', error);
      }
    };

    loadPreferences();
  }, [user]);

  // Save preferences
  const updatePreferences = useCallback(async (newPreferences: Partial<typeof preferences>) => {
    if (!user) return;

    const updatedPrefs = { ...preferences, ...newPreferences };
    setPreferences(updatedPrefs);

    try {
      await database.write(async () => {
        const existingPrefs = await collections.userPreferences
          .query()
          .where('user_id', user.id)
          .where('preference_type', 'recommendations')
          .fetch();

        if (existingPrefs.length > 0) {
          await existingPrefs[0].update(record => {
            record.preferences = JSON.stringify(updatedPrefs);
            record.syncStatus = 'pending';
          });
        } else {
          await collections.userPreferences.create(record => {
            record.serverId = `pref_${Date.now()}_${Math.random()}`;
            record.userId = user.id;
            record.preferenceType = 'recommendations';
            record.preferences = JSON.stringify(updatedPrefs);
            record.syncStatus = 'pending';
          });
        }
      });
    } catch (error) {
      console.warn('Failed to save recommendation preferences:', error);
    }
  }, [user, preferences]);

  return {
    preferences,
    updatePreferences,
  };
}
