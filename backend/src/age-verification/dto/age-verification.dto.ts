/**
 * Age Verification DTOs
 * Data Transfer Objects for age verification endpoints
 */

import { IsOptional, IsString, IsUrl, IsBoolean, IsNumber, IsEnum, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateVerificationDto {
  @ApiPropertyOptional({ 
    example: 'https://app.inked-draw.com/verification/callback',
    description: 'Callback URL for verification completion'
  })
  @IsOptional()
  @IsUrl()
  callbackUrl?: string;

  @ApiPropertyOptional({ 
    example: 'en',
    description: 'Language code for verification interface'
  })
  @IsOptional()
  @IsString()
  language?: string;
}

export class VerificationStatusDto {
  @ApiProperty({ 
    example: true,
    description: 'Whether the user is age verified'
  })
  @IsBoolean()
  isVerified: boolean;

  @ApiProperty({ 
    example: 'approved',
    enum: ['pending', 'approved', 'rejected', 'expired'],
    description: 'Current verification status'
  })
  @IsEnum(['pending', 'approved', 'rejected', 'expired'])
  status: 'pending' | 'approved' | 'rejected' | 'expired' | null;

  @ApiPropertyOptional({ 
    example: 'uuid-verification-id',
    description: 'Verification record ID'
  })
  @IsOptional()
  @IsString()
  verificationId?: string;

  @ApiPropertyOptional({ 
    example: 'veriff-session-id',
    description: 'Veriff session ID'
  })
  @IsOptional()
  @IsString()
  sessionId?: string;

  @ApiPropertyOptional({ 
    example: 25,
    description: 'Verified age of the user'
  })
  @IsOptional()
  @IsNumber()
  age?: number;

  @ApiPropertyOptional({ 
    example: '2024-01-15T10:30:00Z',
    description: 'When the verification was completed'
  })
  @IsOptional()
  @IsDateString()
  verifiedAt?: string;

  @ApiPropertyOptional({ 
    example: '2025-01-15T10:30:00Z',
    description: 'When the verification expires'
  })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @ApiProperty({ 
    example: true,
    description: 'Whether user can start a new verification'
  })
  @IsBoolean()
  canStartVerification: boolean;

  @ApiProperty({ 
    example: 2,
    description: 'Number of verification attempts remaining'
  })
  @IsNumber()
  attemptsRemaining: number;

  @ApiPropertyOptional({ 
    example: 'passport',
    description: 'Type of document used for verification'
  })
  @IsOptional()
  @IsString()
  documentType?: string;

  @ApiPropertyOptional({ 
    example: 'US',
    description: 'Nationality from verified document'
  })
  @IsOptional()
  @IsString()
  nationality?: string;
}

export class StartVerificationResponseDto {
  @ApiProperty({ 
    example: 'uuid-verification-id',
    description: 'Verification record ID'
  })
  @IsString()
  verificationId: string;

  @ApiProperty({ 
    example: 'veriff-session-id',
    description: 'Veriff session ID'
  })
  @IsString()
  sessionId: string;

  @ApiProperty({ 
    example: 'https://magic.veriff.me/v/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'URL to start verification process'
  })
  @IsUrl()
  verificationUrl: string;

  @ApiProperty({ 
    example: 'pending',
    description: 'Initial verification status'
  })
  @IsString()
  status: string;

  @ApiProperty({ 
    example: '2025-01-15T10:30:00Z',
    description: 'When the verification expires'
  })
  @IsDateString()
  expiresAt: string;

  @ApiProperty({ 
    example: 2,
    description: 'Number of verification attempts remaining'
  })
  @IsNumber()
  attemptsRemaining: number;
}

export class VerificationHistoryDto {
  @ApiProperty({ 
    example: 'uuid-verification-id',
    description: 'Verification record ID'
  })
  @IsString()
  id: string;

  @ApiProperty({ 
    example: 'veriff-session-id',
    description: 'Veriff session ID'
  })
  @IsString()
  sessionId: string;

  @ApiProperty({ 
    example: 'approved',
    enum: ['pending', 'approved', 'rejected', 'expired'],
    description: 'Verification status'
  })
  @IsEnum(['pending', 'approved', 'rejected', 'expired'])
  status: 'pending' | 'approved' | 'rejected' | 'expired';

  @ApiProperty({ 
    example: 'veriff',
    enum: ['veriff', 'manual'],
    description: 'Verification method used'
  })
  @IsEnum(['veriff', 'manual'])
  verificationMethod: 'veriff' | 'manual';

  @ApiPropertyOptional({ 
    example: 25,
    description: 'Verified age'
  })
  @IsOptional()
  @IsNumber()
  age?: number;

  @ApiPropertyOptional({ 
    example: '2024-01-15T10:30:00Z',
    description: 'When verification was completed'
  })
  @IsOptional()
  @IsDateString()
  verifiedAt?: string;

  @ApiProperty({ 
    example: '2024-01-15T09:00:00Z',
    description: 'When verification was started'
  })
  @IsDateString()
  createdAt: string;

  @ApiProperty({ 
    example: 1,
    description: 'Attempt number'
  })
  @IsNumber()
  attempts: number;
}

export class WebhookPayloadDto {
  @ApiProperty({ 
    description: 'Verification data from Veriff'
  })
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

export class SupportedCountriesDto {
  @ApiProperty({ 
    example: ['US', 'CA', 'GB', 'DE', 'FR'],
    description: 'List of supported country codes'
  })
  @IsString({ each: true })
  supportedCountries: string[];
}
