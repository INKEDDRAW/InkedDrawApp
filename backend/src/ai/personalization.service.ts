/**
 * Personalization Service
 * Advanced personalization based on user behavior and preferences
 */

import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

export interface PersonalizationRequest {
  productType?: 'cigar' | 'beer' | 'wine';
  limit?: number;
  timeWindow?: number; // days
}

export interface PersonalizedRecommendation {
  productId: string;
  productType: 'cigar' | 'beer' | 'wine';
  score: number;
  confidence: number;
  reason: string;
  personalizedFactors: string[];
}

export interface UserBehaviorProfile {
  userId: string;
  ratingPatterns: any;
  timePreferences: any;
  categoryPreferences: any;
  pricePreferences: any;
  socialInfluence: any;
}

@Injectable()
export class PersonalizationService {
  private readonly logger = new Logger(PersonalizationService.name);

  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Get personalized recommendations based on user behavior
   */
  async getPersonalizedRecommendations(
    userId: string,
    request: PersonalizationRequest = {}
  ): Promise<PersonalizedRecommendation[]> {
    try {
      const { productType, limit = 15, timeWindow = 90 } = request;

      // Build comprehensive user profile
      const userProfile = await this.buildUserBehaviorProfile(userId, timeWindow);
      
      if (!userProfile) {
        return this.getFallbackRecommendations(productType, limit);
      }

      // Get personalized recommendations based on different factors
      const [
        behaviorBasedRecs,
        timeBasedRecs,
        socialBasedRecs,
        trendBasedRecs,
      ] = await Promise.all([
        this.getBehaviorBasedRecommendations(userProfile, productType, limit),
        this.getTimeBasedRecommendations(userProfile, productType, Math.ceil(limit * 0.3)),
        this.getSocialInfluenceRecommendations(userProfile, productType, Math.ceil(limit * 0.3)),
        this.getTrendAwareRecommendations(userProfile, productType, Math.ceil(limit * 0.2)),
      ]);

      // Combine and rank recommendations
      const combinedRecs = this.combinePersonalizedRecommendations([
        ...behaviorBasedRecs,
        ...timeBasedRecs,
        ...socialBasedRecs,
        ...trendBasedRecs,
      ]);

      return combinedRecs.slice(0, limit);
    } catch (error) {
      this.logger.error(`Error getting personalized recommendations for ${userId}:`, error);
      return [];
    }
  }

  /**
   * Build comprehensive user behavior profile
   */
  async buildUserBehaviorProfile(userId: string, timeWindow: number): Promise<UserBehaviorProfile | null> {
    try {
      const [
        ratingPatterns,
        timePreferences,
        categoryPreferences,
        pricePreferences,
        socialInfluence,
      ] = await Promise.all([
        this.analyzeRatingPatterns(userId, timeWindow),
        this.analyzeTimePreferences(userId, timeWindow),
        this.analyzeCategoryPreferences(userId, timeWindow),
        this.analyzePricePreferences(userId, timeWindow),
        this.analyzeSocialInfluence(userId, timeWindow),
      ]);

      return {
        userId,
        ratingPatterns,
        timePreferences,
        categoryPreferences,
        pricePreferences,
        socialInfluence,
      };
    } catch (error) {
      this.logger.error(`Error building user profile for ${userId}:`, error);
      return null;
    }
  }

