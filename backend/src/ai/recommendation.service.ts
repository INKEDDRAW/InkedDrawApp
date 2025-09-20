/**
 * Recommendation Service
 * Main orchestrator for AI-powered recommendations
 */

import { Injectable, Logger } from '@nestjs/common';
import { VectorService } from './vector.service';
import { CollaborativeFilteringService } from './collaborative-filtering.service';
import { PersonalizationService } from './personalization.service';
import { DatabaseService } from '../database/database.service';
import { AnalyticsService } from '../analytics/analytics.service';

export interface RecommendationRequest {
  userId: string;
  productType?: 'cigar' | 'beer' | 'wine';
  limit?: number;
  includeReasons?: boolean;
  diversityWeight?: number;
}

export interface Recommendation {
  productId: string;
  productType: 'cigar' | 'beer' | 'wine';
  score: number;
  confidence: number;
  reason: string;
  algorithm: 'vector' | 'collaborative' | 'personalized' | 'hybrid';
  product?: any;
}

export interface RecommendationResponse {
  recommendations: Recommendation[];
  totalCount: number;
  algorithms: string[];
  userProfile?: any;
}

@Injectable()
export class RecommendationService {
  private readonly logger = new Logger(RecommendationService.name);

  constructor(
    private readonly vectorService: VectorService,
    private readonly collaborativeService: CollaborativeFilteringService,
    private readonly personalizationService: PersonalizationService,
    private readonly databaseService: DatabaseService,
    private readonly analyticsService: AnalyticsService,
  ) {}

  /**
   * Get comprehensive recommendations for a user
   */
  async getRecommendations(request: RecommendationRequest): Promise<RecommendationResponse> {
    try {
      const startTime = Date.now();
      const { userId, productType, limit = 20, includeReasons = true, diversityWeight = 0.3 } = request;

      this.logger.log(`Getting recommendations for user ${userId}`);

      // Get recommendations from different algorithms in parallel
      const [
        vectorRecommendations,
        collaborativeRecommendations,
        personalizedRecommendations,
        userProfile,
      ] = await Promise.all([
        this.getVectorBasedRecommendations(userId, productType, Math.ceil(limit * 0.4)),
        this.getCollaborativeRecommendations(userId, productType, Math.ceil(limit * 0.4)),
        this.getPersonalizedRecommendations(userId, productType, Math.ceil(limit * 0.3)),
        this.getUserProfile(userId),
      ]);

      // Combine and rank recommendations
      const combinedRecommendations = await this.combineRecommendations([
        ...vectorRecommendations,
        ...collaborativeRecommendations,
        ...personalizedRecommendations,
      ], diversityWeight);

      // Apply diversity and final filtering
      const finalRecommendations = await this.applyDiversityAndFiltering(
        combinedRecommendations,
        limit,
        diversityWeight
      );

      // Enrich with product details if needed
      const enrichedRecommendations = await this.enrichRecommendations(finalRecommendations);

      // Track recommendation event
      await this.trackRecommendationEvent(userId, enrichedRecommendations, Date.now() - startTime);

      return {
        recommendations: enrichedRecommendations,
        totalCount: enrichedRecommendations.length,
        algorithms: ['vector', 'collaborative', 'personalized'],
        userProfile: includeReasons ? userProfile : undefined,
      };
    } catch (error) {
      this.logger.error(`Error getting recommendations for ${request.userId}:`, error);
      return {
        recommendations: [],
        totalCount: 0,
        algorithms: [],
      };
    }
  }

  /**
   * Get similar products to a given product
   */
  async getSimilarProducts(
    productId: string,
    productType: 'cigar' | 'beer' | 'wine',
    limit: number = 10
  ): Promise<Recommendation[]> {
    try {
      const similarProducts = await this.vectorService.findSimilarProducts(
        productId,
        productType,
        limit
      );

      return similarProducts.map(product => ({
        productId: product.id,
        productType: product.type,
        score: 0.8, // High confidence for similarity
        confidence: 0.9,
        reason: 'Similar characteristics and flavor profile',
        algorithm: 'vector' as const,
      }));
    } catch (error) {
      this.logger.error(`Error getting similar products for ${productId}:`, error);
      return [];
    }
  }

