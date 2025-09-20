/**
 * Age Verification Service
 * Manages age verification process and compliance tracking
 */

import { Injectable, Logger, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { VeriffService, VeriffDecision } from './veriff.service';
import { CreateVerificationDto, VerificationStatusDto } from './dto/age-verification.dto';

export interface AgeVerificationRecord {
  id: string;
  userId: string;
  sessionId: string;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  verificationMethod: 'veriff' | 'manual';
  dateOfBirth?: string;
  age?: number;
  documentType?: string;
  documentNumber?: string;
  nationality?: string;
  verifiedAt?: string;
  expiresAt: string;
  attempts: number;
  maxAttempts: number;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class AgeVerificationService {
  private readonly logger = new Logger(AgeVerificationService.name);
  private readonly maxAttempts = 3;
  private readonly verificationValidityDays = 365; // 1 year

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly veriffService: VeriffService,
  ) {}

  /**
   * Start age verification process
   */
  async startVerification(userId: string, createVerificationDto: CreateVerificationDto) {
    try {
      // Check if user already has a valid verification
      const existingVerification = await this.getActiveVerification(userId);
      if (existingVerification && existingVerification.status === 'approved') {
        throw new ConflictException('User already has valid age verification');
      }

      // Check if user has exceeded maximum attempts
      const recentAttempts = await this.getRecentAttempts(userId);
      if (recentAttempts >= this.maxAttempts) {
        throw new BadRequestException('Maximum verification attempts exceeded');
      }

      // Create Veriff session
      const session = await this.veriffService.createSession(userId, createVerificationDto.callbackUrl);

      // Calculate expiration date
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + this.verificationValidityDays);

      // Create verification record
      const verificationRecord = {
        user_id: userId,
        session_id: session.verification.id,
        status: 'pending' as const,
        verification_method: 'veriff' as const,
        expires_at: expiresAt.toISOString(),
        attempts: recentAttempts + 1,
        max_attempts: this.maxAttempts,
        metadata: {
          veriffUrl: session.verification.url,
          vendorData: session.verification.vendorData,
          host: session.verification.host,
        },
      };

      const verification = await this.databaseService.create('age_verifications', verificationRecord);

      this.logger.log(`Started age verification for user ${userId}, session: ${session.verification.id}`);

      return {
        verificationId: verification.id,
        sessionId: session.verification.id,
        verificationUrl: session.verification.url,
        status: 'pending',
        expiresAt: expiresAt.toISOString(),
        attemptsRemaining: this.maxAttempts - (recentAttempts + 1),
      };

    } catch (error) {
      this.logger.error(`Failed to start verification for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Process verification webhook from Veriff
   */
  async processWebhook(payload: any, signature: string) {
    try {
      // Verify webhook signature
      const isValidSignature = this.veriffService.verifyWebhookSignature(
        JSON.stringify(payload),
        signature
      );

      if (!isValidSignature) {
        throw new BadRequestException('Invalid webhook signature');
      }

      const { verification } = payload;
      const sessionId = verification.id;

      // Find verification record
      const verificationRecord = await this.databaseService.client
        .from('age_verifications')
        .select('*')
        .eq('session_id', sessionId)
        .single();

      if (verificationRecord.error || !verificationRecord.data) {
        throw new NotFoundException(`Verification record not found for session ${sessionId}`);
      }

      // Get detailed decision from Veriff
      const decision = await this.veriffService.getDecision(sessionId);
      const validation = this.veriffService.validateDocument(decision);

      // Update verification record
      const updateData = {
        status: this.mapVeriffStatusToInternal(decision.verification.status),
        date_of_birth: validation.extractedData.dateOfBirth,
        age: validation.age,
        document_type: validation.extractedData.documentType,
        document_number: validation.extractedData.documentNumber,
        nationality: validation.extractedData.nationality,
        verified_at: validation.isValid ? new Date().toISOString() : null,
        metadata: {
          ...verificationRecord.data.metadata,
          veriffDecision: decision,
          validation,
          processedAt: new Date().toISOString(),
        },
      };

      await this.databaseService.update('age_verifications', verificationRecord.data.id, updateData);

      // Update user profile with verification status
      if (validation.isValid && validation.meetsRequirement) {
        await this.updateUserVerificationStatus(verificationRecord.data.user_id, true);
      }

      this.logger.log(`Processed verification webhook for session ${sessionId}: ${updateData.status}`);

      return {
        processed: true,
        sessionId,
        status: updateData.status,
        meetsAgeRequirement: validation.meetsRequirement,
      };

    } catch (error) {
      this.logger.error('Failed to process verification webhook:', error);
      throw error;
    }
  }

  /**
   * Get verification status for user
   */
  async getVerificationStatus(userId: string): Promise<VerificationStatusDto> {
    try {
      const verification = await this.getActiveVerification(userId);

      if (!verification) {
        return {
          isVerified: false,
          status: null,
          canStartVerification: true,
          attemptsRemaining: this.maxAttempts,
        };
      }

      const attemptsUsed = await this.getRecentAttempts(userId);
      const canStartVerification = verification.status !== 'approved' && attemptsUsed < this.maxAttempts;

      return {
        isVerified: verification.status === 'approved',
        status: verification.status,
        verificationId: verification.id,
        sessionId: verification.session_id,
        age: verification.age,
        verifiedAt: verification.verified_at,
        expiresAt: verification.expires_at,
        canStartVerification,
        attemptsRemaining: Math.max(0, this.maxAttempts - attemptsUsed),
        documentType: verification.document_type,
        nationality: verification.nationality,
      };

    } catch (error) {
      this.logger.error(`Failed to get verification status for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get verification history for user
   */
  async getVerificationHistory(userId: string) {
    try {
      const { data, error } = await this.databaseService.client
        .from('age_verifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data.map(record => ({
        id: record.id,
        sessionId: record.session_id,
        status: record.status,
        verificationMethod: record.verification_method,
        age: record.age,
        verifiedAt: record.verified_at,
        createdAt: record.created_at,
        attempts: record.attempts,
      }));

    } catch (error) {
      this.logger.error(`Failed to get verification history for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Check if user is age verified
   */
  async isUserAgeVerified(userId: string): Promise<boolean> {
    try {
      const verification = await this.getActiveVerification(userId);
      return verification?.status === 'approved' && new Date(verification.expires_at) > new Date();
    } catch (error) {
      this.logger.error(`Failed to check age verification for user ${userId}:`, error);
      return false;
    }
  }

  /**
   * Get active verification for user
   */
  private async getActiveVerification(userId: string) {
    const { data, error } = await this.databaseService.client
      .from('age_verifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw error;
    }

    return data;
  }

  /**
   * Get recent verification attempts count
   */
  private async getRecentAttempts(userId: string): Promise<number> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data, error } = await this.databaseService.client
      .from('age_verifications')
      .select('id')
      .eq('user_id', userId)
      .gte('created_at', thirtyDaysAgo.toISOString());

    if (error) {
      throw error;
    }

    return data?.length || 0;
  }

  /**
   * Update user profile verification status
   */
  private async updateUserVerificationStatus(userId: string, isVerified: boolean) {
    await this.databaseService.client
      .from('profiles')
      .update({
        is_age_verified: isVerified,
        age_verified_at: isVerified ? new Date().toISOString() : null,
      })
      .eq('user_id', userId);
  }

  /**
   * Map Veriff status to internal status
   */
  private mapVeriffStatusToInternal(veriffStatus: string): 'pending' | 'approved' | 'rejected' | 'expired' {
    switch (veriffStatus) {
      case 'approved':
        return 'approved';
      case 'declined':
        return 'rejected';
      case 'expired':
        return 'expired';
      case 'resubmission_requested':
        return 'rejected';
      default:
        return 'pending';
    }
  }
}
