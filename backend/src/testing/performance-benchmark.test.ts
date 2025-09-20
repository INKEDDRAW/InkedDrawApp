/**
 * Performance Benchmark Tests
 * Load testing and performance validation
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../app.module';
import * as request from 'supertest';

describe('Performance Benchmark Tests', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Create test user for authenticated tests
    const authResponse = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email: 'perf@example.com',
        password: 'PerfTestPassword123!',
        displayName: 'Performance Test User',
        dateOfBirth: '1990-01-01',
      });

    authToken = authResponse.body.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Response Time Benchmarks', () => {
    it('should respond to health check within 100ms', async () => {
      const startTime = Date.now();
      
      const response = await request(app.getHttpServer())
        .get('/health');
      
      const responseTime = Date.now() - startTime;
      
      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(100);
    });

    it('should respond to authentication within 500ms', async () => {
      const startTime = Date.now();
      
      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'perf@example.com',
          password: 'PerfTestPassword123!',
        });
      
      const responseTime = Date.now() - startTime;
      
      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(500);
    });

    it('should respond to feed requests within 300ms', async () => {
      const startTime = Date.now();
      
      const response = await request(app.getHttpServer())
        .get('/api/social/feed')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ limit: 10 });
      
      const responseTime = Date.now() - startTime;
      
      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(300);
    });

    it('should respond to product search within 400ms', async () => {
      const startTime = Date.now();
      
      const response = await request(app.getHttpServer())
        .get('/api/catalog/products/search')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ q: 'cohiba', limit: 10 });
      
      const responseTime = Date.now() - startTime;
      
      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(400);
    });

    it('should respond to AI recommendations within 800ms', async () => {
      const startTime = Date.now();
      
      const response = await request(app.getHttpServer())
        .get('/api/ai/recommendations')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ type: 'cigar', limit: 5 });
      
      const responseTime = Date.now() - startTime;
      
      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(800);
    });
  });

  describe('Concurrent Load Testing', () => {
    it('should handle 10 concurrent feed requests', async () => {
      const concurrentRequests = 10;
      const requests = Array(concurrentRequests).fill(null).map(() =>
        request(app.getHttpServer())
          .get('/api/social/feed')
          .set('Authorization', `Bearer ${authToken}`)
          .query({ limit: 5 })
      );

      const startTime = Date.now();
      const responses = await Promise.all(requests);
      const totalTime = Date.now() - startTime;

      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });

      // Average response time should be reasonable
      const avgResponseTime = totalTime / concurrentRequests;
      expect(avgResponseTime).toBeLessThan(500);
    });

    it('should handle 20 concurrent search requests', async () => {
      const concurrentRequests = 20;
      const searchTerms = ['cohiba', 'montecristo', 'padron', 'davidoff', 'arturo'];
      
      const requests = Array(concurrentRequests).fill(null).map((_, index) =>
        request(app.getHttpServer())
          .get('/api/catalog/products/search')
          .set('Authorization', `Bearer ${authToken}`)
          .query({ 
            q: searchTerms[index % searchTerms.length], 
            limit: 5 
          })
      );

      const startTime = Date.now();
      const responses = await Promise.all(requests);
      const totalTime = Date.now() - startTime;

      // Most requests should succeed (allow for some rate limiting)
      const successfulResponses = responses.filter(r => r.status === 200);
      expect(successfulResponses.length).toBeGreaterThan(concurrentRequests * 0.8);

      // Total time should be reasonable
      expect(totalTime).toBeLessThan(3000);
    });

    it('should handle mixed concurrent operations', async () => {
      const operations = [
        () => request(app.getHttpServer())
          .get('/api/social/feed')
          .set('Authorization', `Bearer ${authToken}`)
          .query({ limit: 5 }),
        
        () => request(app.getHttpServer())
          .get('/api/catalog/products/search')
          .set('Authorization', `Bearer ${authToken}`)
          .query({ q: 'cigar', limit: 5 }),
        
        () => request(app.getHttpServer())
          .get('/api/ai/recommendations')
          .set('Authorization', `Bearer ${authToken}`)
          .query({ type: 'cigar', limit: 3 }),
        
        () => request(app.getHttpServer())
          .get('/api/performance/summary')
          .set('Authorization', `Bearer ${authToken}`),
        
        () => request(app.getHttpServer())
          .post('/api/social/posts')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            content: `Performance test post ${Date.now()}`,
            productType: 'cigar',
          }),
      ];

      const requests = Array(15).fill(null).map((_, index) =>
        operations[index % operations.length]()
      );

      const startTime = Date.now();
      const responses = await Promise.all(requests);
      const totalTime = Date.now() - startTime;

      // Most operations should succeed
      const successfulResponses = responses.filter(r => 
        r.status >= 200 && r.status < 300
      );
      expect(successfulResponses.length).toBeGreaterThan(requests.length * 0.7);

      // Total time should be reasonable
      expect(totalTime).toBeLessThan(5000);
    });
  });

  describe('Memory and Resource Usage', () => {
    it('should not have memory leaks during repeated operations', async () => {
      const initialMemory = process.memoryUsage();
      
      // Perform many operations
      for (let i = 0; i < 100; i++) {
        await request(app.getHttpServer())
          .get('/api/social/feed')
          .set('Authorization', `Bearer ${authToken}`)
          .query({ limit: 1 });
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage();
      
      // Memory usage should not increase dramatically
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      const memoryIncreasePercent = (memoryIncrease / initialMemory.heapUsed) * 100;
      
      expect(memoryIncreasePercent).toBeLessThan(50); // Less than 50% increase
    });

    it('should handle large response payloads efficiently', async () => {
      const startTime = Date.now();
      
      const response = await request(app.getHttpServer())
        .get('/api/catalog/products')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ limit: 100 }); // Large payload
      
      const responseTime = Date.now() - startTime;
      
      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(1000);
      
      // Response should be properly structured
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('Database Performance', () => {
    it('should execute complex queries efficiently', async () => {
      const startTime = Date.now();
      
      // Complex query with joins and filters
      const response = await request(app.getHttpServer())
        .get('/api/social/feed')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ 
          limit: 20,
          include_user: 'true',
          include_product: 'true',
          sort: 'trending'
        });
      
      const responseTime = Date.now() - startTime;
      
      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(600);
    });

    it('should handle pagination efficiently', async () => {
      const pageSize = 10;
      const pages = 5;
      
      const startTime = Date.now();
      
      for (let page = 0; page < pages; page++) {
        const response = await request(app.getHttpServer())
          .get('/api/social/feed')
          .set('Authorization', `Bearer ${authToken}`)
          .query({ 
            limit: pageSize,
            offset: page * pageSize
          });
        
        expect(response.status).toBe(200);
      }
      
      const totalTime = Date.now() - startTime;
      const avgTimePerPage = totalTime / pages;
      
      expect(avgTimePerPage).toBeLessThan(300);
    });
  });

  describe('Cache Performance', () => {
    it('should improve response times with caching', async () => {
      const endpoint = '/api/catalog/products/trending';
      
      // First request (cache miss)
      const startTime1 = Date.now();
      const response1 = await request(app.getHttpServer())
        .get(endpoint)
        .set('Authorization', `Bearer ${authToken}`);
      const responseTime1 = Date.now() - startTime1;
      
      expect(response1.status).toBe(200);
      
      // Second request (cache hit)
      const startTime2 = Date.now();
      const response2 = await request(app.getHttpServer())
        .get(endpoint)
        .set('Authorization', `Bearer ${authToken}`);
      const responseTime2 = Date.now() - startTime2;
      
      expect(response2.status).toBe(200);
      
      // Cached response should be faster
      expect(responseTime2).toBeLessThan(responseTime1);
      expect(responseTime2).toBeLessThan(100);
    });

    it('should handle cache invalidation properly', async () => {
      // Get cache stats before
      const statsBefore = await request(app.getHttpServer())
        .get('/api/performance/cache/stats')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(statsBefore.status).toBe(200);
      
      // Perform cache-invalidating operation
      await request(app.getHttpServer())
        .post('/api/performance/cache/optimize')
        .set('Authorization', `Bearer ${authToken}`);
      
      // Get cache stats after
      const statsAfter = await request(app.getHttpServer())
        .get('/api/performance/cache/stats')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(statsAfter.status).toBe(200);
      expect(statsAfter.body.hitRate).toBeDefined();
    });
  });

  describe('Real-time Performance', () => {
    it('should handle WebSocket connections efficiently', async () => {
      // Test real-time dashboard endpoint
      const startTime = Date.now();
      
      const response = await request(app.getHttpServer())
        .get('/api/realtime/dashboard')
        .set('Authorization', `Bearer ${authToken}`);
      
      const responseTime = Date.now() - startTime;
      
      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(200);
      expect(response.body.stats).toBeDefined();
    });

    it('should update presence status quickly', async () => {
      const startTime = Date.now();
      
      const response = await request(app.getHttpServer())
        .put('/api/realtime/presence/status')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'online' });
      
      const responseTime = Date.now() - startTime;
      
      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(150);
    });
  });

  describe('Vision API Performance', () => {
    it('should handle image recognition requests efficiently', async () => {
      const startTime = Date.now();
      
      const response = await request(app.getHttpServer())
        .post('/api/vision/recognize-cigar')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          imageUrl: 'https://example.com/test-cigar.jpg',
          userLatitude: 40.7128,
          userLongitude: -74.0060,
          searchRadius: 25,
        });
      
      const responseTime = Date.now() - startTime;
      
      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(2000); // Vision API can be slower
    });

    it('should handle location searches efficiently', async () => {
      const startTime = Date.now();
      
      const response = await request(app.getHttpServer())
        .post('/api/location/nearby-shops')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          latitude: 40.7128,
          longitude: -74.0060,
          radius: 25,
          limit: 10,
        });
      
      const responseTime = Date.now() - startTime;
      
      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(400);
    });
  });

  describe('Performance Monitoring', () => {
    it('should track performance metrics accurately', async () => {
      // Get initial metrics
      const initialMetrics = await request(app.getHttpServer())
        .get('/api/performance/metrics')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(initialMetrics.status).toBe(200);
      
      // Perform some operations
      await Promise.all([
        request(app.getHttpServer())
          .get('/api/social/feed')
          .set('Authorization', `Bearer ${authToken}`),
        request(app.getHttpServer())
          .get('/api/catalog/products/search')
          .set('Authorization', `Bearer ${authToken}`)
          .query({ q: 'test' }),
      ]);
      
      // Get updated metrics
      const updatedMetrics = await request(app.getHttpServer())
        .get('/api/performance/metrics')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(updatedMetrics.status).toBe(200);
      expect(updatedMetrics.body.requestCount).toBeGreaterThan(
        initialMetrics.body.requestCount
      );
    });

    it('should provide optimization recommendations', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/performance/optimization/recommendations')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.recommendations)).toBe(true);
    });
  });
});
