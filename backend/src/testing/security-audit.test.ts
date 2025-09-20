/**
 * Security Audit Tests
 * Comprehensive security validation and vulnerability testing
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../app.module';
import * as request from 'supertest';

describe('Security Audit Tests', () => {
  let app: INestApplication;
  let authToken: string;
  let testUserId: string;

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
        email: 'security@example.com',
        password: 'SecurePassword123!',
        displayName: 'Security Test User',
        dateOfBirth: '1990-01-01',
      });

    authToken = authResponse.body.access_token;
    testUserId = authResponse.body.user.id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Authentication Security', () => {
    it('should reject weak passwords', async () => {
      const weakPasswords = [
        'password',
        '123456',
        'qwerty',
        'abc123',
        'password123',
      ];

      for (const password of weakPasswords) {
        const response = await request(app.getHttpServer())
          .post('/api/auth/register')
          .send({
            email: `weak${Date.now()}@example.com`,
            password,
            displayName: 'Weak Password User',
            dateOfBirth: '1990-01-01',
          });

        expect(response.status).toBe(400);
        expect(response.body.message).toContain('password');
      }
    });

    it('should enforce password complexity requirements', async () => {
      const invalidPasswords = [
        'short',           // Too short
        'nouppercase123!', // No uppercase
        'NOLOWERCASE123!', // No lowercase
        'NoNumbers!',      // No numbers
        'NoSpecialChars123', // No special characters
      ];

      for (const password of invalidPasswords) {
        const response = await request(app.getHttpServer())
          .post('/api/auth/register')
          .send({
            email: `invalid${Date.now()}@example.com`,
            password,
            displayName: 'Invalid Password User',
            dateOfBirth: '1990-01-01',
          });

        expect(response.status).toBe(400);
      }
    });

    it('should prevent email enumeration attacks', async () => {
      // Try to register with existing email
      const response1 = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'security@example.com', // Already exists
          password: 'NewPassword123!',
          displayName: 'Duplicate User',
          dateOfBirth: '1990-01-01',
        });

      // Try to login with non-existent email
      const response2 = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'AnyPassword123!',
        });

      // Both should return similar error messages to prevent enumeration
      expect(response1.status).toBe(400);
      expect(response2.status).toBe(401);
      
      // Error messages should not reveal whether email exists
      expect(response1.body.message).not.toContain('already exists');
      expect(response2.body.message).not.toContain('not found');
    });

    it('should implement rate limiting on auth endpoints', async () => {
      const requests = Array(10).fill(null).map(() =>
        request(app.getHttpServer())
          .post('/api/auth/login')
          .send({
            email: 'nonexistent@example.com',
            password: 'WrongPassword123!',
          })
      );

      const responses = await Promise.all(requests);
      
      // Some requests should be rate limited
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });

    it('should invalidate tokens on logout', async () => {
      // Login to get a token
      const loginResponse = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'security@example.com',
          password: 'SecurePassword123!',
        });

      const token = loginResponse.body.access_token;

      // Use token to access protected endpoint
      const protectedResponse1 = await request(app.getHttpServer())
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`);

      expect(protectedResponse1.status).toBe(200);

      // Logout
      await request(app.getHttpServer())
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${token}`);

      // Try to use token again (should fail)
      const protectedResponse2 = await request(app.getHttpServer())
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`);

      expect(protectedResponse2.status).toBe(401);
    });
  });

  describe('Authorization Security', () => {
    it('should enforce proper access control on user data', async () => {
      // Create another user
      const otherUserResponse = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'other@example.com',
          password: 'OtherPassword123!',
          displayName: 'Other User',
          dateOfBirth: '1990-01-01',
        });

      const otherUserId = otherUserResponse.body.user.id;

      // Try to access other user's data
      const response = await request(app.getHttpServer())
        .get(`/api/users/${otherUserId}/profile`)
        .set('Authorization', `Bearer ${authToken}`);

      // Should either be forbidden or return limited public data only
      if (response.status === 200) {
        // If allowed, should not contain sensitive data
        expect(response.body.email).toBeUndefined();
        expect(response.body.password_hash).toBeUndefined();
      } else {
        expect(response.status).toBe(403);
      }
    });

    it('should prevent unauthorized post modifications', async () => {
      // Create a post as test user
      const postResponse = await request(app.getHttpServer())
        .post('/api/social/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'Test post for security',
          productType: 'cigar',
        });

      const postId = postResponse.body.id;

      // Create another user
      const otherUserResponse = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'unauthorized@example.com',
          password: 'UnauthorizedPassword123!',
          displayName: 'Unauthorized User',
          dateOfBirth: '1990-01-01',
        });

      const otherUserToken = otherUserResponse.body.access_token;

      // Try to modify the post as other user
      const modifyResponse = await request(app.getHttpServer())
        .put(`/api/social/posts/${postId}`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .send({
          content: 'Modified by unauthorized user',
        });

      expect(modifyResponse.status).toBe(403);

      // Try to delete the post as other user
      const deleteResponse = await request(app.getHttpServer())
        .delete(`/api/social/posts/${postId}`)
        .set('Authorization', `Bearer ${otherUserToken}`);

      expect(deleteResponse.status).toBe(403);
    });

    it('should enforce admin-only access to moderation endpoints', async () => {
      // Try to access moderation queue as regular user
      const response = await request(app.getHttpServer())
        .get('/api/moderation/queue')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(403);

      // Try to review content as regular user
      const reviewResponse = await request(app.getHttpServer())
        .post('/api/moderation/review')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          contentId: 'test-content-id',
          action: 'approve',
        });

      expect(reviewResponse.status).toBe(403);
    });
  });

  describe('Input Validation Security', () => {
    it('should prevent SQL injection attacks', async () => {
      const sqlInjectionPayloads = [
        "'; DROP TABLE users; --",
        "' OR '1'='1",
        "'; INSERT INTO users (email) VALUES ('hacked@example.com'); --",
        "' UNION SELECT * FROM users --",
      ];

      for (const payload of sqlInjectionPayloads) {
        const response = await request(app.getHttpServer())
          .get('/api/catalog/products/search')
          .set('Authorization', `Bearer ${authToken}`)
          .query({ q: payload });

        // Should not return 500 error (which might indicate SQL injection)
        expect(response.status).not.toBe(500);
        
        // Should handle malicious input gracefully
        expect(response.status).toBeOneOf([200, 400]);
      }
    });

    it('should prevent XSS attacks in user content', async () => {
      const xssPayloads = [
        '<script>alert("XSS")</script>',
        '<img src="x" onerror="alert(\'XSS\')">',
        'javascript:alert("XSS")',
        '<svg onload="alert(\'XSS\')">',
      ];

      for (const payload of xssPayloads) {
        const response = await request(app.getHttpServer())
          .post('/api/social/posts')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            content: payload,
            productType: 'cigar',
          });

        if (response.status === 201) {
          // If post is created, content should be sanitized
          expect(response.body.content).not.toContain('<script>');
          expect(response.body.content).not.toContain('javascript:');
          expect(response.body.content).not.toContain('onerror');
          expect(response.body.content).not.toContain('onload');
        }
      }
    });

    it('should validate file upload security', async () => {
      // Test malicious file types
      const maliciousFiles = [
        { filename: 'malware.exe', mimetype: 'application/x-executable' },
        { filename: 'script.php', mimetype: 'application/x-php' },
        { filename: 'payload.js', mimetype: 'application/javascript' },
      ];

      for (const file of maliciousFiles) {
        const response = await request(app.getHttpServer())
          .post('/api/upload/image')
          .set('Authorization', `Bearer ${authToken}`)
          .attach('file', Buffer.from('fake content'), file.filename);

        // Should reject malicious file types
        expect(response.status).toBe(400);
      }
    });

    it('should prevent path traversal attacks', async () => {
      const pathTraversalPayloads = [
        '../../../etc/passwd',
        '..\\..\\..\\windows\\system32\\config\\sam',
        '....//....//....//etc/passwd',
        '%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd',
      ];

      for (const payload of pathTraversalPayloads) {
        const response = await request(app.getHttpServer())
          .get(`/api/files/${payload}`)
          .set('Authorization', `Bearer ${authToken}`);

        // Should not allow access to system files
        expect(response.status).toBeOneOf([400, 403, 404]);
        expect(response.status).not.toBe(200);
      }
    });
  });

  describe('Data Protection', () => {
    it('should not expose sensitive data in API responses', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      
      // Should not expose sensitive fields
      expect(response.body.password_hash).toBeUndefined();
      expect(response.body.password).toBeUndefined();
      expect(response.body.salt).toBeUndefined();
      expect(response.body.reset_token).toBeUndefined();
    });

    it('should implement proper data masking for PII', async () => {
      // Create user with PII
      const userResponse = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'pii.test@example.com',
          password: 'PIITestPassword123!',
          displayName: 'PII Test User',
          dateOfBirth: '1990-01-01',
        });

      const userId = userResponse.body.user.id;

      // Get user profile (should mask sensitive data)
      const profileResponse = await request(app.getHttpServer())
        .get(`/api/users/${userId}/profile`)
        .set('Authorization', `Bearer ${authToken}`);

      if (profileResponse.status === 200) {
        // Email should be masked or not exposed
        if (profileResponse.body.email) {
          expect(profileResponse.body.email).toMatch(/\*+/);
        }
      }
    });

    it('should enforce HTTPS in production headers', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`);

      // Should have security headers
      expect(response.headers['strict-transport-security']).toBeDefined();
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBeDefined();
    });
  });

  describe('Session Security', () => {
    it('should implement proper session timeout', async () => {
      // This would require mocking time or using expired tokens
      // For now, just verify that tokens have expiration
      const loginResponse = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'security@example.com',
          password: 'SecurePassword123!',
        });

      expect(loginResponse.body.expires_in).toBeDefined();
      expect(loginResponse.body.expires_in).toBeGreaterThan(0);
    });

    it('should prevent session fixation attacks', async () => {
      // Login should generate new session/token
      const loginResponse1 = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'security@example.com',
          password: 'SecurePassword123!',
        });

      const token1 = loginResponse1.body.access_token;

      // Login again should generate different token
      const loginResponse2 = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'security@example.com',
          password: 'SecurePassword123!',
        });

      const token2 = loginResponse2.body.access_token;

      expect(token1).not.toBe(token2);
    });
  });

  describe('API Security', () => {
    it('should implement proper CORS configuration', async () => {
      const response = await request(app.getHttpServer())
        .options('/api/social/feed')
        .set('Origin', 'https://malicious-site.com');

      // Should not allow arbitrary origins
      expect(response.headers['access-control-allow-origin']).not.toBe('*');
    });

    it('should prevent information disclosure in error messages', async () => {
      // Trigger various error conditions
      const responses = await Promise.all([
        request(app.getHttpServer()).get('/api/nonexistent'),
        request(app.getHttpServer()).post('/api/social/posts').send({}),
        request(app.getHttpServer()).get('/api/social/feed'),
      ]);

      responses.forEach(response => {
        // Error messages should not expose internal details
        if (response.body.message) {
          expect(response.body.message).not.toContain('database');
          expect(response.body.message).not.toContain('SQL');
          expect(response.body.message).not.toContain('stack trace');
          expect(response.body.message).not.toContain('file path');
        }
      });
    });

    it('should implement request size limits', async () => {
      // Try to send very large request
      const largePayload = 'x'.repeat(10 * 1024 * 1024); // 10MB

      const response = await request(app.getHttpServer())
        .post('/api/social/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: largePayload,
        });

      // Should reject oversized requests
      expect(response.status).toBe(413);
    });
  });

  describe('Age Verification Security', () => {
    it('should properly validate age verification documents', async () => {
      const invalidDocuments = [
        { idType: 'invalid_type', idNumber: 'ABC123' },
        { idType: 'drivers_license', idNumber: '' },
        { idType: 'passport', idNumber: 'INVALID' },
      ];

      for (const doc of invalidDocuments) {
        const response = await request(app.getHttpServer())
          .post('/api/age-verification/verify')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            dateOfBirth: '1990-01-01',
            ...doc,
          });

        expect(response.status).toBe(400);
      }
    });

    it('should prevent underage access', async () => {
      const underageDate = new Date();
      underageDate.setFullYear(underageDate.getFullYear() - 17); // 17 years old

      const response = await request(app.getHttpServer())
        .post('/api/age-verification/verify')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          dateOfBirth: underageDate.toISOString().split('T')[0],
          idType: 'drivers_license',
          idNumber: 'DL123456789',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('age');
    });
  });
});
