/**
 * Performance Service
 * Main orchestrator for performance monitoring and optimization
 */

import { Injectable, Logger } from '@nestjs/common';
import { CacheService } from './cache.service';
import { MetricsService } from './metrics.service';
import { OptimizationService } from './optimization.service';

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

export interface PerformanceReport {
  timestamp: Date;
  metrics: PerformanceMetrics;
  recommendations: string[];
  alerts: PerformanceAlert[];
  trends: PerformanceTrend[];
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

@Injectable()
export class PerformanceService {
  private readonly logger = new Logger(PerformanceService.name);
  private performanceHistory: PerformanceMetrics[] = [];
  private alerts: PerformanceAlert[] = [];

  constructor(
    private readonly cacheService: CacheService,
    private readonly metricsService: MetricsService,
    private readonly optimizationService: OptimizationService,
  ) {
    // Start performance monitoring
    this.startPerformanceMonitoring();
  }

  /**
   * Start continuous performance monitoring
   */
  private startPerformanceMonitoring(): void {
    // Collect metrics every 30 seconds
    setInterval(async () => {
      try {
        await this.collectMetrics();
      } catch (error) {
        this.logger.error('Error collecting performance metrics:', error);
      }
    }, 30000);

    // Generate performance report every 5 minutes
    setInterval(async () => {
      try {
        await this.generatePerformanceReport();
      } catch (error) {
        this.logger.error('Error generating performance report:', error);
      }
    }, 300000);

    // Run optimization checks every 15 minutes
    setInterval(async () => {
      try {
        await this.runOptimizationChecks();
      } catch (error) {
        this.logger.error('Error running optimization checks:', error);
      }
    }, 900000);
  }

  /**
   * Collect current performance metrics
   */
  async collectMetrics(): Promise<PerformanceMetrics> {
    const metrics: PerformanceMetrics = {
      responseTime: await this.metricsService.getAverageResponseTime(),
      throughput: await this.metricsService.getCurrentThroughput(),
      errorRate: await this.metricsService.getErrorRate(),
      cacheHitRate: await this.cacheService.getCacheHitRate(),
      memoryUsage: await this.metricsService.getMemoryUsage(),
      cpuUsage: await this.metricsService.getCpuUsage(),
      activeConnections: await this.metricsService.getActiveConnections(),
      queueLength: await this.metricsService.getQueueLength(),
    };

    // Store metrics in history
    this.performanceHistory.push(metrics);
    
    // Keep only last 1000 entries (about 8 hours at 30s intervals)
    if (this.performanceHistory.length > 1000) {
      this.performanceHistory = this.performanceHistory.slice(-1000);
    }

    // Check for performance alerts
    await this.checkPerformanceAlerts(metrics);

    return metrics;
  }

  /**
   * Generate comprehensive performance report
   */
  async generatePerformanceReport(): Promise<PerformanceReport> {
    const currentMetrics = await this.collectMetrics();
    const recommendations = await this.generateRecommendations(currentMetrics);
    const trends = this.calculateTrends();

    const report: PerformanceReport = {
      timestamp: new Date(),
      metrics: currentMetrics,
      recommendations,
      alerts: this.getActiveAlerts(),
      trends,
    };

    // Cache the report
    await this.cacheService.set(
      'performance:latest_report',
      report,
      300, // 5 minutes
    );

    this.logger.log('Performance report generated', {
      responseTime: currentMetrics.responseTime,
      throughput: currentMetrics.throughput,
      errorRate: currentMetrics.errorRate,
      alertCount: report.alerts.length,
    });

    return report;
  }

  /**
   * Check for performance alerts
   */
  private async checkPerformanceAlerts(metrics: PerformanceMetrics): Promise<void> {
    const alertChecks = [
      {
        metric: 'responseTime',
        value: metrics.responseTime,
        threshold: 1000, // 1 second
        severity: 'high' as const,
        message: 'High response time detected',
      },
      {
        metric: 'errorRate',
        value: metrics.errorRate,
        threshold: 0.05, // 5%
        severity: 'critical' as const,
        message: 'High error rate detected',
      },
      {
        metric: 'memoryUsage',
        value: metrics.memoryUsage,
        threshold: 0.8, // 80%
        severity: 'medium' as const,
        message: 'High memory usage detected',
      },
      {
        metric: 'cpuUsage',
        value: metrics.cpuUsage,
        threshold: 0.8, // 80%
        severity: 'medium' as const,
        message: 'High CPU usage detected',
      },
      {
        metric: 'cacheHitRate',
        value: metrics.cacheHitRate,
        threshold: 0.7, // 70% (alert if below)
        severity: 'low' as const,
        message: 'Low cache hit rate detected',
        reverse: true, // Alert if value is below threshold
      },
    ];

    for (const check of alertChecks) {
      const shouldAlert = check.reverse 
        ? check.value < check.threshold
        : check.value > check.threshold;

      if (shouldAlert) {
        const alert: PerformanceAlert = {
          id: `${check.metric}_${Date.now()}`,
          severity: check.severity,
          metric: check.metric,
          value: check.value,
          threshold: check.threshold,
          message: check.message,
          timestamp: new Date(),
        };

        this.alerts.push(alert);
        
        // Keep only last 100 alerts
        if (this.alerts.length > 100) {
          this.alerts = this.alerts.slice(-100);
        }

        this.logger.warn('Performance alert triggered', alert);
      }
    }
  }

