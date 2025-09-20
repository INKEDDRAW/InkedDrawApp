/**
 * Performance Controller
 * API endpoints for performance monitoring and optimization
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Query,
  UseGuards,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { PerformanceService } from './performance.service';
import { CacheService } from './cache.service';
import { MetricsService } from './metrics.service';
import { OptimizationService } from './optimization.service';

@ApiTags('Performance')
@Controller('performance')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class PerformanceController {
  constructor(
    private readonly performanceService: PerformanceService,
    private readonly cacheService: CacheService,
    private readonly metricsService: MetricsService,
    private readonly optimizationService: OptimizationService,
  ) {}

  /**
   * Get performance summary
   */
  @Get('summary')
  @ApiOperation({ summary: 'Get performance summary' })
  @ApiResponse({ status: 200, description: 'Performance summary retrieved successfully' })
  @Roles('admin', 'moderator')
  async getPerformanceSummary() {
    return await this.performanceService.getPerformanceSummary();
  }

  /**
   * Get detailed performance metrics
   */
  @Get('metrics')
  @ApiOperation({ summary: 'Get detailed performance metrics' })
  @ApiResponse({ status: 200, description: 'Performance metrics retrieved successfully' })
  @Roles('admin', 'moderator')
  async getPerformanceMetrics() {
    return await this.metricsService.getMetricsSummary();
  }

  /**
   * Get system metrics
   */
  @Get('metrics/system')
  @ApiOperation({ summary: 'Get system metrics' })
  @ApiResponse({ status: 200, description: 'System metrics retrieved successfully' })
  @Roles('admin')
  async getSystemMetrics() {
    return await this.metricsService.getSystemMetrics();
  }

  /**
   * Get application metrics
   */
  @Get('metrics/application')
  @ApiOperation({ summary: 'Get application metrics' })
  @ApiResponse({ status: 200, description: 'Application metrics retrieved successfully' })
  @Roles('admin', 'moderator')
  async getApplicationMetrics() {
    return this.metricsService.getApplicationMetrics();
  }

  /**
   * Get Prometheus metrics
   */
  @Get('metrics/prometheus')
  @ApiOperation({ summary: 'Get metrics in Prometheus format' })
  @ApiResponse({ status: 200, description: 'Prometheus metrics retrieved successfully' })
  async getPrometheusMetrics() {
    return this.metricsService.getPrometheusMetrics();
  }

  /**
   * Get performance report
   */
  @Get('report')
  @ApiOperation({ summary: 'Get performance report' })
  @ApiResponse({ status: 200, description: 'Performance report retrieved successfully' })
  @Roles('admin', 'moderator')
  async getPerformanceReport() {
    const report = await this.performanceService.getLatestReport();
    if (!report) {
      return await this.performanceService.generatePerformanceReport();
    }
    return report;
  }

  /**
   * Get performance history
   */
  @Get('history')
  @ApiOperation({ summary: 'Get performance history' })
  @ApiResponse({ status: 200, description: 'Performance history retrieved successfully' })
  @Roles('admin', 'moderator')
  async getPerformanceHistory(@Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit, 10) : 100;
    return this.performanceService.getPerformanceHistory(limitNum);
  }

  /**
   * Get cache statistics
   */
  @Get('cache/stats')
  @ApiOperation({ summary: 'Get cache statistics' })
  @ApiResponse({ status: 200, description: 'Cache statistics retrieved successfully' })
  @Roles('admin', 'moderator')
  async getCacheStats() {
    return this.cacheService.getCacheStats();
  }

  /**
   * Clear cache
   */
  @Delete('cache')
  @ApiOperation({ summary: 'Clear all cache' })
  @ApiResponse({ status: 200, description: 'Cache cleared successfully' })
  @HttpCode(HttpStatus.OK)
  @Roles('admin')
  async clearCache() {
    await this.cacheService.flushAll();
    return { message: 'Cache cleared successfully' };
  }

  /**
   * Clear cache pattern
   */
  @Delete('cache/pattern')
  @ApiOperation({ summary: 'Clear cache by pattern' })
  @ApiResponse({ status: 200, description: 'Cache pattern cleared successfully' })
  @HttpCode(HttpStatus.OK)
  @Roles('admin')
  async clearCachePattern(@Body('pattern') pattern: string) {
    await this.cacheService.delPattern(pattern);
    return { message: `Cache pattern '${pattern}' cleared successfully` };
  }

  /**
   * Optimize cache
   */
  @Post('cache/optimize')
  @ApiOperation({ summary: 'Optimize cache performance' })
  @ApiResponse({ status: 200, description: 'Cache optimized successfully' })
  @Roles('admin')
  async optimizeCache() {
    await this.cacheService.optimize();
    return { message: 'Cache optimization completed' };
  }

  /**
   * Get optimization history
   */
  @Get('optimization/history')
  @ApiOperation({ summary: 'Get optimization history' })
  @ApiResponse({ status: 200, description: 'Optimization history retrieved successfully' })
  @Roles('admin', 'moderator')
  async getOptimizationHistory(@Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit, 10) : 50;
    return this.optimizationService.getOptimizationHistory(limitNum);
  }

  /**
   * Get optimization recommendations
   */
  @Get('optimization/recommendations')
  @ApiOperation({ summary: 'Get optimization recommendations' })
  @ApiResponse({ status: 200, description: 'Optimization recommendations retrieved successfully' })
  @Roles('admin', 'moderator')
  async getOptimizationRecommendations() {
    return await this.optimizationService.getOptimizationRecommendations();
  }

  /**
   * Run full optimization
   */
  @Post('optimization/run')
  @ApiOperation({ summary: 'Run full optimization suite' })
  @ApiResponse({ status: 200, description: 'Optimization completed successfully' })
  @Roles('admin')
  async runOptimization() {
    const results = await this.optimizationService.runFullOptimization();
    return {
      message: 'Optimization completed',
      results,
      optimizationsApplied: results.length,
    };
  }

  /**
   * Force performance optimization
   */
  @Post('optimization/force')
  @ApiOperation({ summary: 'Force performance optimization' })
  @ApiResponse({ status: 200, description: 'Forced optimization completed successfully' })
  @Roles('admin')
  async forceOptimization() {
    await this.performanceService.forceOptimization();
    return { message: 'Forced optimization completed' };
  }

  /**
   * Get optimization configuration
   */
  @Get('optimization/config')
  @ApiOperation({ summary: 'Get optimization configuration' })
  @ApiResponse({ status: 200, description: 'Optimization configuration retrieved successfully' })
  @Roles('admin')
  async getOptimizationConfig() {
    return this.optimizationService.getOptimizationConfig();
  }

  /**
   * Update optimization configuration
   */
  @Put('optimization/config')
  @ApiOperation({ summary: 'Update optimization configuration' })
  @ApiResponse({ status: 200, description: 'Optimization configuration updated successfully' })
  @Roles('admin')
  async updateOptimizationConfig(@Body() config: any) {
    this.optimizationService.updateOptimizationConfig(config);
    return { message: 'Optimization configuration updated' };
  }

  /**
   * Enable/disable auto-optimization
   */
  @Put('optimization/auto')
  @ApiOperation({ summary: 'Enable/disable auto-optimization' })
  @ApiResponse({ status: 200, description: 'Auto-optimization setting updated successfully' })
  @Roles('admin')
  async setAutoOptimization(@Body('enabled') enabled: boolean) {
    this.optimizationService.setAutoOptimization(enabled);
    return { message: `Auto-optimization ${enabled ? 'enabled' : 'disabled'}` };
  }

  /**
   * Get optimization summary
   */
  @Get('optimization/summary')
  @ApiOperation({ summary: 'Get optimization summary' })
  @ApiResponse({ status: 200, description: 'Optimization summary retrieved successfully' })
  @Roles('admin', 'moderator')
  async getOptimizationSummary() {
    return this.optimizationService.getOptimizationSummary();
  }

  /**
   * Clear performance alerts
   */
  @Delete('alerts')
  @ApiOperation({ summary: 'Clear performance alerts' })
  @ApiResponse({ status: 200, description: 'Performance alerts cleared successfully' })
  @HttpCode(HttpStatus.OK)
  @Roles('admin')
  async clearAlerts() {
    this.performanceService.clearAlerts();
    return { message: 'Performance alerts cleared' };
  }

  /**
   * Reset performance metrics
   */
  @Delete('metrics')
  @ApiOperation({ summary: 'Reset performance metrics' })
  @ApiResponse({ status: 200, description: 'Performance metrics reset successfully' })
  @HttpCode(HttpStatus.OK)
  @Roles('admin')
  async resetMetrics() {
    this.performanceService.resetMetrics();
    return { message: 'Performance metrics reset' };
  }

  /**
   * Health check endpoint
   */
  @Get('health')
  @ApiOperation({ summary: 'Performance health check' })
  @ApiResponse({ status: 200, description: 'Performance health check successful' })
  async healthCheck() {
    const summary = await this.performanceService.getPerformanceSummary();
    const isHealthy = summary.current.responseTime < 1000 && 
                     summary.current.errorRate < 0.05 &&
                     summary.current.memoryUsage < 0.9;

    return {
      status: isHealthy ? 'healthy' : 'degraded',
      timestamp: new Date(),
      metrics: summary.current,
      alerts: summary.alerts,
    };
  }

  /**
   * Performance dashboard data
   */
  @Get('dashboard')
  @ApiOperation({ summary: 'Get performance dashboard data' })
  @ApiResponse({ status: 200, description: 'Performance dashboard data retrieved successfully' })
  @Roles('admin', 'moderator')
  async getDashboardData() {
    const [
      summary,
      cacheStats,
      optimizationSummary,
      recommendations,
    ] = await Promise.all([
      this.performanceService.getPerformanceSummary(),
      this.cacheService.getCacheStats(),
      this.optimizationService.getOptimizationSummary(),
      this.optimizationService.getOptimizationRecommendations(),
    ]);

    return {
      performance: summary,
      cache: cacheStats,
      optimization: optimizationSummary,
      recommendations,
      timestamp: new Date(),
    };
  }
}
