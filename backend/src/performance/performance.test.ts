/**
 * Performance Module Tests
 * Comprehensive test suite for performance monitoring and optimization
 */

import { Test, TestingModule } from '@nestjs/testing';
import { PerformanceService } from './performance.service';
import { CacheService } from './cache.service';
import { MetricsService } from './metrics.service';
import { OptimizationService } from './optimization.service';

describe('PerformanceService', () => {
  let service: PerformanceService;
  let cacheService: CacheService;
  let metricsService: MetricsService;
  let optimizationService: OptimizationService;

  const mockCacheService = {
    getCacheHitRate: jest.fn().mockResolvedValue(0.85),
    getCacheStats: jest.fn().mockResolvedValue({
      hitRate: 0.85,
      missRate: 0.15,
      totalRequests: 1000,
      totalHits: 850,
      totalMisses: 150,
      memoryUsage: 1024 * 1024 * 100, // 100MB
      keyCount: 500,
    }),
    optimize: jest.fn().mockResolvedValue(undefined),
    set: jest.fn().mockResolvedValue(undefined),
    get: jest.fn().mockResolvedValue(null),
  };

  const mockMetricsService = {
    getAverageResponseTime: jest.fn().mockResolvedValue(250),
    getCurrentThroughput: jest.fn().mockResolvedValue(50),
    getErrorRate: jest.fn().mockResolvedValue(0.02),
    getMemoryUsage: jest.fn().mockResolvedValue(0.65),
    getCpuUsage: jest.fn().mockResolvedValue(0.45),
    getActiveConnections: jest.fn().mockResolvedValue(150),
    getQueueLength: jest.fn().mockResolvedValue(25),
    getApplicationMetrics: jest.fn().mockResolvedValue({
      uptime: 3600,
      responseTime: { average: 250, p50: 200, p95: 500, p99: 800 },
      throughput: { requestsPerSecond: 50, requestsPerMinute: 3000 },
      errors: { rate: 0.02, count: 20, types: { '500': 15, '404': 5 } },
      database: { connections: 10, queries: 1000, slowQueries: 2 },
      cache: { hitRate: 0.85, operations: 1000 },
      websockets: { connections: 50, messages: 5000 },
    }),
  };

  const mockOptimizationService = {
    optimizeCache: jest.fn().mockResolvedValue({
      strategy: 'Cache optimization',
      applied: true,
      impact: 'Hit rate improved by 5%',
      metrics: { before: {}, after: {} },
      timestamp: new Date(),
    }),
    optimizeConnections: jest.fn().mockResolvedValue(null),
    scaleQueueProcessing: jest.fn().mockResolvedValue(null),
    runFullOptimization: jest.fn().mockResolvedValue([]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PerformanceService,
        { provide: CacheService, useValue: mockCacheService },
        { provide: MetricsService, useValue: mockMetricsService },
        { provide: OptimizationService, useValue: mockOptimizationService },
      ],
    }).compile();

    service = module.get<PerformanceService>(PerformanceService);
    cacheService = module.get<CacheService>(CacheService);
    metricsService = module.get<MetricsService>(MetricsService);
    optimizationService = module.get<OptimizationService>(OptimizationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('collectMetrics', () => {
    it('should collect performance metrics successfully', async () => {
      const metrics = await service.collectMetrics();

      expect(metrics).toBeDefined();
      expect(metrics.responseTime).toBe(250);
      expect(metrics.throughput).toBe(50);
      expect(metrics.errorRate).toBe(0.02);
      expect(metrics.cacheHitRate).toBe(0.85);
      expect(metrics.memoryUsage).toBe(0.65);
      expect(metrics.cpuUsage).toBe(0.45);
      expect(metrics.activeConnections).toBe(150);
      expect(metrics.queueLength).toBe(25);
    });

    it('should call all metric collection methods', async () => {
      await service.collectMetrics();

      expect(metricsService.getAverageResponseTime).toHaveBeenCalled();
      expect(metricsService.getCurrentThroughput).toHaveBeenCalled();
      expect(metricsService.getErrorRate).toHaveBeenCalled();
      expect(cacheService.getCacheHitRate).toHaveBeenCalled();
      expect(metricsService.getMemoryUsage).toHaveBeenCalled();
      expect(metricsService.getCpuUsage).toHaveBeenCalled();
      expect(metricsService.getActiveConnections).toHaveBeenCalled();
      expect(metricsService.getQueueLength).toHaveBeenCalled();
    });
  });

  describe('generatePerformanceReport', () => {
    it('should generate a comprehensive performance report', async () => {
      const report = await service.generatePerformanceReport();

      expect(report).toBeDefined();
      expect(report.timestamp).toBeInstanceOf(Date);
      expect(report.metrics).toBeDefined();
      expect(report.recommendations).toBeInstanceOf(Array);
      expect(report.alerts).toBeInstanceOf(Array);
      expect(report.trends).toBeInstanceOf(Array);
    });

    it('should cache the generated report', async () => {
      await service.generatePerformanceReport();

      expect(cacheService.set).toHaveBeenCalledWith(
        'performance:latest_report',
        expect.any(Object),
        300,
      );
    });
  });

  describe('getPerformanceSummary', () => {
    it('should return performance summary with all required fields', async () => {
      const summary = await service.getPerformanceSummary();

      expect(summary).toBeDefined();
      expect(summary.current).toBeDefined();
      expect(summary.alerts).toBeDefined();
      expect(summary.trends).toBeInstanceOf(Array);
      expect(summary.uptime).toBeGreaterThan(0);
    });
  });

  describe('performance alerts', () => {
    it('should trigger alert for high response time', async () => {
      mockMetricsService.getAverageResponseTime.mockResolvedValueOnce(1500);

      await service.collectMetrics();
      const alerts = service.getActiveAlerts();

      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts.some(alert => alert.metric === 'responseTime')).toBe(true);
    });

    it('should trigger alert for high error rate', async () => {
      mockMetricsService.getErrorRate.mockResolvedValueOnce(0.08);

      await service.collectMetrics();
      const alerts = service.getActiveAlerts();

      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts.some(alert => alert.metric === 'errorRate')).toBe(true);
    });

    it('should trigger alert for high memory usage', async () => {
      mockMetricsService.getMemoryUsage.mockResolvedValueOnce(0.85);

      await service.collectMetrics();
      const alerts = service.getActiveAlerts();

      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts.some(alert => alert.metric === 'memoryUsage')).toBe(true);
    });

    it('should clear alerts successfully', () => {
      service.clearAlerts();
      const alerts = service.getActiveAlerts();

      expect(alerts).toHaveLength(0);
    });
  });

  describe('performance history', () => {
    it('should maintain performance history', async () => {
      await service.collectMetrics();
      await service.collectMetrics();
      await service.collectMetrics();

      const history = service.getPerformanceHistory(10);
      expect(history.length).toBe(3);
    });

    it('should limit history to specified count', async () => {
      // Collect more metrics than the limit
      for (let i = 0; i < 15; i++) {
        await service.collectMetrics();
      }

      const history = service.getPerformanceHistory(10);
      expect(history.length).toBe(10);
    });
  });

  describe('optimization integration', () => {
    it('should force optimization successfully', async () => {
      await service.forceOptimization();

      expect(optimizationService.runFullOptimization).toHaveBeenCalled();
    });

    it('should reset metrics successfully', () => {
      service.resetMetrics();
      const history = service.getPerformanceHistory();

      expect(history).toHaveLength(0);
    });
  });
});

