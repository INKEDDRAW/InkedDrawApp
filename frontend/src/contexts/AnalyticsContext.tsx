/**
 * Analytics Context
 * Manages analytics tracking and feature flags on the frontend
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';

interface ProductInteraction {
  productId: string;
  productType: 'cigar' | 'beer' | 'wine';
  action: 'view' | 'like' | 'review' | 'share' | 'purchase';
  rating?: number;
  price?: number;
  brand?: string;
  category?: string;
}

interface SocialInteraction {
  targetUserId?: string;
  postId?: string;
  commentId?: string;
  action: 'follow' | 'unfollow' | 'like' | 'comment' | 'share' | 'post_create' | 'post_view';
  content_type?: 'text' | 'image' | 'video';
}

interface AnalyticsContextType {
  // Feature flags
  featureFlags: Record<string, boolean>;
  isFeatureEnabled: (feature: string) => boolean;
  refreshFeatureFlags: () => Promise<void>;

  // Event tracking
  trackEvent: (event: string, properties?: Record<string, any>) => Promise<void>;
  trackScreenView: (screenName: string, properties?: Record<string, any>) => Promise<void>;
  trackProductInteraction: (interaction: ProductInteraction) => Promise<void>;
  trackSocialInteraction: (interaction: SocialInteraction) => Promise<void>;
  trackSearch: (query: string, category?: string, resultsCount?: number) => Promise<void>;
  trackError: (error: string, context?: string, severity?: 'low' | 'medium' | 'high') => Promise<void>;

  // User journey tracking
  trackOnboardingStep: (step: string, completed: boolean, stepNumber?: number) => Promise<void>;
  trackAgeVerification: (status: 'started' | 'completed' | 'failed' | 'expired', metadata?: any) => Promise<void>;
  trackSubscription: (action: 'subscribe' | 'unsubscribe' | 'upgrade' | 'downgrade', tier: string, price?: number) => Promise<void>;

  // State
  loading: boolean;
}

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined);

interface AnalyticsProviderProps {
  children: ReactNode;
}

export const AnalyticsProvider: React.FC<AnalyticsProviderProps> = ({ children }) => {
  const { user, session } = useAuth();
  const [featureFlags, setFeatureFlags] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);

  // Load feature flags when user changes
  useEffect(() => {
    if (user && session) {
      refreshFeatureFlags();
    } else {
      setFeatureFlags({});
    }
  }, [user, session]);

  const makeApiCall = async (endpoint: string, method: 'GET' | 'POST' = 'GET', body?: any) => {
    if (!session?.access_token) {
      console.warn('No session token available for analytics call');
      return;
    }

    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}${endpoint}`, {
        method,
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        throw new Error(`Analytics API call failed: ${response.status}`);
      }

      return method === 'GET' ? await response.json() : null;
    } catch (error) {
      console.error(`Analytics API error (${endpoint}):`, error);
    }
  };

  const refreshFeatureFlags = async () => {
    try {
      setLoading(true);
      const result = await makeApiCall('/analytics/feature-flags');
      if (result?.flags) {
        setFeatureFlags(result.flags);
      }
    } catch (error) {
      console.error('Error fetching feature flags:', error);
    } finally {
      setLoading(false);
    }
  };

  const isFeatureEnabled = (feature: string): boolean => {
    return featureFlags[feature] || false;
  };

  const trackEvent = async (event: string, properties?: Record<string, any>) => {
    await makeApiCall('/analytics/track/event', 'POST', {
      event,
      properties,
    });
  };

  const trackScreenView = async (screenName: string, properties?: Record<string, any>) => {
    await makeApiCall('/analytics/track/screen', 'POST', {
      screenName,
      properties,
    });
  };

  const trackProductInteraction = async (interaction: ProductInteraction) => {
    await trackEvent('product_interaction', interaction);
  };

  const trackSocialInteraction = async (interaction: SocialInteraction) => {
    await trackEvent('social_interaction', interaction);
  };

  const trackSearch = async (query: string, category?: string, resultsCount?: number) => {
    await makeApiCall('/analytics/track/search', 'POST', {
      query,
      category,
      resultsCount,
    });
  };

  const trackError = async (error: string, context?: string, severity: 'low' | 'medium' | 'high' = 'medium') => {
    await trackEvent('error', {
      error,
      context,
      severity,
    });
  };

  const trackOnboardingStep = async (step: string, completed: boolean, stepNumber?: number) => {
    await trackEvent('onboarding_step', {
      step,
      completed,
      stepNumber,
    });
  };

  const trackAgeVerification = async (status: 'started' | 'completed' | 'failed' | 'expired', metadata?: any) => {
    await trackEvent('age_verification', {
      status,
      ...metadata,
    });
  };

  const trackSubscription = async (action: 'subscribe' | 'unsubscribe' | 'upgrade' | 'downgrade', tier: string, price?: number) => {
    await trackEvent('subscription', {
      action,
      tier,
      price,
    });
  };

  const value: AnalyticsContextType = {
    featureFlags,
    isFeatureEnabled,
    refreshFeatureFlags,
    trackEvent,
    trackScreenView,
    trackProductInteraction,
    trackSocialInteraction,
    trackSearch,
    trackError,
    trackOnboardingStep,
    trackAgeVerification,
    trackSubscription,
    loading,
  };

  return (
    <AnalyticsContext.Provider value={value}>
      {children}
    </AnalyticsContext.Provider>
  );
};

export const useAnalytics = (): AnalyticsContextType => {
  const context = useContext(AnalyticsContext);
  if (context === undefined) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider');
  }
  return context;
};
