/**
 * API Endpoint Validation Tests
 * Comprehensive validation of all API endpoints
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../app.module';
import * as request from 'supertest';

describe('API Endpoint Validation', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Get auth token for protected endpoints
    const authResponse = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email: 'apitest@example.com',
        password: 'ApiTest123!',
        displayName: 'API Test User',
        dateOfBirth: '1990-01-01',
      });

    authToken = authResponse.body.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Authentication Endpoints', () => {
    const endpoints = [
      { method: 'POST', path: '/api/auth/register', requiresAuth: false },
      { method: 'POST', path: '/api/auth/login', requiresAuth: false },
      { method: 'POST', path: '/api/auth/logout', requiresAuth: true },
      { method: 'POST', path: '/api/auth/refresh', requiresAuth: true },
      { method: 'GET', path: '/api/auth/profile', requiresAuth: true },
      { method: 'PUT', path: '/api/auth/profile', requiresAuth: true },
    ];

    endpoints.forEach(({ method, path, requiresAuth }) => {
      it(`should validate ${method} ${path}`, async () => {
        const req = request(app.getHttpServer())[method.toLowerCase()](path);
        
        if (requiresAuth) {
          req.set('Authorization', `Bearer ${authToken}`);
        }

        const response = await req;
        
        // Should not return 404 (endpoint exists)
        expect(response.status).not.toBe(404);
        
        // Should have proper CORS headers
        expect(response.headers['access-control-allow-origin']).toBeDefined();
      });
    });
  });

  describe('Social Endpoints', () => {
    const endpoints = [
      { method: 'GET', path: '/api/social/feed' },
      { method: 'POST', path: '/api/social/posts' },
      { method: 'GET', path: '/api/social/posts/trending' },
      { method: 'GET', path: '/api/social/users/search' },
      { method: 'POST', path: '/api/social/users/follow' },
      { method: 'GET', path: '/api/social/users/followers' },
      { method: 'GET', path: '/api/social/users/following' },
    ];

    endpoints.forEach(({ method, path }) => {
      it(`should validate ${method} ${path}`, async () => {
        const response = await request(app.getHttpServer())
          [method.toLowerCase()](path)
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).not.toBe(404);
        expect(response.status).not.toBe(500);
      });
    });
  });

  describe('Catalog Endpoints', () => {
    const endpoints = [
      { method: 'GET', path: '/api/catalog/products' },
      { method: 'GET', path: '/api/catalog/products/search' },
      { method: 'GET', path: '/api/catalog/products/trending' },
      { method: 'GET', path: '/api/catalog/cigars' },
      { method: 'GET', path: '/api/catalog/beers' },
      { method: 'GET', path: '/api/catalog/wines' },
      { method: 'POST', path: '/api/catalog/user-products' },
      { method: 'GET', path: '/api/catalog/user-products' },
    ];

    endpoints.forEach(({ method, path }) => {
      it(`should validate ${method} ${path}`, async () => {
        const response = await request(app.getHttpServer())
          [method.toLowerCase()](path)
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).not.toBe(404);
        expect(response.status).not.toBe(500);
      });
    });
  });

  describe('AI Recommendation Endpoints', () => {
    const endpoints = [
      { method: 'GET', path: '/api/ai/recommendations' },
      { method: 'GET', path: '/api/ai/recommendations/trending' },
      { method: 'GET', path: '/api/ai/recommendations/cold-start' },
      { method: 'GET', path: '/api/ai/recommendations/collaborative/user-based' },
      { method: 'GET', path: '/api/ai/recommendations/collaborative/item-based' },
      { method: 'POST', path: '/api/ai/recommendations/feedback' },
    ];

    endpoints.forEach(({ method, path }) => {
      it(`should validate ${method} ${path}`, async () => {
        const response = await request(app.getHttpServer())
          [method.toLowerCase()](path)
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).not.toBe(404);
        expect(response.status).not.toBe(500);
      });
    });
  });

  describe('Vision & Location Endpoints', () => {
    const endpoints = [
      { method: 'GET', path: '/api/vision/status' },
      { method: 'POST', path: '/api/vision/recognize-cigar' },
      { method: 'POST', path: '/api/vision/analyze-image' },
      { method: 'POST', path: '/api/vision/extract-text' },
      { method: 'POST', path: '/api/vision/detect-logos' },
      { method: 'POST', path: '/api/location/nearby-shops' },
      { method: 'GET', path: '/api/location/popular-shops' },
      { method: 'GET', path: '/api/location/shops-with-brand' },
      { method: 'POST', path: '/api/location/geocode' },
      { method: 'GET', path: '/api/location/distance' },
    ];

    endpoints.forEach(({ method, path }) => {
      it(`should validate ${method} ${path}`, async () => {
        const response = await request(app.getHttpServer())
          [method.toLowerCase()](path)
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).not.toBe(404);
        expect(response.status).not.toBe(500);
      });
    });
  });

  describe('Real-time Endpoints', () => {
    const endpoints = [
      { method: 'GET', path: '/api/realtime/dashboard' },
      { method: 'GET', path: '/api/realtime/presence/status' },
      { method: 'PUT', path: '/api/realtime/presence/status' },
      { method: 'GET', path: '/api/realtime/notifications' },
      { method: 'PUT', path: '/api/realtime/notifications/read' },
      { method: 'GET', path: '/api/realtime/live-feed' },
    ];

    endpoints.forEach(({ method, path }) => {
      it(`should validate ${method} ${path}`, async () => {
        const response = await request(app.getHttpServer())
          [method.toLowerCase()](path)
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).not.toBe(404);
        expect(response.status).not.toBe(500);
      });
    });
  });

  describe('Performance Endpoints', () => {
    const endpoints = [
      { method: 'GET', path: '/api/performance/summary' },
      { method: 'GET', path: '/api/performance/metrics' },
      { method: 'GET', path: '/api/performance/dashboard' },
      { method: 'GET', path: '/api/performance/cache/stats' },
      { method: 'POST', path: '/api/performance/cache/optimize' },
      { method: 'GET', path: '/api/performance/optimization/recommendations' },
      { method: 'POST', path: '/api/performance/optimization/run' },
      { method: 'GET', path: '/api/performance/health' },
    ];

    endpoints.forEach(({ method, path }) => {
      it(`should validate ${method} ${path}`, async () => {
        const response = await request(app.getHttpServer())
          [method.toLowerCase()](path)
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).not.toBe(404);
        expect(response.status).not.toBe(500);
      });
    });
  });

  describe('Content Moderation Endpoints', () => {
    const endpoints = [
      { method: 'POST', path: '/api/moderation/moderate-text' },
      { method: 'POST', path: '/api/moderation/moderate-image' },
      { method: 'GET', path: '/api/moderation/queue' },
      { method: 'POST', path: '/api/moderation/review' },
      { method: 'GET', path: '/api/moderation/stats' },
      { method: 'POST', path: '/api/moderation/report' },
    ];

    endpoints.forEach(({ method, path }) => {
      it(`should validate ${method} ${path}`, async () => {
        const response = await request(app.getHttpServer())
          [method.toLowerCase()](path)
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).not.toBe(404);
        expect(response.status).not.toBe(500);
      });
    });
  });

  describe('Analytics Endpoints', () => {
    const endpoints = [
      { method: 'POST', path: '/api/analytics/track/event' },
      { method: 'POST', path: '/api/analytics/track/page-view' },
      { method: 'POST', path: '/api/analytics/track/search' },
      { method: 'GET', path: '/api/analytics/user/summary' },
      { method: 'GET', path: '/api/analytics/feature-flags' },
    ];

    endpoints.forEach(({ method, path }) => {
      it(`should validate ${method} ${path}`, async () => {
        const response = await request(app.getHttpServer())
          [method.toLowerCase()](path)
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).not.toBe(404);
        expect(response.status).not.toBe(500);
      });
    });
  });

  describe('Response Format Validation', () => {
    it('should return JSON responses with proper content-type', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/social/feed')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.headers['content-type']).toMatch(/application\/json/);
    });

    it('should include proper error format for 4xx responses', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/social/feed'); // No auth token

      expect(response.status).toBe(401);
      expect(response.body.message).toBeDefined();
      expect(response.body.statusCode).toBe(401);
    });

    it('should include request ID in responses', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/social/feed')
        .set('Authorization', `Bearer ${authToken}`);

      // Check for request ID header or in response body
      expect(
        response.headers['x-request-id'] || response.body.requestId
      ).toBeDefined();
    });
  });

  describe('Security Headers Validation', () => {
    it('should include security headers', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/social/feed')
        .set('Authorization', `Bearer ${authToken}`);

      // Check for common security headers
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBeDefined();
      expect(response.headers['x-xss-protection']).toBeDefined();
    });

    it('should handle CORS properly', async () => {
      const response = await request(app.getHttpServer())
        .options('/api/social/feed')
        .set('Origin', 'http://localhost:3000');

      expect(response.headers['access-control-allow-origin']).toBeDefined();
      expect(response.headers['access-control-allow-methods']).toBeDefined();
      expect(response.headers['access-control-allow-headers']).toBeDefined();
    });
  });

  describe('Input Validation', () => {
    it('should validate required fields', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/social/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({}); // Empty body

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('content');
    });

    it('should validate field types', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/catalog/user-products')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: 'test-id',
          productType: 'cigar',
          rating: 'invalid-rating', // Should be number
        });

      expect(response.status).toBe(400);
    });

    it('should validate field lengths', async () => {
      const longContent = 'a'.repeat(10000); // Very long content
      
      const response = await request(app.getHttpServer())
        .post('/api/social/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: longContent,
        });

      expect(response.status).toBe(400);
    });
  });

  describe('Pagination Validation', () => {
    it('should handle pagination parameters', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/social/feed')
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          limit: 5,
          offset: 10,
        });

      expect(response.status).toBe(200);
      expect(response.body.posts).toBeDefined();
      expect(response.body.pagination).toBeDefined();
    });

    it('should enforce pagination limits', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/social/feed')
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          limit: 1000, // Excessive limit
        });

      expect(response.status).toBe(200);
      // Should be capped at reasonable limit
      expect(response.body.posts.length).toBeLessThanOrEqual(100);
    });
  });

  describe('Health Check Endpoints', () => {
    it('should have health check endpoint', async () => {
      const response = await request(app.getHttpServer())
        .get('/health');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ok');
    });

    it('should have readiness check', async () => {
      const response = await request(app.getHttpServer())
        .get('/health/ready');

      expect(response.status).toBe(200);
    });

    it('should have liveness check', async () => {
      const response = await request(app.getHttpServer())
        .get('/health/live');

      expect(response.status).toBe(200);
    });
  });
});
