/**
 * Analytics Service
 * High-level analytics service for business events
 */

import { Injectable, Logger } from '@nestjs/common';
import { PostHogService, EventProperties, UserProperties } from './posthog.service';

export interface UserAnalyticsProfile {
  userId: string;
  email?: string;
  name?: string;
  age?: number;
  preferences?: {
    cigars?: string[];
    beers?: string[];
    wines?: string[];
  };
  subscription?: {
    tier: string;
    status: string;
    started_at: string;
  };
  verification?: {
    age_verified: boolean;
    verified_at?: string;
  };
  location?: {
    country?: string;
    region?: string;
    city?: string;
  };
}

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(private readonly posthogService: PostHogService) {}

  // ==================== USER LIFECYCLE EVENTS ====================

  /**
   * Track user registration
   */
  async trackUserRegistration(userId: string, properties?: EventProperties): Promise<void> {
    await this.posthogService.capture({
      event: 'user_registered',
      distinctId: userId,
      properties: {
        registration_method: properties?.method || 'email',
        source: properties?.source || 'organic',
        ...properties,
      },
    });
  }

  /**
   * Track user login
   */
  async trackUserLogin(userId: string, properties?: EventProperties): Promise<void> {
    await this.posthogService.capture({
      event: 'user_logged_in',
      distinctId: userId,
      properties: {
        login_method: properties?.method || 'email',
        device_type: properties?.device_type,
        ...properties,
      },
    });
  }

  /**
   * Track user logout
   */
  async trackUserLogout(userId: string): Promise<void> {
    await this.posthogService.capture({
      event: 'user_logged_out',
      distinctId: userId,
    });
  }

  /**
   * Update user profile
   */
  async updateUserProfile(profile: UserAnalyticsProfile): Promise<void> {
    const userProperties: UserProperties = {
      email: profile.email,
      name: profile.name,
      age: profile.age,
      preferences: profile.preferences ? Object.keys(profile.preferences).filter(key => 
        profile.preferences![key as keyof typeof profile.preferences]?.length > 0
      ) : [],
      subscription_tier: profile.subscription?.tier,
      age_verified: profile.verification?.age_verified || false,
      country: profile.location?.country,
      region: profile.location?.region,
      city: profile.location?.city,
    };

    await this.posthogService.identify(profile.userId, userProperties);
  }

  // ==================== AGE VERIFICATION EVENTS ====================

  /**
   * Track age verification started
   */
  async trackAgeVerificationStarted(userId: string, properties?: EventProperties): Promise<void> {
    await this.posthogService.capture({
      event: 'age_verification_started',
      distinctId: userId,
      properties: {
        verification_method: 'veriff',
        ...properties,
      },
    });
  }

  /**
   * Track age verification completed
   */
  async trackAgeVerificationCompleted(userId: string, success: boolean, properties?: EventProperties): Promise<void> {
    await this.posthogService.capture({
      event: 'age_verification_completed',
      distinctId: userId,
      properties: {
        success,
        verification_method: 'veriff',
        age: properties?.age,
        document_type: properties?.document_type,
        nationality: properties?.nationality,
        ...properties,
      },
    });

    // Update user properties
    if (success) {
      await this.posthogService.setUserProperties(userId, {
        age_verified: true,
        age_verified_at: new Date().toISOString(),
        age: properties?.age,
      });
    }
  }

  // ==================== CONTENT INTERACTION EVENTS ====================

  /**
   * Track product view
   */
  async trackProductView(userId: string, productType: 'cigar' | 'beer' | 'wine', productId: string, properties?: EventProperties): Promise<void> {
    await this.posthogService.capture({
      event: 'product_viewed',
      distinctId: userId,
      properties: {
        product_type: productType,
        product_id: productId,
        product_name: properties?.name,
        brand: properties?.brand,
        price: properties?.price,
        rating: properties?.rating,
        ...properties,
      },
    });
  }

  /**
   * Track product search
   */
  async trackProductSearch(userId: string, query: string, category?: string, results?: number): Promise<void> {
    await this.posthogService.capture({
      event: 'product_searched',
      distinctId: userId,
      properties: {
        search_query: query,
        category,
        results_count: results,
      },
    });
  }

  /**
   * Track product filter usage
   */
  async trackProductFilter(userId: string, category: string, filters: Record<string, any>): Promise<void> {
    await this.posthogService.capture({
      event: 'product_filtered',
      distinctId: userId,
      properties: {
        category,
        filters,
        filter_count: Object.keys(filters).length,
      },
    });
  }

  // ==================== SOCIAL INTERACTION EVENTS ====================

  /**
   * Track post creation
   */
  async trackPostCreated(userId: string, postType: string, properties?: EventProperties): Promise<void> {
    await this.posthogService.capture({
      event: 'post_created',
      distinctId: userId,
      properties: {
        post_type: postType,
        has_image: properties?.has_image || false,
        has_rating: properties?.has_rating || false,
        character_count: properties?.character_count,
        ...properties,
      },
    });
  }

  /**
   * Track post interaction
   */
  async trackPostInteraction(userId: string, action: 'like' | 'comment' | 'share', postId: string, authorId: string): Promise<void> {
    await this.posthogService.capture({
      event: 'post_interaction',
      distinctId: userId,
      properties: {
        action,
        post_id: postId,
        post_author_id: authorId,
        is_own_post: userId === authorId,
      },
    });
  }

  /**
   * Track user follow/unfollow
   */
  async trackUserFollow(userId: string, targetUserId: string, action: 'follow' | 'unfollow'): Promise<void> {
    await this.posthogService.capture({
      event: 'user_follow',
      distinctId: userId,
      properties: {
        action,
        target_user_id: targetUserId,
      },
    });
  }

  // ==================== RECOMMENDATION EVENTS ====================

  /**
   * Track recommendation view
   */
  async trackRecommendationView(userId: string, recommendationType: string, items: string[]): Promise<void> {
    await this.posthogService.capture({
      event: 'recommendation_viewed',
      distinctId: userId,
      properties: {
        recommendation_type: recommendationType,
        item_count: items.length,
        items,
      },
    });
  }

  /**
   * Track recommendation click
   */
  async trackRecommendationClick(userId: string, recommendationType: string, itemId: string, position: number): Promise<void> {
    await this.posthogService.capture({
      event: 'recommendation_clicked',
      distinctId: userId,
      properties: {
        recommendation_type: recommendationType,
        item_id: itemId,
        position,
      },
    });
  }

  // ==================== NAVIGATION EVENTS ====================

  /**
   * Track screen view
   */
  async trackScreenView(userId: string, screenName: string, properties?: EventProperties): Promise<void> {
    await this.posthogService.screenView(userId, screenName, {
      previous_screen: properties?.previous_screen,
      session_duration: properties?.session_duration,
      ...properties,
    });
  }

  /**
   * Track app open
   */
  async trackAppOpen(userId: string, properties?: EventProperties): Promise<void> {
    await this.posthogService.capture({
      event: 'app_opened',
      distinctId: userId,
      properties: {
        app_version: properties?.app_version,
        device_type: properties?.device_type,
        os_version: properties?.os_version,
        ...properties,
      },
    });
  }

  /**
   * Track app background
   */
  async trackAppBackground(userId: string, sessionDuration?: number): Promise<void> {
    await this.posthogService.capture({
      event: 'app_backgrounded',
      distinctId: userId,
      properties: {
        session_duration: sessionDuration,
      },
    });
  }

  // ==================== ERROR TRACKING ====================

  /**
   * Track error
   */
  async trackError(userId: string, error: Error, context?: string): Promise<void> {
    await this.posthogService.capture({
      event: 'error_occurred',
      distinctId: userId,
      properties: {
        error_name: error.name,
        error_message: error.message,
        error_stack: error.stack,
        context,
      },
    });
  }

  /**
   * Track API error
   */
  async trackApiError(userId: string, endpoint: string, statusCode: number, errorMessage: string): Promise<void> {
    await this.posthogService.capture({
      event: 'api_error',
      distinctId: userId,
      properties: {
        endpoint,
        status_code: statusCode,
        error_message: errorMessage,
      },
    });
  }

  // ==================== FEATURE FLAGS ====================

  /**
   * Get feature flag value
   */
  async getFeatureFlag(userId: string, flagKey: string, defaultValue: boolean = false): Promise<boolean> {
    return this.posthogService.getFeatureFlag(userId, flagKey, defaultValue);
  }

  /**
   * Get all feature flags for user
   */
  async getAllFeatureFlags(userId: string): Promise<Record<string, boolean>> {
    return this.posthogService.getAllFeatureFlags(userId);
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Flush all pending events
   */
  async flush(): Promise<void> {
    await this.posthogService.flush();
  }

  /**
   * Check if analytics is enabled
   */
  isEnabled(): boolean {
    return this.posthogService.isAnalyticsEnabled();
  }
}
