/**
 * Text Moderation Service
 * AI-powered text content analysis and moderation
 */

import { Injectable, Logger } from '@nestjs/common';
import { ModerationResult } from './moderation.service';

interface TextAnalysisResult {
  toxicity: number;
  profanity: number;
  spam: number;
  hate: number;
  harassment: number;
  violence: number;
  sexual: number;
  drugs: number;
  gambling: number;
  personalInfo: number;
}

@Injectable()
export class TextModerationService {
  private readonly logger = new Logger(TextModerationService.name);
  
  // Profanity and inappropriate content filters
  private readonly profanityPatterns = [
    // Basic profanity (would be expanded with comprehensive list)
    /\b(fuck|shit|damn|bitch|asshole|bastard)\b/gi,
    /\b(cunt|whore|slut|faggot|nigger|retard)\b/gi,
  ];

  private readonly spamPatterns = [
    /\b(buy now|click here|limited time|act now|free money)\b/gi,
    /\b(viagra|cialis|casino|lottery|winner)\b/gi,
    /(http[s]?:\/\/[^\s]+){3,}/gi, // Multiple URLs
    /(.)\1{10,}/gi, // Repeated characters
  ];

  private readonly personalInfoPatterns = [
    /\b\d{3}-\d{2}-\d{4}\b/g, // SSN pattern
    /\b\d{3}-\d{3}-\d{4}\b/g, // Phone number
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, // Email
    /\b\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\b/g, // Credit card pattern
  ];

  private readonly hatePatterns = [
    /\b(kill yourself|kys|die|suicide)\b/gi,
    /\b(terrorist|nazi|hitler|genocide)\b/gi,
    /\b(racial slurs and hate terms would go here)\b/gi,
  ];

  private readonly violencePatterns = [
    /\b(murder|kill|bomb|shoot|stab|attack)\b/gi,
    /\b(weapon|gun|knife|explosive|violence)\b/gi,
  ];

  private readonly sexualPatterns = [
    /\b(porn|sex|nude|naked|explicit)\b/gi,
    /\b(sexual explicit terms would go here)\b/gi,
  ];

  private readonly drugPatterns = [
    /\b(cocaine|heroin|meth|weed|marijuana|drugs)\b/gi,
    /\b(dealer|selling|buying|high|stoned)\b/gi,
  ];

  private readonly gamblingPatterns = [
    /\b(bet|gambling|casino|poker|lottery)\b/gi,
    /\b(odds|wager|jackpot|slots)\b/gi,
  ];

  constructor() {}

  /**
   * Moderate text content using multiple analysis techniques
   */
  async moderateText(text: string): Promise<Partial<ModerationResult>> {
    try {
      if (!text || text.trim().length === 0) {
        return {
          isApproved: true,
          confidence: 1.0,
          flags: [],
          reasons: [],
          severity: 'low',
        };
      }

      // Perform comprehensive text analysis
      const analysis = await this.analyzeText(text);
      
      // Calculate overall risk score
      const riskScore = this.calculateRiskScore(analysis);
      
      // Determine flags and reasons
      const { flags, reasons } = this.generateFlagsAndReasons(analysis);
      
      // Determine severity
      const severity = this.determineSeverity(riskScore, analysis);
      
      // Make approval decision
      const isApproved = this.makeApprovalDecision(riskScore, severity);
      
      // Calculate confidence
      const confidence = this.calculateConfidence(analysis, riskScore);
      
      // Determine if human review is needed
      const requiresHumanReview = this.requiresHumanReview(riskScore, confidence, severity);
      
      // Generate auto-actions
      const autoActions = this.generateAutoActions(severity, riskScore);

      return {
        isApproved,
        confidence,
        flags,
        reasons,
        severity,
        requiresHumanReview,
        autoActions,
        metadata: {
          textAnalysis: analysis,
          riskScore,
          textLength: text.length,
        },
      };
    } catch (error) {
      this.logger.error('Error in text moderation:', error);
      return {
        isApproved: false,
        confidence: 0,
        flags: ['text_analysis_error'],
        reasons: ['Text analysis failed - requires manual review'],
        severity: 'high',
        requiresHumanReview: true,
      };
    }
  }

  /**
   * Analyze text for various risk factors
   */
  private async analyzeText(text: string): Promise<TextAnalysisResult> {
    const normalizedText = text.toLowerCase();
    
    return {
      toxicity: await this.analyzeToxicity(text),
      profanity: this.analyzeProfanity(normalizedText),
      spam: this.analyzeSpam(normalizedText),
      hate: this.analyzeHate(normalizedText),
      harassment: this.analyzeHarassment(normalizedText),
      violence: this.analyzeViolence(normalizedText),
      sexual: this.analyzeSexual(normalizedText),
      drugs: this.analyzeDrugs(normalizedText),
      gambling: this.analyzeGambling(normalizedText),
      personalInfo: this.analyzePersonalInfo(text), // Use original case for PII
    };
  }

