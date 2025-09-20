/**
 * Auto-Moderation Service
 * Rule-based automatic moderation and enforcement
 */

import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { ModerationResult, ContentToModerate } from './moderation.service';

interface ModerationRule {
  id: string;
  name: string;
  type: 'content' | 'user' | 'behavior';
  condition: string;
  action: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  isActive: boolean;
  threshold?: number;
  timeWindow?: string;
}

interface UserBehaviorMetrics {
  postsLast24h: number;
  commentsLast24h: number;
  reportsReceived: number;
  accountAge: number;
  followersCount: number;
  engagementRate: number;
  suspiciousActivity: boolean;
}

@Injectable()
export class AutoModerationService {
  private readonly logger = new Logger(AutoModerationService.name);
  
  // Built-in moderation rules
  private readonly defaultRules: ModerationRule[] = [
    {
      id: 'spam_detection',
      name: 'Spam Content Detection',
      type: 'content',
      condition: 'contains_spam_patterns',
      action: 'hide_content',
      severity: 'medium',
      isActive: true,
      threshold: 0.7,
    },
    {
      id: 'excessive_posting',
      name: 'Excessive Posting Prevention',
      type: 'behavior',
      condition: 'posts_per_hour > 10',
      action: 'temporary_restriction',
      severity: 'medium',
      isActive: true,
      threshold: 10,
      timeWindow: '1h',
    },
    {
      id: 'new_user_restriction',
      name: 'New User Content Restriction',
      type: 'user',
      condition: 'account_age < 24h AND posts_count > 5',
      action: 'require_approval',
      severity: 'low',
      isActive: true,
      threshold: 5,
      timeWindow: '24h',
    },
    {
      id: 'multiple_reports',
      name: 'Multiple Reports Auto-Action',
      type: 'content',
      condition: 'reports_count >= 3',
      action: 'hide_content',
      severity: 'high',
      isActive: true,
      threshold: 3,
    },
    {
      id: 'suspicious_links',
      name: 'Suspicious Link Detection',
      type: 'content',
      condition: 'contains_suspicious_links',
      action: 'require_approval',
      severity: 'medium',
      isActive: true,
    },
    {
      id: 'duplicate_content',
      name: 'Duplicate Content Prevention',
      type: 'content',
      condition: 'similarity_score > 0.9',
      action: 'hide_content',
      severity: 'low',
      isActive: true,
      threshold: 0.9,
    },
  ];

  constructor(
    private readonly databaseService: DatabaseService,
  ) {}

  /**
   * Apply auto-moderation rules to content
   */
  async applyRules(content: ContentToModerate, currentResult: ModerationResult): Promise<Partial<ModerationResult>> {
    try {
      // Get user behavior metrics
      const userMetrics = await this.getUserBehaviorMetrics(content.userId);
      
      // Apply all active rules
      const ruleResults = await Promise.all(
        this.defaultRules
          .filter(rule => rule.isActive)
          .map(rule => this.applyRule(rule, content, userMetrics, currentResult))
      );
      
      // Combine rule results
      const combinedResult = this.combineRuleResults(ruleResults);
      
      // Log rule applications
      const appliedRules = ruleResults.filter(result => result.triggered).map(result => result.ruleName);
      if (appliedRules.length > 0) {
        this.logger.log(`Auto-moderation rules triggered for content ${content.id}: ${appliedRules.join(', ')}`);
      }
      
      return combinedResult;
    } catch (error) {
      this.logger.error('Error applying auto-moderation rules:', error);
      return {
        flags: ['auto_moderation_error'],
        reasons: ['Auto-moderation system error'],
      };
    }
  }

  /**
   * Apply a single moderation rule
   */
  private async applyRule(
    rule: ModerationRule,
    content: ContentToModerate,
    userMetrics: UserBehaviorMetrics,
    currentResult: ModerationResult
  ): Promise<any> {
    try {
      let triggered = false;
      const result = {
        ruleName: rule.name,
        triggered: false,
        flags: [] as string[],
        reasons: [] as string[],
        severity: rule.severity,
        autoActions: [] as string[],
      };

      switch (rule.condition) {
        case 'contains_spam_patterns':
          triggered = await this.checkSpamPatterns(content.content || '');
          break;
          
        case 'posts_per_hour > 10':
          triggered = userMetrics.postsLast24h > (rule.threshold || 10);
          break;
          
        case 'account_age < 24h AND posts_count > 5':
          triggered = userMetrics.accountAge < 24 && userMetrics.postsLast24h > (rule.threshold || 5);
          break;
          
        case 'reports_count >= 3':
          triggered = await this.checkReportsCount(content.id, rule.threshold || 3);
          break;
          
        case 'contains_suspicious_links':
          triggered = this.checkSuspiciousLinks(content.content || '');
          break;
          
        case 'similarity_score > 0.9':
          triggered = await this.checkDuplicateContent(content, rule.threshold || 0.9);
          break;
      }

      if (triggered) {
        result.triggered = true;
        result.flags.push(rule.id);
        result.reasons.push(`Auto-moderation rule triggered: ${rule.name}`);
        result.autoActions.push(rule.action);
      }

      return result;
    } catch (error) {
      this.logger.error(`Error applying rule ${rule.name}:`, error);
      return {
        ruleName: rule.name,
        triggered: false,
        flags: [],
        reasons: [],
        severity: 'low',
        autoActions: [],
      };
    }
  }

