/**
 * Veriff Service
 * Integration with Veriff identity verification API
 */

import { Injectable, Logger, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import * as crypto from 'crypto';

export interface VeriffSession {
  status: string;
  verification: {
    id: string;
    url: string;
    vendorData: string;
    host: string;
  };
}

export interface VeriffDecision {
  verification: {
    id: string;
    code: number;
    person: {
      firstName: string;
      lastName: string;
      dateOfBirth: string;
      nationality: string;
      idNumber: string;
    };
    document: {
      number: string;
      type: string;
      country: string;
    };
    status: 'approved' | 'declined' | 'resubmission_requested' | 'expired';
    decisionTime: string;
    acceptanceTime: string;
  };
}

@Injectable()
export class VeriffService {
  private readonly logger = new Logger(VeriffService.name);
  private readonly httpClient: AxiosInstance;
  private readonly apiKey: string;
  private readonly secretKey: string;
  private readonly baseUrl = 'https://stationapi.veriff.com/v1';

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('VERIFF_API_KEY');
    this.secretKey = this.configService.get<string>('VERIFF_SECRET_KEY');

    if (!this.apiKey || !this.secretKey) {
      throw new Error('Veriff API credentials not configured');
    }

    this.httpClient = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Content-Type': 'application/json',
        'X-AUTH-CLIENT': this.apiKey,
      },
    });

    // Add request interceptor for signature
    this.httpClient.interceptors.request.use((config) => {
      const signature = this.generateSignature(config.data || '');
      config.headers['X-HMAC-SIGNATURE'] = signature;
      return config;
    });
  }

  /**
   * Create a new verification session
   */
  async createSession(userId: string, callback?: string): Promise<VeriffSession> {
    try {
      const payload = {
        verification: {
          callback: callback || `${this.configService.get('API_BASE_URL')}/age-verification/webhook`,
          person: {
            firstName: '',
            lastName: '',
          },
          vendorData: userId,
          lang: 'en',
          features: ['selfid'],
          additionalData: {
            userId,
            timestamp: new Date().toISOString(),
          },
        },
      };

      const response = await this.httpClient.post('/sessions', payload);
      
      this.logger.log(`Created Veriff session for user ${userId}: ${response.data.verification.id}`);
      
      return response.data;
    } catch (error: any) {
      this.logger.error('Failed to create Veriff session:', error.response?.data || error.message);
      throw new InternalServerErrorException('Failed to create verification session');
    }
  }

  /**
   * Get verification decision
   */
  async getDecision(sessionId: string): Promise<VeriffDecision> {
    try {
      const response = await this.httpClient.get(`/sessions/${sessionId}/decision`);
      return response.data;
    } catch (error: any) {
      this.logger.error(`Failed to get decision for session ${sessionId}:`, error.response?.data || error.message);
      throw new InternalServerErrorException('Failed to retrieve verification decision');
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    try {
      const expectedSignature = this.generateSignature(payload);
      return crypto.timingSafeEqual(
        Buffer.from(signature, 'hex'),
        Buffer.from(expectedSignature, 'hex')
      );
    } catch (error) {
      this.logger.error('Failed to verify webhook signature:', error);
      return false;
    }
  }

  /**
   * Calculate minimum age based on date of birth
   */
  calculateAge(dateOfBirth: string): number {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }

  /**
   * Check if user meets minimum age requirement
   */
  meetsAgeRequirement(dateOfBirth: string, minimumAge: number = 21): boolean {
    const age = this.calculateAge(dateOfBirth);
    return age >= minimumAge;
  }

  /**
   * Validate document authenticity and extract data
   */
  validateDocument(decision: VeriffDecision): {
    isValid: boolean;
    age: number;
    meetsRequirement: boolean;
    extractedData: {
      firstName: string;
      lastName: string;
      dateOfBirth: string;
      nationality: string;
      documentType: string;
      documentNumber: string;
    };
  } {
    const { person, document, status } = decision.verification;
    
    const isValid = status === 'approved';
    const age = this.calculateAge(person.dateOfBirth);
    const meetsRequirement = this.meetsAgeRequirement(person.dateOfBirth);

    return {
      isValid,
      age,
      meetsRequirement,
      extractedData: {
        firstName: person.firstName,
        lastName: person.lastName,
        dateOfBirth: person.dateOfBirth,
        nationality: person.nationality,
        documentType: document.type,
        documentNumber: document.number,
      },
    };
  }

  /**
   * Generate HMAC signature for API requests
   */
  private generateSignature(payload: string): string {
    return crypto
      .createHmac('sha256', this.secretKey)
      .update(payload)
      .digest('hex');
  }

  /**
   * Get supported countries for verification
   */
  async getSupportedCountries(): Promise<string[]> {
    try {
      const response = await this.httpClient.get('/supported-countries');
      return response.data.supportedCountries || [];
    } catch (error: any) {
      this.logger.error('Failed to get supported countries:', error.response?.data || error.message);
      return [];
    }
  }

  /**
   * Get verification session status
   */
  async getSessionStatus(sessionId: string): Promise<string> {
    try {
      const response = await this.httpClient.get(`/sessions/${sessionId}`);
      return response.data.status;
    } catch (error: any) {
      this.logger.error(`Failed to get session status for ${sessionId}:`, error.response?.data || error.message);
      throw new InternalServerErrorException('Failed to retrieve session status');
    }
  }
}
