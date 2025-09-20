/**
 * Follows Controller
 * RESTful API endpoints for user following relationships
 */

import {
  Controller,
  Get,
  Post,
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
import { FollowsService } from './follows.service';
import { SocialService } from './social.service';
import { FollowUserDto } from './dto/posts.dto';

@ApiTags('Social Follows')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('social/follows')
export class FollowsController {
  constructor(
    private readonly followsService: FollowsService,
    private readonly socialService: SocialService,
  ) {}

  @Post(':userId')
  @ApiOperation({ summary: 'Follow a user' })
  @ApiResponse({ status: 201, description: 'User followed successfully' })
  @ApiResponse({ status: 400, description: 'Cannot follow user' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async followUser(
    @Request() req: any,
    @Param('userId') userId: string,
  ) {
    try {
      const result = await this.followsService.followUser(req.user.id, userId);

      // Track analytics
      await this.socialService.trackSocialInteraction(
        req.user.id,
        'follow',
        'user',
        userId
      );

      return {
        success: true,
        data: result,
        message: 'User followed successfully',
      };
    } catch (error) {
      if (error.message.includes('not found')) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }
      if (error.message.includes('Cannot follow') || error.message.includes('Already following')) {
        throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
      }
      throw new HttpException(
        error.message || 'Failed to follow user',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Delete(':userId')
  @ApiOperation({ summary: 'Unfollow a user' })
  @ApiResponse({ status: 200, description: 'User unfollowed successfully' })
  @ApiResponse({ status: 404, description: 'Follow relationship not found' })
  async unfollowUser(
    @Request() req: any,
    @Param('userId') userId: string,
  ) {
    try {
      const result = await this.followsService.unfollowUser(req.user.id, userId);

      // Track analytics
      await this.socialService.trackSocialInteraction(
        req.user.id,
        'unfollow',
        'user',
        userId
      );

      return {
        success: true,
        data: result,
        message: 'User unfollowed successfully',
      };
    } catch (error) {
      if (error.message.includes('not found')) {
        throw new HttpException('Follow relationship not found', HttpStatus.NOT_FOUND);
      }
      throw new HttpException(
        error.message || 'Failed to unfollow user',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get(':userId/status')
  @ApiOperation({ summary: 'Check if following a user' })
  @ApiResponse({ status: 200, description: 'Follow status retrieved successfully' })
  async getFollowStatus(
    @Request() req: any,
    @Param('userId') userId: string,
  ) {
    try {
      const isFollowing = await this.followsService.isFollowing(req.user.id, userId);

      return {
        success: true,
        data: {
          userId,
          isFollowing,
        },
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to get follow status',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':userId/followers')
  @ApiOperation({ summary: 'Get user followers' })
  @ApiResponse({ status: 200, description: 'Followers retrieved successfully' })
  async getFollowers(
    @Param('userId') userId: string,
    @Query('limit') limit: string = '50',
    @Query('offset') offset: string = '0',
  ) {
    try {
      const limitNum = parseInt(limit, 10);
      const offsetNum = parseInt(offset, 10);

      const followers = await this.followsService.getFollowers(userId, limitNum, offsetNum);

      return {
        success: true,
        data: followers,
        pagination: {
          limit: limitNum,
          offset: offsetNum,
          hasMore: followers.length === limitNum,
        },
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to get followers',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':userId/following')
  @ApiOperation({ summary: 'Get users that a user is following' })
  @ApiResponse({ status: 200, description: 'Following list retrieved successfully' })
  async getFollowing(
    @Param('userId') userId: string,
    @Query('limit') limit: string = '50',
    @Query('offset') offset: string = '0',
  ) {
    try {
      const limitNum = parseInt(limit, 10);
      const offsetNum = parseInt(offset, 10);

      const following = await this.followsService.getFollowing(userId, limitNum, offsetNum);

      return {
        success: true,
        data: following,
        pagination: {
          limit: limitNum,
          offset: offsetNum,
          hasMore: following.length === limitNum,
        },
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to get following list',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':userId/counts')
  @ApiOperation({ summary: 'Get follow counts for a user' })
  @ApiResponse({ status: 200, description: 'Follow counts retrieved successfully' })
  async getFollowCounts(@Param('userId') userId: string) {
    try {
      const counts = await this.followsService.getFollowCounts(userId);

      return {
        success: true,
        data: {
          userId,
          ...counts,
        },
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to get follow counts',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('suggestions')
  @ApiOperation({ summary: 'Get follow suggestions for current user' })
  @ApiResponse({ status: 200, description: 'Follow suggestions retrieved successfully' })
  async getFollowSuggestions(
    @Request() req: any,
    @Query('limit') limit: string = '10',
  ) {
    try {
      const limitNum = parseInt(limit, 10);
      const suggestions = await this.followsService.getFollowSuggestions(req.user.id, limitNum);

      return {
        success: true,
        data: suggestions,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to get follow suggestions',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':userId1/mutual/:userId2')
  @ApiOperation({ summary: 'Get mutual follows between two users' })
  @ApiResponse({ status: 200, description: 'Mutual follows retrieved successfully' })
  async getMutualFollows(
    @Param('userId1') userId1: string,
    @Param('userId2') userId2: string,
    @Query('limit') limit: string = '20',
  ) {
    try {
      const limitNum = parseInt(limit, 10);
      const mutualFollows = await this.followsService.getMutualFollows(userId1, userId2, limitNum);

      return {
        success: true,
        data: mutualFollows,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to get mutual follows',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('batch-status')
  @ApiOperation({ summary: 'Check follow status for multiple users' })
  @ApiResponse({ status: 200, description: 'Batch follow status retrieved successfully' })
  async batchCheckFollowStatus(
    @Request() req: any,
    @Body() body: { userIds: string[] },
  ) {
    try {
      const followStatus = await this.followsService.batchCheckFollowStatus(
        req.user.id,
        body.userIds,
      );

      return {
        success: true,
        data: followStatus,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to check follow status',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
