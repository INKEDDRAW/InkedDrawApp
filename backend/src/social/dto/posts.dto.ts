/**
 * Posts DTOs
 * Data Transfer Objects for post-related API endpoints
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsArray,
  IsEnum,
  IsUUID,
  IsBoolean,
  MaxLength,
  MinLength,
  ValidateNested,
  IsUrl,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum PostVisibility {
  PUBLIC = 'public',
  FRIENDS = 'friends',
  PRIVATE = 'private',
}

export enum ProductType {
  CIGAR = 'cigar',
  BEER = 'beer',
  WINE = 'wine',
}

export class PostImageDto {
  @ApiProperty({ description: 'Image URL' })
  @IsUrl()
  url: string;

  @ApiPropertyOptional({ description: 'Image caption' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  caption?: string;

  @ApiPropertyOptional({ description: 'Image width in pixels' })
  @IsOptional()
  width?: number;

  @ApiPropertyOptional({ description: 'Image height in pixels' })
  @IsOptional()
  height?: number;
}

export class CreatePostDto {
  @ApiProperty({ 
    description: 'Post content',
    minLength: 1,
    maxLength: 2000,
    example: 'Just enjoyed an amazing Cohiba Behike! Perfect for a special evening. 🔥'
  })
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  content: string;

  @ApiPropertyOptional({ 
    description: 'Array of post images',
    type: [PostImageDto]
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PostImageDto)
  images?: PostImageDto[];

  @ApiPropertyOptional({ 
    description: 'Tagged product ID',
    example: 'uuid-of-cigar-product'
  })
  @IsOptional()
  @IsUUID()
  productId?: string;

  @ApiPropertyOptional({ 
    description: 'Tagged product type',
    enum: ProductType,
    example: ProductType.CIGAR
  })
  @IsOptional()
  @IsEnum(ProductType)
  productType?: ProductType;

  @ApiPropertyOptional({ 
    description: 'Location where post was created',
    maxLength: 100,
    example: 'Local Cigar Lounge'
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  location?: string;

  @ApiPropertyOptional({ 
    description: 'Post tags',
    example: ['cohiba', 'premium', 'evening']
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ 
    description: 'Post visibility',
    enum: PostVisibility,
    default: PostVisibility.PUBLIC
  })
  @IsOptional()
  @IsEnum(PostVisibility)
  visibility?: PostVisibility = PostVisibility.PUBLIC;
}

export class UpdatePostDto {
  @ApiPropertyOptional({ 
    description: 'Updated post content',
    minLength: 1,
    maxLength: 2000
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  content?: string;

  @ApiPropertyOptional({ 
    description: 'Updated post images',
    type: [PostImageDto]
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PostImageDto)
  images?: PostImageDto[];

  @ApiPropertyOptional({ 
    description: 'Updated tagged product ID'
  })
  @IsOptional()
  @IsUUID()
  productId?: string;

  @ApiPropertyOptional({ 
    description: 'Updated tagged product type',
    enum: ProductType
  })
  @IsOptional()
  @IsEnum(ProductType)
  productType?: ProductType;

  @ApiPropertyOptional({ 
    description: 'Updated location',
    maxLength: 100
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  location?: string;

  @ApiPropertyOptional({ 
    description: 'Updated post tags'
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ 
    description: 'Updated post visibility',
    enum: PostVisibility
  })
  @IsOptional()
  @IsEnum(PostVisibility)
  visibility?: PostVisibility;
}

export class LikePostDto {
  @ApiProperty({ 
    description: 'Whether to like (true) or unlike (false) the post',
    example: true
  })
  @IsBoolean()
  isLiked: boolean;
}

export class CreateCommentDto {
  @ApiProperty({ 
    description: 'Comment content',
    minLength: 1,
    maxLength: 500,
    example: 'Great choice! I love that cigar too.'
  })
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  content: string;

  @ApiPropertyOptional({ 
    description: 'Parent comment ID for replies',
    example: 'uuid-of-parent-comment'
  })
  @IsOptional()
  @IsUUID()
  parentCommentId?: string;
}

export class UpdateCommentDto {
  @ApiProperty({ 
    description: 'Updated comment content',
    minLength: 1,
    maxLength: 500
  })
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  content: string;
}

export class LikeCommentDto {
  @ApiProperty({ 
    description: 'Whether to like (true) or unlike (false) the comment',
    example: true
  })
  @IsBoolean()
  isLiked: boolean;
}

export class FollowUserDto {
  @ApiProperty({ 
    description: 'Whether to follow (true) or unfollow (false) the user',
    example: true
  })
  @IsBoolean()
  isFollowing: boolean;
}

// Response DTOs
export class PostResponseDto {
  @ApiProperty({ description: 'Post ID' })
  id: string;

  @ApiProperty({ description: 'User ID who created the post' })
  userId: string;

  @ApiProperty({ description: 'Post content' })
  content: string;

  @ApiPropertyOptional({ description: 'Post images' })
  images?: PostImageDto[];

  @ApiPropertyOptional({ description: 'Tagged product ID' })
  productId?: string;

  @ApiPropertyOptional({ description: 'Tagged product type' })
  productType?: ProductType;

  @ApiPropertyOptional({ description: 'Post location' })
  location?: string;

  @ApiPropertyOptional({ description: 'Post tags' })
  tags?: string[];

  @ApiProperty({ description: 'Number of likes' })
  likeCount: number;

  @ApiProperty({ description: 'Number of comments' })
  commentCount: number;

  @ApiProperty({ description: 'Number of shares' })
  shareCount: number;

  @ApiProperty({ description: 'Whether current user liked this post' })
  isLikedByUser: boolean;

  @ApiProperty({ description: 'Post visibility' })
  visibility: PostVisibility;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;

  @ApiPropertyOptional({ description: 'User information' })
  user?: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl?: string;
  };
}

export class CommentResponseDto {
  @ApiProperty({ description: 'Comment ID' })
  id: string;

  @ApiProperty({ description: 'Post ID' })
  postId: string;

  @ApiProperty({ description: 'User ID who created the comment' })
  userId: string;

  @ApiProperty({ description: 'Comment content' })
  content: string;

  @ApiPropertyOptional({ description: 'Parent comment ID for replies' })
  parentCommentId?: string;

  @ApiProperty({ description: 'Number of likes' })
  likeCount: number;

  @ApiProperty({ description: 'Whether current user liked this comment' })
  isLikedByUser: boolean;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;

  @ApiPropertyOptional({ description: 'User information' })
  user?: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl?: string;
  };
}
