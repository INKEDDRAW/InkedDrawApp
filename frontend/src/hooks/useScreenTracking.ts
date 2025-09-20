/**
 * Screen Tracking Hook
 * Automatically tracks screen views and user navigation
 */

import { useEffect, useRef } from 'react';
import { useAnalytics } from '../contexts/AnalyticsContext';
import { useAuth } from '../contexts/AuthContext';

interface ScreenTrackingOptions {
  screenName: string;
  properties?: Record<string, any>;
  trackOnMount?: boolean;
  trackOnFocus?: boolean;
}

export const useScreenTracking = (options: ScreenTrackingOptions) => {
  const { trackScreenView } = useAnalytics();
  const { user } = useAuth();
  const hasTrackedMount = useRef(false);
  const {
    screenName,
    properties = {},
    trackOnMount = true,
    trackOnFocus = false,
  } = options;

  // Track screen view on mount
  useEffect(() => {
    if (trackOnMount && user && !hasTrackedMount.current) {
      trackScreenView(screenName, {
        ...properties,
        entry_point: 'mount',
        timestamp: new Date().toISOString(),
      });
      hasTrackedMount.current = true;
    }
  }, [trackOnMount, user, screenName, properties, trackScreenView]);

  // Track screen view on focus (if enabled)
  useEffect(() => {
    if (!trackOnFocus || !user) return;

    const handleFocus = () => {
      trackScreenView(screenName, {
        ...properties,
        entry_point: 'focus',
        timestamp: new Date().toISOString(),
      });
    };

    // For React Native, we would use AppState
    // For web, we use window focus events
    if (typeof window !== 'undefined') {
      window.addEventListener('focus', handleFocus);
      return () => window.removeEventListener('focus', handleFocus);
    }
  }, [trackOnFocus, user, screenName, properties, trackScreenView]);

  // Return tracking function for manual tracking
  const trackScreen = (customProperties?: Record<string, any>) => {
    if (user) {
      trackScreenView(screenName, {
        ...properties,
        ...customProperties,
        entry_point: 'manual',
        timestamp: new Date().toISOString(),
      });
    }
  };

  return { trackScreen };
};

// Higher-order component for automatic screen tracking
export const withScreenTracking = <P extends object>(
  Component: React.ComponentType<P>,
  screenName: string,
  properties?: Record<string, any>
) => {
  return (props: P) => {
    useScreenTracking({ screenName, properties });
    return <Component {...props} />;
  };
};

// Hook for tracking user interactions within a screen
export const useInteractionTracking = (screenName: string) => {
  const { trackEvent } = useAnalytics();
  const { user } = useAuth();

  const trackInteraction = (
    interaction: string,
    properties?: Record<string, any>
  ) => {
    if (user) {
      trackEvent('user_interaction', {
        screen: screenName,
        interaction,
        ...properties,
        timestamp: new Date().toISOString(),
      });
    }
  };

  const trackButtonPress = (buttonName: string, properties?: Record<string, any>) => {
    trackInteraction('button_press', {
      button_name: buttonName,
      ...properties,
    });
  };

  const trackFormSubmission = (formName: string, success: boolean, properties?: Record<string, any>) => {
    trackInteraction('form_submission', {
      form_name: formName,
      success,
      ...properties,
    });
  };

  const trackModalOpen = (modalName: string, properties?: Record<string, any>) => {
    trackInteraction('modal_open', {
      modal_name: modalName,
      ...properties,
    });
  };

  const trackModalClose = (modalName: string, method: 'button' | 'backdrop' | 'escape' = 'button', properties?: Record<string, any>) => {
    trackInteraction('modal_close', {
      modal_name: modalName,
      close_method: method,
      ...properties,
    });
  };

  const trackTabSwitch = (fromTab: string, toTab: string, properties?: Record<string, any>) => {
    trackInteraction('tab_switch', {
      from_tab: fromTab,
      to_tab: toTab,
      ...properties,
    });
  };

  const trackScrollDepth = (depth: number, maxDepth: number, properties?: Record<string, any>) => {
    trackInteraction('scroll_depth', {
      scroll_depth: depth,
      max_depth: maxDepth,
      scroll_percentage: Math.round((depth / maxDepth) * 100),
      ...properties,
    });
  };

  return {
    trackInteraction,
    trackButtonPress,
    trackFormSubmission,
    trackModalOpen,
    trackModalClose,
    trackTabSwitch,
    trackScrollDepth,
  };
};

// Hook for tracking time spent on screen
export const useTimeTracking = (screenName: string) => {
  const { trackEvent } = useAnalytics();
  const { user } = useAuth();
  const startTime = useRef<number>(Date.now());
  const isActive = useRef<boolean>(true);

  useEffect(() => {
    startTime.current = Date.now();
    isActive.current = true;

    // Track when component unmounts or user leaves
    return () => {
      if (user && isActive.current) {
        const timeSpent = Date.now() - startTime.current;
        trackEvent('screen_time', {
          screen: screenName,
          time_spent_ms: timeSpent,
          time_spent_seconds: Math.round(timeSpent / 1000),
          timestamp: new Date().toISOString(),
        });
      }
    };
  }, [screenName, trackEvent, user]);

  // Pause time tracking (e.g., when app goes to background)
  const pauseTracking = () => {
    if (user && isActive.current) {
      const timeSpent = Date.now() - startTime.current;
      trackEvent('screen_time_pause', {
        screen: screenName,
        time_spent_ms: timeSpent,
        timestamp: new Date().toISOString(),
      });
      isActive.current = false;
    }
  };

  // Resume time tracking
  const resumeTracking = () => {
    startTime.current = Date.now();
    isActive.current = true;
  };

  return { pauseTracking, resumeTracking };
};
