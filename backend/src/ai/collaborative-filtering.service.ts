/**
 * Collaborative Filtering Service
 * Implements user-based and item-based collaborative filtering
 */

import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

export interface UserSimilarity {
  userId: string;
  similarity: number;
  commonRatings: number;
}

export interface ItemSimilarity {
  productId: string;
  productType: string;
  similarity: number;
  commonUsers: number;
}

export interface CollaborativeRecommendation {
  productId: string;
  productType: 'cigar' | 'beer' | 'wine';
  predictedRating: number;
  confidence: number;
  reason: string;
}

@Injectable()
export class CollaborativeFilteringService {
  private readonly logger = new Logger(CollaborativeFilteringService.name);
  private readonly minCommonRatings = 3;
  private readonly minSimilarity = 0.3;

  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Get user-based collaborative filtering recommendations
   */
  async getUserBasedRecommendations(
    userId: string,
    limit: number = 15
  ): Promise<CollaborativeRecommendation[]> {
    try {
      // Find similar users
      const similarUsers = await this.findSimilarUsers(userId);
      
      if (similarUsers.length === 0) {
        this.logger.warn(`No similar users found for ${userId}`);
        return [];
      }

      // Get recommendations from similar users
      const recommendations = await this.getRecommendationsFromSimilarUsers(
        userId,
        similarUsers,
        limit
      );

      return recommendations;
    } catch (error) {
      this.logger.error(`Error getting user-based recommendations for ${userId}:`, error);
      return [];
    }
  }

  /**
   * Get item-based collaborative filtering recommendations
   */
  async getItemBasedRecommendations(
    userId: string,
    limit: number = 15
  ): Promise<CollaborativeRecommendation[]> {
    try {
      // Get user's rated products
      const userRatings = await this.getUserRatings(userId);
      
      if (userRatings.length === 0) {
        return [];
      }

      const recommendations: CollaborativeRecommendation[] = [];

      // For each rated product, find similar products
      for (const rating of userRatings.slice(0, 10)) { // Limit to top 10 rated products
        const similarProducts = await this.findSimilarProducts(
          rating.product_id,
          rating.product_type
        );

        for (const similarProduct of similarProducts) {
          // Skip if user already rated this product
          const alreadyRated = userRatings.some(
            r => r.product_id === similarProduct.productId && 
                 r.product_type === similarProduct.productType
          );

          if (alreadyRated) continue;

          // Calculate predicted rating
          const predictedRating = this.calculateItemBasedPrediction(
            rating.rating,
            similarProduct.similarity
          );

          recommendations.push({
            productId: similarProduct.productId,
            productType: similarProduct.productType,
            predictedRating,
            confidence: similarProduct.similarity,
            reason: `Similar to ${rating.product_name || 'a product'} you rated ${rating.rating}/5`,
          });
        }
      }

      // Sort by predicted rating and confidence
      recommendations.sort((a, b) => {
        const scoreA = a.predictedRating * a.confidence;
        const scoreB = b.predictedRating * b.confidence;
        return scoreB - scoreA;
      });

      // Remove duplicates and limit results
      const uniqueRecommendations = this.removeDuplicateRecommendations(recommendations);
      return uniqueRecommendations.slice(0, limit);
    } catch (error) {
      this.logger.error(`Error getting item-based recommendations for ${userId}:`, error);
      return [];
    }
  }

  /**
   * Get hybrid recommendations combining user-based and item-based
   */
  async getHybridRecommendations(
    userId: string,
    limit: number = 20
  ): Promise<CollaborativeRecommendation[]> {
    try {
      const [userBasedRecs, itemBasedRecs] = await Promise.all([
        this.getUserBasedRecommendations(userId, Math.ceil(limit * 0.6)),
        this.getItemBasedRecommendations(userId, Math.ceil(limit * 0.6)),
      ]);

      // Combine and weight recommendations
      const combinedRecs = new Map<string, CollaborativeRecommendation>();

      // Add user-based recommendations with higher weight
      userBasedRecs.forEach(rec => {
        const key = `${rec.productId}_${rec.productType}`;
        combinedRecs.set(key, {
          ...rec,
          predictedRating: rec.predictedRating * 1.2, // Boost user-based
          confidence: rec.confidence * 1.1,
          reason: `User-based: ${rec.reason}`,
        });
      });

      // Add item-based recommendations
      itemBasedRecs.forEach(rec => {
        const key = `${rec.productId}_${rec.productType}`;
        const existing = combinedRecs.get(key);
        
        if (existing) {
          // Combine scores if product appears in both
          existing.predictedRating = (existing.predictedRating + rec.predictedRating) / 2;
          existing.confidence = Math.max(existing.confidence, rec.confidence);
          existing.reason = `Hybrid: ${existing.reason} + ${rec.reason}`;
        } else {
          combinedRecs.set(key, {
            ...rec,
            reason: `Item-based: ${rec.reason}`,
          });
        }
      });

      // Sort and return top recommendations
      const finalRecs = Array.from(combinedRecs.values())
        .sort((a, b) => {
          const scoreA = a.predictedRating * a.confidence;
          const scoreB = b.predictedRating * b.confidence;
          return scoreB - scoreA;
        })
        .slice(0, limit);

      return finalRecs;
    } catch (error) {
      this.logger.error(`Error getting hybrid recommendations for ${userId}:`, error);
      return [];
    }
  }