  /**
   * Analyze toxicity using AI (placeholder for actual AI service)
   */
  private async analyzeToxicity(text: string): Promise<number> {
    // This would integrate with Google's Perspective API or similar
    // For now, we'll use a simple heuristic
    
    const toxicWords = ['hate', 'stupid', 'idiot', 'moron', 'loser'];
    const words = text.toLowerCase().split(/\s+/);
    const toxicCount = words.filter(word => toxicWords.includes(word)).length;
    
    return Math.min(toxicCount / words.length * 5, 1.0);
  }

  /**
   * Analyze profanity content
   */
  private analyzeProfanity(text: string): number {
    let score = 0;
    
    for (const pattern of this.profanityPatterns) {
      const matches = text.match(pattern);
      if (matches) {
        score += matches.length * 0.3;
      }
    }
    
    return Math.min(score, 1.0);
  }

  /**
   * Analyze spam indicators
   */
  private analyzeSpam(text: string): number {
    let score = 0;
    
    // Check spam patterns
    for (const pattern of this.spamPatterns) {
      const matches = text.match(pattern);
      if (matches) {
        score += matches.length * 0.2;
      }
    }
    
    // Check for excessive capitalization
    const capsRatio = (text.match(/[A-Z]/g) || []).length / text.length;
    if (capsRatio > 0.5) score += 0.3;
    
    // Check for excessive punctuation
    const punctRatio = (text.match(/[!?]{2,}/g) || []).length;
    if (punctRatio > 2) score += 0.2;
    
    return Math.min(score, 1.0);
  }

  /**
   * Analyze hate speech
   */
  private analyzeHate(text: string): number {
    let score = 0;
    
    for (const pattern of this.hatePatterns) {
      const matches = text.match(pattern);
      if (matches) {
        score += matches.length * 0.5;
      }
    }
    
    return Math.min(score, 1.0);
  }

  /**
   * Analyze harassment indicators
   */
  private analyzeHarassment(text: string): number {
    let score = 0;
    
    // Check for direct threats or harassment
    const harassmentWords = ['threaten', 'harass', 'stalk', 'follow', 'find you'];
    const words = text.split(/\s+/);
    
    for (const word of harassmentWords) {
      if (text.includes(word)) {
        score += 0.3;
      }
    }
    
    // Check for personal attacks
    const personalAttacks = ['you are', 'you\'re', 'your'];
    const negativeWords = ['stupid', 'ugly', 'worthless', 'pathetic'];
    
    for (const attack of personalAttacks) {
      for (const negative of negativeWords) {
        if (text.includes(attack) && text.includes(negative)) {
          score += 0.2;
        }
      }
    }
    
    return Math.min(score, 1.0);
  }

  /**
   * Analyze violence indicators
   */
  private analyzeViolence(text: string): number {
    let score = 0;
    
    for (const pattern of this.violencePatterns) {
      const matches = text.match(pattern);
      if (matches) {
        score += matches.length * 0.4;
      }
    }
    
    return Math.min(score, 1.0);
  }

  /**
   * Analyze sexual content
   */
  private analyzeSexual(text: string): number {
    let score = 0;
    
    for (const pattern of this.sexualPatterns) {
      const matches = text.match(pattern);
      if (matches) {
        score += matches.length * 0.3;
      }
    }
    
    return Math.min(score, 1.0);
  }

  /**
   * Analyze drug-related content
   */
  private analyzeDrugs(text: string): number {
    let score = 0;
    
    for (const pattern of this.drugPatterns) {
      const matches = text.match(pattern);
      if (matches) {
        score += matches.length * 0.3;
      }
    }
    
    return Math.min(score, 1.0);
  }

  /**
   * Analyze gambling content
   */
  private analyzeGambling(text: string): number {
    let score = 0;
    
    for (const pattern of this.gamblingPatterns) {
      const matches = text.match(pattern);
      if (matches) {
        score += matches.length * 0.2;
      }
    }
    
    return Math.min(score, 1.0);
  }

  /**
   * Analyze personal information exposure
   */
  private analyzePersonalInfo(text: string): number {
    let score = 0;
    
    for (const pattern of this.personalInfoPatterns) {
      const matches = text.match(pattern);
      if (matches) {
        score += matches.length * 0.5;
      }
    }
    
    return Math.min(score, 1.0);
  }

