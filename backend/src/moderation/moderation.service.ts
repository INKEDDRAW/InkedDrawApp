/**
 * Moderation Service
 * Main orchestrator for content moderation system
 */

import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { ContentAnalysisService } from './content-analysis.service';
import { ImageModerationService } from './image-moderation.service';
import { TextModerationService } from './text-moderation.service';
import { AutoModerationService } from './auto-moderation.service';

export interface ModerationResult {
  isApproved: boolean;
  confidence: number;
  flags: string[];
  reasons: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  requiresHumanReview: boolean;
  autoActions: string[];
  metadata?: any;
}

export interface ContentToModerate {
  id: string;
  type: 'post' | 'comment' | 'image' | 'profile' | 'message';
  content?: string;
  imageUrls?: string[];
  userId: string;
  metadata?: any;
}

@Injectable()
export class ModerationService {
  private readonly logger = new Logger(ModerationService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly analyticsService: AnalyticsService,
    private readonly contentAnalysisService: ContentAnalysisService,
    private readonly imageModerationService: ImageModerationService,
    private readonly textModerationService: TextModerationService,
    private readonly autoModerationService: AutoModerationService,
  ) {}

  /**
   * Moderate content using AI and rule-based systems
   */
  async moderateContent(content: ContentToModerate): Promise<ModerationResult> {
    try {
      const startTime = Date.now();
      
      // Initialize moderation result
      let result: ModerationResult = {
        isApproved: true,
        confidence: 1.0,
        flags: [],
        reasons: [],
        severity: 'low',
        requiresHumanReview: false,
        autoActions: [],
        metadata: {},
      };

      // Get user's moderation history
      const userHistory = await this.getUserModerationHistory(content.userId);
      
      // Apply user-based risk scoring
      const userRiskScore = this.calculateUserRiskScore(userHistory);
      result.metadata.userRiskScore = userRiskScore;

      // Text moderation (if content has text)
      if (content.content) {
        const textResult = await this.textModerationService.moderateText(content.content);
        result = this.combineResults(result, textResult);
      }

      // Image moderation (if content has images)
      if (content.imageUrls && content.imageUrls.length > 0) {
        for (const imageUrl of content.imageUrls) {
          const imageResult = await this.imageModerationService.moderateImage(imageUrl);
          result = this.combineResults(result, imageResult);
        }
      }

      // Content analysis (context and quality)
      const analysisResult = await this.contentAnalysisService.analyzeContent(content);
      result = this.combineResults(result, analysisResult);

      // Apply auto-moderation rules
      const autoResult = await this.autoModerationService.applyRules(content, result);
      result = this.combineResults(result, autoResult);

      // Adjust based on user risk score
      if (userRiskScore > 0.7) {
        result.requiresHumanReview = true;
        result.reasons.push('High-risk user profile');
      }

      // Final decision logic
      result = this.makeFinalDecision(result);

      // Store moderation result
      await this.storeModerationResult(content, result);

      // Execute auto-actions
      if (result.autoActions.length > 0) {
        await this.executeAutoActions(content, result.autoActions);
      }

      // Track analytics
      const processingTime = Date.now() - startTime;
      await this.analyticsService.track(content.userId, 'content_moderated', {
        content_type: content.type,
        content_id: content.id,
        is_approved: result.isApproved,
        confidence: result.confidence,
        flags: result.flags,
        severity: result.severity,
        processing_time: processingTime,
        requires_human_review: result.requiresHumanReview,
      });

      this.logger.log(`Content ${content.id} moderated: ${result.isApproved ? 'APPROVED' : 'REJECTED'} (${processingTime}ms)`);
      
      return result;
    } catch (error) {
      this.logger.error('Error moderating content:', error);
      
      // Fail-safe: require human review on error
      return {
        isApproved: false,
        confidence: 0,
        flags: ['moderation_error'],
        reasons: ['Moderation system error - requires manual review'],
        severity: 'high',
        requiresHumanReview: true,
        autoActions: [],
        metadata: { error: error.message },
      };
    }
  }