describe('CacheService', () => {
  let service: CacheService;
  let mockRedis: any;

  beforeEach(async () => {
    mockRedis = {
      config: jest.fn().mockResolvedValue('OK'),
      info: jest.fn().mockResolvedValue('keyspace_hits:850\r\nkeyspace_misses:150\r\n'),
      setex: jest.fn().mockResolvedValue('OK'),
      set: jest.fn().mockResolvedValue('OK'),
      get: jest.fn().mockResolvedValue(null),
      del: jest.fn().mockResolvedValue(1),
      exists: jest.fn().mockResolvedValue(1),
      keys: jest.fn().mockResolvedValue([]),
      incr: jest.fn().mockResolvedValue(1),
      expire: jest.fn().mockResolvedValue(1),
      mget: jest.fn().mockResolvedValue([]),
      pipeline: jest.fn().mockReturnValue({
        setex: jest.fn(),
        set: jest.fn(),
        exec: jest.fn().mockResolvedValue([]),
      }),
      flushall: jest.fn().mockResolvedValue('OK'),
      eval: jest.fn().mockResolvedValue(0),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CacheService,
        { provide: 'default_IORedisModuleConnectionToken', useValue: mockRedis },
      ],
    }).compile();

    service = module.get<CacheService>(CacheService);
  });

  describe('cache operations', () => {
    it('should set cache value with TTL', async () => {
      await service.set('test-key', { data: 'test' }, 3600);

      expect(mockRedis.setex).toHaveBeenCalledWith(
        'test-key',
        3600,
        expect.any(String),
      );
    });

    it('should get cache value', async () => {
      mockRedis.get.mockResolvedValueOnce('{"data":"test"}');

      const result = await service.get('test-key');

      expect(mockRedis.get).toHaveBeenCalledWith('test-key');
      expect(result).toEqual({ data: 'test' });
    });

    it('should return null for non-existent key', async () => {
      mockRedis.get.mockResolvedValueOnce(null);

      const result = await service.get('non-existent-key');

      expect(result).toBeNull();
    });

    it('should delete cache key', async () => {
      await service.del('test-key');

      expect(mockRedis.del).toHaveBeenCalledWith('test-key');
    });

    it('should check key existence', async () => {
      const exists = await service.exists('test-key');

      expect(mockRedis.exists).toHaveBeenCalledWith('test-key');
      expect(exists).toBe(true);
    });
  });

  describe('pattern operations', () => {
    it('should set cache with pattern', async () => {
      await service.setWithPattern('user', '123', { name: 'John' }, 3600);

      expect(mockRedis.setex).toHaveBeenCalledWith(
        'user:123',
        3600,
        expect.any(String),
      );
    });

    it('should get cache with pattern', async () => {
      mockRedis.get.mockResolvedValueOnce('{"name":"John"}');

      const result = await service.getWithPattern('user', '123');

      expect(mockRedis.get).toHaveBeenCalledWith('user:123');
      expect(result).toEqual({ name: 'John' });
    });

    it('should delete pattern keys', async () => {
      mockRedis.keys.mockResolvedValueOnce(['user:1', 'user:2', 'user:3']);

      await service.delPattern('user');

      expect(mockRedis.keys).toHaveBeenCalledWith('user:*');
      expect(mockRedis.del).toHaveBeenCalledWith('user:1', 'user:2', 'user:3');
    });
  });

  describe('cache optimization', () => {
    it('should optimize cache successfully', async () => {
      await service.optimize();

      expect(mockRedis.eval).toHaveBeenCalled();
      expect(mockRedis.config).toHaveBeenCalledWith('SET', 'maxmemory-policy', 'allkeys-lru');
    });

    it('should flush all cache', async () => {
      await service.flushAll();

      expect(mockRedis.flushall).toHaveBeenCalled();
    });
  });
});