  /**
   * Calculate overall risk score
   */
  private calculateRiskScore(analysis: TextAnalysisResult): number {
    const weights = {
      toxicity: 0.2,
      profanity: 0.15,
      spam: 0.1,
      hate: 0.25,
      harassment: 0.2,
      violence: 0.3,
      sexual: 0.15,
      drugs: 0.1,
      gambling: 0.05,
      personalInfo: 0.2,
    };
    
    let weightedScore = 0;
    let totalWeight = 0;
    
    for (const [key, weight] of Object.entries(weights)) {
      weightedScore += analysis[key] * weight;
      totalWeight += weight;
    }
    
    return weightedScore / totalWeight;
  }

  /**
   * Generate flags and reasons based on analysis
   */
  private generateFlagsAndReasons(analysis: TextAnalysisResult): { flags: string[], reasons: string[] } {
    const flags: string[] = [];
    const reasons: string[] = [];
    
    if (analysis.toxicity > 0.3) {
      flags.push('toxic_content');
      reasons.push('Content contains toxic language');
    }
    
    if (analysis.profanity > 0.2) {
      flags.push('profanity');
      reasons.push('Content contains profanity');
    }
    
    if (analysis.spam > 0.4) {
      flags.push('spam');
      reasons.push('Content appears to be spam');
    }
    
    if (analysis.hate > 0.2) {
      flags.push('hate_speech');
      reasons.push('Content contains hate speech');
    }
    
    if (analysis.harassment > 0.3) {
      flags.push('harassment');
      reasons.push('Content contains harassment');
    }
    
    if (analysis.violence > 0.3) {
      flags.push('violence');
      reasons.push('Content contains violent language');
    }
    
    if (analysis.sexual > 0.3) {
      flags.push('sexual_content');
      reasons.push('Content contains sexual material');
    }
    
    if (analysis.drugs > 0.4) {
      flags.push('drug_content');
      reasons.push('Content references illegal drugs');
    }
    
    if (analysis.gambling > 0.5) {
      flags.push('gambling');
      reasons.push('Content promotes gambling');
    }
    
    if (analysis.personalInfo > 0.1) {
      flags.push('personal_info');
      reasons.push('Content contains personal information');
    }
    
    return { flags, reasons };
  }

  /**
   * Determine severity level
   */
  private determineSeverity(riskScore: number, analysis: TextAnalysisResult): 'low' | 'medium' | 'high' | 'critical' {
    // Critical: High violence, hate speech, or harassment
    if (analysis.violence > 0.5 || analysis.hate > 0.4 || analysis.harassment > 0.5) {
      return 'critical';
    }
    
    // High: Significant risk factors
    if (riskScore > 0.6 || analysis.personalInfo > 0.3) {
      return 'high';
    }
    
    // Medium: Moderate risk
    if (riskScore > 0.3) {
      return 'medium';
    }
    
    return 'low';
  }

  /**
   * Make approval decision
   */
  private makeApprovalDecision(riskScore: number, severity: string): boolean {
    if (severity === 'critical') return false;
    if (severity === 'high' && riskScore > 0.7) return false;
    if (riskScore > 0.8) return false;
    
    return true;
  }

  /**
   * Calculate confidence score
   */
  private calculateConfidence(analysis: TextAnalysisResult, riskScore: number): number {
    // Higher confidence for clear violations or clear approvals
    if (riskScore > 0.8 || riskScore < 0.1) {
      return 0.9;
    }
    
    // Medium confidence for moderate risk
    if (riskScore > 0.5 || riskScore < 0.3) {
      return 0.7;
    }
    
    // Lower confidence for borderline cases
    return 0.5;
  }

  /**
   * Determine if human review is required
   */
  private requiresHumanReview(riskScore: number, confidence: number, severity: string): boolean {
    if (severity === 'critical') return true;
    if (severity === 'high' && confidence < 0.8) return true;
    if (riskScore > 0.4 && confidence < 0.6) return true;
    
    return false;
  }

  /**
   * Generate auto-actions based on analysis
   */
  private generateAutoActions(severity: string, riskScore: number): string[] {
    const actions: string[] = [];
    
    if (severity === 'critical') {
      actions.push('hide_content', 'flag_user', 'send_warning');
    } else if (severity === 'high') {
      actions.push('hide_content', 'send_warning');
    } else if (severity === 'medium' && riskScore > 0.5) {
      actions.push('send_warning');
    }
    
    return actions;
  }
}
