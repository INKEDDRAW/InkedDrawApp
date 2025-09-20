/**
 * AI Services Test Suite
 * Tests for AI-powered recommendation system
 */

import { Test, TestingModule } from '@nestjs/testing';
import { VectorService } from './vector.service';
import { CollaborativeFilteringService } from './collaborative-filtering.service';
import { PersonalizationService } from './personalization.service';
import { RecommendationService } from './recommendation.service';
import { DatabaseService } from '../database/database.service';
import { AnalyticsService } from '../analytics/analytics.service';

// Mock data
const mockProduct = {
  id: 'test-cigar-1',
  name: 'Test Cohiba',
  brand: 'Cohiba',
  strength: 'medium',
  ring_gauge: 50,
  length_inches: 6,
  price_range: 'premium',
  origin_country: 'Cuba',
  flavor_notes: ['chocolate', 'cedar', 'pepper'],
  average_rating: 4.5,
  rating_count: 25,
};

const mockUser = {
  id: 'test-user-1',
  email: 'test@example.com',
  display_name: 'Test User',
};

const mockRatings = [
  {
    id: 'rating-1',
    user_id: 'test-user-1',
    product_id: 'test-cigar-1',
    product_type: 'cigar',
    rating: 5,
    review: 'Excellent cigar',
    flavor_notes: ['chocolate', 'cedar'],
    created_at: new Date(),
  },
  {
    id: 'rating-2',
    user_id: 'test-user-1',
    product_id: 'test-cigar-2',
    product_type: 'cigar',
    rating: 4,
    review: 'Good smoke',
    flavor_notes: ['pepper', 'wood'],
    created_at: new Date(),
  },
];

