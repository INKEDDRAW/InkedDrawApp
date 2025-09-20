/**
 * Moderation Queue Service
 * Manages the queue of content requiring human moderation review
 */

import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { NotificationService } from '../realtime/notification.service';

export interface ModerationQueueItem {
  id: string;
  contentId: string;
  contentType: 'post' | 'comment' | 'image' | 'profile' | 'message';
  userId: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_review' | 'approved' | 'rejected' | 'escalated';
  flags: string[];
  reasons: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  assignedTo?: string;
  createdAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  reviewNotes?: string;
  escalationReason?: string;
  metadata?: any;
}

export interface QueueStatistics {
  totalItems: number;
  pendingItems: number;
  inReviewItems: number;
  averageWaitTime: number;
  averageReviewTime: number;
  itemsByPriority: Record<string, number>;
  itemsBySeverity: Record<string, number>;
  reviewerWorkload: Record<string, number>;
}

@Injectable()
export class ModerationQueueService {
  private readonly logger = new Logger(ModerationQueueService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly analyticsService: AnalyticsService,
    private readonly notificationService: NotificationService,
  ) {}

  /**
   * Add item to moderation queue
   */
  async addToQueue(item: Omit<ModerationQueueItem, 'id' | 'createdAt' | 'status'>): Promise<ModerationQueueItem> {
    try {
      // Check if item already exists in queue
      const existingItem = await this.findExistingQueueItem(item.contentId, item.contentType);
      if (existingItem) {
        this.logger.warn(`Item already in queue: ${item.contentId}`);
        return existingItem;
      }

      // Create queue item
      const queueItem = await this.databaseService.insert('moderation_queue', {
        content_id: item.contentId,
        content_type: item.contentType,
        user_id: item.userId,
        priority: item.priority,
        status: 'pending',
        flags: JSON.stringify(item.flags),
        reasons: JSON.stringify(item.reasons),
        severity: item.severity,
        confidence: item.confidence,
        metadata: JSON.stringify(item.metadata || {}),
        created_at: new Date(),
      });

      // Auto-assign based on priority and workload
      const assignedTo = await this.autoAssignReviewer(item.priority, item.severity);
      if (assignedTo) {
        await this.assignToReviewer(queueItem.id, assignedTo);
      }

      // Notify reviewers for high-priority items
      if (item.priority === 'high' || item.priority === 'urgent') {
        await this.notifyReviewers(queueItem);
      }

      // Track analytics
      await this.analyticsService.track('system', 'moderation_queue_added', {
        queue_item_id: queueItem.id,
        content_type: item.contentType,
        priority: item.priority,
        severity: item.severity,
        flags: item.flags,
      });

      this.logger.log(`Added to moderation queue: ${queueItem.id} (${item.priority} priority)`);

      return {
        id: queueItem.id,
        contentId: item.contentId,
        contentType: item.contentType,
        userId: item.userId,
        priority: item.priority,
        status: 'pending',
        flags: item.flags,
        reasons: item.reasons,
        severity: item.severity,
        confidence: item.confidence,
        assignedTo,
        createdAt: queueItem.created_at,
        metadata: item.metadata,
      };
    } catch (error) {
      this.logger.error('Error adding to moderation queue:', error);
      throw error;
    }
  }

