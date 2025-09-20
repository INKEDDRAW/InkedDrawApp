/**
 * Analytics Middleware
 * Automatically tracks API requests and user activity
 */

import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { AnalyticsService } from '../analytics.service';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email?: string;
  };
}

@Injectable()
export class AnalyticsMiddleware implements NestMiddleware {
  private readonly logger = new Logger(AnalyticsMiddleware.name);

  constructor(private readonly analyticsService: AnalyticsService) {}

  async use(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    const startTime = Date.now();
    const { method, originalUrl, ip, headers } = req;
    const userAgent = headers['user-agent'] || 'unknown';

    // Skip analytics endpoints to avoid infinite loops
    if (originalUrl.startsWith('/analytics')) {
      return next();
    }

    // Skip health checks and static assets
    if (this.shouldSkipTracking(originalUrl)) {
      return next();
    }

    // Track API request if user is authenticated
    if (req.user?.id) {
      try {
        await this.trackApiRequest(req.user.id, {
          method,
          endpoint: originalUrl,
          userAgent,
          ip,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        this.logger.error('Failed to track API request:', error);
      }
    }

    // Override res.end to capture response data
    const originalEnd = res.end;
    res.end = function(chunk?: any) {
      const duration = Date.now() - startTime;
      const statusCode = res.statusCode;

      // Track API response if user is authenticated
      if (req.user?.id) {
        setImmediate(async () => {
          try {
            await this.trackApiResponse(req.user!.id, {
              method,
              endpoint: originalUrl,
              statusCode,
              duration,
              success: statusCode < 400,
            });
          } catch (error) {
            this.logger.error('Failed to track API response:', error);
          }
        });
      }

      // Call original end method
      originalEnd.call(this, chunk);
    }.bind(this);

    next();
  }

  private shouldSkipTracking(url: string): boolean {
    const skipPatterns = [
      '/health',
      '/metrics',
      '/favicon.ico',
      '/robots.txt',
      '/.well-known',
      '/static/',
      '/assets/',
    ];

    return skipPatterns.some(pattern => url.includes(pattern));
  }

  private async trackApiRequest(userId: string, requestData: any): Promise<void> {
    await this.analyticsService.posthogService.capture({
      event: 'api_request',
      distinctId: userId,
      properties: {
        ...requestData,
        request_type: 'api',
      },
    });
  }

  private async trackApiResponse(userId: string, responseData: any): Promise<void> {
    await this.analyticsService.posthogService.capture({
      event: 'api_response',
      distinctId: userId,
      properties: {
        ...responseData,
        response_type: 'api',
      },
    });

    // Track performance metrics for slow requests
    if (responseData.duration > 1000) { // > 1 second
      await this.analyticsService.trackPerformance(
        userId,
        'slow_api_request',
        responseData.duration,
        'milliseconds'
      );
    }

    // Track errors
    if (!responseData.success) {
      await this.analyticsService.trackError(
        userId,
        `API Error: ${responseData.statusCode}`,
        `${responseData.method} ${responseData.endpoint}`,
        responseData.statusCode >= 500 ? 'high' : 'medium'
      );
    }
  }
}
