/**
 * Content Analysis Service
 * Advanced content quality and context analysis
 */

import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { ModerationResult, ContentToModerate } from './moderation.service';

interface ContentQualityMetrics {
  readability: number;
  coherence: number;
  relevance: number;
  originality: number;
  engagement: number;
  length: number;
  structure: number;
}

@Injectable()
export class ContentAnalysisService {
  private readonly logger = new Logger(ContentAnalysisService.name);

  constructor(
    private readonly databaseService: DatabaseService,
  ) {}

  /**
   * Analyze content for quality, context, and appropriateness
   */
  async analyzeContent(content: ContentToModerate): Promise<Partial<ModerationResult>> {
    try {
      // Analyze content quality
      const qualityMetrics = await this.analyzeContentQuality(content);
      
      // Analyze context and relevance
      const contextAnalysis = await this.analyzeContext(content);
      
      // Check for duplicate or plagiarized content
      const originalityCheck = await this.checkOriginality(content);
      
      // Analyze user behavior patterns
      const behaviorAnalysis = await this.analyzeUserBehavior(content.userId);
      
      // Calculate overall content score
      const contentScore = this.calculateContentScore(qualityMetrics, contextAnalysis, originalityCheck);
      
      // Determine flags and reasons
      const { flags, reasons } = this.generateContentFlags(qualityMetrics, contextAnalysis, originalityCheck);
      
      // Determine severity
      const severity = this.determineContentSeverity(contentScore, qualityMetrics);
      
      // Make approval decision
      const isApproved = this.makeContentApprovalDecision(contentScore, severity);
      
      // Calculate confidence
      const confidence = this.calculateContentConfidence(qualityMetrics, contextAnalysis);
      
      return {
        isApproved,
        confidence,
        flags,
        reasons,
        severity,
        requiresHumanReview: contentScore < 0.3 || !originalityCheck.isOriginal,
        autoActions: this.generateContentAutoActions(contentScore, originalityCheck),
        metadata: {
          qualityMetrics,
          contextAnalysis,
          originalityCheck,
          behaviorAnalysis,
          contentScore,
        },
      };
    } catch (error) {
      this.logger.error('Error in content analysis:', error);
      return {
        isApproved: true, // Default to approved for analysis errors
        confidence: 0.5,
        flags: ['analysis_error'],
        reasons: ['Content analysis failed'],
        severity: 'low',
      };
    }
  }

  /**
   * Analyze content quality metrics
   */
  private async analyzeContentQuality(content: ContentToModerate): Promise<ContentQualityMetrics> {
    const text = content.content || '';
    
    return {
      readability: this.calculateReadability(text),
      coherence: this.calculateCoherence(text),
      relevance: await this.calculateRelevance(content),
      originality: await this.calculateOriginality(text),
      engagement: this.calculateEngagementPotential(text),
      length: this.calculateLengthScore(text),
      structure: this.calculateStructureScore(text),
    };
  }

  /**
   * Calculate readability score
   */
  private calculateReadability(text: string): number {
    if (!text || text.length === 0) return 0;
    
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const syllables = words.reduce((count, word) => count + this.countSyllables(word), 0);
    
    if (sentences.length === 0 || words.length === 0) return 0;
    
    // Simplified Flesch Reading Ease formula
    const avgWordsPerSentence = words.length / sentences.length;
    const avgSyllablesPerWord = syllables / words.length;
    
    const fleschScore = 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord);
    