  /**
   * Get behavior-based recommendations
   */
  private async getBehaviorBasedRecommendations(
    userProfile: UserBehaviorProfile,
    productType?: string,
    limit: number = 10
  ): Promise<PersonalizedRecommendation[]> {
    try {
      // Find products that match user's rating patterns and preferences
      const query = `
        WITH user_preferences AS (
          SELECT 
            $1::text as user_id,
            $2::jsonb as rating_patterns,
            $3::jsonb as category_prefs,
            $4::jsonb as price_prefs
        ),
        candidate_products AS (
          SELECT 
            p.id,
            p.type,
            p.name,
            p.average_rating,
            p.rating_count,
            p.price_range,
            CASE 
              WHEN p.type = 'cigar' THEN p.strength
              WHEN p.type = 'beer' THEN p.style
              WHEN p.type = 'wine' THEN p.wine_type
            END as category_attribute
          FROM (
            SELECT id, 'cigar' as type, name, average_rating, rating_count, price_range, strength FROM cigars
            UNION ALL
            SELECT id, 'beer' as type, name, average_rating, rating_count, price_range, style FROM beers
            UNION ALL
            SELECT id, 'wine' as type, name, average_rating, rating_count, price_range, wine_type FROM wines
          ) p
          WHERE p.average_rating >= 3.0
            ${productType ? 'AND p.type = $5' : ''}
            AND NOT EXISTS (
              SELECT 1 FROM user_ratings ur 
              WHERE ur.user_id = $1 AND ur.product_id = p.id AND ur.product_type = p.type
            )
        )
        SELECT *
        FROM candidate_products
        ORDER BY average_rating DESC, rating_count DESC
        LIMIT $${productType ? '6' : '5'}
      `;

      const params = [
        userProfile.userId,
        JSON.stringify(userProfile.ratingPatterns),
        JSON.stringify(userProfile.categoryPreferences),
        JSON.stringify(userProfile.pricePreferences),
      ];

      if (productType) {
        params.push(productType);
      }

      const results = await this.databaseService.query(query, params);

      return results.map(row => ({
        productId: row.id,
        productType: row.type,
        score: this.calculateBehaviorScore(row, userProfile),
        confidence: Math.min(1.0, parseFloat(row.rating_count) / 20),
        reason: this.generateBehaviorReason(row, userProfile),
        personalizedFactors: ['rating_patterns', 'category_preferences', 'price_preferences'],
      }));
    } catch (error) {
      this.logger.error('Error getting behavior-based recommendations:', error);
      return [];
    }
  }

  /**
   * Get time-based recommendations (considering when user is most active)
   */
  private async getTimeBasedRecommendations(
    userProfile: UserBehaviorProfile,
    productType?: string,
    limit: number = 5
  ): Promise<PersonalizedRecommendation[]> {
    try {
      // Find products that align with user's time-based preferences
      const currentHour = new Date().getHours();
      const preferredTimeSlot = this.getPreferredTimeSlot(userProfile.timePreferences, currentHour);

      const query = `
        WITH time_based_products AS (
          SELECT 
            p.id,
            p.type,
            p.name,
            p.average_rating,
            COUNT(ur.id) as recent_activity
          FROM (
            SELECT id, 'cigar' as type, name, average_rating FROM cigars
            UNION ALL
            SELECT id, 'beer' as type, name, average_rating FROM beers
            UNION ALL
            SELECT id, 'wine' as type, name, average_rating FROM wines
          ) p
          LEFT JOIN user_ratings ur ON p.id = ur.product_id AND p.type = ur.product_type
          WHERE ur.created_at >= NOW() - INTERVAL '7 days'
            AND EXTRACT(HOUR FROM ur.created_at) BETWEEN $1 AND $2
            ${productType ? 'AND p.type = $3' : ''}
          GROUP BY p.id, p.type, p.name, p.average_rating
          HAVING COUNT(ur.id) >= 2
          ORDER BY recent_activity DESC, p.average_rating DESC
          LIMIT $${productType ? '4' : '3'}
        )
        SELECT * FROM time_based_products
      `;

      const params = [
        preferredTimeSlot.start,
        preferredTimeSlot.end,
      ];

      if (productType) {
        params.push(productType);
      }

      const results = await this.databaseService.query(query, params);

      return results.map(row => ({
        productId: row.id,
        productType: row.type,
        score: parseFloat(row.average_rating) / 5,
        confidence: 0.6,
        reason: `Popular during your preferred time (${preferredTimeSlot.label})`,
        personalizedFactors: ['time_preferences'],
      }));
    } catch (error) {
      this.logger.error('Error getting time-based recommendations:', error);
      return [];
    }
  }

