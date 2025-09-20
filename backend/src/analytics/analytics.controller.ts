/**
 * Analytics Controller
 * Handles analytics endpoints and event tracking
 */

import { 
  Controller, 
  Post, 
  Get, 
  Body, 
  UseGuards, 
  Request,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AnalyticsService, ProductInteraction, SocialInteraction } from './analytics.service';
import { TrackEventDto, TrackScreenViewDto, TrackSearchDto, FeatureFlagDto } from './dto/analytics.dto';

@ApiTags('Analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Post('track/event')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Track custom event' })
  @ApiResponse({ status: 200, description: 'Event tracked successfully' })
  async trackEvent(@Request() req: any, @Body() trackEventDto: TrackEventDto) {
    const { event, properties } = trackEventDto;
    
    // Route to appropriate tracking method based on event type
    switch (event) {
      case 'product_interaction':
        await this.analyticsService.trackProductInteraction(req.user.id, properties as ProductInteraction);
        break;
      case 'social_interaction':
        await this.analyticsService.trackSocialInteraction(req.user.id, properties as SocialInteraction);
        break;
      case 'age_verification':
        await this.analyticsService.trackAgeVerification(req.user.id, properties.status, properties);
        break;
      case 'search':
        await this.analyticsService.trackSearch(req.user.id, properties.query, properties.category, properties.resultsCount);
        break;
      case 'onboarding_step':
        await this.analyticsService.trackOnboardingStep(req.user.id, properties.step, properties.completed, properties.stepNumber);
        break;
      case 'subscription':
        await this.analyticsService.trackSubscription(req.user.id, properties.action, properties.tier, properties.price);
        break;
      case 'error':
        await this.analyticsService.trackError(req.user.id, properties.error, properties.context, properties.severity);
        break;
      case 'performance':
        await this.analyticsService.trackPerformance(req.user.id, properties.metric, properties.value, properties.unit);
        break;
      case 'feature_usage':
        await this.analyticsService.trackFeatureUsage(req.user.id, properties.feature, properties.action);
        break;
      default:
        // Generic event tracking
        await this.analyticsService.posthogService.capture({
          event,
          distinctId: req.user.id,
          properties,
        });
    }

    return { success: true };
  }

  @Post('track/screen')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Track screen view' })
  @ApiResponse({ status: 200, description: 'Screen view tracked successfully' })
  async trackScreenView(@Request() req: any, @Body() trackScreenViewDto: TrackScreenViewDto) {
    await this.analyticsService.trackScreenView(
      req.user.id, 
      trackScreenViewDto.screenName, 
      trackScreenViewDto.properties
    );
    return { success: true };
  }

  @Post('track/search')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Track search query' })
  @ApiResponse({ status: 200, description: 'Search tracked successfully' })
  async trackSearch(@Request() req: any, @Body() trackSearchDto: TrackSearchDto) {
    await this.analyticsService.trackSearch(
      req.user.id,
      trackSearchDto.query,
      trackSearchDto.category,
      trackSearchDto.resultsCount
    );
    return { success: true };
  }

  @Get('feature-flags')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get feature flags for user' })
  @ApiResponse({ 
    status: 200, 
    description: 'Feature flags retrieved successfully',
    type: FeatureFlagDto,
  })
  async getFeatureFlags(@Request() req: any): Promise<FeatureFlagDto> {
    const flags = await this.analyticsService.getFeatureFlags(req.user.id);
    return { flags };
  }

  @Get('feature-flags/:feature')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check if specific feature is enabled' })
  @ApiResponse({ status: 200, description: 'Feature flag status retrieved' })
  async getFeatureFlag(@Request() req: any, @Query('feature') feature: string) {
    const enabled = await this.analyticsService.isFeatureEnabled(req.user.id, feature);
    return { feature, enabled };
  }

  @Post('flush')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Flush pending analytics events' })
  @ApiResponse({ status: 200, description: 'Events flushed successfully' })
  async flushEvents() {
    await this.analyticsService.flush();
    return { success: true };
  }

  @Get('health')
  @ApiOperation({ summary: 'Analytics service health check' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  async healthCheck() {
    const isEnabled = this.analyticsService.posthogService.isAnalyticsEnabled();
    
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      analytics_enabled: isEnabled,
      service: 'posthog',
    };
  }
}
