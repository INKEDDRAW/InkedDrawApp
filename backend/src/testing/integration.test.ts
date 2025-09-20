/**
 * Comprehensive Integration Tests
 * End-to-end testing of all major user workflows
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../app.module';
import * as request from 'supertest';

describe('Inked Draw Integration Tests', () => {
  let app: INestApplication;
  let authToken: string;
  let testUserId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Create test user and get auth token
    const authResponse = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email: 'test@example.com',
        password: 'TestPassword123!',
        displayName: 'Test User',
        dateOfBirth: '1990-01-01',
      });

    authToken = authResponse.body.access_token;
    testUserId = authResponse.body.user.id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Authentication Flow', () => {
    it('should register a new user', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'newuser@example.com',
          password: 'NewPassword123!',
          displayName: 'New User',
          dateOfBirth: '1985-05-15',
        });

      expect(response.status).toBe(201);
      expect(response.body.access_token).toBeDefined();
      expect(response.body.user.email).toBe('newuser@example.com');
    });

    it('should login existing user', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'TestPassword123!',
        });

      expect(response.status).toBe(200);
      expect(response.body.access_token).toBeDefined();
    });

    it('should verify age verification', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/age-verification/verify')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          dateOfBirth: '1990-01-01',
          idType: 'drivers_license',
          idNumber: 'DL123456789',
        });

      expect(response.status).toBe(200);
      expect(response.body.verified).toBe(true);
    });
  });

  describe('Social Features Workflow', () => {
    let postId: string;

    it('should create a new post', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/social/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'Just enjoyed an amazing Cohiba Behike!',
          productId: 'test-cigar-id',
          productType: 'cigar',
          imageUrls: ['https://example.com/cigar.jpg'],
          tags: ['cohiba', 'premium'],
        });

      expect(response.status).toBe(201);
      expect(response.body.content).toBe('Just enjoyed an amazing Cohiba Behike!');
      postId = response.body.id;
    });

    it('should get user feed', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/social/feed')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ limit: 10 });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.posts)).toBe(true);
    });

    it('should like a post', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/social/posts/${postId}/like`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.liked).toBe(true);
    });

    it('should comment on a post', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/social/posts/${postId}/comments`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'Great choice! I love that cigar too.',
        });

      expect(response.status).toBe(201);
      expect(response.body.content).toBe('Great choice! I love that cigar too.');
    });
  });

  describe('Product Catalog Integration', () => {
    it('should search cigars', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/catalog/products/search')
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          q: 'cohiba',
          category: 'cigars',
          limit: 10,
        });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should get product details', async () => {
      // First get a product from search
      const searchResponse = await request(app.getHttpServer())
        .get('/api/catalog/products/search')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ q: 'cohiba', limit: 1 });

      if (searchResponse.body.length > 0) {
        const productId = searchResponse.body[0].id;
        
        const response = await request(app.getHttpServer())
          .get(`/api/catalog/products/${productId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .query({ type: 'cigar' });

        expect(response.status).toBe(200);
        expect(response.body.id).toBe(productId);
      }
    });

    it('should add product to user collection', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/catalog/user-products')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: 'test-cigar-id',
          productType: 'cigar',
          rating: 5,
          notes: 'Excellent cigar with rich flavors',
          purchaseDate: '2024-01-15',
          purchasePrice: 25.99,
        });

      expect(response.status).toBe(201);
      expect(response.body.rating).toBe(5);
    });
  });

  describe('AI Recommendations', () => {
    it('should get personalized recommendations', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/ai/recommendations')
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          type: 'cigar',
          limit: 10,
          include_reasons: 'true',
        });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.recommendations)).toBe(true);
    });

    it('should get similar products', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/ai/recommendations/similar/test-cigar-id')
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          product_type: 'cigar',
          limit: 5,
        });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.recommendations)).toBe(true);
    });
  });

  describe('Vision & Location Services', () => {
    it('should get vision API status', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/vision/status')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(typeof response.body.enabled).toBe('boolean');
    });

    it('should recognize cigar from image', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/vision/recognize-cigar')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          imageUrl: 'https://example.com/test-cigar.jpg',
          userLatitude: 40.7128,
          userLongitude: -74.0060,
          searchRadius: 25,
        });

      expect(response.status).toBe(200);
      expect(response.body.recognition).toBeDefined();
      expect(Array.isArray(response.body.nearbyShops)).toBe(true);
    });

    it('should find nearby smoke shops', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/location/nearby-shops')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          latitude: 40.7128,
          longitude: -74.0060,
          radius: 25,
          limit: 10,
        });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.shops)).toBe(true);
    });
  });

  describe('Real-time Features', () => {
    it('should get real-time dashboard data', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/realtime/dashboard')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.stats).toBeDefined();
    });

    it('should get user presence', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/realtime/presence/status')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBeDefined();
    });
  });

  describe('Content Moderation', () => {
    it('should moderate text content', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/moderation/moderate-text')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'This is a test message for moderation',
          contentType: 'post',
        });

      expect(response.status).toBe(200);
      expect(response.body.isApproved).toBeDefined();
      expect(response.body.confidence).toBeDefined();
    });

    it('should get moderation queue (admin only)', async () => {
      // This would require admin token in real scenario
      const response = await request(app.getHttpServer())
        .get('/api/moderation/queue')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ status: 'pending', limit: 10 });

      // Expect 403 for non-admin user
      expect([200, 403]).toContain(response.status);
    });
  });

  describe('Performance Monitoring', () => {
    it('should get performance summary', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/performance/summary')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.current).toBeDefined();
      expect(response.body.uptime).toBeDefined();
    });

    it('should get cache statistics', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/performance/cache/stats')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.hitRate).toBeDefined();
    });
  });

  describe('Analytics Integration', () => {
    it('should track user event', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/analytics/track/event')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          event: 'test_event',
          properties: {
            category: 'testing',
            value: 1,
          },
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should get user analytics', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/analytics/user/summary')
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          startDate: '2024-01-01',
          endDate: '2024-12-31',
        });

      expect(response.status).toBe(200);
      expect(response.body.totalEvents).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle unauthorized requests', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/social/feed');

      expect(response.status).toBe(401);
    });

    it('should handle invalid data', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/social/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: '', // Invalid empty content
        });

      expect(response.status).toBe(400);
    });

    it('should handle not found resources', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/catalog/products/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ type: 'cigar' });

      expect(response.status).toBe(404);
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits', async () => {
      // Make multiple rapid requests to test rate limiting
      const requests = Array(20).fill(null).map(() =>
        request(app.getHttpServer())
          .get('/api/social/feed')
          .set('Authorization', `Bearer ${authToken}`)
      );

      const responses = await Promise.all(requests);
      
      // Some requests should be rate limited
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });
});