  /**
   * Find users similar to the given user
   */
  private async findSimilarUsers(userId: string): Promise<UserSimilarity[]> {
    try {
      const query = `
        WITH user_ratings AS (
          SELECT product_id, product_type, rating
          FROM user_ratings
          WHERE user_id = $1
        ),
        other_user_ratings AS (
          SELECT 
            ur.user_id,
            ur.product_id,
            ur.product_type,
            ur.rating,
            u.display_name
          FROM user_ratings ur
          JOIN users u ON ur.user_id = u.id
          WHERE ur.user_id != $1
        ),
        common_ratings AS (
          SELECT 
            our.user_id,
            our.display_name,
            COUNT(*) as common_count,
            CORR(ur.rating, our.rating) as correlation,
            AVG(ABS(ur.rating - our.rating)) as avg_diff
          FROM user_ratings ur
          JOIN other_user_ratings our ON ur.product_id = our.product_id 
            AND ur.product_type = our.product_type
          GROUP BY our.user_id, our.display_name
          HAVING COUNT(*) >= $2
        )
        SELECT 
          user_id,
          display_name,
          common_count,
          COALESCE(correlation, 0) as similarity,
          avg_diff
        FROM common_ratings
        WHERE COALESCE(correlation, 0) >= $3
        ORDER BY correlation DESC, common_count DESC
        LIMIT 20
      `;

      const results = await this.databaseService.query(query, [
        userId,
        this.minCommonRatings,
        this.minSimilarity,
      ]);

      return results.map(row => ({
        userId: row.user_id,
        similarity: parseFloat(row.similarity),
        commonRatings: parseInt(row.common_count),
      }));
    } catch (error) {
      this.logger.error(`Error finding similar users for ${userId}:`, error);
      return [];
    }
  }

  /**
   * Find products similar to the given product
   */
  private async findSimilarProducts(
    productId: string,
    productType: 'cigar' | 'beer' | 'wine'
  ): Promise<ItemSimilarity[]> {
    try {
      const query = `
        WITH product_ratings AS (
          SELECT user_id, rating
          FROM user_ratings
          WHERE product_id = $1 AND product_type = $2
        ),
        other_product_ratings AS (
          SELECT 
            ur.product_id,
            ur.product_type,
            ur.user_id,
            ur.rating
          FROM user_ratings ur
          WHERE (ur.product_id != $1 OR ur.product_type != $2)
            AND ur.product_type = $2
        ),
        common_users AS (
          SELECT 
            opr.product_id,
            opr.product_type,
            COUNT(*) as common_count,
            CORR(pr.rating, opr.rating) as correlation
          FROM product_ratings pr
          JOIN other_product_ratings opr ON pr.user_id = opr.user_id
          GROUP BY opr.product_id, opr.product_type
          HAVING COUNT(*) >= $3
        )
        SELECT 
          product_id,
          product_type,
          common_count,
          COALESCE(correlation, 0) as similarity
        FROM common_users
        WHERE COALESCE(correlation, 0) >= $4
        ORDER BY correlation DESC, common_count DESC
        LIMIT 10
      `;

      const results = await this.databaseService.query(query, [
        productId,
        productType,
        this.minCommonRatings,
        this.minSimilarity,
      ]);

      return results.map(row => ({
        productId: row.product_id,
        productType: row.product_type,
        similarity: parseFloat(row.similarity),
        commonUsers: parseInt(row.common_count),
      }));
    } catch (error) {
      this.logger.error(`Error finding similar products for ${productId}:`, error);
      return [];
    }
  }

