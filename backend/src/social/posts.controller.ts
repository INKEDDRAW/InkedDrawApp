/**
 * Posts Controller
 * RESTful API endpoints for social posts
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PostsService } from './posts.service';
import { SocialService } from './social.service';
import { CreatePostDto, UpdatePostDto, LikePostDto } from './dto/posts.dto';

@ApiTags('Social Posts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('social/posts')
export class PostsController {
  constructor(
    private readonly postsService: PostsService,
    private readonly socialService: SocialService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new post' })
  @ApiResponse({ status: 201, description: 'Post created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid post data' })
  async createPost(@Request() req: any, @Body() createPostDto: CreatePostDto) {
    try {
      const post = await this.postsService.createPost(req.user.id, createPostDto);
      
      // Track analytics
      await this.socialService.trackSocialInteraction(
        req.user.id,
        'post_create',
        'post',
        post.id,
        {
          content_length: createPostDto.content.length,
          has_images: !!createPostDto.images?.length,
          has_product: !!createPostDto.productId,
          visibility: createPostDto.visibility,
        }
      );

      return {
        success: true,
        data: post,
        message: 'Post created successfully',
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to create post',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get()
  @ApiOperation({ summary: 'Get posts feed' })
  @ApiResponse({ status: 200, description: 'Posts retrieved successfully' })
  async getPosts(
    @Request() req: any,
    @Query('limit') limit: string = '20',
    @Query('offset') offset: string = '0',
    @Query('type') type: 'feed' | 'trending' | 'public' = 'feed',
  ) {
    try {
      const limitNum = parseInt(limit, 10);
      const offsetNum = parseInt(offset, 10);

      let posts;
      switch (type) {
        case 'trending':
          posts = await this.socialService.getTrendingPosts(limitNum);
          break;
        case 'public':
          posts = await this.postsService.getPublicPosts(limitNum, offsetNum);
          break;
        case 'feed':
        default:
          posts = await this.socialService.getPersonalizedFeed(req.user.id, limitNum, offsetNum);
          break;
      }

      return {
        success: true,
        data: posts,
        pagination: {
          limit: limitNum,
          offset: offsetNum,
          hasMore: posts.length === limitNum,
        },
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to get posts',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific post' })
  @ApiResponse({ status: 200, description: 'Post retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  async getPost(@Request() req: any, @Param('id') id: string) {
    try {
      const post = await this.postsService.getPostById(id, req.user.id);
      
      if (!post) {
        throw new HttpException('Post not found', HttpStatus.NOT_FOUND);
      }

      // Track view analytics
      await this.socialService.trackSocialInteraction(
        req.user.id,
        'post_view',
        'post',
        id
      );

      return {
        success: true,
        data: post,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error.message || 'Failed to get post',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a post' })
  @ApiResponse({ status: 200, description: 'Post updated successfully' })
  @ApiResponse({ status: 403, description: 'Not authorized to update this post' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  async updatePost(
    @Request() req: any,
    @Param('id') id: string,
    @Body() updatePostDto: UpdatePostDto,
  ) {
    try {
      const post = await this.postsService.updatePost(id, req.user.id, updatePostDto);
      
      return {
        success: true,
        data: post,
        message: 'Post updated successfully',
      };
    } catch (error) {
      if (error.message.includes('not found')) {
        throw new HttpException('Post not found', HttpStatus.NOT_FOUND);
      }
      if (error.message.includes('not authorized')) {
        throw new HttpException('Not authorized to update this post', HttpStatus.FORBIDDEN);
      }
      throw new HttpException(
        error.message || 'Failed to update post',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a post' })
  @ApiResponse({ status: 200, description: 'Post deleted successfully' })
  @ApiResponse({ status: 403, description: 'Not authorized to delete this post' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  async deletePost(@Request() req: any, @Param('id') id: string) {
    try {
      await this.postsService.deletePost(id, req.user.id);
      
      return {
        success: true,
        message: 'Post deleted successfully',
      };
    } catch (error) {
      if (error.message.includes('not found')) {
        throw new HttpException('Post not found', HttpStatus.NOT_FOUND);
      }
      if (error.message.includes('not authorized')) {
        throw new HttpException('Not authorized to delete this post', HttpStatus.FORBIDDEN);
      }
      throw new HttpException(
        error.message || 'Failed to delete post',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post(':id/like')
  @ApiOperation({ summary: 'Like or unlike a post' })
  @ApiResponse({ status: 200, description: 'Post like status updated' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  async likePost(
    @Request() req: any,
    @Param('id') id: string,
    @Body() likePostDto: LikePostDto,
  ) {
    try {
      const result = await this.postsService.toggleLike(id, req.user.id, likePostDto.isLiked);
      
      // Track analytics
      await this.socialService.trackSocialInteraction(
        req.user.id,
        likePostDto.isLiked ? 'like' : 'unlike',
        'post',
        id
      );

      return {
        success: true,
        data: result,
        message: likePostDto.isLiked ? 'Post liked' : 'Post unliked',
      };
    } catch (error) {
      if (error.message.includes('not found')) {
        throw new HttpException('Post not found', HttpStatus.NOT_FOUND);
      }
      throw new HttpException(
        error.message || 'Failed to update like status',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get(':id/likes')
  @ApiOperation({ summary: 'Get post likes' })
  @ApiResponse({ status: 200, description: 'Post likes retrieved successfully' })
  async getPostLikes(
    @Param('id') id: string,
    @Query('limit') limit: string = '50',
    @Query('offset') offset: string = '0',
  ) {
    try {
      const limitNum = parseInt(limit, 10);
      const offsetNum = parseInt(offset, 10);
      
      const likes = await this.postsService.getPostLikes(id, limitNum, offsetNum);
      
      return {
        success: true,
        data: likes,
        pagination: {
          limit: limitNum,
          offset: offsetNum,
          hasMore: likes.length === limitNum,
        },
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to get post likes',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get posts by user' })
  @ApiResponse({ status: 200, description: 'User posts retrieved successfully' })
  async getUserPosts(
    @Request() req: any,
    @Param('userId') userId: string,
    @Query('limit') limit: string = '20',
    @Query('offset') offset: string = '0',
  ) {
    try {
      const limitNum = parseInt(limit, 10);
      const offsetNum = parseInt(offset, 10);
      
      const posts = await this.postsService.getUserPosts(userId, req.user.id, limitNum, offsetNum);
      
      return {
        success: true,
        data: posts,
        pagination: {
          limit: limitNum,
          offset: offsetNum,
          hasMore: posts.length === limitNum,
        },
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to get user posts',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
