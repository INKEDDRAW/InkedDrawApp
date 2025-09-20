/**
 * Metrics Service
 * System and application metrics collection
 */

import { Injectable, Logger } from '@nestjs/common';
import * as os from 'os';
import * as process from 'process';

export interface SystemMetrics {
  cpu: {
    usage: number;
    loadAverage: number[];
    cores: number;
  };
  memory: {
    total: number;
    used: number;
    free: number;
    usage: number;
  };
  disk: {
    total: number;
    used: number;
    free: number;
    usage: number;
  };
  network: {
    bytesReceived: number;
    bytesSent: number;
    packetsReceived: number;
    packetsSent: number;
  };
}

export interface ApplicationMetrics {
  uptime: number;
  responseTime: {
    average: number;
    p50: number;
    p95: number;
    p99: number;
  };
  throughput: {
    requestsPerSecond: number;
    requestsPerMinute: number;
  };
  errors: {
    rate: number;
    count: number;
    types: Record<string, number>;
  };
  database: {
    connections: number;
    queries: number;
    slowQueries: number;
  };
  cache: {
    hitRate: number;
    operations: number;
  };
  websockets: {
    connections: number;
    messages: number;
  };
}

@Injectable()
export class MetricsService {
  private readonly logger = new Logger(MetricsService.name);
  private requestTimes: number[] = [];
  private requestCount = 0;
  private errorCount = 0;
  private errorTypes: Record<string, number> = {};
  private lastRequestTime = Date.now();
  private websocketConnections = 0;
  private websocketMessages = 0;
  private databaseQueries = 0;
  private slowQueries = 0;
  private cacheOperations = 0;
  private cacheHits = 0;

  constructor() {
    this.startMetricsCollection();
  }

  /**
   * Start collecting metrics periodically
   */
  private startMetricsCollection(): void {
    // Clean up old request times every minute
    setInterval(() => {
      const oneMinuteAgo = Date.now() - 60000;
      this.requestTimes = this.requestTimes.filter(time => time > oneMinuteAgo);
    }, 60000);

    // Reset counters every hour
    setInterval(() => {
      this.resetHourlyCounters();
    }, 3600000);
  }

  /**
   * Record request timing
   */
  recordRequest(responseTime: number): void {
    const now = Date.now();
    this.requestTimes.push(now);
    this.requestCount++;
    this.lastRequestTime = now;

    // Store response time for percentile calculations
    if (this.requestTimes.length > 1000) {
      this.requestTimes = this.requestTimes.slice(-1000);
    }
  }

  /**
   * Record error
   */
  recordError(errorType: string): void {
    this.errorCount++;
    this.errorTypes[errorType] = (this.errorTypes[errorType] || 0) + 1;
  }

  /**
   * Record WebSocket connection
   */
  recordWebSocketConnection(connected: boolean): void {
    if (connected) {
      this.websocketConnections++;
    } else {
      this.websocketConnections = Math.max(0, this.websocketConnections - 1);
    }
  }

  /**
   * Record WebSocket message
   */
  recordWebSocketMessage(): void {
    this.websocketMessages++;
  }

  /**
   * Record database query
   */
  recordDatabaseQuery(queryTime: number): void {
    this.databaseQueries++;
    
    // Consider queries over 1 second as slow
    if (queryTime > 1000) {
      this.slowQueries++;
    }
  }

  /**
   * Record cache operation
   */
  recordCacheOperation(hit: boolean): void {
    this.cacheOperations++;
    if (hit) {
      this.cacheHits++;
    }
  }

  /**
   * Get system metrics
   */
  async getSystemMetrics(): Promise<SystemMetrics> {
    const cpuUsage = await this.getCpuUsage();
    const memoryInfo = this.getMemoryInfo();
    const diskInfo = await this.getDiskInfo();
    const networkInfo = this.getNetworkInfo();

    return {
      cpu: {
        usage: cpuUsage,
        loadAverage: os.loadavg(),
        cores: os.cpus().length,
      },
      memory: memoryInfo,
      disk: diskInfo,
      network: networkInfo,
    };
  }

  /**
   * Get application metrics
   */
  getApplicationMetrics(): ApplicationMetrics {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    const recentRequests = this.requestTimes.filter(time => time > oneMinuteAgo);

    return {
      uptime: process.uptime(),
      responseTime: this.calculateResponseTimeMetrics(),
      throughput: {
        requestsPerSecond: recentRequests.length / 60,
        requestsPerMinute: recentRequests.length,
      },
      errors: {
        rate: this.requestCount > 0 ? this.errorCount / this.requestCount : 0,
        count: this.errorCount,
        types: { ...this.errorTypes },
      },
      database: {
        connections: this.getDatabaseConnections(),
        queries: this.databaseQueries,
        slowQueries: this.slowQueries,
      },
      cache: {
        hitRate: this.cacheOperations > 0 ? this.cacheHits / this.cacheOperations : 0,
        operations: this.cacheOperations,
      },
      websockets: {
        connections: this.websocketConnections,
        messages: this.websocketMessages,
      },
    };
  }

  /**
   * Get average response time
   */
  async getAverageResponseTime(): Promise<number> {
    const metrics = this.calculateResponseTimeMetrics();
    return metrics.average;
  }

  /**
   * Get current throughput (requests per second)
   */
  async getCurrentThroughput(): Promise<number> {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    const recentRequests = this.requestTimes.filter(time => time > oneMinuteAgo);
    return recentRequests.length / 60;
  }

