/**
 * Recommendation Controller
 * API endpoints for AI-powered recommendations
 */

import {
  Controller,
  Get,
  Query,
  Param,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RecommendationService } from './recommendation.service';
import { VectorService } from './vector.service';
import { CollaborativeFilteringService } from './collaborative-filtering.service';
import { PersonalizationService } from './personalization.service';

@Controller('api/v1/recommendations')
@UseGuards(JwtAuthGuard)
export class RecommendationController {
  constructor(
    private readonly recommendationService: RecommendationService,
    private readonly vectorService: VectorService,
    private readonly collaborativeService: CollaborativeFilteringService,
    private readonly personalizationService: PersonalizationService,
  ) {}

  /**
   * Get personalized recommendations for the authenticated user
   */
  @Get()
  async getRecommendations(
    @Request() req: any,
    @Query('type') productType?: 'cigar' | 'beer' | 'wine',
    @Query('limit') limit?: string,
    @Query('diversity') diversityWeight?: string,
    @Query('include_reasons') includeReasons?: string,
  ) {
    const userId = req.user.id;
    
    return this.recommendationService.getRecommendations({
      userId,
      productType,
      limit: limit ? parseInt(limit) : 20,
      diversityWeight: diversityWeight ? parseFloat(diversityWeight) : 0.3,
      includeReasons: includeReasons === 'true',
    });
  }

  /**
   * Get similar products to a specific product
   */
  @Get('similar/:productType/:productId')
  async getSimilarProducts(
    @Param('productType') productType: 'cigar' | 'beer' | 'wine',
    @Param('productId') productId: string,
    @Query('limit') limit?: string,
  ) {
    if (!['cigar', 'beer', 'wine'].includes(productType)) {
      throw new BadRequestException('Invalid product type');
    }

    return this.recommendationService.getSimilarProducts(
      productId,
      productType,
      limit ? parseInt(limit) : 10,
    );
  }

  /**
   * Get trending products
   */
  @Get('trending')
  async getTrendingProducts(
    @Query('type') productType?: 'cigar' | 'beer' | 'wine',
    @Query('limit') limit?: string,
  ) {
    return this.recommendationService.getTrendingProducts(
      productType,
      limit ? parseInt(limit) : 15,
    );
  }

  /**
   * Get recommendations for new users (cold start)
   */
  @Get('cold-start')
  async getColdStartRecommendations(
    @Request() req: any,
    @Query('preferences') preferences?: string,
    @Query('limit') limit?: string,
  ) {
    const userId = req.user.id;
    const parsedPreferences = preferences ? JSON.parse(preferences) : undefined;

    return this.recommendationService.getColdStartRecommendations(
      userId,
      parsedPreferences,
      limit ? parseInt(limit) : 15,
    );
  }

  /**
   * Get user-based collaborative filtering recommendations
   */
  @Get('collaborative/user-based')
  async getUserBasedRecommendations(
    @Request() req: any,
    @Query('limit') limit?: string,
  ) {
    const userId = req.user.id;
    
    return this.collaborativeService.getUserBasedRecommendations(
      userId,
      limit ? parseInt(limit) : 15,
    );
  }

  /**
   * Get item-based collaborative filtering recommendations
   */
  @Get('collaborative/item-based')
  async getItemBasedRecommendations(
    @Request() req: any,
    @Query('limit') limit?: string,
  ) {
    const userId = req.user.id;
    
    return this.collaborativeService.getItemBasedRecommendations(
      userId,
      limit ? parseInt(limit) : 15,
    );
  }

  /**
   * Get hybrid collaborative filtering recommendations
   */
  @Get('collaborative/hybrid')
  async getHybridCollaborativeRecommendations(
    @Request() req: any,
    @Query('limit') limit?: string,
  ) {
    const userId = req.user.id;
    
    return this.collaborativeService.getHybridRecommendations(
      userId,
      limit ? parseInt(limit) : 20,
    );
  }