  /**
   * Get recommendations from similar users
   */
  private async getRecommendationsFromSimilarUsers(
    userId: string,
    similarUsers: UserSimilarity[],
    limit: number
  ): Promise<CollaborativeRecommendation[]> {
    try {
      const userIds = similarUsers.map(u => u.userId);
      const similarities = new Map(similarUsers.map(u => [u.userId, u.similarity]));

      const query = `
        WITH similar_user_ratings AS (
          SELECT 
            ur.product_id,
            ur.product_type,
            ur.rating,
            ur.user_id,
            u.display_name
          FROM user_ratings ur
          JOIN users u ON ur.user_id = u.id
          WHERE ur.user_id = ANY($1)
            AND NOT EXISTS (
              SELECT 1 FROM user_ratings ur2
              WHERE ur2.user_id = $2
                AND ur2.product_id = ur.product_id
                AND ur2.product_type = ur.product_type
            )
        ),
        product_info AS (
          SELECT id, name, 'cigar' as type FROM cigars
          UNION ALL
          SELECT id, name, 'beer' as type FROM beers
          UNION ALL
          SELECT id, name, 'wine' as type FROM wines
        )
        SELECT 
          sur.product_id,
          sur.product_type,
          pi.name as product_name,
          AVG(sur.rating) as avg_rating,
          COUNT(*) as rating_count,
          STRING_AGG(DISTINCT sur.display_name, ', ') as recommenders
        FROM similar_user_ratings sur
        JOIN product_info pi ON sur.product_id = pi.id AND sur.product_type = pi.type
        GROUP BY sur.product_id, sur.product_type, pi.name
        HAVING AVG(sur.rating) >= 3.5
        ORDER BY AVG(sur.rating) DESC, COUNT(*) DESC
        LIMIT $3
      `;

      const results = await this.databaseService.query(query, [
        userIds,
        userId,
        limit,
      ]);

      return results.map(row => {
        const avgRating = parseFloat(row.avg_rating);
        const ratingCount = parseInt(row.rating_count);
        
        // Calculate confidence based on number of similar users who rated it
        const confidence = Math.min(1.0, ratingCount / similarUsers.length);
        
        return {
          productId: row.product_id,
          productType: row.product_type,
          predictedRating: avgRating,
          confidence,
          reason: `Recommended by ${row.recommenders} (${ratingCount} similar users)`,
        };
      });
    } catch (error) {
      this.logger.error('Error getting recommendations from similar users:', error);
      return [];
    }
  }

  /**
   * Calculate predicted rating for item-based filtering
   */
  private calculateItemBasedPrediction(
    userRating: number,
    itemSimilarity: number
  ): number {
    // Simple weighted prediction
    // In production, this would use more sophisticated algorithms
    const baseRating = 3.5; // Average rating baseline
    const prediction = baseRating + (userRating - baseRating) * itemSimilarity;
    
    // Clamp to valid rating range
    return Math.max(1, Math.min(5, prediction));
  }

  /**
   * Remove duplicate recommendations
   */
  private removeDuplicateRecommendations(
    recommendations: CollaborativeRecommendation[]
  ): CollaborativeRecommendation[] {
    const seen = new Set<string>();
    const unique: CollaborativeRecommendation[] = [];

    for (const rec of recommendations) {
      const key = `${rec.productId}_${rec.productType}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(rec);
      }
    }

    return unique;
  }

  /**
   * Get user ratings
   */
  private async getUserRatings(userId: string): Promise<any[]> {
    try {
      const query = `
        SELECT 
          ur.*,
          COALESCE(c.name, b.name, w.name) as product_name
        FROM user_ratings ur
        LEFT JOIN cigars c ON ur.product_id = c.id AND ur.product_type = 'cigar'
        LEFT JOIN beers b ON ur.product_id = b.id AND ur.product_type = 'beer'
        LEFT JOIN wines w ON ur.product_id = w.id AND ur.product_type = 'wine'
        WHERE ur.user_id = $1
        ORDER BY ur.rating DESC, ur.created_at DESC
      `;

      return await this.databaseService.query(query, [userId]);
    } catch (error) {
      this.logger.error(`Error getting user ratings for ${userId}:`, error);
      return [];
    }
  }

  /**
   * Get user taste profile for better recommendations
   */
  async getUserTasteProfile(userId: string): Promise<any> {
    try {
      const query = `
        WITH user_stats AS (
          SELECT 
            product_type,
            AVG(rating) as avg_rating,
            COUNT(*) as rating_count,
            STDDEV(rating) as rating_stddev
          FROM user_ratings
          WHERE user_id = $1
          GROUP BY product_type
        ),
        flavor_preferences AS (
          SELECT 
            jsonb_array_elements_text(flavor_notes::jsonb) as flavor,
            AVG(rating) as avg_rating_for_flavor,
            COUNT(*) as flavor_count
          FROM user_ratings
          WHERE user_id = $1 AND flavor_notes IS NOT NULL
          GROUP BY jsonb_array_elements_text(flavor_notes::jsonb)
          HAVING COUNT(*) >= 2
          ORDER BY AVG(rating) DESC
        )
        SELECT 
          json_build_object(
            'category_preferences', json_agg(
              json_build_object(
                'type', us.product_type,
                'avg_rating', us.avg_rating,
                'count', us.rating_count,
                'consistency', CASE WHEN us.rating_stddev > 0 THEN 1/us.rating_stddev ELSE 1 END
              )
            ),
            'flavor_preferences', (
              SELECT json_agg(
                json_build_object(
                  'flavor', fp.flavor,
                  'avg_rating', fp.avg_rating_for_flavor,
                  'count', fp.flavor_count
                )
              )
              FROM flavor_preferences fp
              LIMIT 10
            )
          ) as taste_profile
        FROM user_stats us
      `;

      const result = await this.databaseService.query(query, [userId]);
      return result[0]?.taste_profile || {};
    } catch (error) {
      this.logger.error(`Error getting taste profile for ${userId}:`, error);
      return {};
    }
  }
}