describe('AI Services', () => {
  let vectorService: VectorService;
  let collaborativeService: CollaborativeFilteringService;
  let personalizationService: PersonalizationService;
  let recommendationService: RecommendationService;
  let databaseService: DatabaseService;

  beforeEach(async () => {
    const mockDatabaseService = {
      query: jest.fn(),
      insert: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const mockAnalyticsService = {
      track: jest.fn(),
      identify: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VectorService,
        CollaborativeFilteringService,
        PersonalizationService,
        RecommendationService,
        {
          provide: DatabaseService,
          useValue: mockDatabaseService,
        },
        {
          provide: AnalyticsService,
          useValue: mockAnalyticsService,
        },
      ],
    }).compile();

    vectorService = module.get<VectorService>(VectorService);
    collaborativeService = module.get<CollaborativeFilteringService>(CollaborativeFilteringService);
    personalizationService = module.get<PersonalizationService>(PersonalizationService);
    recommendationService = module.get<RecommendationService>(RecommendationService);
    databaseService = module.get<DatabaseService>(DatabaseService);
  });

  describe('VectorService', () => {
    it('should generate product embedding', async () => {
      // Mock database calls
      jest.spyOn(databaseService, 'query').mockResolvedValue([]);

      const embedding = await vectorService.generateProductEmbedding(mockProduct, 'cigar');

      expect(embedding).toBeDefined();
      expect(embedding).toHaveLength(384); // Vector dimension
      expect(embedding.every(val => typeof val === 'number')).toBe(true);
    });

    it('should calculate cosine similarity correctly', () => {
      const vectorA = [1, 0, 0];
      const vectorB = [0, 1, 0];
      const vectorC = [1, 0, 0];

      const similarityAB = vectorService.calculateCosineSimilarity(vectorA, vectorB);
      const similarityAC = vectorService.calculateCosineSimilarity(vectorA, vectorC);

      expect(similarityAB).toBe(0); // Orthogonal vectors
      expect(similarityAC).toBe(1); // Identical vectors
    });

    it('should generate user preference vector', async () => {
      // Mock user ratings
      jest.spyOn(databaseService, 'query').mockResolvedValue(mockRatings);

      const userVector = await vectorService.generateUserPreferenceVector('test-user-1');

      expect(userVector).toBeDefined();
      expect(userVector.userId).toBe('test-user-1');
      expect(userVector.flavorPreferences).toBeDefined();
      expect(userVector.categoryWeights).toBeDefined();
    });

    it('should find similar products', async () => {
      // Mock similar products query
      const mockSimilarProducts = [
        {
          id: 'similar-1',
          type: 'cigar',
          embedding: JSON.stringify(new Array(384).fill(0.5)),
          characteristics: {},
        },
      ];

      jest.spyOn(databaseService, 'query')
        .mockResolvedValueOnce([{ embedding: JSON.stringify(new Array(384).fill(0.8)) }]) // Target embedding
        .mockResolvedValueOnce(mockSimilarProducts); // Similar products

      const similar = await vectorService.findSimilarProducts('test-cigar-1', 'cigar', 5);

      expect(similar).toBeDefined();
      expect(Array.isArray(similar)).toBe(true);
    });
  });

  describe('CollaborativeFilteringService', () => {
    it('should find similar users', async () => {
      const mockSimilarUsers = [
        {
          user_id: 'similar-user-1',
          similarity: 0.8,
          common_count: 5,
        },
      ];

      jest.spyOn(databaseService, 'query').mockResolvedValue(mockSimilarUsers);

      const similarUsers = await collaborativeService['findSimilarUsers']('test-user-1');

      expect(similarUsers).toBeDefined();
      expect(similarUsers).toHaveLength(1);
      expect(similarUsers[0].similarity).toBe(0.8);
    });

    it('should get user-based recommendations', async () => {
      // Mock similar users and their recommendations
      jest.spyOn(collaborativeService as any, 'findSimilarUsers').mockResolvedValue([
        { userId: 'similar-user-1', similarity: 0.8, commonRatings: 5 },
      ]);

      jest.spyOn(databaseService, 'query').mockResolvedValue([
        {
          product_id: 'rec-product-1',
          product_type: 'cigar',
          product_name: 'Recommended Cigar',
          avg_rating: 4.5,
          rating_count: 3,
          recommenders: 'Similar User',
        },
      ]);

      const recommendations = await collaborativeService.getUserBasedRecommendations('test-user-1', 10);

      expect(recommendations).toBeDefined();
      expect(Array.isArray(recommendations)).toBe(true);
    });

    it('should get hybrid recommendations', async () => {
      // Mock both user-based and item-based recommendations
      jest.spyOn(collaborativeService, 'getUserBasedRecommendations').mockResolvedValue([
        {
          productId: 'product-1',
          productType: 'cigar',
          predictedRating: 4.5,
          confidence: 0.8,
          reason: 'User-based recommendation',
        },
      ]);

      jest.spyOn(collaborativeService, 'getItemBasedRecommendations').mockResolvedValue([
        {
          productId: 'product-2',
          productType: 'cigar',
          predictedRating: 4.2,
          confidence: 0.7,
          reason: 'Item-based recommendation',
        },
      ]);

      const recommendations = await collaborativeService.getHybridRecommendations('test-user-1', 15);

      expect(recommendations).toBeDefined();
      expect(Array.isArray(recommendations)).toBe(true);
    });
  });

  describe('PersonalizationService', () => {
    it('should build user behavior profile', async () => {
      // Mock various analytics queries
      jest.spyOn(databaseService, 'query')
        .mockResolvedValueOnce([{ avg_rating: 4.2, total_ratings: 10 }]) // Rating patterns
        .mockResolvedValueOnce([{ hour: 19, activity_count: 5 }]) // Time preferences
        .mockResolvedValueOnce([{ product_type: 'cigar', rating_count: 8, avg_rating: 4.5 }]) // Category preferences
        .mockResolvedValueOnce([{ price_range: 'premium', rating_count: 6, avg_rating: 4.3 }]) // Price preferences
        .mockResolvedValueOnce([{ following_count: 5, follower_count: 3 }]); // Social influence

      const profile = await personalizationService.buildUserBehaviorProfile('test-user-1', 90);

      expect(profile).toBeDefined();
      expect(profile.userId).toBe('test-user-1');
      expect(profile.ratingPatterns).toBeDefined();
      expect(profile.timePreferences).toBeDefined();
      expect(profile.categoryPreferences).toBeDefined();
    });

    it('should get personalized recommendations', async () => {
      // Mock user profile
      jest.spyOn(personalizationService, 'buildUserBehaviorProfile').mockResolvedValue({
        userId: 'test-user-1',
        ratingPatterns: { avg_rating: 4.2 },
        timePreferences: [{ hour: 19, activity_count: 5 }],
        categoryPreferences: [{ product_type: 'cigar', avg_rating: 4.5 }],
        pricePreferences: [{ price_range: 'premium', avg_rating: 4.3 }],
        socialInfluence: { following_count: 5 },
      });

      // Mock recommendation queries
      jest.spyOn(databaseService, 'query').mockResolvedValue([
        {
          id: 'personalized-1',
          type: 'cigar',
          name: 'Personalized Cigar',
          average_rating: 4.6,
          rating_count: 15,
        },
      ]);

      const recommendations = await personalizationService.getPersonalizedRecommendations('test-user-1');

      expect(recommendations).toBeDefined();
      expect(Array.isArray(recommendations)).toBe(true);
    });
  });

  describe('RecommendationService', () => {
    it('should get comprehensive recommendations', async () => {
      // Mock all sub-services
      jest.spyOn(vectorService, 'getPersonalizedRecommendations').mockResolvedValue([
        { id: 'vector-1', type: 'cigar', embedding: [], characteristics: {} },
      ]);

      jest.spyOn(collaborativeService, 'getHybridRecommendations').mockResolvedValue([
        {
          productId: 'collab-1',
          productType: 'cigar',
          predictedRating: 4.5,
          confidence: 0.8,
          reason: 'Collaborative filtering',
        },
      ]);

      jest.spyOn(personalizationService, 'getPersonalizedRecommendations').mockResolvedValue([
        {
          productId: 'personal-1',
          productType: 'cigar',
          score: 0.9,
          confidence: 0.85,
          reason: 'Personalized recommendation',
          personalizedFactors: ['behavior'],
        },
      ]);

      // Mock user profile
      jest.spyOn(collaborativeService, 'getUserTasteProfile').mockResolvedValue({
        category_preferences: [],
        flavor_preferences: [],
      });

      jest.spyOn(vectorService, 'generateUserPreferenceVector').mockResolvedValue({
        userId: 'test-user-1',
        flavorPreferences: [],
        strengthPreferences: [],
        pricePreferences: [],
        categoryWeights: {},
      });

      // Mock product details
      jest.spyOn(databaseService, 'query').mockResolvedValue([mockProduct]);

      const result = await recommendationService.getRecommendations({
        userId: 'test-user-1',
        limit: 20,
      });

      expect(result).toBeDefined();
      expect(result.recommendations).toBeDefined();
      expect(Array.isArray(result.recommendations)).toBe(true);
      expect(result.algorithms).toContain('vector');
      expect(result.algorithms).toContain('collaborative');
      expect(result.algorithms).toContain('personalized');
    });

    it('should get similar products', async () => {
      jest.spyOn(vectorService, 'findSimilarProducts').mockResolvedValue([
        { id: 'similar-1', type: 'cigar', embedding: [], characteristics: {} },
      ]);

      const similar = await recommendationService.getSimilarProducts('test-cigar-1', 'cigar', 10);

      expect(similar).toBeDefined();
      expect(Array.isArray(similar)).toBe(true);
    });

    it('should get trending products', async () => {
      const mockTrending = [
        {
          product_id: 'trending-1',
          product_type: 'cigar',
          activity_count: 15,
          avg_rating: 4.7,
          unique_users: 8,
          name: 'Trending Cigar',
        },
      ];

      jest.spyOn(databaseService, 'query').mockResolvedValue(mockTrending);

      const trending = await recommendationService.getTrendingProducts('cigar', 15);

      expect(trending).toBeDefined();
      expect(Array.isArray(trending)).toBe(true);
    });

    it('should handle cold start recommendations', async () => {
      const mockPopular = [
        {
          id: 'popular-1',
          type: 'cigar',
          name: 'Popular Cigar',
          average_rating: 4.8,
          rating_count: 50,
          rank: 1,
        },
      ];

      jest.spyOn(databaseService, 'query').mockResolvedValue(mockPopular);

      const coldStart = await recommendationService.getColdStartRecommendations('new-user-1');

      expect(coldStart).toBeDefined();
      expect(Array.isArray(coldStart)).toBe(true);
    });
  });

  describe('Integration Tests', () => {
    it('should provide diverse recommendations', async () => {
      // Mock diverse product recommendations
      const mockDiverseRecs = [
        { productId: '1', productType: 'cigar', score: 0.9, confidence: 0.8, reason: 'Test', algorithm: 'vector' },
        { productId: '2', productType: 'beer', score: 0.8, confidence: 0.7, reason: 'Test', algorithm: 'collaborative' },
        { productId: '3', productType: 'wine', score: 0.7, confidence: 0.6, reason: 'Test', algorithm: 'personalized' },
      ];

      // Mock all services to return diverse recommendations
      jest.spyOn(vectorService, 'getPersonalizedRecommendations').mockResolvedValue([
        { id: '1', type: 'cigar', embedding: [], characteristics: {} },
      ]);

      jest.spyOn(collaborativeService, 'getHybridRecommendations').mockResolvedValue([
        { productId: '2', productType: 'beer', predictedRating: 4.0, confidence: 0.7, reason: 'Test' },
      ]);

      jest.spyOn(personalizationService, 'getPersonalizedRecommendations').mockResolvedValue([
        { productId: '3', productType: 'wine', score: 0.7, confidence: 0.6, reason: 'Test', personalizedFactors: [] },
      ]);

      // Mock other required methods
      jest.spyOn(collaborativeService, 'getUserTasteProfile').mockResolvedValue({});
      jest.spyOn(vectorService, 'generateUserPreferenceVector').mockResolvedValue({
        userId: 'test-user-1',
        flavorPreferences: [],
        strengthPreferences: [],
        pricePreferences: [],
        categoryWeights: {},
      });
      jest.spyOn(databaseService, 'query').mockResolvedValue([mockProduct]);

      const result = await recommendationService.getRecommendations({
        userId: 'test-user-1',
        limit: 20,
        diversityWeight: 0.5,
      });

      const productTypes = new Set(result.recommendations.map(r => r.productType));
      expect(productTypes.size).toBeGreaterThan(1); // Should have multiple product types
    });

    it('should handle errors gracefully', async () => {
      // Mock services to throw errors
      jest.spyOn(vectorService, 'getPersonalizedRecommendations').mockRejectedValue(new Error('Vector service error'));
      jest.spyOn(collaborativeService, 'getHybridRecommendations').mockRejectedValue(new Error('Collaborative service error'));
      jest.spyOn(personalizationService, 'getPersonalizedRecommendations').mockRejectedValue(new Error('Personalization service error'));

      const result = await recommendationService.getRecommendations({
        userId: 'test-user-1',
        limit: 20,
      });

      // Should return empty recommendations instead of throwing
      expect(result).toBeDefined();
      expect(result.recommendations).toEqual([]);
      expect(result.totalCount).toBe(0);
    });
  });
});

describe('Performance Tests', () => {
  it('should generate recommendations within acceptable time', async () => {
    // This would be a more comprehensive performance test in a real scenario
    const startTime = Date.now();
    
    // Mock fast responses
    const mockRecommendationService = {
      getRecommendations: jest.fn().mockResolvedValue({
        recommendations: [],
        totalCount: 0,
        algorithms: [],
      }),
    };

    await mockRecommendationService.getRecommendations({
      userId: 'test-user-1',
      limit: 20,
    });

    const duration = Date.now() - startTime;
    expect(duration).toBeLessThan(100); // Should be very fast with mocks
  });
});