  /**
   * Get error rate
   */
  async getErrorRate(): Promise<number> {
    return this.requestCount > 0 ? this.errorCount / this.requestCount : 0;
  }

  /**
   * Get memory usage percentage
   */
  async getMemoryUsage(): Promise<number> {
    const memInfo = this.getMemoryInfo();
    return memInfo.usage;
  }

  /**
   * Get CPU usage percentage
   */
  async getCpuUsage(): Promise<number> {
    return new Promise((resolve) => {
      const startUsage = process.cpuUsage();
      const startTime = process.hrtime();

      setTimeout(() => {
        const endUsage = process.cpuUsage(startUsage);
        const endTime = process.hrtime(startTime);

        const totalTime = endTime[0] * 1000000 + endTime[1] / 1000;
        const cpuTime = (endUsage.user + endUsage.system);
        const cpuPercent = (cpuTime / totalTime) * 100;

        resolve(Math.min(100, Math.max(0, cpuPercent)));
      }, 100);
    });
  }

  /**
   * Get active connections count
   */
  async getActiveConnections(): Promise<number> {
    return this.websocketConnections + this.getDatabaseConnections();
  }

  /**
   * Get queue length (placeholder)
   */
  async getQueueLength(): Promise<number> {
    // This would integrate with your actual queue system
    return 0;
  }

  /**
   * Calculate response time metrics
   */
  private calculateResponseTimeMetrics(): ApplicationMetrics['responseTime'] {
    if (this.requestTimes.length === 0) {
      return {
        average: 0,
        p50: 0,
        p95: 0,
        p99: 0,
      };
    }

    const now = Date.now();
    const responseTimes = this.requestTimes.map(time => now - time);
    responseTimes.sort((a, b) => a - b);

    const average = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
    const p50 = this.percentile(responseTimes, 0.5);
    const p95 = this.percentile(responseTimes, 0.95);
    const p99 = this.percentile(responseTimes, 0.99);

    return { average, p50, p95, p99 };
  }

  /**
   * Calculate percentile
   */
  private percentile(sortedArray: number[], percentile: number): number {
    const index = Math.ceil(sortedArray.length * percentile) - 1;
    return sortedArray[Math.max(0, index)] || 0;
  }

  /**
   * Get memory information
   */
  private getMemoryInfo(): SystemMetrics['memory'] {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const usage = (usedMemory / totalMemory) * 100;

    return {
      total: totalMemory,
      used: usedMemory,
      free: freeMemory,
      usage: usage / 100, // Return as decimal
    };
  }

  /**
   * Get disk information (placeholder)
   */
  private async getDiskInfo(): Promise<SystemMetrics['disk']> {
    // This would require a disk usage library in a real implementation
    return {
      total: 1000000000, // 1GB placeholder
      used: 500000000,   // 500MB placeholder
      free: 500000000,   // 500MB placeholder
      usage: 0.5,        // 50% placeholder
    };
  }

  /**
   * Get network information (placeholder)
   */
  private getNetworkInfo(): SystemMetrics['network'] {
    // This would require network monitoring in a real implementation
    return {
      bytesReceived: 0,
      bytesSent: 0,
      packetsReceived: 0,
      packetsSent: 0,
    };
  }

  /**
   * Get database connections count (placeholder)
   */
  private getDatabaseConnections(): number {
    // This would integrate with your database connection pool
    return 10; // Placeholder
  }

  /**
   * Reset hourly counters
   */
  private resetHourlyCounters(): void {
    this.requestCount = 0;
    this.errorCount = 0;
    this.errorTypes = {};
    this.databaseQueries = 0;
    this.slowQueries = 0;
    this.cacheOperations = 0;
    this.cacheHits = 0;
    this.websocketMessages = 0;

    this.logger.log('Hourly metrics counters reset');
  }

  /**
   * Get metrics summary
   */
  async getMetricsSummary(): Promise<{
    system: SystemMetrics;
    application: ApplicationMetrics;
    timestamp: Date;
  }> {
    const system = await this.getSystemMetrics();
    const application = this.getApplicationMetrics();

    return {
      system,
      application,
      timestamp: new Date(),
    };
  }

  /**
   * Export metrics in Prometheus format
   */
  getPrometheusMetrics(): string {
    const appMetrics = this.getApplicationMetrics();
    
    const metrics = [
      `# HELP http_requests_total Total number of HTTP requests`,
      `# TYPE http_requests_total counter`,
      `http_requests_total ${this.requestCount}`,
      ``,
      `# HELP http_request_duration_seconds HTTP request duration in seconds`,
      `# TYPE http_request_duration_seconds histogram`,
      `http_request_duration_seconds_sum ${appMetrics.responseTime.average * this.requestCount / 1000}`,
      `http_request_duration_seconds_count ${this.requestCount}`,
      ``,
      `# HELP http_errors_total Total number of HTTP errors`,
      `# TYPE http_errors_total counter`,
      `http_errors_total ${this.errorCount}`,
      ``,
      `# HELP websocket_connections_active Active WebSocket connections`,
      `# TYPE websocket_connections_active gauge`,
      `websocket_connections_active ${this.websocketConnections}`,
      ``,
      `# HELP cache_hit_rate Cache hit rate`,
      `# TYPE cache_hit_rate gauge`,
      `cache_hit_rate ${appMetrics.cache.hitRate}`,
    ];

    return metrics.join('\n');
  }
}
