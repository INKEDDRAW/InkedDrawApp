/**
 * Realtime Controller
 * REST API endpoints for real-time features
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
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { NotificationService } from './notification.service';
import { LiveFeedService } from './live-feed.service';
import { PresenceService } from './presence.service';
import { ChatService } from './chat.service';
import { RealtimeGateway } from './realtime.gateway';

@Controller('api/v1/realtime')
@UseGuards(JwtAuthGuard)
export class RealtimeController {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly liveFeedService: LiveFeedService,
    private readonly presenceService: PresenceService,
    private readonly chatService: ChatService,
    private readonly realtimeGateway: RealtimeGateway,
  ) {}

  // Notification endpoints
  @Get('notifications')
  async getNotifications(
    @Request() req,
    @Query('limit') limit: string = '50',
    @Query('unread_only') unreadOnly: string = 'false'
  ) {
    try {
      const userId = req.user.sub;
      const notifications = await this.notificationService.getUnreadNotifications(
        userId,
        parseInt(limit)
      );

      return {
        notifications,
        totalCount: notifications.length,
      };
    } catch (error) {
      throw new HttpException('Failed to get notifications', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Put('notifications/read')
  async markNotificationsRead(
    @Request() req,
    @Body() body: { notificationIds: string[] }
  ) {
    try {
      const userId = req.user.sub;
      await this.notificationService.markNotificationsRead(userId, body.notificationIds);

      return { success: true };
    } catch (error) {
      throw new HttpException('Failed to mark notifications as read', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('notifications/preferences')
  async getNotificationPreferences(@Request() req) {
    try {
      const userId = req.user.sub;
      const preferences = await this.notificationService.getUserNotificationPreferences(userId);

      return { preferences };
    } catch (error) {
      throw new HttpException('Failed to get notification preferences', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Put('notifications/preferences')
  async updateNotificationPreferences(
    @Request() req,
    @Body() body: { preferences: any }
  ) {
    try {
      const userId = req.user.sub;
      await this.notificationService.updateNotificationPreferences(userId, body.preferences);

      return { success: true };
    } catch (error) {
      throw new HttpException('Failed to update notification preferences', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Live feed endpoints
  @Get('feed')
  async getLiveFeed(
    @Request() req,
    @Query('limit') limit: string = '50',
    @Query('following_only') followingOnly: string = 'false',
    @Query('types') types: string,
    @Query('product_types') productTypes: string,
    @Query('time_range') timeRange: string = 'week'
  ) {
    try {
      const userId = req.user.sub;
      const filters = {
        followingOnly: followingOnly === 'true',
        types: types ? types.split(',') : undefined,
        productTypes: productTypes ? productTypes.split(',') : undefined,
        timeRange: timeRange as any,
      };

      const feedUpdates = await this.liveFeedService.getRecentFeedUpdates(
        userId,
        parseInt(limit),
        filters
      );

      return {
        feedUpdates,
        totalCount: feedUpdates.length,
        filters,
      };
    } catch (error) {
      throw new HttpException('Failed to get live feed', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('feed/trending')
  async getTrendingFeed(@Query('limit') limit: string = '20') {
    try {
      const trendingActivities = await this.liveFeedService.getTrendingActivities(parseInt(limit));

      return {
        activities: trendingActivities,
        totalCount: trendingActivities.length,
      };
    } catch (error) {
      throw new HttpException('Failed to get trending feed', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('feed/statistics')
  async getFeedStatistics(@Request() req) {
    try {
      const userId = req.user.sub;
      const statistics = await this.liveFeedService.getFeedStatistics(userId);

      return { statistics };
    } catch (error) {
      throw new HttpException('Failed to get feed statistics', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Presence endpoints
  @Get('presence/me')
  async getMyPresence(@Request() req) {
    try {
      const userId = req.user.sub;
      const presence = await this.presenceService.getUserPresence(userId);

      return { presence };
    } catch (error) {
      throw new HttpException('Failed to get presence', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Put('presence/activity')
  async updateActivity(
    @Request() req,
    @Body() body: { activity: string; metadata?: any }
  ) {
    try {
      const userId = req.user.sub;
      await this.presenceService.updateUserActivity(userId, body.activity, body.metadata);

      return { success: true };
    } catch (error) {
      throw new HttpException('Failed to update activity', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('presence/online-friends')
  async getOnlineFriends(@Request() req) {
    try {
      const userId = req.user.sub;
      const onlineFriends = await this.presenceService.getOnlineFriends(userId);

      return { onlineFriends };
    } catch (error) {
      throw new HttpException('Failed to get online friends', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('presence/statistics')
  async getPresenceStatistics() {
    try {
      const statistics = await this.presenceService.getPresenceStatistics();

      return { statistics };
    } catch (error) {
      throw new HttpException('Failed to get presence statistics', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Chat endpoints
  @Get('chat/rooms')
  async getChatRooms(@Request() req) {
    try {
      const userId = req.user.sub;
      const rooms = await this.chatService.getUserChatRooms(userId);

      return { rooms };
    } catch (error) {
      throw new HttpException('Failed to get chat rooms', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('chat/rooms')
  async createChatRoom(
    @Request() req,
    @Body() body: {
      participants: string[];
      type?: 'direct' | 'group' | 'public';
      name?: string;
      metadata?: any;
    }
  ) {
    try {
      const userId = req.user.sub;
      const room = await this.chatService.createChatRoom(
        userId,
        [...body.participants, userId], // Include creator in participants
        body.type || 'direct',
        body.name,
        body.metadata
      );

      return { room };
    } catch (error) {
      throw new HttpException('Failed to create chat room', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('chat/rooms/:roomId/messages')
  async getRoomMessages(
    @Request() req,
    @Param('roomId') roomId: string,
    @Query('limit') limit: string = '50'
  ) {
    try {
      const userId = req.user.sub;
      
      // Verify access
      const hasAccess = await this.chatService.verifyRoomAccess(userId, roomId);
      if (!hasAccess) {
        throw new HttpException('Access denied', HttpStatus.FORBIDDEN);
      }

      const messages = await this.chatService.getRecentMessages(roomId, parseInt(limit));

      return { messages };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException('Failed to get room messages', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('chat/rooms/:roomId/messages')
  async sendMessage(
    @Request() req,
    @Param('roomId') roomId: string,
    @Body() body: {
      message: string;
      type?: string;
      replyToId?: string;
      metadata?: any;
    }
  ) {
    try {
      const userId = req.user.sub;
      
      // Verify access
      const hasAccess = await this.chatService.verifyRoomAccess(userId, roomId);
      if (!hasAccess) {
        throw new HttpException('Access denied', HttpStatus.FORBIDDEN);
      }

      const message = await this.chatService.createMessage({
        roomId,
        userId,
        message: body.message,
        type: body.type,
        replyToId: body.replyToId,
        metadata: body.metadata,
      });

      // Broadcast via WebSocket
      this.realtimeGateway.server.to(`chat:${roomId}`).emit('chat:new_message', {
        roomId,
        message,
      });

      return { message };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException('Failed to send message', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Put('chat/rooms/:roomId/messages/:messageId')
  async editMessage(
    @Request() req,
    @Param('roomId') roomId: string,
    @Param('messageId') messageId: string,
    @Body() body: { content: string }
  ) {
    try {
      const userId = req.user.sub;
      
      const success = await this.chatService.editMessage(messageId, userId, body.content);
      if (!success) {
        throw new HttpException('Message not found or access denied', HttpStatus.NOT_FOUND);
      }

      // Broadcast edit via WebSocket
      this.realtimeGateway.server.to(`chat:${roomId}`).emit('chat:message_edited', {
        roomId,
        messageId,
        newContent: body.content,
      });

      return { success: true };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException('Failed to edit message', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Delete('chat/rooms/:roomId/messages/:messageId')
  async deleteMessage(
    @Request() req,
    @Param('roomId') roomId: string,
    @Param('messageId') messageId: string
  ) {
    try {
      const userId = req.user.sub;
      
      const success = await this.chatService.deleteMessage(messageId, userId);
      if (!success) {
        throw new HttpException('Message not found or access denied', HttpStatus.NOT_FOUND);
      }

      // Broadcast deletion via WebSocket
      this.realtimeGateway.server.to(`chat:${roomId}`).emit('chat:message_deleted', {
        roomId,
        messageId,
      });

      return { success: true };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException('Failed to delete message', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Put('chat/rooms/:roomId/read')
  async markMessagesAsRead(
    @Request() req,
    @Param('roomId') roomId: string
  ) {
    try {
      const userId = req.user.sub;
      await this.chatService.markMessagesAsRead(userId, roomId);

      return { success: true };
    } catch (error) {
      throw new HttpException('Failed to mark messages as read', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('chat/rooms/:roomId/search')
  async searchMessages(
    @Request() req,
    @Param('roomId') roomId: string,
    @Query('q') query: string,
    @Query('limit') limit: string = '20'
  ) {
    try {
      const userId = req.user.sub;
      
      // Verify access
      const hasAccess = await this.chatService.verifyRoomAccess(userId, roomId);
      if (!hasAccess) {
        throw new HttpException('Access denied', HttpStatus.FORBIDDEN);
      }

      if (!query) {
        throw new HttpException('Search query is required', HttpStatus.BAD_REQUEST);
      }

      const messages = await this.chatService.searchMessages(roomId, query, parseInt(limit));

      return { messages, query };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException('Failed to search messages', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('chat/unread-count')
  async getUnreadMessageCount(@Request() req) {
    try {
      const userId = req.user.sub;
      const count = await this.chatService.getUnreadMessageCount(userId);

      return { count };
    } catch (error) {
      throw new HttpException('Failed to get unread message count', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // System status endpoints
  @Get('status')
  async getSystemStatus() {
    try {
      const connectedUsers = this.realtimeGateway.getConnectedUsersCount();
      const presenceStats = await this.presenceService.getPresenceStatistics();

      return {
        connectedUsers,
        presenceStatistics: presenceStats,
        timestamp: new Date(),
      };
    } catch (error) {
      throw new HttpException('Failed to get system status', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('health')
  async healthCheck() {
    return {
      status: 'healthy',
      timestamp: new Date(),
      services: {
        websocket: 'operational',
        notifications: 'operational',
        chat: 'operational',
        presence: 'operational',
        liveFeed: 'operational',
      },
    };
  }
}
