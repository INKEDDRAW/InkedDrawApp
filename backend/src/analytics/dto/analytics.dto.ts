/**
 * Analytics DTOs
 * Data Transfer Objects for analytics endpoints
 */

import { IsString, IsOptional, IsObject, IsNumber, IsBoolean, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TrackEventDto {
  @ApiProperty({ 
    example: 'product_interaction',
    description: 'Event name to track'
  })
  @IsString()
  event: string;

  @ApiPropertyOptional({ 
    example: { product_id: '123', action: 'view' },
    description: 'Event properties'
  })
  @IsOptional()
  @IsObject()
  properties?: Record<string, any>;
}

export class TrackScreenViewDto {
  @ApiProperty({ 
    example: 'CigarCatalogScreen',
    description: 'Screen name'
  })
  @IsString()
  screenName: string;

  @ApiPropertyOptional({ 
    example: { category: 'cigars', filter: 'premium' },
    description: 'Additional screen properties'
  })
  @IsOptional()
  @IsObject()
  properties?: Record<string, any>;
}

export class TrackSearchDto {
  @ApiProperty({ 
    example: 'Cuban cigars',
    description: 'Search query'
  })
  @IsString()
  query: string;

  @ApiPropertyOptional({ 
    example: 'cigars',
    description: 'Search category'
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ 
    example: 25,
    description: 'Number of search results'
  })
  @IsOptional()
  @IsNumber()
  resultsCount?: number;
}

export class TrackProductInteractionDto {
  @ApiProperty({ 
    example: 'cigar-123',
    description: 'Product ID'
  })
  @IsString()
  productId: string;

  @ApiProperty({ 
    example: 'cigar',
    enum: ['cigar', 'beer', 'wine'],
    description: 'Product type'
  })
  @IsEnum(['cigar', 'beer', 'wine'])
  productType: 'cigar' | 'beer' | 'wine';

  @ApiProperty({ 
    example: 'view',
    enum: ['view', 'like', 'review', 'share', 'purchase'],
    description: 'Interaction action'
  })
  @IsEnum(['view', 'like', 'review', 'share', 'purchase'])
  action: 'view' | 'like' | 'review' | 'share' | 'purchase';

  @ApiPropertyOptional({ 
    example: 4.5,
    description: 'Rating given (1-5)'
  })
  @IsOptional()
  @IsNumber()
  rating?: number;

  @ApiPropertyOptional({ 
    example: 25.99,
    description: 'Product price'
  })
  @IsOptional()
  @IsNumber()
  price?: number;

  @ApiPropertyOptional({ 
    example: 'Cohiba',
    description: 'Product brand'
  })
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiPropertyOptional({ 
    example: 'Premium',
    description: 'Product category'
  })
  @IsOptional()
  @IsString()
  category?: string;
}

export class TrackSocialInteractionDto {
  @ApiProperty({ 
    example: 'like',
    enum: ['follow', 'unfollow', 'like', 'comment', 'share', 'post_create', 'post_view'],
    description: 'Social interaction action'
  })
  @IsEnum(['follow', 'unfollow', 'like', 'comment', 'share', 'post_create', 'post_view'])
  action: 'follow' | 'unfollow' | 'like' | 'comment' | 'share' | 'post_create' | 'post_view';

  @ApiPropertyOptional({ 
    example: 'user-456',
    description: 'Target user ID'
  })
  @IsOptional()
  @IsString()
  targetUserId?: string;

  @ApiPropertyOptional({ 
    example: 'post-789',
    description: 'Post ID'
  })
  @IsOptional()
  @IsString()
  postId?: string;

  @ApiPropertyOptional({ 
    example: 'comment-101',
    description: 'Comment ID'
  })
  @IsOptional()
  @IsString()
  commentId?: string;

  @ApiPropertyOptional({ 
    example: 'image',
    enum: ['text', 'image', 'video'],
    description: 'Content type'
  })
  @IsOptional()
  @IsEnum(['text', 'image', 'video'])
  content_type?: 'text' | 'image' | 'video';
}

export class TrackAgeVerificationDto {
  @ApiProperty({ 
    example: 'completed',
    enum: ['started', 'completed', 'failed', 'expired'],
    description: 'Verification status'
  })
  @IsEnum(['started', 'completed', 'failed', 'expired'])
  status: 'started' | 'completed' | 'failed' | 'expired';

  @ApiPropertyOptional({ 
    example: 'veriff',
    description: 'Verification method'
  })
  @IsOptional()
  @IsString()
  method?: string;

  @ApiPropertyOptional({ 
    example: 1,
    description: 'Attempt number'
  })
  @IsOptional()
  @IsNumber()
  attempt?: number;

  @ApiPropertyOptional({ 
    example: 'passport',
    description: 'Document type used'
  })
  @IsOptional()
  @IsString()
  documentType?: string;

  @ApiPropertyOptional({ 
    example: 'US',
    description: 'User nationality'
  })
  @IsOptional()
  @IsString()
  nationality?: string;

  @ApiPropertyOptional({ 
    example: 25,
    description: 'Verified age'
  })
  @IsOptional()
  @IsNumber()
  age?: number;
}

export class TrackOnboardingDto {
  @ApiProperty({ 
    example: 'preferences_setup',
    description: 'Onboarding step name'
  })
  @IsString()
  step: string;

  @ApiProperty({ 
    example: true,
    description: 'Whether step was completed'
  })
  @IsBoolean()
  completed: boolean;

  @ApiPropertyOptional({ 
    example: 3,
    description: 'Step number in sequence'
  })
  @IsOptional()
  @IsNumber()
  stepNumber?: number;
}

export class TrackSubscriptionDto {
  @ApiProperty({ 
    example: 'subscribe',
    enum: ['subscribe', 'unsubscribe', 'upgrade', 'downgrade'],
    description: 'Subscription action'
  })
  @IsEnum(['subscribe', 'unsubscribe', 'upgrade', 'downgrade'])
  action: 'subscribe' | 'unsubscribe' | 'upgrade' | 'downgrade';

  @ApiProperty({ 
    example: 'premium',
    description: 'Subscription tier'
  })
  @IsString()
  tier: string;

  @ApiPropertyOptional({ 
    example: 9.99,
    description: 'Subscription price'
  })
  @IsOptional()
  @IsNumber()
  price?: number;
}

export class TrackErrorDto {
  @ApiProperty({ 
    example: 'Failed to load cigar catalog',
    description: 'Error message'
  })
  @IsString()
  error: string;

  @ApiPropertyOptional({ 
    example: 'CigarCatalogScreen',
    description: 'Error context'
  })
  @IsOptional()
  @IsString()
  context?: string;

  @ApiPropertyOptional({ 
    example: 'medium',
    enum: ['low', 'medium', 'high'],
    description: 'Error severity'
  })
  @IsOptional()
  @IsEnum(['low', 'medium', 'high'])
  severity?: 'low' | 'medium' | 'high';
}

export class FeatureFlagDto {
  @ApiProperty({ 
    example: { 'new_ui': true, 'beta_features': false },
    description: 'Feature flags for user'
  })
  flags: Record<string, boolean>;
}
