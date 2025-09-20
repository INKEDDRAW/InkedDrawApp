/**
 * Test Setup Configuration
 * Global test setup and utilities
 */

// Test setup - no imports needed for environment configuration

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5432/inked_draw_test';
process.env.SUPABASE_URL = process.env.TEST_SUPABASE_URL || 'http://localhost:54321';
process.env.SUPABASE_ANON_KEY = process.env.TEST_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.TEST_SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.GOOGLE_VISION_ENABLED = 'false'; // Use mock for tests
process.env.REDIS_URL = process.env.TEST_REDIS_URL || 'redis://localhost:6379/1';

// Global test timeout
jest.setTimeout(30000);

// Mock external services for testing
jest.mock('@google-cloud/vision', () => ({
  ImageAnnotatorClient: jest.fn().mockImplementation(() => ({
    labelDetection: jest.fn().mockResolvedValue([{
      labelAnnotations: [
        { description: 'Cigar', score: 0.95 },
        { description: 'Tobacco', score: 0.88 },
      ],
    }]),
    textDetection: jest.fn().mockResolvedValue([{
      textAnnotations: [
        { description: 'COHIBA BEHIKE 52' },
      ],
    }]),
    objectLocalization: jest.fn().mockResolvedValue([{
      localizedObjectAnnotations: [],
    }]),
    logoDetection: jest.fn().mockResolvedValue([{
      logoAnnotations: [
        { description: 'Cohiba', score: 0.89 },
      ],
    }]),
    imageProperties: jest.fn().mockResolvedValue([{
      imagePropertiesAnnotation: {
        dominantColors: {
          colors: [
            { color: { red: 139, green: 69, blue: 19 }, score: 0.8 },
          ],
        },
      },
    }]),
    safeSearchDetection: jest.fn().mockResolvedValue([{
      safeSearchAnnotation: {
        adult: 'VERY_UNLIKELY',
        spoof: 'VERY_UNLIKELY',
        medical: 'UNLIKELY',
        violence: 'VERY_UNLIKELY',
        racy: 'VERY_UNLIKELY',
      },
    }]),
  })),
}));

// Mock PostHog for analytics
jest.mock('posthog-node', () => ({
  PostHog: jest.fn().mockImplementation(() => ({
    capture: jest.fn(),
    identify: jest.fn(),
    isFeatureEnabled: jest.fn().mockResolvedValue(false),
    shutdown: jest.fn(),
  })),
}));

// Mock Redis for caching
jest.mock('ioredis', () => {
  const mockRedis = {
    get: jest.fn(),
    set: jest.fn(),
    setex: jest.fn(),
    del: jest.fn(),
    exists: jest.fn(),
    keys: jest.fn(),
    incr: jest.fn(),
    expire: jest.fn(),
    mget: jest.fn(),
    pipeline: jest.fn().mockReturnValue({
      setex: jest.fn(),
      set: jest.fn(),
      exec: jest.fn().mockResolvedValue([]),
    }),
    flushall: jest.fn(),
    eval: jest.fn(),
    config: jest.fn(),
    info: jest.fn().mockReturnValue('keyspace_hits:850\r\nkeyspace_misses:150\r\n'),
  };
  
  return jest.fn().mockImplementation(() => mockRedis);
});

// Global test utilities
global.testUtils = {
  createMockUser: () => ({
    id: 'test-user-id',
    email: 'test@example.com',
    displayName: 'Test User',
    createdAt: new Date(),
  }),
  
  createMockPost: () => ({
    id: 'test-post-id',
    content: 'Test post content',
    userId: 'test-user-id',
    createdAt: new Date(),
  }),
  
  createMockCigar: () => ({
    id: 'test-cigar-id',
    name: 'Test Cigar',
    brand: 'Test Brand',
    strength: 'medium',
    createdAt: new Date(),
  }),
  
  delay: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),
};

// Declare global types
declare global {
  var testUtils: {
    createMockUser: () => any;
    createMockPost: () => any;
    createMockCigar: () => any;
    delay: (ms: number) => Promise<void>;
  };
}

export {};