describe('MetricsService', () => {
  let service: MetricsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MetricsService],
    }).compile();

    service = module.get<MetricsService>(MetricsService);
  });

  describe('request tracking', () => {
    it('should record request timing', () => {
      service.recordRequest(250);

      expect(service.getApplicationMetrics().throughput.requestsPerSecond).toBeGreaterThan(0);
    });

    it('should record errors', () => {
      service.recordError('500');
      service.recordError('404');

      const metrics = service.getApplicationMetrics();
      expect(metrics.errors.count).toBe(2);
      expect(metrics.errors.types['500']).toBe(1);
      expect(metrics.errors.types['404']).toBe(1);
    });
  });

  describe('WebSocket tracking', () => {
    it('should track WebSocket connections', () => {
      service.recordWebSocketConnection(true);
      service.recordWebSocketConnection(true);
      service.recordWebSocketConnection(false);

      const metrics = service.getApplicationMetrics();
      expect(metrics.websockets.connections).toBe(1);
    });

    it('should track WebSocket messages', () => {
      service.recordWebSocketMessage();
      service.recordWebSocketMessage();

      const metrics = service.getApplicationMetrics();
      expect(metrics.websockets.messages).toBe(2);
    });
  });

  describe('database tracking', () => {
    it('should record database queries', () => {
      service.recordDatabaseQuery(500);
      service.recordDatabaseQuery(1500); // Slow query

      const metrics = service.getApplicationMetrics();
      expect(metrics.database.queries).toBe(2);
      expect(metrics.database.slowQueries).toBe(1);
    });
  });

  describe('cache tracking', () => {
    it('should record cache operations', () => {
      service.recordCacheOperation(true);
      service.recordCacheOperation(false);
      service.recordCacheOperation(true);

      const metrics = service.getApplicationMetrics();
      expect(metrics.cache.operations).toBe(3);
      expect(metrics.cache.hitRate).toBeCloseTo(0.67, 2);
    });
  });

  describe('Prometheus metrics', () => {
    it('should generate Prometheus format metrics', () => {
      service.recordRequest(250);
      service.recordError('500');

      const prometheusMetrics = service.getPrometheusMetrics();

      expect(prometheusMetrics).toContain('http_requests_total');
      expect(prometheusMetrics).toContain('http_errors_total');
      expect(prometheusMetrics).toContain('websocket_connections_active');
      expect(prometheusMetrics).toContain('cache_hit_rate');
    });
  });
});
