/**
 * Chat Service
 * Manages real-time messaging and chat rooms
 */

import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { AnalyticsService } from '../analytics/analytics.service';

export interface ChatRoom {
  id: string;
  name?: string;
  type: 'direct' | 'group' | 'public';
  participants: string[];
  createdBy: string;
  createdAt: Date;
  lastMessageAt?: Date;
  metadata?: any;
}

export interface ChatMessage {
  id: string;
  roomId: string;
  userId: string;
  content: string;
  type: 'text' | 'image' | 'file' | 'system';
  replyToId?: string;
  metadata?: any;
  createdAt: Date;
  editedAt?: Date;
  user?: any;
  replyTo?: ChatMessage;
}

export interface CreateMessageData {
  roomId: string;
  userId: string;
  message: string;
  type?: string;
  replyToId?: string;
  metadata?: any;
}

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private readonly activeUsers = new Map<string, Set<string>>(); // roomId -> Set of userIds

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly analyticsService: AnalyticsService,
  ) {}

  /**
   * Create a new chat room
   */
  async createChatRoom(
    createdBy: string,
    participants: string[],
    type: 'direct' | 'group' | 'public' = 'direct',
    name?: string,
    metadata?: any
  ): Promise<ChatRoom> {
    try {
      // For direct messages, check if room already exists
      if (type === 'direct' && participants.length === 2) {
        const existingRoom = await this.findDirectMessageRoom(participants[0], participants[1]);
        if (existingRoom) {
          return existingRoom;
        }
      }

      // Create the room
      const room = await this.databaseService.insert('chat_rooms', {
        name,
        type,
        created_by: createdBy,
        metadata: JSON.stringify(metadata || {}),
        created_at: new Date(),
      });

      // Add participants
      const participantInserts = participants.map(userId => ({
        room_id: room.id,
        user_id: userId,
        joined_at: new Date(),
        is_active: true,
      }));

      await this.databaseService.insertMany('chat_participants', participantInserts);

      // Track analytics
      await this.analyticsService.track(createdBy, 'chat_room_created', {
        room_id: room.id,
        type,
        participant_count: participants.length,
      });

      return {
        id: room.id,
        name: room.name,
        type: room.type,
        participants,
        createdBy,
        createdAt: room.created_at,
        metadata: metadata || {},
      };
    } catch (error) {
      this.logger.error('Error creating chat room:', error);
      throw error;
    }
  }

  /**
   * Create a message
   */
  async createMessage(data: CreateMessageData): Promise<ChatMessage> {
    try {
      const message = await this.databaseService.insert('chat_messages', {
        room_id: data.roomId,
        user_id: data.userId,
        content: data.message,
        message_type: data.type || 'text',
        reply_to_id: data.replyToId,
        metadata: JSON.stringify(data.metadata || {}),
        created_at: new Date(),
      });

      // Update room's last message timestamp
      await this.databaseService.query(`
        UPDATE chat_rooms 
        SET last_message_at = NOW()
        WHERE id = $1
      `, [data.roomId]);

      // Get user info and reply-to message if applicable
      const userQuery = `
        SELECT id, display_name, avatar_url
        FROM users
        WHERE id = $1
      `;
      const userResult = await this.databaseService.query(userQuery, [data.userId]);
      const user = userResult[0];

      let replyTo: ChatMessage | undefined;
      if (data.replyToId) {
        replyTo = await this.getMessageById(data.replyToId);
      }

      // Track analytics
      await this.analyticsService.track(data.userId, 'chat_message_sent', {
        room_id: data.roomId,
        message_id: message.id,
        message_type: data.type || 'text',
        has_reply: !!data.replyToId,
      });

      return {
        id: message.id,
        roomId: data.roomId,
        userId: data.userId,
        content: data.message,
        type: (data.type || 'text') as any,
        replyToId: data.replyToId,
        metadata: data.metadata || {},
        createdAt: message.created_at,
        user,
        replyTo,
      };
    } catch (error) {
      this.logger.error('Error creating message:', error);
      throw error;
    }
  }

  /**
   * Get recent messages for a room
   */
  async getRecentMessages(roomId: string, limit: number = 50): Promise<ChatMessage[]> {
    try {
      const query = `
        SELECT 
          m.id,
          m.room_id,
          m.user_id,
          m.content,
          m.message_type,
          m.reply_to_id,
          m.metadata,
          m.created_at,
          m.edited_at,
          u.display_name as user_name,
          u.avatar_url as user_avatar,
          rm.content as reply_content,
          ru.display_name as reply_user_name
        FROM chat_messages m
        JOIN users u ON m.user_id = u.id
        LEFT JOIN chat_messages rm ON m.reply_to_id = rm.id
        LEFT JOIN users ru ON rm.user_id = ru.id
        WHERE m.room_id = $1
        ORDER BY m.created_at DESC
        LIMIT $2
      `;

      const results = await this.databaseService.query(query, [roomId, limit]);

      return results.reverse().map(row => ({
        id: row.id,
        roomId: row.room_id,
        userId: row.user_id,
        content: row.content,
        type: row.message_type,
        replyToId: row.reply_to_id,
        metadata: row.metadata ? JSON.parse(row.metadata) : {},
        createdAt: new Date(row.created_at),
        editedAt: row.edited_at ? new Date(row.edited_at) : undefined,
        user: {
          id: row.user_id,
          displayName: row.user_name,
          avatarUrl: row.user_avatar,
        },
        replyTo: row.reply_to_id ? {
          id: row.reply_to_id,
          content: row.reply_content,
          user: {
            displayName: row.reply_user_name,
          },
        } : undefined,
      }));
    } catch (error) {
      this.logger.error('Error getting recent messages:', error);
      return [];
    }
  }

  /**
   * Get user's chat rooms
   */
  async getUserChatRooms(userId: string): Promise<ChatRoom[]> {
    try {
      const query = `
        SELECT 
          r.id,
          r.name,
          r.type,
          r.created_by,
          r.created_at,
          r.last_message_at,
          r.metadata,
          array_agg(DISTINCT p.user_id) as participants,
          lm.content as last_message_content,
          lm.user_id as last_message_user_id,
          lu.display_name as last_message_user_name
        FROM chat_rooms r
        JOIN chat_participants cp ON r.id = cp.room_id
        JOIN chat_participants p ON r.id = p.room_id
        LEFT JOIN LATERAL (
          SELECT content, user_id
          FROM chat_messages
          WHERE room_id = r.id
          ORDER BY created_at DESC
          LIMIT 1
        ) lm ON true
        LEFT JOIN users lu ON lm.user_id = lu.id
        WHERE cp.user_id = $1 AND cp.is_active = true
        GROUP BY r.id, r.name, r.type, r.created_by, r.created_at, r.last_message_at, r.metadata, lm.content, lm.user_id, lu.display_name
        ORDER BY COALESCE(r.last_message_at, r.created_at) DESC
      `;

      const results = await this.databaseService.query(query, [userId]);

      return results.map(row => ({
        id: row.id,
        name: row.name,
        type: row.type,
        participants: row.participants,
        createdBy: row.created_by,
        createdAt: new Date(row.created_at),
        lastMessageAt: row.last_message_at ? new Date(row.last_message_at) : undefined,
        metadata: row.metadata ? JSON.parse(row.metadata) : {},
        lastMessage: row.last_message_content ? {
          content: row.last_message_content,
          userId: row.last_message_user_id,
          userName: row.last_message_user_name,
        } : undefined,
      }));
    } catch (error) {
      this.logger.error('Error getting user chat rooms:', error);
      return [];
    }
  }

  /**
   * Verify user has access to room
   */
  async verifyRoomAccess(userId: string, roomId: string): Promise<boolean> {
    try {
      const result = await this.databaseService.query(`
        SELECT 1
        FROM chat_participants
        WHERE room_id = $1 AND user_id = $2 AND is_active = true
      `, [roomId, userId]);

      return result.length > 0;
    } catch (error) {
      this.logger.error('Error verifying room access:', error);
      return false;
    }
  }

  /**
   * Set user as active in room
   */
  async setUserActiveInRoom(userId: string, roomId: string): Promise<void> {
    try {
      if (!this.activeUsers.has(roomId)) {
        this.activeUsers.set(roomId, new Set());
      }
      this.activeUsers.get(roomId)!.add(userId);

      // Update last seen in room
      await this.databaseService.query(`
        UPDATE chat_participants
        SET last_seen_at = NOW()
        WHERE room_id = $1 AND user_id = $2
      `, [roomId, userId]);
    } catch (error) {
      this.logger.error('Error setting user active in room:', error);
    }
  }

  /**
   * Set user as inactive in room
   */
  async setUserInactiveInRoom(userId: string, roomId: string): Promise<void> {
    try {
      const roomUsers = this.activeUsers.get(roomId);
      if (roomUsers) {
        roomUsers.delete(userId);
        if (roomUsers.size === 0) {
          this.activeUsers.delete(roomId);
        }
      }
    } catch (error) {
      this.logger.error('Error setting user inactive in room:', error);
    }
  }

  /**
   * Get active users in room
   */
  getActiveUsersInRoom(roomId: string): string[] {
    const roomUsers = this.activeUsers.get(roomId);
    return roomUsers ? Array.from(roomUsers) : [];
  }

  /**
   * Get unread message count for user
   */
  async getUnreadMessageCount(userId: string): Promise<number> {
    try {
      const result = await this.databaseService.query(`
        SELECT COUNT(*)::int as unread_count
        FROM chat_messages m
        JOIN chat_participants p ON m.room_id = p.room_id
        WHERE p.user_id = $1 
          AND p.is_active = true
          AND m.user_id != $1
          AND m.created_at > COALESCE(p.last_seen_at, p.joined_at)
      `, [userId]);

      return result[0]?.unread_count || 0;
    } catch (error) {
      this.logger.error('Error getting unread message count:', error);
      return 0;
    }
  }

  /**
   * Mark messages as read
   */
  async markMessagesAsRead(userId: string, roomId: string): Promise<void> {
    try {
      await this.databaseService.query(`
        UPDATE chat_participants
        SET last_seen_at = NOW()
        WHERE room_id = $1 AND user_id = $2
      `, [roomId, userId]);

      // Track analytics
      await this.analyticsService.track(userId, 'chat_messages_read', {
        room_id: roomId,
      });
    } catch (error) {
      this.logger.error('Error marking messages as read:', error);
    }
  }

  /**
   * Search messages in room
   */
  async searchMessages(roomId: string, query: string, limit: number = 20): Promise<ChatMessage[]> {
    try {
      const searchQuery = `
        SELECT 
          m.id,
          m.room_id,
          m.user_id,
          m.content,
          m.message_type,
          m.created_at,
          u.display_name as user_name,
          u.avatar_url as user_avatar,
          ts_rank(to_tsvector('english', m.content), plainto_tsquery('english', $2)) as rank
        FROM chat_messages m
        JOIN users u ON m.user_id = u.id
        WHERE m.room_id = $1
          AND to_tsvector('english', m.content) @@ plainto_tsquery('english', $2)
        ORDER BY rank DESC, m.created_at DESC
        LIMIT $3
      `;

      const results = await this.databaseService.query(searchQuery, [roomId, query, limit]);

      return results.map(row => ({
        id: row.id,
        roomId: row.room_id,
        userId: row.user_id,
        content: row.content,
        type: row.message_type,
        createdAt: new Date(row.created_at),
        user: {
          id: row.user_id,
          displayName: row.user_name,
          avatarUrl: row.user_avatar,
        },
      }));
    } catch (error) {
      this.logger.error('Error searching messages:', error);
      return [];
    }
  }

  /**
   * Delete a message
   */
  async deleteMessage(messageId: string, userId: string): Promise<boolean> {
    try {
      const result = await this.databaseService.query(`
        UPDATE chat_messages
        SET content = '[Message deleted]', metadata = jsonb_set(COALESCE(metadata, '{}'), '{deleted}', 'true')
        WHERE id = $1 AND user_id = $2
        RETURNING id
      `, [messageId, userId]);

      if (result.length > 0) {
        await this.analyticsService.track(userId, 'chat_message_deleted', {
          message_id: messageId,
        });
        return true;
      }

      return false;
    } catch (error) {
      this.logger.error('Error deleting message:', error);
      return false;
    }
  }

  /**
   * Edit a message
   */
  async editMessage(messageId: string, userId: string, newContent: string): Promise<boolean> {
    try {
      const result = await this.databaseService.query(`
        UPDATE chat_messages
        SET content = $3, edited_at = NOW()
        WHERE id = $1 AND user_id = $2
        RETURNING id
      `, [messageId, userId, newContent]);

      if (result.length > 0) {
        await this.analyticsService.track(userId, 'chat_message_edited', {
          message_id: messageId,
        });
        return true;
      }

      return false;
    } catch (error) {
      this.logger.error('Error editing message:', error);
      return false;
    }
  }

  /**
   * Helper methods
   */
  private async findDirectMessageRoom(userId1: string, userId2: string): Promise<ChatRoom | null> {
    try {
      const query = `
        SELECT r.id, r.name, r.type, r.created_by, r.created_at, r.metadata
        FROM chat_rooms r
        JOIN chat_participants p1 ON r.id = p1.room_id
        JOIN chat_participants p2 ON r.id = p2.room_id
        WHERE r.type = 'direct'
          AND p1.user_id = $1
          AND p2.user_id = $2
          AND p1.is_active = true
          AND p2.is_active = true
        LIMIT 1
      `;

      const result = await this.databaseService.query(query, [userId1, userId2]);
      
      if (result.length === 0) return null;

      const row = result[0];
      return {
        id: row.id,
        name: row.name,
        type: row.type,
        participants: [userId1, userId2],
        createdBy: row.created_by,
        createdAt: new Date(row.created_at),
        metadata: row.metadata ? JSON.parse(row.metadata) : {},
      };
    } catch (error) {
      this.logger.error('Error finding direct message room:', error);
      return null;
    }
  }

  private async getMessageById(messageId: string): Promise<ChatMessage | undefined> {
    try {
      const query = `
        SELECT 
          m.id,
          m.room_id,
          m.user_id,
          m.content,
          m.message_type,
          m.created_at,
          u.display_name as user_name
        FROM chat_messages m
        JOIN users u ON m.user_id = u.id
        WHERE m.id = $1
      `;

      const result = await this.databaseService.query(query, [messageId]);
      
      if (result.length === 0) return undefined;

      const row = result[0];
      return {
        id: row.id,
        roomId: row.room_id,
        userId: row.user_id,
        content: row.content,
        type: row.message_type,
        createdAt: new Date(row.created_at),
        user: {
          id: row.user_id,
          displayName: row.user_name,
        },
      };
    } catch (error) {
      this.logger.error('Error getting message by ID:', error);
      return undefined;
    }
  }
}