  /**
   * Bulk moderate multiple content items
   */
  async bulkModerateContent(contents: ContentToModerate[]): Promise<Map<string, ModerationResult>> {
    const results = new Map<string, ModerationResult>();
    const batchSize = 10;

    for (let i = 0; i < contents.length; i += batchSize) {
      const batch = contents.slice(i, i + batchSize);
      const batchPromises = batch.map(content => 
        this.moderateContent(content).then(result => ({ id: content.id, result }))
      );

      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach(promiseResult => {
        if (promiseResult.status === 'fulfilled') {
          results.set(promiseResult.value.id, promiseResult.value.result);
        } else {
          this.logger.error('Batch moderation error:', promiseResult.reason);
        }
      });

      // Small delay between batches to avoid overwhelming external APIs
      if (i + batchSize < contents.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return results;
  }

  /**
   * Get moderation status for content
   */
  async getModerationStatus(contentId: string, contentType: string): Promise<any> {
    try {
      const result = await this.databaseService.query(`
        SELECT 
          mr.*,
          EXTRACT(EPOCH FROM (NOW() - mr.created_at)) as seconds_ago
        FROM moderation_results mr
        WHERE mr.content_id = $1 AND mr.content_type = $2
        ORDER BY mr.created_at DESC
        LIMIT 1
      `, [contentId, contentType]);

      return result[0] || null;
    } catch (error) {
      this.logger.error('Error getting moderation status:', error);
      return null;
    }
  }

  /**
   * Appeal moderation decision
   */
  async appealModerationDecision(
    contentId: string,
    contentType: string,
    userId: string,
    reason: string
  ): Promise<boolean> {
    try {
      await this.databaseService.insert('moderation_appeals', {
        content_id: contentId,
        content_type: contentType,
        user_id: userId,
        appeal_reason: reason,
        status: 'pending',
        created_at: new Date(),
      });

      // Track appeal analytics
      await this.analyticsService.track(userId, 'moderation_appeal_submitted', {
        content_id: contentId,
        content_type: contentType,
        reason,
      });

      return true;
    } catch (error) {
      this.logger.error('Error submitting appeal:', error);
      return false;
    }
  }

  /**
   * Get moderation statistics
   */
  async getModerationStatistics(timeRange: string = '24h'): Promise<any> {
    try {
      const interval = timeRange === '24h' ? '24 hours' : 
                      timeRange === '7d' ? '7 days' : 
                      timeRange === '30d' ? '30 days' : '24 hours';

      const query = `
        SELECT 
          COUNT(*) as total_moderated,
          COUNT(CASE WHEN is_approved = true THEN 1 END) as approved_count,
          COUNT(CASE WHEN is_approved = false THEN 1 END) as rejected_count,
          COUNT(CASE WHEN requires_human_review = true THEN 1 END) as human_review_count,
          COUNT(CASE WHEN severity = 'critical' THEN 1 END) as critical_count,
          COUNT(CASE WHEN severity = 'high' THEN 1 END) as high_count,
          COUNT(CASE WHEN severity = 'medium' THEN 1 END) as medium_count,
          COUNT(CASE WHEN severity = 'low' THEN 1 END) as low_count,
          AVG(confidence) as avg_confidence,
          AVG(processing_time_ms) as avg_processing_time
        FROM moderation_results
        WHERE created_at >= NOW() - INTERVAL '${interval}'
      `;

      const result = await this.databaseService.query(query);
      return result[0] || {};
    } catch (error) {
      this.logger.error('Error getting moderation statistics:', error);
      return {};
    }
  }

  /**
   * Private helper methods
   */
  private async getUserModerationHistory(userId: string): Promise<any> {
    try {
      const result = await this.databaseService.query(`
        SELECT 
          COUNT(*) as total_content,
          COUNT(CASE WHEN is_approved = false THEN 1 END) as rejected_count,
          COUNT(CASE WHEN severity IN ('high', 'critical') THEN 1 END) as severe_violations,
          MAX(created_at) as last_violation
        FROM moderation_results
        WHERE user_id = $1
          AND created_at >= NOW() - INTERVAL '30 days'
      `, [userId]);

      return result[0] || { total_content: 0, rejected_count: 0, severe_violations: 0 };
    } catch (error) {
      this.logger.error('Error getting user moderation history:', error);
      return { total_content: 0, rejected_count: 0, severe_violations: 0 };
    }
  }

  private calculateUserRiskScore(history: any): number {
    const { total_content, rejected_count, severe_violations } = history;
    
    if (total_content === 0) return 0.1; // New users get low risk
    
    const rejectionRate = rejected_count / total_content;
    const severeViolationRate = severe_violations / total_content;
    
    // Risk score calculation (0-1 scale)
    const riskScore = Math.min(
      (rejectionRate * 0.6) + (severeViolationRate * 0.4),
      1.0
    );
    
    return riskScore;
  }

  private combineResults(current: ModerationResult, additional: Partial<ModerationResult>): ModerationResult {
    return {
      isApproved: current.isApproved && (additional.isApproved !== false),
      confidence: Math.min(current.confidence, additional.confidence || 1.0),
      flags: [...current.flags, ...(additional.flags || [])],
      reasons: [...current.reasons, ...(additional.reasons || [])],
      severity: this.getHighestSeverity(current.severity, additional.severity || 'low'),
      requiresHumanReview: current.requiresHumanReview || additional.requiresHumanReview || false,
      autoActions: [...current.autoActions, ...(additional.autoActions || [])],
      metadata: { ...current.metadata, ...additional.metadata },
    };
  }

  private getHighestSeverity(current: string, additional: string): 'low' | 'medium' | 'high' | 'critical' {
    const severityOrder = { low: 1, medium: 2, high: 3, critical: 4 };
    const currentLevel = severityOrder[current] || 1;
    const additionalLevel = severityOrder[additional] || 1;
    
    const highestLevel = Math.max(currentLevel, additionalLevel);
    return Object.keys(severityOrder).find(key => severityOrder[key] === highestLevel) as any;
  }

  private makeFinalDecision(result: ModerationResult): ModerationResult {
    // Auto-reject critical content
    if (result.severity === 'critical') {
      result.isApproved = false;
      result.requiresHumanReview = true;
    }
    
    // Auto-reject high severity with low confidence
    if (result.severity === 'high' && result.confidence < 0.7) {
      result.isApproved = false;
      result.requiresHumanReview = true;
    }
    
    // Require human review for medium severity with low confidence
    if (result.severity === 'medium' && result.confidence < 0.8) {
      result.requiresHumanReview = true;
    }
    
    return result;
  }

  private async storeModerationResult(content: ContentToModerate, result: ModerationResult): Promise<void> {
    try {
      await this.databaseService.insert('moderation_results', {
        content_id: content.id,
        content_type: content.type,
        user_id: content.userId,
        is_approved: result.isApproved,
        confidence: result.confidence,
        flags: JSON.stringify(result.flags),
        reasons: JSON.stringify(result.reasons),
        severity: result.severity,
        requires_human_review: result.requiresHumanReview,
        auto_actions: JSON.stringify(result.autoActions),
        metadata: JSON.stringify(result.metadata),
        created_at: new Date(),
      });
    } catch (error) {
      this.logger.error('Error storing moderation result:', error);
    }
  }

  private async executeAutoActions(content: ContentToModerate, actions: string[]): Promise<void> {
    for (const action of actions) {
      try {
        switch (action) {
          case 'hide_content':
            await this.hideContent(content.id, content.type);
            break;
          case 'flag_user':
            await this.flagUser(content.userId);
            break;
          case 'send_warning':
            await this.sendWarningToUser(content.userId, content.type);
            break;
          case 'temporary_ban':
            await this.temporaryBanUser(content.userId, '24h');
            break;
          default:
            this.logger.warn(`Unknown auto-action: ${action}`);
        }
      } catch (error) {
        this.logger.error(`Error executing auto-action ${action}:`, error);
      }
    }
  }

  private async hideContent(contentId: string, contentType: string): Promise<void> {
    const table = contentType === 'post' ? 'posts' : 
                  contentType === 'comment' ? 'comments' : null;
    
    if (table) {
      await this.databaseService.query(`
        UPDATE ${table} 
        SET is_hidden = true, hidden_reason = 'Auto-moderated'
        WHERE id = $1
      `, [contentId]);
    }
  }

  private async flagUser(userId: string): Promise<void> {
    await this.databaseService.query(`
      UPDATE user_profiles 
      SET moderation_flags = COALESCE(moderation_flags, 0) + 1
      WHERE user_id = $1
    `, [userId]);
  }

  private async sendWarningToUser(userId: string, contentType: string): Promise<void> {
    // This would integrate with the notification system
    this.logger.log(`Warning sent to user ${userId} for ${contentType} violation`);
  }

  private async temporaryBanUser(userId: string, duration: string): Promise<void> {
    const banUntil = new Date();
    if (duration === '24h') banUntil.setHours(banUntil.getHours() + 24);
    else if (duration === '7d') banUntil.setDate(banUntil.getDate() + 7);
    
    await this.databaseService.query(`
      UPDATE user_profiles 
      SET is_banned = true, ban_until = $2
      WHERE user_id = $1
    `, [userId, banUntil]);
  }
}
