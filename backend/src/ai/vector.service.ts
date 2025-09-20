/**
 * Vector Service
 * Handles vector embeddings and similarity calculations
 */

import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import * as tf from '@tensorflow/tfjs-node';

export interface ProductVector {
  id: string;
  type: 'cigar' | 'beer' | 'wine';
  embedding: number[];
  characteristics: Record<string, any>;
}

export interface UserPreferenceVector {
  userId: string;
  flavorPreferences: number[];
  strengthPreferences: number[];
  pricePreferences: number[];
  categoryWeights: Record<string, number>;
}

@Injectable()
export class VectorService {
  private readonly logger = new Logger(VectorService.name);
  private readonly vectorDimension = parseInt(process.env.VECTOR_DIMENSION || '384');

  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Generate product embedding based on characteristics
   */
  async generateProductEmbedding(product: any, productType: 'cigar' | 'beer' | 'wine'): Promise<number[]> {
    try {
      const features = this.extractProductFeatures(product, productType);
      const embedding = await this.createEmbeddingFromFeatures(features);
      
      // Store embedding in database
      await this.storeProductEmbedding(product.id, productType, embedding);
      
      return embedding;
    } catch (error) {
      this.logger.error(`Error generating embedding for product ${product.id}:`, error);
      return new Array(this.vectorDimension).fill(0);
    }
  }