  /**
   * Get social influence recommendations
   */
  private async getSocialInfluenceRecommendations(
    userProfile: UserBehaviorProfile,
    productType?: string,
    limit: number = 5
  ): Promise<PersonalizedRecommendation[]> {
    try {
      // Find products liked by users the person follows
      const query = `
        WITH followed_users AS (
          SELECT following_id as user_id
          FROM follows
          WHERE follower_id = $1
        ),
        social_recommendations AS (
          SELECT 
            ur.product_id,
            ur.product_type,
            AVG(ur.rating) as avg_rating,
            COUNT(*) as recommendation_count,
            STRING_AGG(DISTINCT u.display_name, ', ') as recommenders
          FROM user_ratings ur
          JOIN followed_users fu ON ur.user_id = fu.user_id
          JOIN users u ON ur.user_id = u.id
          WHERE ur.rating >= 4
            ${productType ? 'AND ur.product_type = $2' : ''}
            AND NOT EXISTS (
              SELECT 1 FROM user_ratings ur2
              WHERE ur2.user_id = $1 AND ur2.product_id = ur.product_id AND ur2.product_type = ur.product_type
            )
          GROUP BY ur.product_id, ur.product_type
          HAVING COUNT(*) >= 1
          ORDER BY AVG(ur.rating) DESC, COUNT(*) DESC
          LIMIT $${productType ? '3' : '2'}
        )
        SELECT * FROM social_recommendations
      `;

      const params = [userProfile.userId];
      if (productType) {
        params.push(productType);
      }

      const results = await this.databaseService.query(query, params);

      return results.map(row => ({
        productId: row.product_id,
        productType: row.product_type,
        score: parseFloat(row.avg_rating) / 5,
        confidence: Math.min(1.0, parseInt(row.recommendation_count) / 3),
        reason: `Recommended by ${row.recommenders} (people you follow)`,
        personalizedFactors: ['social_influence'],
      }));
    } catch (error) {
      this.logger.error('Error getting social influence recommendations:', error);
      return [];
    }
  }

  /**
   * Get trend-aware recommendations
   */
  private async getTrendAwareRecommendations(
    userProfile: UserBehaviorProfile,
    productType?: string,
    limit: number = 3
  ): Promise<PersonalizedRecommendation[]> {
    try {
      // Find trending products that match user's profile
      const query = `
        WITH trending_products AS (
          SELECT 
            ur.product_id,
            ur.product_type,
            COUNT(*) as recent_ratings,
            AVG(ur.rating) as avg_rating
          FROM user_ratings ur
          WHERE ur.created_at >= NOW() - INTERVAL '14 days'
            ${productType ? 'AND ur.product_type = $1' : ''}
          GROUP BY ur.product_id, ur.product_type
          HAVING COUNT(*) >= 3 AND AVG(ur.rating) >= 3.5
          ORDER BY COUNT(*) DESC, AVG(ur.rating) DESC
          LIMIT $${productType ? '2' : '1'}
        )
        SELECT * FROM trending_products
      `;

      const params = productType ? [productType, limit] : [limit];
      const results = await this.databaseService.query(query, params);

      return results.map(row => ({
        productId: row.product_id,
        productType: row.product_type,
        score: parseFloat(row.avg_rating) / 5,
        confidence: 0.7,
        reason: `Trending now with ${row.recent_ratings} recent reviews`,
        personalizedFactors: ['trending'],
      }));
    } catch (error) {
      this.logger.error('Error getting trend-aware recommendations:', error);
      return [];
    }
  }

  /**
   * Analyze user rating patterns
   */
  private async analyzeRatingPatterns(userId: string, timeWindow: number): Promise<any> {
    try {
      const query = `
        SELECT 
          AVG(rating) as avg_rating,
          STDDEV(rating) as rating_stddev,
          COUNT(*) as total_ratings,
          COUNT(CASE WHEN rating >= 4 THEN 1 END) as high_ratings,
          COUNT(CASE WHEN rating <= 2 THEN 1 END) as low_ratings
        FROM user_ratings
        WHERE user_id = $1 AND created_at >= NOW() - INTERVAL '${timeWindow} days'
      `;

      const result = await this.databaseService.query(query, [userId]);
      return result[0] || {};
    } catch (error) {
      this.logger.error('Error analyzing rating patterns:', error);
      return {};
    }
  }