  /**
   * Get queue items for review
   */
  async getQueueItems(
    filters: {
      status?: string;
      priority?: string;
      severity?: string;
      assignedTo?: string;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{ items: ModerationQueueItem[], totalCount: number }> {
    try {
      const {
        status = 'pending',
        priority,
        severity,
        assignedTo,
        limit = 50,
        offset = 0,
      } = filters;

      let whereClause = 'WHERE mq.status = $1';
      const params = [status];
      let paramIndex = 2;

      if (priority) {
        whereClause += ` AND mq.priority = $${paramIndex}`;
        params.push(priority);
        paramIndex++;
      }

      if (severity) {
        whereClause += ` AND mq.severity = $${paramIndex}`;
        params.push(severity);
        paramIndex++;
      }

      if (assignedTo) {
        whereClause += ` AND mq.assigned_to = $${paramIndex}`;
        params.push(assignedTo);
        paramIndex++;
      }

      const query = `
        SELECT 
          mq.*,
          u.display_name as user_name,
          u.avatar_url as user_avatar,
          ru.display_name as reviewer_name,
          EXTRACT(EPOCH FROM (NOW() - mq.created_at)) as wait_time_seconds,
          CASE 
            WHEN mq.content_type = 'post' THEN p.content
            WHEN mq.content_type = 'comment' THEN c.content
            ELSE NULL
          END as content_preview
        FROM moderation_queue mq
        JOIN users u ON mq.user_id = u.id
        LEFT JOIN users ru ON mq.assigned_to = ru.id
        LEFT JOIN posts p ON mq.content_type = 'post' AND mq.content_id = p.id
        LEFT JOIN comments c ON mq.content_type = 'comment' AND mq.content_id = c.id
        ${whereClause}
        ORDER BY 
          CASE mq.priority 
            WHEN 'urgent' THEN 1 
            WHEN 'high' THEN 2 
            WHEN 'medium' THEN 3 
            WHEN 'low' THEN 4 
          END,
          mq.created_at ASC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      params.push(limit, offset);

      const items = await this.databaseService.query(query, params);

      // Get total count
      const countQuery = `
        SELECT COUNT(*) as total
        FROM moderation_queue mq
        ${whereClause}
      `;

      const countResult = await this.databaseService.query(countQuery, params.slice(0, -2));
      const totalCount = parseInt(countResult[0]?.total || '0');

      const formattedItems = items.map(row => ({
        id: row.id,
        contentId: row.content_id,
        contentType: row.content_type,
        userId: row.user_id,
        priority: row.priority,
        status: row.status,
        flags: row.flags ? JSON.parse(row.flags) : [],
        reasons: row.reasons ? JSON.parse(row.reasons) : [],
        severity: row.severity,
        confidence: row.confidence,
        assignedTo: row.assigned_to,
        createdAt: new Date(row.created_at),
        reviewedAt: row.reviewed_at ? new Date(row.reviewed_at) : undefined,
        reviewedBy: row.reviewed_by,
        reviewNotes: row.review_notes,
        escalationReason: row.escalation_reason,
        metadata: row.metadata ? JSON.parse(row.metadata) : {},
        user: {
          name: row.user_name,
          avatar: row.user_avatar,
        },
        reviewer: row.reviewer_name ? {
          name: row.reviewer_name,
        } : undefined,
        waitTime: this.formatDuration(row.wait_time_seconds),
        contentPreview: row.content_preview ? this.truncateText(row.content_preview, 100) : null,
      }));

      return { items: formattedItems, totalCount };
    } catch (error) {
      this.logger.error('Error getting queue items:', error);
      return { items: [], totalCount: 0 };
    }
  }

  /**
   * Assign queue item to reviewer
   */
  async assignToReviewer(queueItemId: string, reviewerId: string): Promise<boolean> {
    try {
      await this.databaseService.query(`
        UPDATE moderation_queue
        SET 
          assigned_to = $2,
          status = CASE WHEN status = 'pending' THEN 'in_review' ELSE status END,
          assigned_at = NOW()
        WHERE id = $1
      `, [queueItemId, reviewerId]);

      // Notify reviewer
      await this.notificationService.createNotification({
        userId: reviewerId,
        type: 'system',
        title: 'Moderation Review Assigned',
        message: 'A new content review has been assigned to you.',
        priority: 'normal',
        data: { queueItemId },
      });

      this.logger.log(`Queue item ${queueItemId} assigned to ${reviewerId}`);
      return true;
    } catch (error) {
      this.logger.error('Error assigning to reviewer:', error);
      return false;
    }
  }

  /**
   * Complete review of queue item
   */
  async completeReview(
    queueItemId: string,
    reviewerId: string,
    decision: 'approved' | 'rejected' | 'escalated',
    reviewNotes?: string,
    escalationReason?: string
  ): Promise<boolean> {
    try {
      // Update queue item
      await this.databaseService.query(`
        UPDATE moderation_queue
        SET 
          status = $2,
          reviewed_at = NOW(),
          reviewed_by = $3,
          review_notes = $4,
          escalation_reason = $5
        WHERE id = $1
      `, [queueItemId, decision, reviewerId, reviewNotes, escalationReason]);

      // Get queue item details for analytics
      const queueItem = await this.databaseService.query(`
        SELECT content_id, content_type, priority, severity, user_id
        FROM moderation_queue
        WHERE id = $1
      `, [queueItemId]);

      if (queueItem.length > 0) {
        const item = queueItem[0];

        // Execute decision actions
        await this.executeReviewDecision(item, decision, reviewerId);

        // Track analytics
        await this.analyticsService.track(reviewerId, 'moderation_review_completed', {
          queue_item_id: queueItemId,
          content_id: item.content_id,
          content_type: item.content_type,
          decision,
          priority: item.priority,
          severity: item.severity,
        });

        // Notify content owner if rejected
        if (decision === 'rejected') {
          await this.notifyContentOwner(item.user_id, item.content_type, reviewNotes);
        }
      }

      this.logger.log(`Review completed: ${queueItemId} - ${decision} by ${reviewerId}`);
      return true;
    } catch (error) {
      this.logger.error('Error completing review:', error);
      return false;
    }
  }

  /**
   * Get queue statistics
   */
  async getQueueStatistics(): Promise<QueueStatistics> {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_items,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_items,
          COUNT(CASE WHEN status = 'in_review' THEN 1 END) as in_review_items,
          AVG(EXTRACT(EPOCH FROM (COALESCE(reviewed_at, NOW()) - created_at))) as avg_wait_time,
          AVG(CASE WHEN reviewed_at IS NOT NULL THEN EXTRACT(EPOCH FROM (reviewed_at - assigned_at)) END) as avg_review_time,
          
          -- Items by priority
          COUNT(CASE WHEN priority = 'low' THEN 1 END) as low_priority,
          COUNT(CASE WHEN priority = 'medium' THEN 1 END) as medium_priority,
          COUNT(CASE WHEN priority = 'high' THEN 1 END) as high_priority,
          COUNT(CASE WHEN priority = 'urgent' THEN 1 END) as urgent_priority,
          
          -- Items by severity
          COUNT(CASE WHEN severity = 'low' THEN 1 END) as low_severity,
          COUNT(CASE WHEN severity = 'medium' THEN 1 END) as medium_severity,
          COUNT(CASE WHEN severity = 'high' THEN 1 END) as high_severity,
          COUNT(CASE WHEN severity = 'critical' THEN 1 END) as critical_severity
          
        FROM moderation_queue
        WHERE created_at >= NOW() - INTERVAL '30 days'
      `;

      const result = await this.databaseService.query(query);
      const stats = result[0] || {};

      // Get reviewer workload
      const workloadQuery = `
        SELECT 
          assigned_to,
          COUNT(*) as workload
        FROM moderation_queue
        WHERE status = 'in_review'
          AND assigned_to IS NOT NULL
        GROUP BY assigned_to
      `;

      const workloadResult = await this.databaseService.query(workloadQuery);
      const reviewerWorkload = {};
      workloadResult.forEach(row => {
        reviewerWorkload[row.assigned_to] = parseInt(row.workload);
      });

      return {
        totalItems: parseInt(stats.total_items || '0'),
        pendingItems: parseInt(stats.pending_items || '0'),
        inReviewItems: parseInt(stats.in_review_items || '0'),
        averageWaitTime: parseFloat(stats.avg_wait_time || '0'),
        averageReviewTime: parseFloat(stats.avg_review_time || '0'),
        itemsByPriority: {
          low: parseInt(stats.low_priority || '0'),
          medium: parseInt(stats.medium_priority || '0'),
          high: parseInt(stats.high_priority || '0'),
          urgent: parseInt(stats.urgent_priority || '0'),
        },
        itemsBySeverity: {
          low: parseInt(stats.low_severity || '0'),
          medium: parseInt(stats.medium_severity || '0'),
          high: parseInt(stats.high_severity || '0'),
          critical: parseInt(stats.critical_severity || '0'),
        },
        reviewerWorkload,
      };
    } catch (error) {
      this.logger.error('Error getting queue statistics:', error);
      return {
        totalItems: 0,
        pendingItems: 0,
        inReviewItems: 0,
        averageWaitTime: 0,
        averageReviewTime: 0,
        itemsByPriority: {},
        itemsBySeverity: {},
        reviewerWorkload: {},
      };
    }
  }

  /**
   * Private helper methods
   */
  private async findExistingQueueItem(contentId: string, contentType: string): Promise<ModerationQueueItem | null> {
    try {
      const result = await this.databaseService.query(`
        SELECT * FROM moderation_queue
        WHERE content_id = $1 AND content_type = $2
          AND status IN ('pending', 'in_review')
        LIMIT 1
      `, [contentId, contentType]);

      return result.length > 0 ? result[0] : null;
    } catch (error) {
      this.logger.error('Error finding existing queue item:', error);
      return null;
    }
  }

  private async autoAssignReviewer(priority: string, severity: string): Promise<string | null> {
    try {
      // Get available reviewers with lowest workload
      const query = `
        SELECT 
          u.id,
          COALESCE(workload.current_workload, 0) as current_workload
        FROM users u
        JOIN user_profiles up ON u.id = up.user_id
        LEFT JOIN (
          SELECT 
            assigned_to,
            COUNT(*) as current_workload
          FROM moderation_queue
          WHERE status = 'in_review'
          GROUP BY assigned_to
        ) workload ON u.id = workload.assigned_to
        WHERE up.is_moderator = true
          AND up.is_active = true
        ORDER BY current_workload ASC, RANDOM()
        LIMIT 1
      `;

      const result = await this.databaseService.query(query);
      return result.length > 0 ? result[0].id : null;
    } catch (error) {
      this.logger.error('Error auto-assigning reviewer:', error);
      return null;
    }
  }

  private async notifyReviewers(queueItem: ModerationQueueItem): Promise<void> {
    try {
      // Get all active moderators
      const moderators = await this.databaseService.query(`
        SELECT u.id
        FROM users u
        JOIN user_profiles up ON u.id = up.user_id
        WHERE up.is_moderator = true AND up.is_active = true
      `);

      // Send notifications
      for (const moderator of moderators) {
        await this.notificationService.createNotification({
          userId: moderator.id,
          type: 'system',
          title: `${queueItem.priority.toUpperCase()} Priority Review`,
          message: `New ${queueItem.contentType} requires immediate moderation review.`,
          priority: queueItem.priority === 'urgent' ? 'urgent' : 'high',
          data: { queueItemId: queueItem.id },
        });
      }
    } catch (error) {
      this.logger.error('Error notifying reviewers:', error);
    }
  }

  private async executeReviewDecision(item: any, decision: string, reviewerId: string): Promise<void> {
    try {
      const table = item.content_type === 'post' ? 'posts' : 
                    item.content_type === 'comment' ? 'comments' : null;

      if (!table) return;

      switch (decision) {
        case 'approved':
          await this.databaseService.query(`
            UPDATE ${table}
            SET is_approved = true, approved_by = $2, approved_at = NOW()
            WHERE id = $1
          `, [item.content_id, reviewerId]);
          break;

        case 'rejected':
          await this.databaseService.query(`
            UPDATE ${table}
            SET is_approved = false, is_hidden = true, hidden_reason = 'Moderation review'
            WHERE id = $1
          `, [item.content_id]);
          break;

        case 'escalated':
          // Escalation would involve senior moderators or admin review
          this.logger.log(`Content ${item.content_id} escalated for senior review`);
          break;
      }
    } catch (error) {
      this.logger.error('Error executing review decision:', error);
    }
  }

  private async notifyContentOwner(userId: string, contentType: string, reviewNotes?: string): Promise<void> {
    await this.notificationService.createNotification({
      userId,
      type: 'system',
      title: 'Content Review Update',
      message: `Your ${contentType} has been reviewed and requires attention. ${reviewNotes || ''}`,
      priority: 'normal',
    });
  }

  private formatDuration(seconds: number): string {
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    return `${Math.floor(seconds / 86400)}d`;
  }

  private truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }
}