  /**
   * Get user behavior metrics
   */
  private async getUserBehaviorMetrics(userId: string): Promise<UserBehaviorMetrics> {
    try {
      const query = `
        SELECT 
          COUNT(CASE WHEN p.created_at >= NOW() - INTERVAL '24 hours' THEN 1 END) as posts_last_24h,
          COUNT(CASE WHEN c.created_at >= NOW() - INTERVAL '24 hours' THEN 1 END) as comments_last_24h,
          COALESCE(ur.reports_count, 0) as reports_received,
          EXTRACT(EPOCH FROM (NOW() - u.created_at)) / 3600 as account_age_hours,
          COALESCE(up.followers_count, 0) as followers_count,
          COALESCE(up.engagement_rate, 0) as engagement_rate
        FROM users u
        LEFT JOIN posts p ON u.id = p.user_id
        LEFT JOIN comments c ON u.id = c.user_id
        LEFT JOIN user_profiles up ON u.id = up.user_id
        LEFT JOIN (
          SELECT reported_user_id, COUNT(*) as reports_count
          FROM user_reports
          WHERE created_at >= NOW() - INTERVAL '30 days'
          GROUP BY reported_user_id
        ) ur ON u.id = ur.reported_user_id
        WHERE u.id = $1
        GROUP BY u.id, u.created_at, up.followers_count, up.engagement_rate, ur.reports_count
      `;

      const result = await this.databaseService.query(query, [userId]);
      const data = result[0] || {};

      return {
        postsLast24h: parseInt(data.posts_last_24h || '0'),
        commentsLast24h: parseInt(data.comments_last_24h || '0'),
        reportsReceived: parseInt(data.reports_received || '0'),
        accountAge: parseFloat(data.account_age_hours || '0'),
        followersCount: parseInt(data.followers_count || '0'),
        engagementRate: parseFloat(data.engagement_rate || '0'),
        suspiciousActivity: this.detectSuspiciousActivity(data),
      };
    } catch (error) {
      this.logger.error('Error getting user behavior metrics:', error);
      return {
        postsLast24h: 0,
        commentsLast24h: 0,
        reportsReceived: 0,
        accountAge: 0,
        followersCount: 0,
        engagementRate: 0,
        suspiciousActivity: false,
      };
    }
  }

  /**
   * Detect suspicious user activity patterns
   */
  private detectSuspiciousActivity(data: any): boolean {
    const postsLast24h = parseInt(data.posts_last_24h || '0');
    const commentsLast24h = parseInt(data.comments_last_24h || '0');
    const accountAge = parseFloat(data.account_age_hours || '0');
    const reportsReceived = parseInt(data.reports_received || '0');

    // New account with high activity
    if (accountAge < 24 && (postsLast24h + commentsLast24h) > 20) return true;
    
    // High report rate
    if (reportsReceived > 5) return true;
    
    // Excessive posting
    if (postsLast24h > 50 || commentsLast24h > 100) return true;
    
    return false;
  }

  /**
   * Check for spam patterns in content
   */
  private async checkSpamPatterns(content: string): Promise<boolean> {
    if (!content) return false;

    const spamPatterns = [
      // URL spam
      /(http[s]?:\/\/[^\s]+){3,}/gi,
      
      // Repeated characters
      /(.)\1{10,}/gi,
      
      // Common spam phrases
      /\b(buy now|click here|limited time|act now|free money|guaranteed|no risk)\b/gi,
      
      // Excessive capitalization
      /[A-Z]{20,}/g,
      
      // Excessive punctuation
      /[!?]{5,}/g,
      
      // Phone numbers and emails (potential spam)
      /\b\d{3}-\d{3}-\d{4}\b/g,
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    ];

    let spamScore = 0;
    for (const pattern of spamPatterns) {
      const matches = content.match(pattern);
      if (matches) {
        spamScore += matches.length;
      }
    }

    // Check for word repetition
    const words = content.toLowerCase().split(/\s+/);
    const wordCounts = new Map<string, number>();
    words.forEach(word => {
      wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
    });

    const maxWordCount = Math.max(...Array.from(wordCounts.values()));
    if (maxWordCount > words.length * 0.3) {
      spamScore += 2;
    }

    return spamScore >= 2;
  }

  /**
   * Check reports count for content
   */
  private async checkReportsCount(contentId: string, threshold: number): Promise<boolean> {
    try {
      const result = await this.databaseService.query(`
        SELECT COUNT(*) as report_count
        FROM user_reports
        WHERE content_id = $1
          AND status IN ('pending', 'investigating')
          AND created_at >= NOW() - INTERVAL '24 hours'
      `, [contentId]);

      const reportCount = parseInt(result[0]?.report_count || '0');
      return reportCount >= threshold;
    } catch (error) {
      this.logger.error('Error checking reports count:', error);
      return false;
    }
  }

