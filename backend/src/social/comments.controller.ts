/**
 * Comments Controller
 * RESTful API endpoints for post comments
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
import { CommentsService } from './comments.service';
import { SocialService } from './social.service';
import { CreateCommentDto, UpdateCommentDto, LikeCommentDto } from './dto/posts.dto';

@ApiTags('Social Comments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('social/comments')
export class CommentsController {
  constructor(
    private readonly commentsService: CommentsService,
    private readonly socialService: SocialService,
  ) {}

  @Post('posts/:postId')
  @ApiOperation({ summary: 'Create a comment on a post' })
  @ApiResponse({ status: 201, description: 'Comment created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid comment data' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  async createComment(
    @Request() req: any,
    @Param('postId') postId: string,
    @Body() createCommentDto: CreateCommentDto,
  ) {
    try {
      const comment = await this.commentsService.createComment(
        req.user.id,
        postId,
        createCommentDto,
      );

      // Track analytics
      await this.socialService.trackSocialInteraction(
        req.user.id,
        'comment_create',
        'post',
        postId,
        {
          content_length: createCommentDto.content.length,
          is_reply: !!createCommentDto.parentCommentId,
        }
      );

      return {
        success: true,
        data: comment,
        message: 'Comment created successfully',
      };
    } catch (error) {
      if (error.message.includes('not found')) {
        throw new HttpException('Post not found', HttpStatus.NOT_FOUND);
      }
      throw new HttpException(
        error.message || 'Failed to create comment',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('posts/:postId')
  @ApiOperation({ summary: 'Get comments for a post' })
  @ApiResponse({ status: 200, description: 'Comments retrieved successfully' })
  async getPostComments(
    @Request() req: any,
    @Param('postId') postId: string,
    @Query('limit') limit: string = '50',
    @Query('offset') offset: string = '0',
  ) {
    try {
      const limitNum = parseInt(limit, 10);
      const offsetNum = parseInt(offset, 10);

      const comments = await this.commentsService.getPostComments(
        postId,
        req.user.id,
        limitNum,
        offsetNum,
      );

      return {
        success: true,
        data: comments,
        pagination: {
          limit: limitNum,
          offset: offsetNum,
          hasMore: comments.length === limitNum,
        },
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to get comments',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific comment' })
  @ApiResponse({ status: 200, description: 'Comment retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  async getComment(@Request() req: any, @Param('id') id: string) {
    try {
      const comment = await this.commentsService.getCommentById(id, req.user.id);

      return {
        success: true,
        data: comment,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error.message || 'Failed to get comment',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a comment' })
  @ApiResponse({ status: 200, description: 'Comment updated successfully' })
  @ApiResponse({ status: 403, description: 'Not authorized to update this comment' })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  async updateComment(
    @Request() req: any,
    @Param('id') id: string,
    @Body() updateCommentDto: UpdateCommentDto,
  ) {
    try {
      const comment = await this.commentsService.updateComment(
        id,
        req.user.id,
        updateCommentDto,
      );

      return {
        success: true,
        data: comment,
        message: 'Comment updated successfully',
      };
    } catch (error) {
      if (error.message.includes('not found')) {
        throw new HttpException('Comment not found', HttpStatus.NOT_FOUND);
      }
      if (error.message.includes('not authorized')) {
        throw new HttpException('Not authorized to update this comment', HttpStatus.FORBIDDEN);
      }
      throw new HttpException(
        error.message || 'Failed to update comment',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a comment' })
  @ApiResponse({ status: 200, description: 'Comment deleted successfully' })
  @ApiResponse({ status: 403, description: 'Not authorized to delete this comment' })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  async deleteComment(@Request() req: any, @Param('id') id: string) {
    try {
      await this.commentsService.deleteComment(id, req.user.id);

      return {
        success: true,
        message: 'Comment deleted successfully',
      };
    } catch (error) {
      if (error.message.includes('not found')) {
        throw new HttpException('Comment not found', HttpStatus.NOT_FOUND);
      }
      if (error.message.includes('not authorized')) {
        throw new HttpException('Not authorized to delete this comment', HttpStatus.FORBIDDEN);
      }
      throw new HttpException(
        error.message || 'Failed to delete comment',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post(':id/like')
  @ApiOperation({ summary: 'Like or unlike a comment' })
  @ApiResponse({ status: 200, description: 'Comment like status updated' })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  async likeComment(
    @Request() req: any,
    @Param('id') id: string,
    @Body() likeCommentDto: LikeCommentDto,
  ) {
    try {
      const result = await this.commentsService.toggleLike(
        id,
        req.user.id,
        likeCommentDto.isLiked,
      );

      // Track analytics
      await this.socialService.trackSocialInteraction(
        req.user.id,
        likeCommentDto.isLiked ? 'like' : 'unlike',
        'comment',
        id
      );

      return {
        success: true,
        data: result,
        message: likeCommentDto.isLiked ? 'Comment liked' : 'Comment unliked',
      };
    } catch (error) {
      if (error.message.includes('not found')) {
        throw new HttpException('Comment not found', HttpStatus.NOT_FOUND);
      }
      throw new HttpException(
        error.message || 'Failed to update like status',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get(':id/replies')
  @ApiOperation({ summary: 'Get replies to a comment' })
  @ApiResponse({ status: 200, description: 'Comment replies retrieved successfully' })
  async getCommentReplies(
    @Request() req: any,
    @Param('id') id: string,
    @Query('limit') limit: string = '20',
    @Query('offset') offset: string = '0',
  ) {
    try {
      const limitNum = parseInt(limit, 10);
      const offsetNum = parseInt(offset, 10);

      const replies = await this.commentsService.getCommentReplies(
        id,
        req.user.id,
        limitNum,
        offsetNum,
      );

      return {
        success: true,
        data: replies,
        pagination: {
          limit: limitNum,
          offset: offsetNum,
          hasMore: replies.length === limitNum,
        },
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to get comment replies',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
