/**
 * PostHog Service
 * Direct integration with PostHog analytics platform
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PostHog } from 'posthog-node';

export interface EventProperties {
  [key: string]: any;
}

export interface UserProperties {
  email?: string;
  name?: string;
  age?: number;
  location?: string;
  preferences?: string[];
  subscription_tier?: string;
  age_verified?: boolean;
  created_at?: string;
  last_active?: string;
  [key: string]: any;
}

export interface AnalyticsEvent {
  event: string;
  distinctId: string;
  properties?: EventProperties;
  timestamp?: Date;
}

@Injectable()
export class PostHogService {
  private readonly logger = new Logger(PostHogService.name);
  private posthog: PostHog | null = null;
  private isEnabled: boolean = false;

  constructor(private readonly configService: ConfigService) {
    this.initializePostHog();
  }

  private initializePostHog() {
    const apiKey = this.configService.get<string>('POSTHOG_API_KEY');
    const host = this.configService.get<string>('POSTHOG_HOST', 'https://app.posthog.com');
    
    if (!apiKey) {
      this.logger.warn('PostHog API key not configured. Analytics will be disabled.');
      return;
    }

    try {
      this.posthog = new PostHog(apiKey, {
        host,
        flushAt: 20, // Flush events after 20 events
        flushInterval: 10000, // Flush events every 10 seconds
        personalApiKey: this.configService.get<string>('POSTHOG_PERSONAL_API_KEY'),
      });

      this.isEnabled = true;
      this.logger.log('PostHog analytics initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize PostHog:', error);
    }
  }

  /**
   * Track an event
   */
  async capture(event: AnalyticsEvent): Promise<void> {
    if (!this.isEnabled || !this.posthog) {
      this.logger.debug(`Analytics disabled, skipping event: ${event.event}`);
      return;
    }

    try {
      this.posthog.capture({
        distinctId: event.distinctId,
        event: event.event,
        properties: {
          ...event.properties,
          timestamp: event.timestamp || new Date(),
          source: 'backend',
        },
      });

      this.logger.debug(`Event tracked: ${event.event} for user ${event.distinctId}`);
    } catch (error) {
      this.logger.error(`Failed to track event ${event.event}:`, error);
    }
  }

  /**
   * Identify a user and set their properties
   */
  async identify(distinctId: string, properties: UserProperties): Promise<void> {
    if (!this.isEnabled || !this.posthog) {
      return;
    }

    try {
      this.posthog.identify({
        distinctId,
        properties: {
          ...properties,
          $set: properties, // Set properties
          $set_once: {
            first_seen: new Date().toISOString(),
          },
        },
      });

      this.logger.debug(`User identified: ${distinctId}`);
    } catch (error) {
      this.logger.error(`Failed to identify user ${distinctId}:`, error);
    }
  }

  /**
   * Update user properties
   */
  async setUserProperties(distinctId: string, properties: UserProperties): Promise<void> {
    if (!this.isEnabled || !this.posthog) {
      return;
    }

    try {
      this.posthog.capture({
        distinctId,
        event: '$set',
        properties: {
          $set: properties,
        },
      });

      this.logger.debug(`User properties updated: ${distinctId}`);
    } catch (error) {
      this.logger.error(`Failed to update user properties for ${distinctId}:`, error);
    }
  }

  /**
   * Track page view
   */
  async pageView(distinctId: string, page: string, properties?: EventProperties): Promise<void> {
    await this.capture({
      event: '$pageview',
      distinctId,
      properties: {
        $current_url: page,
        ...properties,
      },
    });
  }

  /**
   * Track screen view (mobile)
   */
  async screenView(distinctId: string, screenName: string, properties?: EventProperties): Promise<void> {
    await this.capture({
      event: '$screen',
      distinctId,
      properties: {
        $screen_name: screenName,
        ...properties,
      },
    });
  }

  /**
   * Create a feature flag for A/B testing
   */
  async getFeatureFlag(distinctId: string, flagKey: string, defaultValue: boolean = false): Promise<boolean> {
    if (!this.isEnabled || !this.posthog) {
      return defaultValue;
    }

    try {
      const result = await this.posthog.isFeatureEnabled(flagKey, distinctId);
      return result ?? defaultValue;
    } catch (error) {
      this.logger.error(`Failed to get feature flag ${flagKey}:`, error);
      return defaultValue;
    }
  }

  /**
   * Get all feature flags for a user
   */
  async getAllFeatureFlags(distinctId: string): Promise<Record<string, boolean>> {
    if (!this.isEnabled || !this.posthog) {
      return {};
    }

    try {
      const flags = await this.posthog.getAllFlags(distinctId);
      return flags || {};
    } catch (error) {
      this.logger.error(`Failed to get feature flags for ${distinctId}:`, error);
      return {};
    }
  }

  /**
   * Track conversion event
   */
  async trackConversion(distinctId: string, conversionType: string, value?: number, properties?: EventProperties): Promise<void> {
    await this.capture({
      event: 'conversion',
      distinctId,
      properties: {
        conversion_type: conversionType,
        value,
        ...properties,
      },
    });
  }

  /**
   * Track revenue event
   */
  async trackRevenue(distinctId: string, amount: number, currency: string = 'USD', properties?: EventProperties): Promise<void> {
    await this.capture({
      event: 'revenue',
      distinctId,
      properties: {
        revenue: amount,
        currency,
        ...properties,
      },
    });
  }

  /**
   * Flush all pending events
   */
  async flush(): Promise<void> {
    if (!this.isEnabled || !this.posthog) {
      return;
    }

    try {
      await this.posthog.flush();
      this.logger.debug('PostHog events flushed');
    } catch (error) {
      this.logger.error('Failed to flush PostHog events:', error);
    }
  }

  /**
   * Shutdown PostHog client
   */
  async shutdown(): Promise<void> {
    if (!this.isEnabled || !this.posthog) {
      return;
    }

    try {
      await this.posthog.shutdown();
      this.logger.log('PostHog client shutdown');
    } catch (error) {
      this.logger.error('Failed to shutdown PostHog client:', error);
    }
  }

  /**
   * Check if analytics is enabled
   */
  isAnalyticsEnabled(): boolean {
    return this.isEnabled;
  }
}
