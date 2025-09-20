/**
 * Realtime Gateway
 * WebSocket gateway for real-time communication
 */

import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PresenceService } from './presence.service';
import { LiveFeedService } from './live-feed.service';
import { ChatService } from './chat.service';
import { NotificationService } from './notification.service';
import { AnalyticsService } from '../analytics/analytics.service';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  user?: any;
}

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || '*',
    credentials: true,
  },
  namespace: '/realtime',
})
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(RealtimeGateway.name);
  private connectedUsers = new Map<string, Set<string>>(); // userId -> Set of socketIds

  constructor(
    private readonly jwtService: JwtService,
    private readonly presenceService: PresenceService,
    private readonly liveFeedService: LiveFeedService,
    private readonly chatService: ChatService,
    private readonly notificationService: NotificationService,
    private readonly analyticsService: AnalyticsService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      // Authenticate the connection
      const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.replace('Bearer ', '');
      
      if (!token) {
        this.logger.warn('Connection rejected: No token provided');
        client.disconnect();
        return;
      }

      const payload = await this.jwtService.verifyAsync(token);
      client.userId = payload.sub;
      client.user = payload;

      // Track connected users
      if (!this.connectedUsers.has(client.userId)) {
        this.connectedUsers.set(client.userId, new Set());
      }
      this.connectedUsers.get(client.userId).add(client.id);

      // Join user-specific room
      await client.join(`user:${client.userId}`);

      // Update user presence
      await this.presenceService.setUserOnline(client.userId);

      // Send initial data
      await this.sendInitialData(client);

      // Track connection analytics
      await this.analyticsService.track(client.userId, 'realtime_connected', {
        socket_id: client.id,
        user_agent: client.handshake.headers['user-agent'],
      });

      this.logger.log(`User ${client.userId} connected with socket ${client.id}`);
    } catch (error) {
      this.logger.error('Connection authentication failed:', error);
      client.disconnect();
    }
  }

  async handleDisconnect(client: AuthenticatedSocket) {
    if (client.userId) {
      // Remove from connected users
      const userSockets = this.connectedUsers.get(client.userId);
      if (userSockets) {
        userSockets.delete(client.id);
        if (userSockets.size === 0) {
          this.connectedUsers.delete(client.userId);
          // Set user offline if no more connections
          await this.presenceService.setUserOffline(client.userId);
        }
      }

      // Track disconnection analytics
      await this.analyticsService.track(client.userId, 'realtime_disconnected', {
        socket_id: client.id,
      });

      this.logger.log(`User ${client.userId} disconnected from socket ${client.id}`);
    }
  }

  /**
   * Send initial data to newly connected client
   */
  private async sendInitialData(client: AuthenticatedSocket) {
    try {
      // Send recent feed updates
      const recentFeed = await this.liveFeedService.getRecentFeedUpdates(client.userId, 20);
      client.emit('feed:initial', recentFeed);

      // Send unread notifications
      const notifications = await this.notificationService.getUnreadNotifications(client.userId);
      client.emit('notifications:initial', notifications);

      // Send online friends
      const onlineFriends = await this.presenceService.getOnlineFriends(client.userId);
      client.emit('presence:online_friends', onlineFriends);

      // Send unread message count
      const unreadCount = await this.chatService.getUnreadMessageCount(client.userId);
      client.emit('chat:unread_count', { count: unreadCount });
    } catch (error) {
      this.logger.error('Error sending initial data:', error);
    }
  }

  /**
   * Subscribe to live feed updates
   */
  @SubscribeMessage('feed:subscribe')
  async handleFeedSubscribe(@ConnectedSocket() client: AuthenticatedSocket) {
    if (!client.userId) return;

    await client.join('feed:global');
    await client.join(`feed:user:${client.userId}`);
    
    // Join rooms for followed users
    const followedUsers = await this.liveFeedService.getFollowedUsers(client.userId);
    for (const userId of followedUsers) {
      await client.join(`feed:user:${userId}`);
    }

    client.emit('feed:subscribed');
  }

  /**
   * Subscribe to notifications
   */
  @SubscribeMessage('notifications:subscribe')
  async handleNotificationsSubscribe(@ConnectedSocket() client: AuthenticatedSocket) {
    if (!client.userId) return;

    await client.join(`notifications:${client.userId}`);
    client.emit('notifications:subscribed');
  }

  /**
   * Join a chat room
   */
  @SubscribeMessage('chat:join')
  async handleChatJoin(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { roomId: string }
  ) {
    if (!client.userId) return;

    const { roomId } = data;
    
    // Verify user has access to this chat room
    const hasAccess = await this.chatService.verifyRoomAccess(client.userId, roomId);
    if (!hasAccess) {
      client.emit('chat:error', { message: 'Access denied to chat room' });
      return;
    }

    await client.join(`chat:${roomId}`);
    
    // Mark user as active in room
    await this.chatService.setUserActiveInRoom(client.userId, roomId);
    
    // Send recent messages
    const recentMessages = await this.chatService.getRecentMessages(roomId, 50);
    client.emit('chat:messages', { roomId, messages: recentMessages });
    
    // Notify others that user joined
    client.to(`chat:${roomId}`).emit('chat:user_joined', {
      userId: client.userId,
      user: client.user,
    });
  }

  /**
   * Leave a chat room
   */
  @SubscribeMessage('chat:leave')
  async handleChatLeave(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { roomId: string }
  ) {
    if (!client.userId) return;

    const { roomId } = data;
    
    await client.leave(`chat:${roomId}`);
    await this.chatService.setUserInactiveInRoom(client.userId, roomId);
    
    // Notify others that user left
    client.to(`chat:${roomId}`).emit('chat:user_left', {
      userId: client.userId,
    });
  }

  /**
   * Send a chat message
   */
  @SubscribeMessage('chat:message')
  async handleChatMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { roomId: string; message: string; type?: string }
  ) {
    if (!client.userId) return;

    const { roomId, message, type = 'text' } = data;
    
    try {
      // Save message to database
      const savedMessage = await this.chatService.createMessage({
        roomId,
        userId: client.userId,
        message,
        type,
      });

      // Broadcast to room
      this.server.to(`chat:${roomId}`).emit('chat:new_message', {
        roomId,
        message: savedMessage,
      });

      // Send push notifications to offline users
      await this.notificationService.sendChatNotifications(roomId, savedMessage, client.userId);
    } catch (error) {
      this.logger.error('Error handling chat message:', error);
      client.emit('chat:error', { message: 'Failed to send message' });
    }
  }

  /**
   * Mark notifications as read
   */
  @SubscribeMessage('notifications:mark_read')
  async handleMarkNotificationsRead(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { notificationIds: string[] }
  ) {
    if (!client.userId) return;

    try {
      await this.notificationService.markNotificationsRead(client.userId, data.notificationIds);
      client.emit('notifications:marked_read', { notificationIds: data.notificationIds });
    } catch (error) {
      this.logger.error('Error marking notifications as read:', error);
    }
  }

  /**
   * Update user activity status
   */
  @SubscribeMessage('presence:activity')
  async handlePresenceActivity(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { activity: string; metadata?: any }
  ) {
    if (!client.userId) return;

    await this.presenceService.updateUserActivity(client.userId, data.activity, data.metadata);
    
    // Broadcast activity to friends
    const friends = await this.presenceService.getOnlineFriends(client.userId);
    friends.forEach(friendId => {
      this.server.to(`user:${friendId}`).emit('presence:friend_activity', {
        userId: client.userId,
        activity: data.activity,
        metadata: data.metadata,
      });
    });
  }

  /**
   * Typing indicator for chat
   */
  @SubscribeMessage('chat:typing')
  async handleChatTyping(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { roomId: string; isTyping: boolean }
  ) {
    if (!client.userId) return;

    const { roomId, isTyping } = data;
    
    client.to(`chat:${roomId}`).emit('chat:user_typing', {
      userId: client.userId,
      user: client.user,
      isTyping,
    });
  }

  /**
   * Broadcast new post to followers
   */
  async broadcastNewPost(post: any) {
    try {
      // Broadcast to global feed
      this.server.to('feed:global').emit('feed:new_post', post);
      
      // Broadcast to author's followers
      this.server.to(`feed:user:${post.userId}`).emit('feed:new_post', post);
      
      // Send push notifications
      await this.notificationService.sendPostNotifications(post);
    } catch (error) {
      this.logger.error('Error broadcasting new post:', error);
    }
  }

  /**
   * Broadcast new comment
   */
  async broadcastNewComment(comment: any) {
    try {
      // Broadcast to post author and commenters
      this.server.to(`post:${comment.postId}`).emit('feed:new_comment', comment);
      
      // Send push notification to post author
      await this.notificationService.sendCommentNotification(comment);
    } catch (error) {
      this.logger.error('Error broadcasting new comment:', error);
    }
  }

  /**
   * Broadcast new like
   */
  async broadcastNewLike(like: any) {
    try {
      // Broadcast to post author
      this.server.to(`user:${like.targetUserId}`).emit('feed:new_like', like);
      
      // Send push notification
      await this.notificationService.sendLikeNotification(like);
    } catch (error) {
      this.logger.error('Error broadcasting new like:', error);
    }
  }

  /**
   * Broadcast new follow
   */
  async broadcastNewFollow(follow: any) {
    try {
      // Notify the followed user
      this.server.to(`user:${follow.followingId}`).emit('social:new_follower', follow);
      
      // Send push notification
      await this.notificationService.sendFollowNotification(follow);
    } catch (error) {
      this.logger.error('Error broadcasting new follow:', error);
    }
  }

  /**
   * Send notification to specific user
   */
  async sendNotificationToUser(userId: string, notification: any) {
    try {
      this.server.to(`user:${userId}`).emit('notification:new', notification);
    } catch (error) {
      this.logger.error('Error sending notification to user:', error);
    }
  }

  /**
   * Get connected users count
   */
  getConnectedUsersCount(): number {
    return this.connectedUsers.size;
  }

  /**
   * Check if user is online
   */
  isUserOnline(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }

  /**
   * Get user's socket IDs
   */
  getUserSockets(userId: string): string[] {
    const sockets = this.connectedUsers.get(userId);
    return sockets ? Array.from(sockets) : [];
  }
}