  /**
   * Get trending products based on recent activity
   */
  async getTrendingProducts(
    productType?: 'cigar' | 'beer' | 'wine',
    limit: number = 15
  ): Promise<Recommendation[]> {
    try {
      const query = `
        WITH recent_activity AS (
          SELECT 
            product_id,
            product_type,
            COUNT(*) as activity_count,
            AVG(rating) as avg_rating,
            COUNT(DISTINCT user_id) as unique_users
          FROM user_ratings
          WHERE created_at >= NOW() - INTERVAL '30 days'
            ${productType ? 'AND product_type = $1' : ''}
          GROUP BY product_id, product_type
          HAVING COUNT(*) >= 3 AND AVG(rating) >= 3.5
        ),
        product_details AS (
          SELECT id, name, 'cigar' as type FROM cigars
          UNION ALL
          SELECT id, name, 'beer' as type FROM beers
          UNION ALL
          SELECT id, name, 'wine' as type FROM wines
        )
        SELECT 
          ra.product_id,
          ra.product_type,
          ra.activity_count,
          ra.avg_rating,
          ra.unique_users,
          pd.name
        FROM recent_activity ra
        JOIN product_details pd ON ra.product_id = pd.id AND ra.product_type = pd.type
        ORDER BY (ra.activity_count * ra.avg_rating * ra.unique_users) DESC
        LIMIT $${productType ? '2' : '1'}
      `;

      const params = productType ? [productType, limit] : [limit];
      const results = await this.databaseService.query(query, params);

      return results.map(row => ({
        productId: row.product_id,
        productType: row.product_type,
        score: parseFloat(row.avg_rating) / 5,
        confidence: Math.min(1.0, parseInt(row.activity_count) / 10),
        reason: `Trending with ${row.unique_users} users and ${row.activity_count} recent reviews`,
        algorithm: 'hybrid' as const,
      }));
    } catch (error) {
      this.logger.error('Error getting trending products:', error);
      return [];
    }
  }

  /**
   * Get recommendations for new users (cold start problem)
   */
  async getColdStartRecommendations(
    userId: string,
    preferences?: any,
    limit: number = 15
  ): Promise<Recommendation[]> {
    try {
      // Use popular products and user preferences if available
      const query = `
        WITH popular_products AS (
          SELECT 
            p.id,
            p.type,
            p.name,
            p.average_rating,
            p.rating_count,
            ROW_NUMBER() OVER (PARTITION BY p.type ORDER BY p.average_rating DESC, p.rating_count DESC) as rank
          FROM (
            SELECT id, 'cigar' as type, name, average_rating, rating_count FROM cigars
            UNION ALL
            SELECT id, 'beer' as type, name, average_rating, rating_count FROM beers
            UNION ALL
            SELECT id, 'wine' as type, name, average_rating, rating_count FROM wines
          ) p
          WHERE p.average_rating >= 4.0 AND p.rating_count >= 10
        )
        SELECT *
        FROM popular_products
        WHERE rank <= 5
        ORDER BY average_rating DESC, rating_count DESC
        LIMIT $1
      `;

      const results = await this.databaseService.query(query, [limit]);

      return results.map(row => ({
        productId: row.id,
        productType: row.type,
        score: parseFloat(row.average_rating) / 5,
        confidence: Math.min(1.0, parseInt(row.rating_count) / 50),
        reason: `Highly rated by the community (${row.average_rating}/5 from ${row.rating_count} reviews)`,
        algorithm: 'hybrid' as const,
      }));
    } catch (error) {
      this.logger.error(`Error getting cold start recommendations for ${userId}:`, error);
      return [];
    }
  }

  /**
   * Get vector-based recommendations
   */
  private async getVectorBasedRecommendations(
    userId: string,
    productType?: 'cigar' | 'beer' | 'wine',
    limit: number = 10
  ): Promise<Recommendation[]> {
    try {
      const vectorRecommendations = await this.vectorService.getPersonalizedRecommendations(
        userId,
        limit
      );

      return vectorRecommendations
        .filter(rec => !productType || rec.type === productType)
        .map(rec => ({
          productId: rec.id,
          productType: rec.type,
          score: 0.8,
          confidence: 0.7,
          reason: 'Based on your flavor and product preferences',
          algorithm: 'vector' as const,
        }));
    } catch (error) {
      this.logger.error('Error getting vector-based recommendations:', error);
      return [];
    }
  }

  /**
   * Get collaborative filtering recommendations
   */
  private async getCollaborativeRecommendations(
    userId: string,
    productType?: 'cigar' | 'beer' | 'wine',
    limit: number = 10
  ): Promise<Recommendation[]> {
    try {
      const collaborativeRecs = await this.collaborativeService.getHybridRecommendations(
        userId,
        limit
      );

      return collaborativeRecs
        .filter(rec => !productType || rec.productType === productType)
        .map(rec => ({
          productId: rec.productId,
          productType: rec.productType,
          score: rec.predictedRating / 5,
          confidence: rec.confidence,
          reason: rec.reason,
          algorithm: 'collaborative' as const,
        }));
    } catch (error) {
      this.logger.error('Error getting collaborative recommendations:', error);
      return [];
    }
  }