  /**
   * Analyze time preferences
   */
  private async analyzeTimePreferences(userId: string, timeWindow: number): Promise<any> {
    try {
      const query = `
        SELECT 
          EXTRACT(HOUR FROM created_at) as hour,
          COUNT(*) as activity_count,
          AVG(rating) as avg_rating
        FROM user_ratings
        WHERE user_id = $1 AND created_at >= NOW() - INTERVAL '${timeWindow} days'
        GROUP BY EXTRACT(HOUR FROM created_at)
        ORDER BY activity_count DESC
      `;

      const results = await this.databaseService.query(query, [userId]);
      return results;
    } catch (error) {
      this.logger.error('Error analyzing time preferences:', error);
      return [];
    }
  }

  /**
   * Analyze category preferences
   */
  private async analyzeCategoryPreferences(userId: string, timeWindow: number): Promise<any> {
    try {
      const query = `
        SELECT 
          product_type,
          COUNT(*) as rating_count,
          AVG(rating) as avg_rating
        FROM user_ratings
        WHERE user_id = $1 AND created_at >= NOW() - INTERVAL '${timeWindow} days'
        GROUP BY product_type
        ORDER BY avg_rating DESC, rating_count DESC
      `;

      const results = await this.databaseService.query(query, [userId]);
      return results;
    } catch (error) {
      this.logger.error('Error analyzing category preferences:', error);
      return [];
    }
  }

  /**
   * Analyze price preferences
   */
  private async analyzePricePreferences(userId: string, timeWindow: number): Promise<any> {
    try {
      const query = `
        WITH user_product_ratings AS (
          SELECT 
            ur.rating,
            COALESCE(c.price_range, b.price_range, w.price_range) as price_range
          FROM user_ratings ur
          LEFT JOIN cigars c ON ur.product_id = c.id AND ur.product_type = 'cigar'
          LEFT JOIN beers b ON ur.product_id = b.id AND ur.product_type = 'beer'
          LEFT JOIN wines w ON ur.product_id = w.id AND ur.product_type = 'wine'
          WHERE ur.user_id = $1 AND ur.created_at >= NOW() - INTERVAL '${timeWindow} days'
        )
        SELECT 
          price_range,
          COUNT(*) as rating_count,
          AVG(rating) as avg_rating
        FROM user_product_ratings
        WHERE price_range IS NOT NULL
        GROUP BY price_range
        ORDER BY avg_rating DESC, rating_count DESC
      `;

      const results = await this.databaseService.query(query, [userId]);
      return results;
    } catch (error) {
      this.logger.error('Error analyzing price preferences:', error);
      return [];
    }
  }

  /**
   * Analyze social influence
   */
  private async analyzeSocialInfluence(userId: string, timeWindow: number): Promise<any> {
    try {
      const query = `
        SELECT 
          COUNT(DISTINCT f.following_id) as following_count,
          COUNT(DISTINCT f2.follower_id) as follower_count,
          COUNT(DISTINCT l.id) as likes_given,
          COUNT(DISTINCT l2.id) as likes_received
        FROM users u
        LEFT JOIN follows f ON u.id = f.follower_id
        LEFT JOIN follows f2 ON u.id = f2.following_id
        LEFT JOIN likes l ON u.id = l.user_id
        LEFT JOIN likes l2 ON u.id = l2.target_user_id
        WHERE u.id = $1
      `;

      const result = await this.databaseService.query(query, [userId]);
      return result[0] || {};
    } catch (error) {
      this.logger.error('Error analyzing social influence:', error);
      return {};
    }
  }