  /**
   * Generate user preference vector based on rating history
   */
  async generateUserPreferenceVector(userId: string): Promise<UserPreferenceVector> {
    try {
      const userRatings = await this.getUserRatings(userId);
      
      if (userRatings.length === 0) {
        return this.getDefaultUserVector(userId);
      }

      const flavorPreferences = await this.extractFlavorPreferences(userRatings);
      const strengthPreferences = await this.extractStrengthPreferences(userRatings);
      const pricePreferences = await this.extractPricePreferences(userRatings);
      const categoryWeights = await this.calculateCategoryWeights(userRatings);

      const userVector: UserPreferenceVector = {
        userId,
        flavorPreferences,
        strengthPreferences,
        pricePreferences,
        categoryWeights,
      };

      // Store user vector for future use
      await this.storeUserVector(userVector);
      
      return userVector;
    } catch (error) {
      this.logger.error(`Error generating user vector for ${userId}:`, error);
      return this.getDefaultUserVector(userId);
    }
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  calculateCosineSimilarity(vectorA: number[], vectorB: number[]): number {
    if (vectorA.length !== vectorB.length) {
      throw new Error('Vectors must have the same dimension');
    }

    const dotProduct = vectorA.reduce((sum, a, i) => sum + a * vectorB[i], 0);
    const magnitudeA = Math.sqrt(vectorA.reduce((sum, a) => sum + a * a, 0));
    const magnitudeB = Math.sqrt(vectorB.reduce((sum, b) => sum + b * b, 0));

    if (magnitudeA === 0 || magnitudeB === 0) {
      return 0;
    }

    return dotProduct / (magnitudeA * magnitudeB);
  }

  /**
   * Find similar products using vector similarity
   */
  async findSimilarProducts(
    productId: string,
    productType: 'cigar' | 'beer' | 'wine',
    limit: number = 10
  ): Promise<ProductVector[]> {
    try {
      const targetEmbedding = await this.getProductEmbedding(productId, productType);
      
      if (!targetEmbedding) {
        this.logger.warn(`No embedding found for product ${productId}`);
        return [];
      }

      const query = `
        SELECT 
          pe.product_id as id,
          pe.product_type as type,
          pe.embedding,
          pe.characteristics
        FROM product_embeddings pe
        WHERE pe.product_type = $1 
          AND pe.product_id != $2
        ORDER BY pe.embedding <-> $3::vector
        LIMIT $4
      `;

      const results = await this.databaseService.query(query, [
        productType,
        productId,
        JSON.stringify(targetEmbedding),
        limit,
      ]);

      return results.map(row => ({
        id: row.id,
        type: row.type,
        embedding: JSON.parse(row.embedding),
        characteristics: row.characteristics,
      }));
    } catch (error) {
      this.logger.error(`Error finding similar products for ${productId}:`, error);
      return [];
    }
  }

  /**
   * Get personalized product recommendations for user
   */
  async getPersonalizedRecommendations(
    userId: string,
    limit: number = 20
  ): Promise<ProductVector[]> {
    try {
      const userVector = await this.getUserVector(userId);
      
      if (!userVector) {
        return this.getFallbackRecommendations(limit);
      }

      // Find products that match user preferences
      const query = `
        WITH user_ratings AS (
          SELECT DISTINCT product_id, product_type 
          FROM user_ratings 
          WHERE user_id = $1
        ),
        candidate_products AS (
          SELECT 
            pe.product_id as id,
            pe.product_type as type,
            pe.embedding,
            pe.characteristics,
            COALESCE(p.average_rating, 0) as avg_rating,
            COALESCE(p.rating_count, 0) as rating_count
          FROM product_embeddings pe
          LEFT JOIN (
            SELECT id, average_rating, rating_count, 'cigar' as type FROM cigars
            UNION ALL
            SELECT id, average_rating, rating_count, 'beer' as type FROM beers
            UNION ALL
            SELECT id, average_rating, rating_count, 'wine' as type FROM wines
          ) p ON pe.product_id = p.id AND pe.product_type = p.type
          WHERE NOT EXISTS (
            SELECT 1 FROM user_ratings ur 
            WHERE ur.user_id = $1 
              AND ur.product_id = pe.product_id 
              AND ur.product_type = pe.product_type
          )
        )
        SELECT * FROM candidate_products
        WHERE avg_rating >= 3.5 OR rating_count >= 5
        ORDER BY avg_rating DESC, rating_count DESC
        LIMIT $2
      `;

      const results = await this.databaseService.query(query, [userId, limit]);

      return results.map(row => ({
        id: row.id,
        type: row.type,
        embedding: JSON.parse(row.embedding),
        characteristics: row.characteristics,
      }));
    } catch (error) {
      this.logger.error(`Error getting personalized recommendations for ${userId}:`, error);
      return this.getFallbackRecommendations(limit);
    }
  }

  /**
   * Extract product features for embedding generation
   */
  private extractProductFeatures(product: any, productType: 'cigar' | 'beer' | 'wine'): number[] {
    const features: number[] = [];

    switch (productType) {
      case 'cigar':
        // Strength (1-5 scale)
        features.push(this.mapStrengthToNumber(product.strength));
        // Size (normalized ring gauge)
        features.push((product.ring_gauge || 50) / 100);
        // Length (normalized)
        features.push((product.length_inches || 6) / 10);
        // Price range (1-4 scale)
        features.push(this.mapPriceRangeToNumber(product.price_range));
        // Origin (one-hot encoded top countries)
        features.push(...this.encodeOrigin(product.origin_country));
        break;

      case 'beer':
        // ABV (normalized)
        features.push((product.abv || 5) / 15);
        // IBU (normalized)
        features.push((product.ibu || 30) / 100);
        // Style (encoded)
        features.push(...this.encodeBeerStyle(product.style));
        // Price range
        features.push(this.mapPriceRangeToNumber(product.price_range));
        break;

      case 'wine':
        // Alcohol content (normalized)
        features.push((product.abv || 12) / 20);
        // Vintage (normalized to recent years)
        features.push(this.normalizeVintage(product.vintage_year));
        // Body (1-5 scale)
        features.push(this.mapBodyToNumber(product.body));
        // Sweetness (1-5 scale)
        features.push(this.mapSweetnessToNumber(product.sweetness));
        // Price range
        features.push(this.mapPriceRangeToNumber(product.price_range));
        break;
    }

    // Add flavor profile features
    if (product.flavor_notes) {
      features.push(...this.encodeFlavorNotes(product.flavor_notes, productType));
    }

    // Pad or truncate to fixed dimension
    return this.normalizeFeatureVector(features);
  }

  /**
   * Create embedding from feature vector using simple neural network
   */
  private async createEmbeddingFromFeatures(features: number[]): Promise<number[]> {
    try {
      // Simple transformation to create embedding
      // In production, this would use a trained model
      const tensor = tf.tensor2d([features]);
      
      // Apply some transformations to create meaningful embeddings
      const normalized = tf.layerNormalization().apply(tensor) as tf.Tensor;
      const dense1 = tf.layers.dense({ units: 256, activation: 'relu' }).apply(normalized) as tf.Tensor;
      const dense2 = tf.layers.dense({ units: this.vectorDimension, activation: 'tanh' }).apply(dense1) as tf.Tensor;
      
      const embedding = await dense2.data();
      
      // Cleanup tensors
      tensor.dispose();
      normalized.dispose();
      dense1.dispose();
      dense2.dispose();
      
      return Array.from(embedding);
    } catch (error) {
      this.logger.error('Error creating embedding from features:', error);
      // Return random normalized vector as fallback
      return Array.from({ length: this.vectorDimension }, () => Math.random() * 2 - 1);
    }
  }

  /**
   * Store product embedding in database
   */
  private async storeProductEmbedding(
    productId: string,
    productType: 'cigar' | 'beer' | 'wine',
    embedding: number[]
  ): Promise<void> {
    try {
      await this.databaseService.query(`
        INSERT INTO product_embeddings (product_id, product_type, embedding, created_at, updated_at)
        VALUES ($1, $2, $3::vector, NOW(), NOW())
        ON CONFLICT (product_id, product_type)
        DO UPDATE SET embedding = $3::vector, updated_at = NOW()
      `, [productId, productType, JSON.stringify(embedding)]);
    } catch (error) {
      this.logger.error(`Error storing embedding for ${productId}:`, error);
    }
  }

  /**
   * Get product embedding from database
   */
  private async getProductEmbedding(
    productId: string,
    productType: 'cigar' | 'beer' | 'wine'
  ): Promise<number[] | null> {
    try {
      const result = await this.databaseService.query(`
        SELECT embedding FROM product_embeddings
        WHERE product_id = $1 AND product_type = $2
      `, [productId, productType]);

      if (result.length === 0) {
        return null;
      }

      return JSON.parse(result[0].embedding);
    } catch (error) {
      this.logger.error(`Error getting embedding for ${productId}:`, error);
      return null;
    }
  }

  /**
   * Helper methods for feature encoding
   */
  private mapStrengthToNumber(strength: string): number {
    const strengthMap: Record<string, number> = {
      'mild': 1,
      'medium-mild': 2,
      'medium': 3,
      'medium-full': 4,
      'full': 5,
    };
    return strengthMap[strength?.toLowerCase()] || 3;
  }

  private mapPriceRangeToNumber(priceRange: string): number {
    const priceMap: Record<string, number> = {
      'budget': 1,
      'mid': 2,
      'premium': 3,
      'luxury': 4,
    };
    return priceMap[priceRange?.toLowerCase()] || 2;
  }

  private normalizeFeatureVector(features: number[]): number[] {
    // Ensure fixed dimension
    const normalized = new Array(this.vectorDimension).fill(0);
    
    for (let i = 0; i < Math.min(features.length, this.vectorDimension); i++) {
      normalized[i] = Math.max(-1, Math.min(1, features[i] || 0));
    }
    
    return normalized;
  }

  private encodeOrigin(origin: string): number[] {
    const topOrigins = ['cuba', 'dominican republic', 'nicaragua', 'honduras', 'usa'];
    return topOrigins.map(country => origin?.toLowerCase().includes(country) ? 1 : 0);
  }

  private encodeBeerStyle(style: string): number[] {
    const topStyles = ['ipa', 'lager', 'stout', 'wheat', 'pilsner'];
    return topStyles.map(s => style?.toLowerCase().includes(s) ? 1 : 0);
  }

  private encodeFlavorNotes(flavorNotes: string[], productType: string): number[] {
    // Simplified flavor encoding - in production would use more sophisticated NLP
    const commonFlavors = ['sweet', 'spicy', 'fruity', 'earthy', 'nutty', 'floral'];
    return commonFlavors.map(flavor => 
      flavorNotes.some(note => note.toLowerCase().includes(flavor)) ? 1 : 0
    );
  }

  private normalizeVintage(vintage: number): number {
    const currentYear = new Date().getFullYear();
    const age = currentYear - (vintage || currentYear);
    return Math.max(0, Math.min(1, age / 50)); // Normalize to 0-1 over 50 years
  }

  private mapBodyToNumber(body: string): number {
    const bodyMap: Record<string, number> = {
      'light': 1,
      'medium-light': 2,
      'medium': 3,
      'medium-full': 4,
      'full': 5,
    };
    return bodyMap[body?.toLowerCase()] || 3;
  }

  private mapSweetnessToNumber(sweetness: string): number {
    const sweetnessMap: Record<string, number> = {
      'bone-dry': 1,
      'dry': 2,
      'off-dry': 3,
      'medium-sweet': 4,
      'sweet': 5,
    };
    return sweetnessMap[sweetness?.toLowerCase()] || 2;
  }

  private async getUserRatings(userId: string): Promise<any[]> {
    return this.databaseService.query(`
      SELECT * FROM user_ratings
      WHERE user_id = $1
      ORDER BY created_at DESC
    `, [userId]);
  }

  private async extractFlavorPreferences(ratings: any[]): Promise<number[]> {
    // Analyze flavor preferences from user ratings
    const flavorCounts: Record<string, number> = {};
    
    ratings.forEach(rating => {
      if (rating.flavor_notes) {
        const notes = JSON.parse(rating.flavor_notes);
        notes.forEach((note: string) => {
          flavorCounts[note] = (flavorCounts[note] || 0) + rating.rating;
        });
      }
    });

    // Convert to preference vector
    const commonFlavors = ['sweet', 'spicy', 'fruity', 'earthy', 'nutty', 'floral'];
    return commonFlavors.map(flavor => flavorCounts[flavor] || 0);
  }

  private async extractStrengthPreferences(ratings: any[]): Promise<number[]> {
    // Analyze strength preferences
    const strengthCounts: Record<string, number> = {};
    
    for (const rating of ratings) {
      if (rating.product_type === 'cigar') {
        const product = await this.getProductDetails(rating.product_id, 'cigar');
        if (product?.strength) {
          strengthCounts[product.strength] = (strengthCounts[product.strength] || 0) + rating.rating;
        }
      }
    }

    const strengths = ['mild', 'medium-mild', 'medium', 'medium-full', 'full'];
    return strengths.map(strength => strengthCounts[strength] || 0);
  }

  private async extractPricePreferences(ratings: any[]): Promise<number[]> {
    // Analyze price preferences
    const priceCounts: Record<string, number> = {};
    
    for (const rating of ratings) {
      const product = await this.getProductDetails(rating.product_id, rating.product_type);
      if (product?.price_range) {
        priceCounts[product.price_range] = (priceCounts[product.price_range] || 0) + rating.rating;
      }
    }

    const priceRanges = ['budget', 'mid', 'premium', 'luxury'];
    return priceRanges.map(range => priceCounts[range] || 0);
  }

  private async calculateCategoryWeights(ratings: any[]): Promise<Record<string, number>> {
    const categoryRatings: Record<string, number[]> = {
      cigar: [],
      beer: [],
      wine: [],
    };

    ratings.forEach(rating => {
      categoryRatings[rating.product_type].push(rating.rating);
    });

    const weights: Record<string, number> = {};
    Object.keys(categoryRatings).forEach(category => {
      const ratings = categoryRatings[category];
      if (ratings.length > 0) {
        weights[category] = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
      } else {
        weights[category] = 0;
      }
    });

    return weights;
  }

  private getDefaultUserVector(userId: string): UserPreferenceVector {
    return {
      userId,
      flavorPreferences: new Array(6).fill(0),
      strengthPreferences: new Array(5).fill(0),
      pricePreferences: new Array(4).fill(0),
      categoryWeights: { cigar: 0, beer: 0, wine: 0 },
    };
  }

  private async storeUserVector(userVector: UserPreferenceVector): Promise<void> {
    try {
      await this.databaseService.query(`
        INSERT INTO user_preference_vectors (user_id, vector_data, created_at, updated_at)
        VALUES ($1, $2, NOW(), NOW())
        ON CONFLICT (user_id)
        DO UPDATE SET vector_data = $2, updated_at = NOW()
      `, [userVector.userId, JSON.stringify(userVector)]);
    } catch (error) {
      this.logger.error(`Error storing user vector for ${userVector.userId}:`, error);
    }
  }

  private async getUserVector(userId: string): Promise<UserPreferenceVector | null> {
    try {
      const result = await this.databaseService.query(`
        SELECT vector_data FROM user_preference_vectors
        WHERE user_id = $1
      `, [userId]);

      if (result.length === 0) {
        return null;
      }

      return JSON.parse(result[0].vector_data);
    } catch (error) {
      this.logger.error(`Error getting user vector for ${userId}:`, error);
      return null;
    }
  }

  private async getFallbackRecommendations(limit: number): Promise<ProductVector[]> {
    // Return highly rated products as fallback
    const query = `
      SELECT 
        pe.product_id as id,
        pe.product_type as type,
        pe.embedding,
        pe.characteristics
      FROM product_embeddings pe
      JOIN (
        SELECT id, average_rating, 'cigar' as type FROM cigars WHERE average_rating >= 4.0
        UNION ALL
        SELECT id, average_rating, 'beer' as type FROM beers WHERE average_rating >= 4.0
        UNION ALL
        SELECT id, average_rating, 'wine' as type FROM wines WHERE average_rating >= 4.0
      ) p ON pe.product_id = p.id AND pe.product_type = p.type
      ORDER BY p.average_rating DESC
      LIMIT $1
    `;

    const results = await this.databaseService.query(query, [limit]);
    
    return results.map(row => ({
      id: row.id,
      type: row.type,
      embedding: JSON.parse(row.embedding),
      characteristics: row.characteristics,
    }));
  }

  private async getProductDetails(productId: string, productType: string): Promise<any> {
    const tableName = `${productType}s`;
    const result = await this.databaseService.query(`
      SELECT * FROM ${tableName} WHERE id = $1
    `, [productId]);

    return result[0] || null;
  }
}