  /**
   * Get personalized recommendations
   */
  private async getPersonalizedRecommendations(
    userId: string,
    productType?: 'cigar' | 'beer' | 'wine',
    limit: number = 10
  ): Promise<Recommendation[]> {
    try {
      const personalizedRecs = await this.personalizationService.getPersonalizedRecommendations(
        userId,
        { productType, limit }
      );

      return personalizedRecs.map(rec => ({
        productId: rec.productId,
        productType: rec.productType,
        score: rec.score,
        confidence: rec.confidence,
        reason: rec.reason,
        algorithm: 'personalized' as const,
      }));
    } catch (error) {
      this.logger.error('Error getting personalized recommendations:', error);
      return [];
    }
  }

  /**
   * Combine recommendations from different algorithms
   */
  private async combineRecommendations(
    recommendations: Recommendation[],
    diversityWeight: number
  ): Promise<Recommendation[]> {
    const combinedMap = new Map<string, Recommendation>();

    recommendations.forEach(rec => {
      const key = `${rec.productId}_${rec.productType}`;
      const existing = combinedMap.get(key);

      if (existing) {
        // Combine scores from multiple algorithms
        const combinedScore = (existing.score + rec.score) / 2;
        const combinedConfidence = Math.max(existing.confidence, rec.confidence);
        
        combinedMap.set(key, {
          ...existing,
          score: combinedScore,
          confidence: combinedConfidence,
          reason: `${existing.reason} + ${rec.reason}`,
          algorithm: 'hybrid' as const,
        });
      } else {
        combinedMap.set(key, rec);
      }
    });

    return Array.from(combinedMap.values());
  }

  /**
   * Apply diversity and final filtering
   */
  private async applyDiversityAndFiltering(
    recommendations: Recommendation[],
    limit: number,
    diversityWeight: number
  ): Promise<Recommendation[]> {
    // Sort by combined score
    recommendations.sort((a, b) => {
      const scoreA = a.score * a.confidence;
      const scoreB = b.score * b.confidence;
      return scoreB - scoreA;
    });

    // Apply diversity if requested
    if (diversityWeight > 0) {
      return this.applyDiversityFiltering(recommendations, limit, diversityWeight);
    }

    return recommendations.slice(0, limit);
  }

  /**
   * Apply diversity filtering to avoid too many similar products
   */
  private applyDiversityFiltering(
    recommendations: Recommendation[],
    limit: number,
    diversityWeight: number
  ): Recommendation[] {
    const selected: Recommendation[] = [];
    const typeCount = { cigar: 0, beer: 0, wine: 0 };
    const maxPerType = Math.ceil(limit / 3);

    for (const rec of recommendations) {
      if (selected.length >= limit) break;
      
      // Ensure diversity across product types
      if (typeCount[rec.productType] < maxPerType) {
        selected.push(rec);
        typeCount[rec.productType]++;
      } else if (selected.length < limit * 0.8) {
        // Allow some overflow if we haven't reached 80% of limit
        selected.push(rec);
      }
    }

    return selected;
  }

  /**
   * Enrich recommendations with product details
   */
  private async enrichRecommendations(recommendations: Recommendation[]): Promise<Recommendation[]> {
    const enriched: Recommendation[] = [];

    for (const rec of recommendations) {
      try {
        const product = await this.getProductDetails(rec.productId, rec.productType);
        enriched.push({
          ...rec,
          product,
        });
      } catch (error) {
        this.logger.warn(`Could not enrich product ${rec.productId}:`, error);
        enriched.push(rec);
      }
    }

    return enriched;
  }

  /**
   * Get product details
   */
  private async getProductDetails(productId: string, productType: string): Promise<any> {
    const tableName = `${productType}s`;
    const result = await this.databaseService.query(`
      SELECT * FROM ${tableName} WHERE id = $1
    `, [productId]);

    return result[0] || null;
  }

  /**
   * Get user profile for recommendations
   */
  private async getUserProfile(userId: string): Promise<any> {
    try {
      const tasteProfile = await this.collaborativeService.getUserTasteProfile(userId);
      const userVector = await this.vectorService.generateUserPreferenceVector(userId);
      
      return {
        tasteProfile,
        preferences: userVector,
      };
    } catch (error) {
      this.logger.error(`Error getting user profile for ${userId}:`, error);
      return null;
    }
  }

  /**
   * Track recommendation event for analytics
   */
  private async trackRecommendationEvent(
    userId: string,
    recommendations: Recommendation[],
    processingTime: number
  ): Promise<void> {
    try {
      await this.analyticsService.track(userId, 'recommendations_generated', {
        count: recommendations.length,
        algorithms: [...new Set(recommendations.map(r => r.algorithm))],
        processing_time_ms: processingTime,
        product_types: [...new Set(recommendations.map(r => r.productType))],
      });
    } catch (error) {
      this.logger.warn('Error tracking recommendation event:', error);
    }
  }
}