  /**
   * Helper methods
   */
  private calculateBehaviorScore(product: any, userProfile: UserBehaviorProfile): number {
    let score = parseFloat(product.average_rating) / 5;

    // Adjust based on user's category preferences
    const categoryPref = userProfile.categoryPreferences.find(
      (pref: any) => pref.product_type === product.type
    );
    if (categoryPref) {
      score *= (1 + (parseFloat(categoryPref.avg_rating) - 3) / 5);
    }

    // Adjust based on price preferences
    const pricePref = userProfile.pricePreferences.find(
      (pref: any) => pref.price_range === product.price_range
    );
    if (pricePref) {
      score *= (1 + (parseFloat(pricePref.avg_rating) - 3) / 10);
    }

    return Math.max(0, Math.min(1, score));
  }

  private generateBehaviorReason(product: any, userProfile: UserBehaviorProfile): string {
    const reasons = [];

    const categoryPref = userProfile.categoryPreferences.find(
      (pref: any) => pref.product_type === product.type
    );
    if (categoryPref && parseFloat(categoryPref.avg_rating) >= 4) {
      reasons.push(`you enjoy ${product.type}s`);
    }

    const pricePref = userProfile.pricePreferences.find(
      (pref: any) => pref.price_range === product.price_range
    );
    if (pricePref && parseFloat(pricePref.avg_rating) >= 4) {
      reasons.push(`matches your ${product.price_range} price preference`);
    }

    if (reasons.length === 0) {
      return 'Based on your rating patterns';
    }

    return `Because ${reasons.join(' and ')}`;
  }

  private getPreferredTimeSlot(timePreferences: any[], currentHour: number): any {
    if (!timePreferences || timePreferences.length === 0) {
      return { start: 18, end: 22, label: 'evening' };
    }

    const mostActive = timePreferences[0];
    const hour = parseInt(mostActive.hour);

    if (hour >= 6 && hour < 12) {
      return { start: 6, end: 12, label: 'morning' };
    } else if (hour >= 12 && hour < 18) {
      return { start: 12, end: 18, label: 'afternoon' };
    } else {
      return { start: 18, end: 23, label: 'evening' };
    }
  }

  private combinePersonalizedRecommendations(
    recommendations: PersonalizedRecommendation[]
  ): PersonalizedRecommendation[] {
    const combinedMap = new Map<string, PersonalizedRecommendation>();

    recommendations.forEach(rec => {
      const key = `${rec.productId}_${rec.productType}`;
      const existing = combinedMap.get(key);

      if (existing) {
        existing.score = (existing.score + rec.score) / 2;
        existing.confidence = Math.max(existing.confidence, rec.confidence);
        existing.personalizedFactors = [
          ...new Set([...existing.personalizedFactors, ...rec.personalizedFactors])
        ];
        existing.reason = `${existing.reason} + ${rec.reason}`;
      } else {
        combinedMap.set(key, rec);
      }
    });

    return Array.from(combinedMap.values())
      .sort((a, b) => (b.score * b.confidence) - (a.score * a.confidence));
  }

  private async getFallbackRecommendations(
    productType?: string,
    limit: number = 10
  ): Promise<PersonalizedRecommendation[]> {
    try {
      const query = `
        SELECT id, type, name, average_rating
        FROM (
          SELECT id, 'cigar' as type, name, average_rating FROM cigars
          UNION ALL
          SELECT id, 'beer' as type, name, average_rating FROM beers
          UNION ALL
          SELECT id, 'wine' as type, name, average_rating FROM wines
        ) p
        WHERE average_rating >= 4.0
          ${productType ? 'AND type = $1' : ''}
        ORDER BY average_rating DESC
        LIMIT $${productType ? '2' : '1'}
      `;

      const params = productType ? [productType, limit] : [limit];
      const results = await this.databaseService.query(query, params);

      return results.map(row => ({
        productId: row.id,
        productType: row.type,
        score: parseFloat(row.average_rating) / 5,
        confidence: 0.5,
        reason: 'Highly rated by the community',
        personalizedFactors: ['fallback'],
      }));
    } catch (error) {
      this.logger.error('Error getting fallback recommendations:', error);
      return [];
    }
  }
}
