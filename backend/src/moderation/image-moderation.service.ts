/**
 * Image Moderation Service
 * AI-powered image content analysis and moderation
 */

import { Injectable, Logger } from '@nestjs/common';
import { ModerationResult } from './moderation.service';

interface ImageAnalysisResult {
  adult: number;
  violence: number;
  racy: number;
  medical: number;
  spoof: number;
  labels: string[];
  faces: number;
  text?: string;
  quality: number;
}

@Injectable()
export class ImageModerationService {
  private readonly logger = new Logger(ImageModerationService.name);

  constructor() {}

  /**
   * Moderate image content using AI analysis
   */
  async moderateImage(imageUrl: string): Promise<Partial<ModerationResult>> {
    try {
      if (!imageUrl || !this.isValidImageUrl(imageUrl)) {
        return {
          isApproved: false,
          confidence: 0.9,
          flags: ['invalid_image'],
          reasons: ['Invalid or inaccessible image URL'],
          severity: 'medium',
        };
      }

      // Perform comprehensive image analysis
      const analysis = await this.analyzeImage(imageUrl);
      
      // Calculate overall risk score
      const riskScore = this.calculateImageRiskScore(analysis);
      
      // Determine flags and reasons
      const { flags, reasons } = this.generateImageFlagsAndReasons(analysis);
      
      // Determine severity
      const severity = this.determineImageSeverity(riskScore, analysis);
      
      // Make approval decision
      const isApproved = this.makeImageApprovalDecision(riskScore, severity, analysis);
      
      // Calculate confidence
      const confidence = this.calculateImageConfidence(analysis, riskScore);
      
      // Determine if human review is needed
      const requiresHumanReview = this.requiresImageHumanReview(riskScore, confidence, severity);
      
      // Generate auto-actions
      const autoActions = this.generateImageAutoActions(severity, riskScore, analysis);

      return {
        isApproved,
        confidence,
        flags,
        reasons,
        severity,
        requiresHumanReview,
        autoActions,
        metadata: {
          imageAnalysis: analysis,
          riskScore,
          imageUrl,
        },
      };
    } catch (error) {
      this.logger.error('Error in image moderation:', error);
      return {
        isApproved: false,
        confidence: 0,
        flags: ['image_analysis_error'],
        reasons: ['Image analysis failed - requires manual review'],
        severity: 'high',
        requiresHumanReview: true,
      };
    }
  }

