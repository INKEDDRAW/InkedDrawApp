/**
 * Moderation Controller
 * REST API endpoints for content moderation system
 */

import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Body, 
  Param, 
  Query, 
  UseGuards,
  Request,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ModerationService, ContentToModerate } from './moderation.service';
import { UserReportingService, UserReport } from './user-reporting.service';
import { ModerationQueueService } from './moderation-queue.service';
import { AutoModerationService } from './auto-moderation.service';

@Controller('moderation')
@UseGuards(JwtAuthGuard)
export class ModerationController {
  constructor(
    private readonly moderationService: ModerationService,
    private readonly userReportingService: UserReportingService,
    private readonly moderationQueueService: ModerationQueueService,
    private readonly autoModerationService: AutoModerationService,
  ) {}

  /**
   * Moderate content manually
   */
  @Post('moderate')
  async moderateContent(
    @Body() body: {
      contentId: string;
      contentType: 'post' | 'comment' | 'image' | 'profile' | 'message';
      content?: string;
      imageUrls?: string[];
      userId: string;
    },
    @Request() req: any
  ) {
    try {
      const contentToModerate: ContentToModerate = {
        id: body.contentId,
        type: body.contentType,
        content: body.content,
        imageUrls: body.imageUrls,
        userId: body.userId,
      };

      const result = await this.moderationService.moderateContent(contentToModerate);
      
      return {
        success: true,
        result,
      };
    } catch (error) {
      throw new HttpException(
        'Failed to moderate content',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Bulk moderate multiple content items
   */
  @Post('moderate/bulk')
  async bulkModerateContent(
    @Body() body: {
      contents: Array<{
        contentId: string;
        contentType: 'post' | 'comment' | 'image' | 'profile' | 'message';
        content?: string;
        imageUrls?: string[];
        userId: string;
      }>;
    },
    @Request() req: any
  ) {
    try {
      const contentsToModerate: ContentToModerate[] = body.contents.map(item => ({
        id: item.contentId,
        type: item.contentType,
        content: item.content,
        imageUrls: item.imageUrls,
        userId: item.userId,
      }));

      const results = await this.moderationService.bulkModerateContent(contentsToModerate);
      
      return {
        success: true,
        results: Object.fromEntries(results),
      };
    } catch (error) {
      throw new HttpException(
        'Failed to bulk moderate content',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get moderation status for content
   */
  @Get('status/:contentId/:contentType')
  async getModerationStatus(
    @Param('contentId') contentId: string,
    @Param('contentType') contentType: string,
    @Request() req: any
  ) {
    try {
      const status = await this.moderationService.getModerationStatus(contentId, contentType);
      
      return {
        success: true,
        status,
      };
    } catch (error) {
      throw new HttpException(
        'Failed to get moderation status',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Appeal moderation decision
   */
  @Post('appeal')
  async appealModerationDecision(
    @Body() body: {
      contentId: string;
      contentType: string;
      reason: string;
    },
    @Request() req: any
  ) {
    try {
      const success = await this.moderationService.appealModerationDecision(
        body.contentId,
        body.contentType,
        req.user.id,
        body.reason
      );
      
      return {
        success,
        message: success ? 'Appeal submitted successfully' : 'Failed to submit appeal',
      };
    } catch (error) {
      throw new HttpException(
        'Failed to submit appeal',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Submit user report
   */
  @Post('report')
  async submitReport(
    @Body() body: {
      reportedUserId?: string;
      contentId?: string;
      contentType?: 'post' | 'comment' | 'profile' | 'message';
      reportType: 'spam' | 'harassment' | 'hate_speech' | 'violence' | 'inappropriate_content' | 'fake_account' | 'copyright' | 'other';
      reason: string;
      evidence?: string[];
    },
    @Request() req: any
  ) {
    try {
      const report: Omit<UserReport, 'id' | 'createdAt'> = {
        reporterId: req.user.id,
        reportedUserId: body.reportedUserId,
        contentId: body.contentId,
        contentType: body.contentType,
        reportType: body.reportType,
        reason: body.reason,
        evidence: body.evidence,
        priority: 'medium', // Will be determined by service
        status: 'pending',
      };

      const submittedReport = await this.userReportingService.submitReport(report);
      
      return {
        success: true,
        report: submittedReport,
        message: 'Report submitted successfully',
      };
    } catch (error) {
      throw new HttpException(
        'Failed to submit report',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get reports for moderation review (moderators only)
   */
  @Get('reports')
  async getReportsForReview(
    @Query('status') status?: string,
    @Query('priority') priority?: string,
    @Query('reportType') reportType?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Request() req: any
  ) {
    try {
      // Check if user is moderator
      if (!req.user.isModerator) {
        throw new HttpException('Insufficient permissions', HttpStatus.FORBIDDEN);
      }

      const filters = {
        status,
        priority,
        reportType,
        limit: limit ? parseInt(limit) : undefined,
        offset: offset ? parseInt(offset) : undefined,
      };

      const result = await this.userReportingService.getReportsForReview(filters);
      
      return {
        success: true,
        ...result,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        'Failed to get reports',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Resolve a report (moderators only)
   */
  @Put('reports/:reportId/resolve')
  async resolveReport(
    @Param('reportId') reportId: string,
    @Body() body: {
      resolution: string;
      action?: 'dismiss' | 'warn_user' | 'suspend_user' | 'ban_user' | 'remove_content';
    },
    @Request() req: any
  ) {
    try {
      // Check if user is moderator
      if (!req.user.isModerator) {
        throw new HttpException('Insufficient permissions', HttpStatus.FORBIDDEN);
      }

      const success = await this.userReportingService.resolveReport(
        reportId,
        req.user.id,
        body.resolution,
        body.action
      );
      
      return {
        success,
        message: success ? 'Report resolved successfully' : 'Failed to resolve report',
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        'Failed to resolve report',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get moderation queue items (moderators only)
   */
  @Get('queue')
  async getQueueItems(
    @Query('status') status?: string,
    @Query('priority') priority?: string,
    @Query('severity') severity?: string,
    @Query('assignedTo') assignedTo?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Request() req: any
  ) {
    try {
      // Check if user is moderator
      if (!req.user.isModerator) {
        throw new HttpException('Insufficient permissions', HttpStatus.FORBIDDEN);
      }

      const filters = {
        status,
        priority,
        severity,
        assignedTo,
        limit: limit ? parseInt(limit) : undefined,
        offset: offset ? parseInt(offset) : undefined,
      };

      const result = await this.moderationQueueService.getQueueItems(filters);
      
      return {
        success: true,
        ...result,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        'Failed to get queue items',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Assign queue item to reviewer (moderators only)
   */
  @Put('queue/:queueItemId/assign')
  async assignQueueItem(
    @Param('queueItemId') queueItemId: string,
    @Body() body: { reviewerId: string },
    @Request() req: any
  ) {
    try {
      // Check if user is moderator
      if (!req.user.isModerator) {
        throw new HttpException('Insufficient permissions', HttpStatus.FORBIDDEN);
      }

      const success = await this.moderationQueueService.assignToReviewer(
        queueItemId,
        body.reviewerId
      );
      
      return {
        success,
        message: success ? 'Queue item assigned successfully' : 'Failed to assign queue item',
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        'Failed to assign queue item',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Complete review of queue item (moderators only)
   */
  @Put('queue/:queueItemId/review')
  async completeReview(
    @Param('queueItemId') queueItemId: string,
    @Body() body: {
      decision: 'approved' | 'rejected' | 'escalated';
      reviewNotes?: string;
      escalationReason?: string;
    },
    @Request() req: any
  ) {
    try {
      // Check if user is moderator
      if (!req.user.isModerator) {
        throw new HttpException('Insufficient permissions', HttpStatus.FORBIDDEN);
      }

      const success = await this.moderationQueueService.completeReview(
        queueItemId,
        req.user.id,
        body.decision,
        body.reviewNotes,
        body.escalationReason
      );
      
      return {
        success,
        message: success ? 'Review completed successfully' : 'Failed to complete review',
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        'Failed to complete review',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get moderation statistics (moderators only)
   */
  @Get('statistics')
  async getModerationStatistics(
    @Query('timeRange') timeRange?: string,
    @Request() req: any
  ) {
    try {
      // Check if user is moderator
      if (!req.user.isModerator) {
        throw new HttpException('Insufficient permissions', HttpStatus.FORBIDDEN);
      }

      const [
        moderationStats,
        reportStats,
        queueStats,
        autoModerationStats,
      ] = await Promise.all([
        this.moderationService.getModerationStatistics(timeRange),
        this.userReportingService.getReportStatistics(timeRange),
        this.moderationQueueService.getQueueStatistics(),
        this.autoModerationService.getAutoModerationStats(timeRange),
      ]);
      
      return {
        success: true,
        statistics: {
          moderation: moderationStats,
          reports: reportStats,
          queue: queueStats,
          autoModeration: autoModerationStats,
        },
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        'Failed to get statistics',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get active auto-moderation rules (moderators only)
   */
  @Get('rules')
  async getActiveRules(@Request() req: any) {
    try {
      // Check if user is moderator
      if (!req.user.isModerator) {
        throw new HttpException('Insufficient permissions', HttpStatus.FORBIDDEN);
      }

      const rules = await this.autoModerationService.getActiveRules();
      
      return {
        success: true,
        rules,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        'Failed to get rules',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Update auto-moderation rule status (admin only)
   */
  @Put('rules/:ruleId')
  async updateRuleStatus(
    @Param('ruleId') ruleId: string,
    @Body() body: { isActive: boolean },
    @Request() req: any
  ) {
    try {
      // Check if user is admin
      if (!req.user.isAdmin) {
        throw new HttpException('Insufficient permissions', HttpStatus.FORBIDDEN);
      }

      const success = await this.autoModerationService.updateRuleStatus(
        ruleId,
        body.isActive
      );
      
      return {
        success,
        message: success ? 'Rule updated successfully' : 'Failed to update rule',
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        'Failed to update rule',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Health check endpoint
   */
  @Get('health')
  async healthCheck() {
    return {
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        moderation: 'operational',
        reporting: 'operational',
        queue: 'operational',
        autoModeration: 'operational',
      },
    };
  }
}