  /**
   * Get vector-based recommendations
   */
  @Get('vector-based')
  async getVectorBasedRecommendations(
    @Request() req: any,
    @Query('limit') limit?: string,
  ) {
    const userId = req.user.id;
    
    return this.vectorService.getPersonalizedRecommendations(
      userId,
      limit ? parseInt(limit) : 20,
    );
  }

  /**
   * Get personalized recommendations based on behavior analysis
   */
  @Get('personalized')
  async getPersonalizedRecommendations(
    @Request() req: any,
    @Query('type') productType?: 'cigar' | 'beer' | 'wine',
    @Query('limit') limit?: string,
    @Query('time_window') timeWindow?: string,
  ) {
    const userId = req.user.id;
    
    return this.personalizationService.getPersonalizedRecommendations(userId, {
      productType,
      limit: limit ? parseInt(limit) : 15,
      timeWindow: timeWindow ? parseInt(timeWindow) : 90,
    });
  }

  /**
   * Get user's taste profile
   */
  @Get('profile/taste')
  async getUserTasteProfile(@Request() req: any) {
    const userId = req.user.id;
    
    return this.collaborativeService.getUserTasteProfile(userId);
  }

  /**
   * Get user's behavior profile
   */
  @Get('profile/behavior')
  async getUserBehaviorProfile(
    @Request() req: any,
    @Query('time_window') timeWindow?: string,
  ) {
    const userId = req.user.id;
    
    return this.personalizationService.buildUserBehaviorProfile(
      userId,
      timeWindow ? parseInt(timeWindow) : 90,
    );
  }

  /**
   * Get user's preference vector
   */
  @Get('profile/vector')
  async getUserPreferenceVector(@Request() req: any) {
    const userId = req.user.id;
    
    return this.vectorService.generateUserPreferenceVector(userId);
  }

  /**
   * Generate embeddings for a product (admin/system use)
   */
  @Get('admin/generate-embedding/:productType/:productId')
  async generateProductEmbedding(
    @Param('productType') productType: 'cigar' | 'beer' | 'wine',
    @Param('productId') productId: string,
  ) {
    if (!['cigar', 'beer', 'wine'].includes(productType)) {
      throw new BadRequestException('Invalid product type');
    }

    // This would typically be restricted to admin users
    // For now, we'll allow it for testing purposes
    
    // First, get the product details
    // This is a simplified version - in production you'd fetch from the appropriate service
    const product = { id: productId }; // Placeholder
    
    const embedding = await this.vectorService.generateProductEmbedding(
      product,
      productType,
    );

    return {
      productId,
      productType,
      embedding: embedding.slice(0, 10), // Return first 10 dimensions for brevity
      dimension: embedding.length,
    };
  }

  /**
   * Get recommendation statistics
   */
  @Get('stats')
  async getRecommendationStats(@Request() req: any) {
    const userId = req.user.id;
    
    // This would return various statistics about the user's recommendations
    // For now, return a placeholder response
    return {
      userId,
      totalRecommendations: 0,
      algorithmsUsed: ['vector', 'collaborative', 'personalized'],
      lastUpdated: new Date(),
      accuracy: {
        precision: 0.75,
        recall: 0.68,
        f1Score: 0.71,
      },
      diversity: {
        categoryDistribution: {
          cigar: 0.4,
          beer: 0.35,
          wine: 0.25,
        },
        priceRangeDistribution: {
          budget: 0.2,
          mid: 0.4,
          premium: 0.3,
          luxury: 0.1,
        },
      },
    };
  }

  /**
   * Provide feedback on recommendations (for learning)
   */
  @Get('feedback/:recommendationId')
  async provideFeedback(
    @Request() req: any,
    @Param('recommendationId') recommendationId: string,
    @Query('rating') rating?: string,
    @Query('action') action?: 'viewed' | 'liked' | 'purchased' | 'dismissed',
  ) {
    const userId = req.user.id;
    
    // This would store feedback for improving future recommendations
    // For now, return a success response
    return {
      success: true,
      recommendationId,
      userId,
      feedback: {
        rating: rating ? parseInt(rating) : null,
        action,
        timestamp: new Date(),
      },
    };
  }
}
