/**
 * User Reporting Service
 * Handles user reports and community-driven moderation
 */

import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { NotificationService } from '../realtime/notification.service';

export interface UserReport {
  id?: string;
  reporterId: string;
  reportedUserId?: string;
  contentId?: string;
  contentType?: 'post' | 'comment' | 'profile' | 'message';
  reportType: 'spam' | 'harassment' | 'hate_speech' | 'violence' | 'inappropriate_content' | 'fake_account' | 'copyright' | 'other';
  reason: string;
  evidence?: string[];
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'investigating' | 'resolved' | 'dismissed';
  createdAt?: Date;
  resolvedAt?: Date;
  resolvedBy?: string;
  resolution?: string;
}

export interface ReportStatistics {
  totalReports: number;
  pendingReports: number;
  resolvedReports: number;
  dismissedReports: number;
  averageResolutionTime: number;
  reportsByType: Record<string, number>;
  reportsByPriority: Record<string, number>;
}

@Injectable()
export class UserReportingService {
  private readonly logger = new Logger(UserReportingService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly analyticsService: AnalyticsService,
    private readonly notificationService: NotificationService,
  ) {}

  /**
   * Submit a user report
   */
  async submitReport(report: Omit<UserReport, 'id' | 'createdAt'>): Promise<UserReport> {
    try {
      // Validate report
      if (!this.validateReport(report)) {
        throw new Error('Invalid report data');
      }

      // Check for duplicate reports
      const existingReport = await this.findDuplicateReport(report);
      if (existingReport) {
        this.logger.warn(`Duplicate report detected: ${existingReport.id}`);
        return existingReport;
      }

      // Determine priority based on report type and content
      const priority = this.determinePriority(report);

      // Create report
      const createdReport = await this.databaseService.insert('user_reports', {
        reporter_id: report.reporterId,
        reported_user_id: report.reportedUserId,
        content_id: report.contentId,
        content_type: report.contentType,
        report_type: report.reportType,
        reason: report.reason,
        evidence: JSON.stringify(report.evidence || []),
        priority,
        status: 'pending',
        created_at: new Date(),
      });

      // Track analytics
      await this.analyticsService.track(report.reporterId, 'report_submitted', {
        report_id: createdReport.id,
        report_type: report.reportType,
        content_type: report.contentType,
        priority,
      });

      // Notify moderators for high/urgent priority reports
      if (priority === 'high' || priority === 'urgent') {
        await this.notifyModerators(createdReport);
      }

      // Auto-escalate certain report types
      await this.autoEscalateReport(createdReport);

      this.logger.log(`Report submitted: ${createdReport.id} (${report.reportType})`);

      return {
        id: createdReport.id,
        reporterId: report.reporterId,
        reportedUserId: report.reportedUserId,
        contentId: report.contentId,
        contentType: report.contentType,
        reportType: report.reportType,
        reason: report.reason,
        evidence: report.evidence,
        priority,
        status: 'pending',
        createdAt: createdReport.created_at,
      };
    } catch (error) {
      this.logger.error('Error submitting report:', error);
      throw error;
    }
  }