  /**
   * Analyze image for various risk factors
   */
  private async analyzeImage(imageUrl: string): Promise<ImageAnalysisResult> {
    // This would integrate with Google Vision API, AWS Rekognition, or similar
    // For now, we'll simulate the analysis
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Mock analysis results (in production, this would be real AI analysis)
      const mockAnalysis: ImageAnalysisResult = {
        adult: Math.random() * 0.3, // Usually low for legitimate content
        violence: Math.random() * 0.2,
        racy: Math.random() * 0.3,
        medical: Math.random() * 0.1,
        spoof: Math.random() * 0.1,
        labels: this.generateMockLabels(),
        faces: Math.floor(Math.random() * 5),
        text: Math.random() > 0.7 ? this.generateMockText() : undefined,
        quality: 0.7 + Math.random() * 0.3, // Quality score 0.7-1.0
      };

      // Adjust scores based on detected labels for more realistic simulation
      if (mockAnalysis.labels.includes('alcohol') || mockAnalysis.labels.includes('tobacco')) {
        mockAnalysis.adult = Math.max(mockAnalysis.adult, 0.4);
      }
      
      if (mockAnalysis.labels.includes('weapon') || mockAnalysis.labels.includes('blood')) {
        mockAnalysis.violence = Math.max(mockAnalysis.violence, 0.6);
      }

      return mockAnalysis;
    } catch (error) {
      this.logger.error('Error analyzing image:', error);
      throw error;
    }
  }

  /**
   * Validate image URL
   */
  private isValidImageUrl(url: string): boolean {
    try {
      const parsedUrl = new URL(url);
      const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
      const hasValidExtension = validExtensions.some(ext => 
        parsedUrl.pathname.toLowerCase().endsWith(ext)
      );
      
      return ['http:', 'https:'].includes(parsedUrl.protocol) && hasValidExtension;
    } catch {
      return false;
    }
  }

  /**
   * Generate mock labels for simulation
   */
  private generateMockLabels(): string[] {
    const possibleLabels = [
      'person', 'food', 'drink', 'cigar', 'tobacco', 'alcohol', 'wine', 'beer',
      'restaurant', 'bar', 'outdoor', 'indoor', 'table', 'glass', 'bottle',
      'hand', 'face', 'smile', 'celebration', 'party', 'social', 'friends',
      'weapon', 'blood', 'violence', 'explicit', 'nudity', 'inappropriate'
    ];
    
    const labelCount = Math.floor(Math.random() * 8) + 3; // 3-10 labels
    const selectedLabels = [];
    
    for (let i = 0; i < labelCount; i++) {
      const randomLabel = possibleLabels[Math.floor(Math.random() * possibleLabels.length)];
      if (!selectedLabels.includes(randomLabel)) {
        selectedLabels.push(randomLabel);
      }
    }
    
    return selectedLabels;
  }

  /**
   * Generate mock text for OCR simulation
   */
  private generateMockText(): string {
    const mockTexts = [
      'Enjoying a great cigar tonight!',
      'Best wine I\'ve ever tasted',
      'Craft beer paradise',
      'Premium tobacco experience',
      'Cheers to good friends',
      'Inappropriate text content', // This would trigger moderation
      'Buy now! Limited time offer!', // Spam-like content
    ];
    
    return mockTexts[Math.floor(Math.random() * mockTexts.length)];
  }

  /**
   * Calculate overall image risk score
   */
  private calculateImageRiskScore(analysis: ImageAnalysisResult): number {
    const weights = {
      adult: 0.4,
      violence: 0.3,
      racy: 0.2,
      medical: 0.1,
      spoof: 0.1,
    };
    
    let weightedScore = 0;
    let totalWeight = 0;
    
    for (const [key, weight] of Object.entries(weights)) {
      if (key in analysis) {
        weightedScore += analysis[key] * weight;
        totalWeight += weight;
      }
    }
    
    // Adjust for quality (low quality images are more suspicious)
    const qualityAdjustment = analysis.quality < 0.3 ? 0.2 : 0;
    
    // Adjust for suspicious labels
    const suspiciousLabels = ['weapon', 'blood', 'explicit', 'nudity', 'inappropriate'];
    const hasSuspiciousLabels = analysis.labels.some(label => 
      suspiciousLabels.includes(label.toLowerCase())
    );
    const labelAdjustment = hasSuspiciousLabels ? 0.3 : 0;
    
    // Adjust for detected text (if it contains inappropriate content)
    let textAdjustment = 0;
    if (analysis.text) {
      const inappropriateTextPatterns = [
        /buy now|click here|limited time/gi,
        /explicit|inappropriate|adult/gi,
      ];
      
      for (const pattern of inappropriateTextPatterns) {
        if (pattern.test(analysis.text)) {
          textAdjustment = 0.2;
          break;
        }
      }
    }
    
    const finalScore = Math.min(
      (weightedScore / totalWeight) + qualityAdjustment + labelAdjustment + textAdjustment,
      1.0
    );
    
    return finalScore;
  }

  /**
   * Generate flags and reasons based on image analysis
   */
  private generateImageFlagsAndReasons(analysis: ImageAnalysisResult): { flags: string[], reasons: string[] } {
    const flags: string[] = [];
    const reasons: string[] = [];
    
    if (analysis.adult > 0.5) {
      flags.push('adult_content');
      reasons.push('Image contains adult content');
    }
    
    if (analysis.violence > 0.4) {
      flags.push('violent_content');
      reasons.push('Image contains violent content');
    }
    
    if (analysis.racy > 0.6) {
      flags.push('racy_content');
      reasons.push('Image contains racy or suggestive content');
    }
    
    if (analysis.medical > 0.7) {
      flags.push('medical_content');
      reasons.push('Image contains medical content');
    }
    
    if (analysis.spoof > 0.5) {
      flags.push('spoof_content');
      reasons.push('Image appears to be spoofed or manipulated');
    }
    
    if (analysis.quality < 0.3) {
      flags.push('low_quality');
      reasons.push('Image quality is too low');
    }
    
    // Check for suspicious labels
    const suspiciousLabels = ['weapon', 'blood', 'explicit', 'nudity'];
    const foundSuspiciousLabels = analysis.labels.filter(label => 
      suspiciousLabels.includes(label.toLowerCase())
    );
    
    if (foundSuspiciousLabels.length > 0) {
      flags.push('suspicious_content');
      reasons.push(`Image contains suspicious elements: ${foundSuspiciousLabels.join(', ')}`);
    }
    
    // Check for inappropriate text in image
    if (analysis.text) {
      const inappropriatePatterns = [
        /buy now|click here|limited time/gi,
        /explicit|inappropriate|adult/gi,
        /fuck|shit|damn/gi,
      ];
      
      for (const pattern of inappropriatePatterns) {
        if (pattern.test(analysis.text)) {
          flags.push('inappropriate_text');
          reasons.push('Image contains inappropriate text');
          break;
        }
      }
    }
    
    return { flags, reasons };
  }

  /**
   * Determine image severity level
   */
  private determineImageSeverity(riskScore: number, analysis: ImageAnalysisResult): 'low' | 'medium' | 'high' | 'critical' {
    // Critical: High adult content or violence
    if (analysis.adult > 0.8 || analysis.violence > 0.7) {
      return 'critical';
    }
    
    // High: Significant inappropriate content
    if (riskScore > 0.6 || analysis.adult > 0.5 || analysis.violence > 0.4) {
      return 'high';
    }
    
    // Medium: Moderate risk factors
    if (riskScore > 0.3 || analysis.racy > 0.5) {
      return 'medium';
    }
    
    return 'low';
  }

  /**
   * Make image approval decision
   */
  private makeImageApprovalDecision(riskScore: number, severity: string, analysis: ImageAnalysisResult): boolean {
    // Auto-reject critical content
    if (severity === 'critical') return false;
    
    // Auto-reject high adult content
    if (analysis.adult > 0.7) return false;
    
    // Auto-reject high violence
    if (analysis.violence > 0.6) return false;
    
    // Auto-reject high overall risk
    if (riskScore > 0.7) return false;
    
    return true;
  }

  /**
   * Calculate image confidence score
   */
  private calculateImageConfidence(analysis: ImageAnalysisResult, riskScore: number): number {
    // Higher confidence for clear violations or clear approvals
    if (riskScore > 0.8 || riskScore < 0.1) {
      return 0.9;
    }
    
    // Higher confidence when multiple indicators agree
    const highRiskIndicators = [
      analysis.adult > 0.5,
      analysis.violence > 0.4,
      analysis.racy > 0.6,
    ].filter(Boolean).length;
    
    if (highRiskIndicators >= 2) {
      return 0.85;
    }
    
    // Medium confidence for moderate risk
    if (riskScore > 0.4 || riskScore < 0.3) {
      return 0.7;
    }
    
    // Lower confidence for borderline cases
    return 0.5;
  }

  /**
   * Determine if image human review is required
   */
  private requiresImageHumanReview(riskScore: number, confidence: number, severity: string): boolean {
    if (severity === 'critical') return true;
    if (severity === 'high' && confidence < 0.8) return true;
    if (riskScore > 0.4 && confidence < 0.6) return true;
    
    return false;
  }

  /**
   * Generate auto-actions for images
   */
  private generateImageAutoActions(severity: string, riskScore: number, analysis: ImageAnalysisResult): string[] {
    const actions: string[] = [];
    
    if (severity === 'critical') {
      actions.push('hide_content', 'flag_user', 'send_warning');
    } else if (severity === 'high') {
      actions.push('hide_content', 'send_warning');
    } else if (severity === 'medium' && riskScore > 0.5) {
      actions.push('send_warning');
    }
    
    // Special actions for specific violations
    if (analysis.adult > 0.6) {
      actions.push('adult_content_violation');
    }
    
    if (analysis.violence > 0.5) {
      actions.push('violence_violation');
    }
    
    return [...new Set(actions)]; // Remove duplicates
  }

  /**
   * Batch moderate multiple images
   */
  async bulkModerateImages(imageUrls: string[]): Promise<Map<string, Partial<ModerationResult>>> {
    const results = new Map<string, Partial<ModerationResult>>();
    const batchSize = 5; // Process 5 images at a time to avoid API limits

    for (let i = 0; i < imageUrls.length; i += batchSize) {
      const batch = imageUrls.slice(i, i + batchSize);
      const batchPromises = batch.map(url => 
        this.moderateImage(url).then(result => ({ url, result }))
      );

      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach(promiseResult => {
        if (promiseResult.status === 'fulfilled') {
          results.set(promiseResult.value.url, promiseResult.value.result);
        } else {
          this.logger.error('Batch image moderation error:', promiseResult.reason);
          results.set('unknown', {
            isApproved: false,
            confidence: 0,
            flags: ['batch_error'],
            reasons: ['Batch processing error'],
            severity: 'high',
            requiresHumanReview: true,
          });
        }
      });

      // Delay between batches to respect API rate limits
      if (i + batchSize < imageUrls.length) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    return results;
  }
}
