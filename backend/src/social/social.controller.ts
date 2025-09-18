import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SocialService, CreatePostDto } from './social.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('social')
@Controller('social')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SocialController {
  constructor(private readonly socialService: SocialService) {}

  @Post('posts')
  @ApiOperation({ summary: 'Create a new post' })
  @ApiResponse({ status: 201, description: 'Post created successfully' })
  createPost(@Request() req, @Body() createPostDto: CreatePostDto) {
    return this.socialService.createPost(req.user.id, createPostDto);
  }

  @Get('feed')
  @ApiOperation({ summary: 'Get social feed' })
  @ApiResponse({ status: 200, description: 'Feed retrieved successfully' })
  getFeed(
    @Request() req,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number
  ) {
    return this.socialService.getFeed(req.user.id, limit, offset);
  }

  @Get('posts/:id')
  @ApiOperation({ summary: 'Get post by ID' })
  @ApiResponse({ status: 200, description: 'Post retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  getPost(@Param('id') id: string) {
    return this.socialService.getPost(id);
  }

  @Post('posts/:id/like')
  @ApiOperation({ summary: 'Like/unlike a post' })
  @ApiResponse({ status: 200, description: 'Post like status updated' })
  likePost(@Request() req, @Param('id') id: string) {
    return this.socialService.likePost(id, req.user.id);
  }

  @Delete('posts/:id')
  @ApiOperation({ summary: 'Delete a post' })
  @ApiResponse({ status: 200, description: 'Post deleted successfully' })
  deletePost(@Request() req, @Param('id') id: string) {
    return this.socialService.deletePost(id, req.user.id);
  }

  @Get('posts/:id/likes')
  @ApiOperation({ summary: 'Get users who liked a post' })
  @ApiResponse({ status: 200, description: 'Post likes retrieved successfully' })
  getPostLikes(@Param('id') id: string) {
    return this.socialService.getPostLikes(id);
  }

  @Get('users/:id/posts')
  @ApiOperation({ summary: 'Get user posts' })
  @ApiResponse({ status: 200, description: 'User posts retrieved successfully' })
  getUserPosts(
    @Param('id') userId: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number
  ) {
    return this.socialService.getUserPosts(userId, limit, offset);
  }

  @Get('users/:id/profile')
  @ApiOperation({ summary: 'Get user profile with social stats' })
  @ApiResponse({ status: 200, description: 'User profile retrieved successfully' })
  getUserProfile(@Param('id') userId: string) {
    return this.socialService.getUserProfile(userId);
  }
}