    // Normalize to 0-1 scale (higher is better)
    return Math.max(0, Math.min(1, fleschScore / 100));
  }

  /**
   * Count syllables in a word (simplified)
   */
  private countSyllables(word: string): number {
    word = word.toLowerCase();
    if (word.length <= 3) return 1;
    
    const vowels = 'aeiouy';
    let count = 0;
    let previousWasVowel = false;
    
    for (let i = 0; i < word.length; i++) {
      const isVowel = vowels.includes(word[i]);
      if (isVowel && !previousWasVowel) {
        count++;
      }
      previousWasVowel = isVowel;
    }
    
    // Adjust for silent 'e'
    if (word.endsWith('e')) count--;
    
    return Math.max(1, count);
  }

  /**
   * Calculate coherence score
   */
  private calculateCoherence(text: string): number {
    if (!text || text.length === 0) return 0;
    
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    if (sentences.length < 2) return 1; // Single sentence is coherent
    
    let coherenceScore = 0;
    const words = text.toLowerCase().split(/\s+/);
    const wordFreq = new Map<string, number>();
    
    // Calculate word frequency
    words.forEach(word => {
      wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
    });
    
    // Check for repeated key terms (indicates coherence)
    const repeatedWords = Array.from(wordFreq.entries())
      .filter(([word, freq]) => freq > 1 && word.length > 3)
      .length;
    
    coherenceScore = Math.min(1, repeatedWords / (sentences.length * 0.5));
    
    return coherenceScore;
  }

  /**
   * Calculate relevance to platform context
   */
  private async calculateRelevance(content: ContentToModerate): Promise<number> {
    const text = content.content || '';
    
    // Keywords relevant to cigars, beer, wine, and social aspects
    const relevantKeywords = [
      // Cigars
      'cigar', 'tobacco', 'smoke', 'flavor', 'aroma', 'wrapper', 'filler', 'binder',
      'humidor', 'cutter', 'lighter', 'ash', 'draw', 'burn', 'ring gauge',
      
      // Beer
      'beer', 'brew', 'hops', 'malt', 'yeast', 'ale', 'lager', 'stout', 'ipa',
      'brewery', 'craft', 'bottle', 'draft', 'foam', 'bitter', 'sweet',
      
      // Wine
      'wine', 'grape', 'vintage', 'tannin', 'bouquet', 'cork', 'cellar',
      'red', 'white', 'rosé', 'champagne', 'vineyard', 'sommelier',
      
      // Social/Review terms
      'taste', 'review', 'rating', 'recommend', 'experience', 'quality',
      'enjoy', 'share', 'collection', 'pairing', 'occasion',
    ];
    
    const words = text.toLowerCase().split(/\s+/);
    const relevantWordCount = words.filter(word => 
      relevantKeywords.some(keyword => word.includes(keyword))
    ).length;
    
    const relevanceScore = Math.min(1, relevantWordCount / Math.max(1, words.length * 0.1));
    
    return relevanceScore;
  }

  /**
   * Calculate originality score
   */
  private async calculateOriginality(text: string): Promise<number> {
    if (!text || text.length < 10) return 1; // Short text is considered original
    
    try {
      // Check for common phrases that might indicate copy-paste
      const commonPhrases = [
        'copy and paste',
        'lorem ipsum',
        'click here',
        'buy now',
        'limited time',
        'act now',
      ];
      
      const hasCommonPhrases = commonPhrases.some(phrase => 
        text.toLowerCase().includes(phrase)
      );
      
      if (hasCommonPhrases) return 0.2;
      
      // Check for excessive repetition
      const words = text.split(/\s+/);
      const uniqueWords = new Set(words.map(w => w.toLowerCase()));
      const uniquenessRatio = uniqueWords.size / words.length;
      
      return Math.max(0.3, uniquenessRatio);
    } catch (error) {
      this.logger.error('Error calculating originality:', error);
      return 0.8; // Default to high originality on error
    }
  }

  /**
   * Calculate engagement potential
   */
  private calculateEngagementPotential(text: string): number {
    if (!text || text.length === 0) return 0;
    
    let score = 0;
    
    // Questions increase engagement
    const questionCount = (text.match(/\?/g) || []).length;
    score += Math.min(0.3, questionCount * 0.1);
    
    // Exclamation points (but not too many)
    const exclamationCount = (text.match(/!/g) || []).length;
    score += Math.min(0.2, exclamationCount * 0.05);
    
    // Call-to-action words
    const ctaWords = ['what', 'how', 'why', 'share', 'think', 'opinion', 'recommend'];
    const ctaCount = ctaWords.filter(word => 
      text.toLowerCase().includes(word)
    ).length;
    score += Math.min(0.3, ctaCount * 0.05);
    
    // Personal pronouns (indicates personal experience)
    const personalPronouns = ['i', 'my', 'me', 'we', 'our', 'us'];
    const personalCount = personalPronouns.filter(pronoun => 
      text.toLowerCase().split(/\s+/).includes(pronoun)
    ).length;
    score += Math.min(0.2, personalCount * 0.03);
    
    return Math.min(1, score);
  }

  /**
   * Calculate length score
   */
  private calculateLengthScore(text: string): number {
    const length = text.length;
    
    // Optimal length is between 50-500 characters
    if (length < 10) return 0.2; // Too short
    if (length < 50) return 0.6;
    if (length <= 500) return 1.0; // Optimal
    if (length <= 1000) return 0.8;
    if (length <= 2000) return 0.6;
    return 0.3; // Too long
  }

  /**
   * Calculate structure score
   */
  private calculateStructureScore(text: string): number {
    if (!text || text.length === 0) return 0;
    
    let score = 0;
    
    // Proper capitalization
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const properlyCapitalized = sentences.filter(sentence => {
      const trimmed = sentence.trim();
      return trimmed.length > 0 && /^[A-Z]/.test(trimmed);
    }).length;
    
    if (sentences.length > 0) {
      score += (properlyCapitalized / sentences.length) * 0.3;
    }
    
    // Paragraph breaks (for longer text)
    if (text.length > 200) {
      const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
      if (paragraphs.length > 1) {
        score += 0.2;
      }
    }
    
    // Punctuation usage
    const hasPunctuation = /[.!?]/.test(text);
    if (hasPunctuation) score += 0.3;
    
    // Not all caps
    const capsRatio = (text.match(/[A-Z]/g) || []).length / text.length;
    if (capsRatio < 0.5) score += 0.2;
    
    return Math.min(1, score);
  }

  /**
   * Analyze context and platform appropriateness
   */
  private async analyzeContext(content: ContentToModerate): Promise<any> {
    return {
      isOnTopic: await this.calculateRelevance(content) > 0.3,
      hasProductMention: this.hasProductMention(content.content || ''),
      isPersonalExperience: this.isPersonalExperience(content.content || ''),
      isCommercial: this.isCommercialContent(content.content || ''),
    };
  }

  /**
   * Check if content mentions relevant products
   */
  private hasProductMention(text: string): boolean {
    const productKeywords = [
      'cigar', 'tobacco', 'beer', 'wine', 'whiskey', 'bourbon',
      'brand', 'vintage', 'brewery', 'distillery', 'vineyard'
    ];
    
    return productKeywords.some(keyword => 
      text.toLowerCase().includes(keyword)
    );
  }

  /**
   * Check if content is personal experience
   */
  private isPersonalExperience(text: string): boolean {
    const personalIndicators = [
      'i tried', 'i tasted', 'my experience', 'i enjoyed',
      'i recommend', 'i think', 'in my opinion'
    ];
    
    return personalIndicators.some(indicator => 
      text.toLowerCase().includes(indicator)
    );
  }

  /**
   * Check if content is commercial
   */
  private isCommercialContent(text: string): boolean {
    const commercialKeywords = [
      'buy', 'sell', 'price', 'discount', 'sale', 'offer',
      'deal', 'cheap', 'expensive', 'cost', 'purchase'
    ];
    
    const commercialCount = commercialKeywords.filter(keyword => 
      text.toLowerCase().includes(keyword)
    ).length;
    
    return commercialCount >= 2;
  }

  /**
   * Check content originality
   */
  private async checkOriginality(content: ContentToModerate): Promise<any> {
    const text = content.content || '';
    
    return {
      isOriginal: await this.calculateOriginality(text) > 0.7,
      duplicateScore: 1 - await this.calculateOriginality(text),
      hasCommonPhrases: this.hasCommonSpamPhrases(text),
    };
  }

  /**
   * Check for common spam phrases
   */
  private hasCommonSpamPhrases(text: string): boolean {
    const spamPhrases = [
      'click here', 'buy now', 'limited time', 'act now',
      'free money', 'guaranteed', 'no risk', 'amazing deal'
    ];
    
    return spamPhrases.some(phrase => 
      text.toLowerCase().includes(phrase)
    );
  }

  /**
   * Analyze user behavior patterns
   */
  private async analyzeUserBehavior(userId: string): Promise<any> {
    try {
      const result = await this.databaseService.query(`
        SELECT 
          COUNT(*) as total_posts,
          AVG(LENGTH(content)) as avg_content_length,
          COUNT(CASE WHEN created_at >= NOW() - INTERVAL '1 hour' THEN 1 END) as recent_posts
        FROM posts
        WHERE user_id = $1
          AND created_at >= NOW() - INTERVAL '24 hours'
      `, [userId]);

      const stats = result[0] || {};
      
      return {
        isFrequentPoster: parseInt(stats.total_posts || '0') > 10,
        avgContentLength: parseFloat(stats.avg_content_length || '0'),
        recentActivity: parseInt(stats.recent_posts || '0'),
        suspiciousActivity: parseInt(stats.recent_posts || '0') > 5, // More than 5 posts in 1 hour
      };
    } catch (error) {
      this.logger.error('Error analyzing user behavior:', error);
      return {
        isFrequentPoster: false,
        avgContentLength: 0,
        recentActivity: 0,
        suspiciousActivity: false,
      };
    }
  }

  /**
   * Calculate overall content score
   */
  private calculateContentScore(
    quality: ContentQualityMetrics,
    context: any,
    originality: any
  ): number {
    const weights = {
      readability: 0.15,
      coherence: 0.15,
      relevance: 0.20,
      originality: 0.20,
      engagement: 0.10,
      length: 0.10,
      structure: 0.10,
    };
    
    let score = 0;
    for (const [metric, weight] of Object.entries(weights)) {
      score += quality[metric] * weight;
    }
    
    // Adjust for context
    if (!context.isOnTopic) score *= 0.7;
    if (context.isCommercial) score *= 0.8;
    if (!originality.isOriginal) score *= 0.5;
    
    return Math.max(0, Math.min(1, score));
  }

  /**
   * Generate content-specific flags
   */
  private generateContentFlags(quality: ContentQualityMetrics, context: any, originality: any): { flags: string[], reasons: string[] } {
    const flags: string[] = [];
    const reasons: string[] = [];
    
    if (quality.readability < 0.3) {
      flags.push('poor_readability');
      reasons.push('Content is difficult to read');
    }
    
    if (quality.relevance < 0.2) {
      flags.push('off_topic');
      reasons.push('Content is not relevant to the platform');
    }
    
    if (!originality.isOriginal) {
      flags.push('duplicate_content');
      reasons.push('Content appears to be copied or duplicated');
    }
    
    if (context.isCommercial) {
      flags.push('commercial_content');
      reasons.push('Content appears to be commercial or promotional');
    }
    
    if (quality.length < 0.3) {
      flags.push('low_quality');
      reasons.push('Content quality is below standards');
    }
    
    return { flags, reasons };
  }

  /**
   * Determine content severity
   */
  private determineContentSeverity(score: number, quality: ContentQualityMetrics): 'low' | 'medium' | 'high' | 'critical' {
    if (score < 0.2 || quality.originality < 0.3) return 'high';
    if (score < 0.4 || quality.relevance < 0.2) return 'medium';
    return 'low';
  }

  /**
   * Make content approval decision
   */
  private makeContentApprovalDecision(score: number, severity: string): boolean {
    if (severity === 'critical' || severity === 'high') return false;
    if (score < 0.3) return false;
    return true;
  }

  /**
   * Calculate content confidence
   */
  private calculateContentConfidence(quality: ContentQualityMetrics, context: any): number {
    const avgQuality = Object.values(quality).reduce((sum, val) => sum + val, 0) / Object.keys(quality).length;
    
    if (avgQuality > 0.8 || avgQuality < 0.2) return 0.9;
    if (avgQuality > 0.6 || avgQuality < 0.4) return 0.7;
    return 0.5;
  }

  /**
   * Generate content auto-actions
   */
  private generateContentAutoActions(score: number, originality: any): string[] {
    const actions: string[] = [];
    
    if (score < 0.2) {
      actions.push('hide_content', 'send_warning');
    } else if (!originality.isOriginal) {
      actions.push('flag_duplicate');
    } else if (score < 0.4) {
      actions.push('reduce_visibility');
    }
    
    return actions;
  }
}