  /**
   * Generate performance recommendations
   */
  private async generateRecommendations(metrics: PerformanceMetrics): Promise<string[]> {
    const recommendations: string[] = [];

    if (metrics.responseTime > 500) {
      recommendations.push('Consider implementing response caching for frequently accessed endpoints');
      recommendations.push('Review database query performance and add indexes where needed');
    }

    if (metrics.errorRate > 0.01) {
      recommendations.push('Investigate error patterns and implement better error handling');
      recommendations.push('Consider implementing circuit breakers for external service calls');
    }

    if (metrics.cacheHitRate < 0.8) {
      recommendations.push('Review cache strategy and increase cache TTL for stable data');
      recommendations.push('Implement cache warming for critical data');
    }

    if (metrics.memoryUsage > 0.7) {
      recommendations.push('Consider implementing memory optimization strategies');
      recommendations.push('Review object lifecycle and implement proper cleanup');
    }

    if (metrics.queueLength > 100) {
      recommendations.push('Consider scaling queue processing workers');
      recommendations.push('Implement queue prioritization for critical tasks');
    }

    if (metrics.activeConnections > 500) {
      recommendations.push('Consider implementing connection pooling optimization');
      recommendations.push('Review WebSocket connection management');
    }

    return recommendations;
  }

  /**
   * Calculate performance trends
   */
  private calculateTrends(): PerformanceTrend[] {
    if (this.performanceHistory.length < 10) {
      return [];
    }

    const recent = this.performanceHistory.slice(-10);
    const older = this.performanceHistory.slice(-20, -10);

    const trends: PerformanceTrend[] = [];

    const metrics = ['responseTime', 'throughput', 'errorRate', 'cacheHitRate'] as const;

    for (const metric of metrics) {
      const recentAvg = recent.reduce((sum, m) => sum + m[metric], 0) / recent.length;
      const olderAvg = older.reduce((sum, m) => sum + m[metric], 0) / older.length;
      
      const change = ((recentAvg - olderAvg) / olderAvg) * 100;
      
      let direction: 'up' | 'down' | 'stable' = 'stable';
      if (Math.abs(change) > 5) {
        direction = change > 0 ? 'up' : 'down';
      }

      trends.push({
        metric,
        direction,
        change: Math.round(change * 100) / 100,
        period: '5 minutes',
      });
    }

    return trends;
  }

  /**
   * Run optimization checks and apply optimizations
   */
  private async runOptimizationChecks(): Promise<void> {
    const currentMetrics = await this.collectMetrics();

    // Auto-optimize cache if hit rate is low
    if (currentMetrics.cacheHitRate < 0.7) {
      await this.optimizationService.optimizeCache();
    }

    // Auto-optimize database connections if needed
    if (currentMetrics.activeConnections > 400) {
      await this.optimizationService.optimizeConnections();
    }

    // Auto-scale queue processing if needed
    if (currentMetrics.queueLength > 50) {
      await this.optimizationService.scaleQueueProcessing();
    }

    this.logger.log('Optimization checks completed');
  }

  /**
   * Get active performance alerts
   */
  getActiveAlerts(): PerformanceAlert[] {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return this.alerts.filter(alert => alert.timestamp > fiveMinutesAgo);
  }

  /**
   * Get performance history
   */
  getPerformanceHistory(limit: number = 100): PerformanceMetrics[] {
    return this.performanceHistory.slice(-limit);
  }

  /**
   * Get latest performance report
   */
  async getLatestReport(): Promise<PerformanceReport | null> {
    return await this.cacheService.get('performance:latest_report');
  }

  /**
   * Clear performance alerts
   */
  clearAlerts(): void {
    this.alerts = [];
    this.logger.log('Performance alerts cleared');
  }

  /**
   * Get performance summary
   */
  async getPerformanceSummary(): Promise<{
    current: PerformanceMetrics;
    alerts: number;
    trends: PerformanceTrend[];
    uptime: number;
  }> {
    const current = await this.collectMetrics();
    const trends = this.calculateTrends();
    const uptime = process.uptime();

    return {
      current,
      alerts: this.getActiveAlerts().length,
      trends,
      uptime,
    };
  }

  /**
   * Force performance optimization
   */
  async forceOptimization(): Promise<void> {
    await this.optimizationService.runFullOptimization();
    this.logger.log('Forced performance optimization completed');
  }

  /**
   * Reset performance metrics
   */
  resetMetrics(): void {
    this.performanceHistory = [];
    this.alerts = [];
    this.logger.log('Performance metrics reset');
  }
}
