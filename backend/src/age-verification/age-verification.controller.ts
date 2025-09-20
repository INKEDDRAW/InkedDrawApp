/**
 * Age Verification Controller
 * Handles age verification endpoints
 */

import { 
  Controller, 
  Post, 
  Get, 
  Body, 
  Headers,
  UseGuards, 
  Request,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { AgeVerificationService } from './age-verification.service';
import { VeriffService } from './veriff.service';
import { 
  CreateVerificationDto, 
  StartVerificationResponseDto,
  VerificationStatusDto,
  VerificationHistoryDto,
  WebhookPayloadDto,
  SupportedCountriesDto,
} from './dto/age-verification.dto';

@ApiTags('Age Verification')
@Controller('age-verification')
export class AgeVerificationController {
  constructor(
    private readonly ageVerificationService: AgeVerificationService,
    private readonly veriffService: VeriffService,
  ) {}

  @Post('start')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Start age verification process' })
  @ApiResponse({ 
    status: 201, 
    description: 'Verification process started successfully',
    type: StartVerificationResponseDto,
  })
  @ApiResponse({ 
    status: 409, 
    description: 'User already verified or maximum attempts exceeded',
  })
  async startVerification(
    @Request() req: any,
    @Body() createVerificationDto: CreateVerificationDto,
  ): Promise<StartVerificationResponseDto> {
    return this.ageVerificationService.startVerification(req.user.id, createVerificationDto);
  }

  @Get('status')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current verification status' })
  @ApiResponse({ 
    status: 200, 
    description: 'Verification status retrieved successfully',
    type: VerificationStatusDto,
  })
  async getVerificationStatus(@Request() req: any): Promise<VerificationStatusDto> {
    return this.ageVerificationService.getVerificationStatus(req.user.id);
  }

  @Get('history')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get verification history' })
  @ApiResponse({ 
    status: 200, 
    description: 'Verification history retrieved successfully',
    type: [VerificationHistoryDto],
  })
  async getVerificationHistory(@Request() req: any): Promise<VerificationHistoryDto[]> {
    return this.ageVerificationService.getVerificationHistory(req.user.id);
  }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Webhook endpoint for Veriff callbacks' })
  @ApiHeader({
    name: 'X-HMAC-SIGNATURE',
    description: 'HMAC signature for webhook verification',
    required: true,
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Webhook processed successfully',
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Invalid webhook signature or payload',
  })
  async handleWebhook(
    @Body() payload: WebhookPayloadDto,
    @Headers('x-hmac-signature') signature: string,
  ) {
    if (!signature) {
      throw new BadRequestException('Missing webhook signature');
    }

    return this.ageVerificationService.processWebhook(payload, signature);
  }

  @Get('supported-countries')
  @ApiOperation({ summary: 'Get list of supported countries for verification' })
  @ApiResponse({ 
    status: 200, 
    description: 'Supported countries retrieved successfully',
    type: SupportedCountriesDto,
  })
  async getSupportedCountries(): Promise<SupportedCountriesDto> {
    const supportedCountries = await this.veriffService.getSupportedCountries();
    return { supportedCountries };
  }

  @Get('check/:userId')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Check if user is age verified (admin only)',
    description: 'Administrative endpoint to check verification status of any user'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Verification check completed',
  })
  async checkUserVerification(@Request() req: any, userId: string) {
    // TODO: Add admin role check
    const isVerified = await this.ageVerificationService.isUserAgeVerified(userId);
    return { userId, isVerified };
  }

  @Get('health')
  @ApiOperation({ summary: 'Health check for age verification service' })
  @ApiResponse({ 
    status: 200, 
    description: 'Service is healthy',
  })
  async healthCheck() {
    try {
      // Test Veriff API connectivity
      const countries = await this.veriffService.getSupportedCountries();
      
      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        veriffConnectivity: countries.length > 0 ? 'connected' : 'disconnected',
        supportedCountriesCount: countries.length,
      };
    } catch (error) {
      return {
        status: 'degraded',
        timestamp: new Date().toISOString(),
        veriffConnectivity: 'error',
        error: error.message,
      };
    }
  }
}