  /**
   * Check for suspicious links
   */
  private checkSuspiciousLinks(content: string): boolean {
    if (!content) return false;

    const suspiciousPatterns = [
      // Shortened URLs
      /\b(bit\.ly|tinyurl|t\.co|goo\.gl|ow\.ly|short\.link)/gi,
      
      // Suspicious domains
      /\b(\.tk|\.ml|\.ga|\.cf)\b/gi,
      
      // IP addresses instead of domains
      /https?:\/\/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/gi,
      
      // Multiple redirects
      /redirect|forward|proxy/gi,
    ];

    return suspiciousPatterns.some(pattern => pattern.test(content));
  }

  /**
   * Check for duplicate content
   */
  private async checkDuplicateContent(content: ContentToModerate, threshold: number): Promise<boolean> {
    if (!content.content || content.content.length < 50) return false;

    try {
      // Simple duplicate detection based on exact matches
      const result = await this.databaseService.query(`
        SELECT COUNT(*) as duplicate_count
        FROM posts
        WHERE content = $1
          AND user_id != $2
          AND created_at >= NOW() - INTERVAL '7 days'
      `, [content.content, content.userId]);

      const duplicateCount = parseInt(result[0]?.duplicate_count || '0');
      return duplicateCount > 0;
    } catch (error) {
      this.logger.error('Error checking duplicate content:', error);
      return false;
    }
  }

  /**
   * Combine results from multiple rules
   */
  private combineRuleResults(ruleResults: any[]): Partial<ModerationResult> {
    const triggeredRules = ruleResults.filter(result => result.triggered);
    
    if (triggeredRules.length === 0) {
      return {
        flags: [],
        reasons: [],
        autoActions: [],
      };
    }

    const allFlags = triggeredRules.flatMap(result => result.flags);
    const allReasons = triggeredRules.flatMap(result => result.reasons);
    const allActions = triggeredRules.flatMap(result => result.autoActions);
    
    // Determine highest severity
    const severities = triggeredRules.map(result => result.severity);
    const severityOrder = { low: 1, medium: 2, high: 3, critical: 4 };
    const highestSeverity = severities.reduce((highest, current) => {
      return severityOrder[current] > severityOrder[highest] ? current : highest;
    }, 'low');

    // Determine if approval should be revoked
    const shouldReject = triggeredRules.some(result => 
      ['hide_content', 'require_approval'].includes(result.autoActions[0])
    );

    return {
      isApproved: !shouldReject,
      flags: [...new Set(allFlags)],
      reasons: [...new Set(allReasons)],
      severity: highestSeverity as any,
      requiresHumanReview: highestSeverity === 'high' || highestSeverity === 'critical',
      autoActions: [...new Set(allActions)],
      metadata: {
        triggeredRules: triggeredRules.map(result => result.ruleName),
        ruleCount: triggeredRules.length,
      },
    };
  }

  /**
   * Get active moderation rules
   */
  async getActiveRules(): Promise<ModerationRule[]> {
    return this.defaultRules.filter(rule => rule.isActive);
  }

  /**
   * Update rule status
   */
  async updateRuleStatus(ruleId: string, isActive: boolean): Promise<boolean> {
    try {
      const ruleIndex = this.defaultRules.findIndex(rule => rule.id === ruleId);
      if (ruleIndex !== -1) {
        this.defaultRules[ruleIndex].isActive = isActive;
        this.logger.log(`Rule ${ruleId} ${isActive ? 'activated' : 'deactivated'}`);
        return true;
      }
      return false;
    } catch (error) {
      this.logger.error('Error updating rule status:', error);
      return false;
    }
  }

  /**
   * Get auto-moderation statistics
   */
  async getAutoModerationStats(timeRange: string = '24h'): Promise<any> {
    try {
      const interval = timeRange === '24h' ? '24 hours' : 
                      timeRange === '7d' ? '7 days' : 
                      timeRange === '30d' ? '30 days' : '24 hours';

      const query = `
        SELECT 
          COUNT(*) as total_actions,
          COUNT(CASE WHEN auto_actions::text LIKE '%hide_content%' THEN 1 END) as hidden_content,
          COUNT(CASE WHEN auto_actions::text LIKE '%send_warning%' THEN 1 END) as warnings_sent,
          COUNT(CASE WHEN auto_actions::text LIKE '%require_approval%' THEN 1 END) as approval_required,
          COUNT(CASE WHEN flags::text LIKE '%spam%' THEN 1 END) as spam_detected,
          COUNT(CASE WHEN flags::text LIKE '%duplicate%' THEN 1 END) as duplicates_found
        FROM moderation_results
        WHERE created_at >= NOW() - INTERVAL '${interval}'
          AND auto_actions IS NOT NULL
          AND auto_actions != '[]'
      `;

      const result = await this.databaseService.query(query);
      return result[0] || {};
    } catch (error) {
      this.logger.error('Error getting auto-moderation stats:', error);
      return {};
    }
  }
}