  /**
   * Get reports for moderation review
   */
  async getReportsForReview(
    filters: {
      status?: string;
      priority?: string;
      reportType?: string;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{ reports: UserReport[], totalCount: number }> {
    try {
      const {
        status = 'pending',
        priority,
        reportType,
        limit = 50,
        offset = 0,
      } = filters;

      let whereClause = 'WHERE r.status = $1';
      const params = [status];
      let paramIndex = 2;

      if (priority) {
        whereClause += ` AND r.priority = $${paramIndex}`;
        params.push(priority);
        paramIndex++;
      }

      if (reportType) {
        whereClause += ` AND r.report_type = $${paramIndex}`;
        params.push(reportType);
        paramIndex++;
      }

      const query = `
        SELECT 
          r.*,
          ru.display_name as reporter_name,
          ru.avatar_url as reporter_avatar,
          rpu.display_name as reported_user_name,
          rpu.avatar_url as reported_user_avatar,
          EXTRACT(EPOCH FROM (NOW() - r.created_at)) as seconds_ago
        FROM user_reports r
        JOIN users ru ON r.reporter_id = ru.id
        LEFT JOIN users rpu ON r.reported_user_id = rpu.id
        ${whereClause}
        ORDER BY 
          CASE r.priority 
            WHEN 'urgent' THEN 1 
            WHEN 'high' THEN 2 
            WHEN 'medium' THEN 3 
            WHEN 'low' THEN 4 
          END,
          r.created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      params.push(limit, offset);

      const reports = await this.databaseService.query(query, params);

      // Get total count
      const countQuery = `
        SELECT COUNT(*) as total
        FROM user_reports r
        ${whereClause}
      `;

      const countResult = await this.databaseService.query(countQuery, params.slice(0, -2));
      const totalCount = parseInt(countResult[0]?.total || '0');

      const formattedReports = reports.map(row => ({
        id: row.id,
        reporterId: row.reporter_id,
        reportedUserId: row.reported_user_id,
        contentId: row.content_id,
        contentType: row.content_type,
        reportType: row.report_type,
        reason: row.reason,
        evidence: row.evidence ? JSON.parse(row.evidence) : [],
        priority: row.priority,
        status: row.status,
        createdAt: new Date(row.created_at),
        resolvedAt: row.resolved_at ? new Date(row.resolved_at) : undefined,
        resolvedBy: row.resolved_by,
        resolution: row.resolution,
        reporter: {
          name: row.reporter_name,
          avatar: row.reporter_avatar,
        },
        reportedUser: row.reported_user_id ? {
          name: row.reported_user_name,
          avatar: row.reported_user_avatar,
        } : undefined,
        timeAgo: this.formatTimeAgo(row.seconds_ago),
      }));

      return { reports: formattedReports, totalCount };
    } catch (error) {
      this.logger.error('Error getting reports for review:', error);
      return { reports: [], totalCount: 0 };
    }
  }

  /**
   * Resolve a report
   */
  async resolveReport(
    reportId: string,
    moderatorId: string,
    resolution: string,
    action?: 'dismiss' | 'warn_user' | 'suspend_user' | 'ban_user' | 'remove_content'
  ): Promise<boolean> {
    try {
      // Update report status
      await this.databaseService.query(`
        UPDATE user_reports
        SET 
          status = 'resolved',
          resolved_at = NOW(),
          resolved_by = $2,
          resolution = $3
        WHERE id = $1
      `, [reportId, moderatorId, resolution]);

      // Execute action if specified
      if (action) {
        await this.executeReportAction(reportId, action, moderatorId);
      }

      // Get report details for analytics
      const reportDetails = await this.databaseService.query(`
        SELECT report_type, content_type, priority, reporter_id
        FROM user_reports
        WHERE id = $1
      `, [reportId]);

      if (reportDetails.length > 0) {
        const report = reportDetails[0];
        
        // Track analytics
        await this.analyticsService.track(moderatorId, 'report_resolved', {
          report_id: reportId,
          report_type: report.report_type,
          content_type: report.content_type,
          priority: report.priority,
          action,
          resolution,
        });

        // Notify reporter of resolution
        await this.notifyReporterOfResolution(report.reporter_id, reportId, resolution);
      }

      this.logger.log(`Report resolved: ${reportId} by ${moderatorId}`);
      return true;
    } catch (error) {
      this.logger.error('Error resolving report:', error);
      return false;
    }
  }

  /**
   * Get report statistics
   */
  async getReportStatistics(timeRange: string = '30d'): Promise<ReportStatistics> {
    try {
      const interval = timeRange === '24h' ? '24 hours' : 
                      timeRange === '7d' ? '7 days' : 
                      timeRange === '30d' ? '30 days' : '30 days';

      const query = `
        SELECT 
          COUNT(*) as total_reports,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_reports,
          COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved_reports,
          COUNT(CASE WHEN status = 'dismissed' THEN 1 END) as dismissed_reports,
          AVG(EXTRACT(EPOCH FROM (resolved_at - created_at))) as avg_resolution_time,
          
          -- Reports by type
          COUNT(CASE WHEN report_type = 'spam' THEN 1 END) as spam_reports,
          COUNT(CASE WHEN report_type = 'harassment' THEN 1 END) as harassment_reports,
          COUNT(CASE WHEN report_type = 'hate_speech' THEN 1 END) as hate_speech_reports,
          COUNT(CASE WHEN report_type = 'violence' THEN 1 END) as violence_reports,
          COUNT(CASE WHEN report_type = 'inappropriate_content' THEN 1 END) as inappropriate_reports,
          COUNT(CASE WHEN report_type = 'fake_account' THEN 1 END) as fake_account_reports,
          COUNT(CASE WHEN report_type = 'copyright' THEN 1 END) as copyright_reports,
          COUNT(CASE WHEN report_type = 'other' THEN 1 END) as other_reports,
          
          -- Reports by priority
          COUNT(CASE WHEN priority = 'low' THEN 1 END) as low_priority,
          COUNT(CASE WHEN priority = 'medium' THEN 1 END) as medium_priority,
          COUNT(CASE WHEN priority = 'high' THEN 1 END) as high_priority,
          COUNT(CASE WHEN priority = 'urgent' THEN 1 END) as urgent_priority
          
        FROM user_reports
        WHERE created_at >= NOW() - INTERVAL '${interval}'
      `;

      const result = await this.databaseService.query(query);
      const stats = result[0] || {};

      return {
        totalReports: parseInt(stats.total_reports || '0'),
        pendingReports: parseInt(stats.pending_reports || '0'),
        resolvedReports: parseInt(stats.resolved_reports || '0'),
        dismissedReports: parseInt(stats.dismissed_reports || '0'),
        averageResolutionTime: parseFloat(stats.avg_resolution_time || '0'),
        reportsByType: {
          spam: parseInt(stats.spam_reports || '0'),
          harassment: parseInt(stats.harassment_reports || '0'),
          hate_speech: parseInt(stats.hate_speech_reports || '0'),
          violence: parseInt(stats.violence_reports || '0'),
          inappropriate_content: parseInt(stats.inappropriate_reports || '0'),
          fake_account: parseInt(stats.fake_account_reports || '0'),
          copyright: parseInt(stats.copyright_reports || '0'),
          other: parseInt(stats.other_reports || '0'),
        },
        reportsByPriority: {
          low: parseInt(stats.low_priority || '0'),
          medium: parseInt(stats.medium_priority || '0'),
          high: parseInt(stats.high_priority || '0'),
          urgent: parseInt(stats.urgent_priority || '0'),
        },
      };
    } catch (error) {
      this.logger.error('Error getting report statistics:', error);
      return {
        totalReports: 0,
        pendingReports: 0,
        resolvedReports: 0,
        dismissedReports: 0,
        averageResolutionTime: 0,
        reportsByType: {},
        reportsByPriority: {},
      };
    }
  }

  /**
   * Private helper methods
   */
  private validateReport(report: Omit<UserReport, 'id' | 'createdAt'>): boolean {
    if (!report.reporterId || !report.reportType || !report.reason) {
      return false;
    }

    if (!report.reportedUserId && !report.contentId) {
      return false; // Must report either a user or content
    }

    const validReportTypes = [
      'spam', 'harassment', 'hate_speech', 'violence', 
      'inappropriate_content', 'fake_account', 'copyright', 'other'
    ];

    return validReportTypes.includes(report.reportType);
  }

  private async findDuplicateReport(report: Omit<UserReport, 'id' | 'createdAt'>): Promise<UserReport | null> {
    try {
      const query = `
        SELECT * FROM user_reports
        WHERE reporter_id = $1
          AND report_type = $2
          AND (
            (reported_user_id = $3 AND $3 IS NOT NULL) OR
            (content_id = $4 AND $4 IS NOT NULL)
          )
          AND created_at >= NOW() - INTERVAL '24 hours'
          AND status IN ('pending', 'investigating')
        LIMIT 1
      `;

      const result = await this.databaseService.query(query, [
        report.reporterId,
        report.reportType,
        report.reportedUserId,
        report.contentId,
      ]);

      return result.length > 0 ? result[0] : null;
    } catch (error) {
      this.logger.error('Error checking for duplicate reports:', error);
      return null;
    }
  }

  private determinePriority(report: Omit<UserReport, 'id' | 'createdAt'>): 'low' | 'medium' | 'high' | 'urgent' {
    // Urgent priority for violence and hate speech
    if (['violence', 'hate_speech'].includes(report.reportType)) {
      return 'urgent';
    }

    // High priority for harassment and inappropriate content
    if (['harassment', 'inappropriate_content'].includes(report.reportType)) {
      return 'high';
    }

    // Medium priority for spam and fake accounts
    if (['spam', 'fake_account'].includes(report.reportType)) {
      return 'medium';
    }

    // Low priority for copyright and other
    return 'low';
  }

  private async notifyModerators(report: UserReport): Promise<void> {
    // This would notify all moderators about high-priority reports
    this.logger.log(`High-priority report ${report.id} requires moderator attention`);
  }

  private async autoEscalateReport(report: UserReport): Promise<void> {
    // Auto-escalate certain types of reports for immediate action
    if (report.reportType === 'violence' || report.reportType === 'hate_speech') {
      await this.databaseService.query(`
        UPDATE user_reports
        SET status = 'investigating'
        WHERE id = $1
      `, [report.id]);
    }
  }

  private async executeReportAction(reportId: string, action: string, moderatorId: string): Promise<void> {
    // Get report details
    const reportDetails = await this.databaseService.query(`
      SELECT reported_user_id, content_id, content_type
      FROM user_reports
      WHERE id = $1
    `, [reportId]);

    if (reportDetails.length === 0) return;

    const { reported_user_id, content_id, content_type } = reportDetails[0];

    switch (action) {
      case 'warn_user':
        if (reported_user_id) {
          await this.warnUser(reported_user_id, moderatorId);
        }
        break;
      case 'suspend_user':
        if (reported_user_id) {
          await this.suspendUser(reported_user_id, moderatorId, '7d');
        }
        break;
      case 'ban_user':
        if (reported_user_id) {
          await this.banUser(reported_user_id, moderatorId);
        }
        break;
      case 'remove_content':
        if (content_id && content_type) {
          await this.removeContent(content_id, content_type, moderatorId);
        }
        break;
    }
  }

  private async warnUser(userId: string, moderatorId: string): Promise<void> {
    await this.notificationService.createNotification({
      userId,
      type: 'system',
      title: 'Community Guidelines Warning',
      message: 'Your recent activity has been reported and reviewed. Please ensure your content follows our community guidelines.',
      priority: 'high',
    });
  }

  private async suspendUser(userId: string, moderatorId: string, duration: string): Promise<void> {
    const suspendUntil = new Date();
    if (duration === '7d') suspendUntil.setDate(suspendUntil.getDate() + 7);

    await this.databaseService.query(`
      UPDATE user_profiles
      SET is_suspended = true, suspended_until = $2
      WHERE user_id = $1
    `, [userId, suspendUntil]);
  }

  private async banUser(userId: string, moderatorId: string): Promise<void> {
    await this.databaseService.query(`
      UPDATE user_profiles
      SET is_banned = true, banned_at = NOW()
      WHERE user_id = $1
    `, [userId]);
  }

  private async removeContent(contentId: string, contentType: string, moderatorId: string): Promise<void> {
    const table = contentType === 'post' ? 'posts' : 
                  contentType === 'comment' ? 'comments' : null;

    if (table) {
      await this.databaseService.query(`
        UPDATE ${table}
        SET is_removed = true, removed_by = $2, removed_at = NOW()
        WHERE id = $1
      `, [contentId, moderatorId]);
    }
  }

  private async notifyReporterOfResolution(reporterId: string, reportId: string, resolution: string): Promise<void> {
    await this.notificationService.createNotification({
      userId: reporterId,
      type: 'system',
      title: 'Report Update',
      message: `Your report has been reviewed and resolved. Thank you for helping keep our community safe.`,
      priority: 'normal',
      data: { reportId, resolution },
    });
  }

  private formatTimeAgo(seconds: number): string {
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  }
}
