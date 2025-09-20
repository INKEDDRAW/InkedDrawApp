/**
 * Vision Controller
 * API endpoints for image recognition and product identification
 */

import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Request,
  UseGuards,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { VisionService } from './vision.service';
import { ProductRecognitionService, CigarRecognitionResult } from './product-recognition.service';
import { SmokeShopService } from '../location/smoke-shop.service';

class RecognizeCigarDto {
  imageUrl: string;
  userLatitude?: number;
  userLongitude?: number;
  searchRadius?: number;
}

class AnalyzeImageDto {
  imageUrl: string;
}

@ApiTags('Vision & Recognition')
@Controller('api/vision')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class VisionController {
  private readonly logger = new Logger(VisionController.name);

  constructor(
    private readonly visionService: VisionService,
    private readonly productRecognitionService: ProductRecognitionService,
    private readonly smokeShopService: SmokeShopService,
  ) {}

  /**
   * Recognize cigar from image and find nearby shops
   */
  @Post('recognize-cigar')
  @ApiOperation({ 
    summary: 'Recognize cigar from image and find nearby shops',
    description: 'Analyze a cigar image using Google Vision API to identify the brand, model, and characteristics, then find nearby smoke shops that carry the identified cigar.'
  })
  @ApiBody({ type: RecognizeCigarDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Cigar recognition and shop search completed successfully',
    schema: {
      type: 'object',
      properties: {
        recognition: {
          type: 'object',
          properties: {
            brand: { type: 'string' },
            model: { type: 'string' },
            size: { type: 'string' },
            wrapper: { type: 'string' },
            confidence: { type: 'number' },
            extractedText: { type: 'array', items: { type: 'string' } },
            detectedLabels: { type: 'array', items: { type: 'string' } },
            matchedProducts: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  brand: { type: 'string' },
                  confidence: { type: 'number' },
                  similarity: { type: 'number' },
                },
              },
            },
          },
        },
        nearbyShops: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              address: { type: 'string' },
              distance: { type: 'number' },
              hasProduct: { type: 'boolean' },
              rating: { type: 'number' },
            },
          },
        },
        searchLocation: {
          type: 'object',
          properties: {
            latitude: { type: 'number' },
            longitude: { type: 'number' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid image URL or parameters' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Vision API or recognition error' })
  async recognizeCigar(
    @Request() req: any,
    @Body() recognizeCigarDto: RecognizeCigarDto
  ) {
    try {
      const { imageUrl, userLatitude, userLongitude, searchRadius = 25 } = recognizeCigarDto;

      if (!imageUrl) {
        throw new HttpException('Image URL is required', HttpStatus.BAD_REQUEST);
      }

      this.logger.log(`Starting cigar recognition for user ${req.user.id}: ${imageUrl}`);

      // Step 1: Recognize the cigar from the image
      const recognition = await this.productRecognitionService.recognizeCigar(imageUrl);

      let nearbyShops = [];
      let searchLocation = null;

      // Step 2: Find nearby shops if user location is provided
      if (userLatitude && userLongitude) {
        searchLocation = { latitude: userLatitude, longitude: userLongitude };

        // If we have matched products, search for shops that carry them
        if (recognition.matchedProducts.length > 0) {
          const bestMatch = recognition.matchedProducts[0];
          nearbyShops = await this.smokeShopService.findShopsWithProduct(
            bestMatch.id,
            'cigar',
            searchLocation,
            searchRadius
          );
        }

        // If no specific product matches, search by brand
        if (nearbyShops.length === 0 && recognition.brand) {
          nearbyShops = await this.smokeShopService.findShopsWithBrand(
            recognition.brand,
            searchLocation,
            searchRadius
          );
        }

        // If still no results, get popular nearby shops
        if (nearbyShops.length === 0) {
          nearbyShops = await this.smokeShopService.getPopularShops(
            userLatitude,
            userLongitude,
            searchRadius,
            10
          );
        }
      }

      const result = {
        recognition,
        nearbyShops,
        searchLocation,
        searchRadius,
        timestamp: new Date(),
      };

      this.logger.log(`Cigar recognition completed:`, {
        userId: req.user.id,
        brand: recognition.brand,
        confidence: recognition.confidence,
        matchedProducts: recognition.matchedProducts.length,
        nearbyShops: nearbyShops.length,
      });

      return result;
    } catch (error) {
      this.logger.error('Error in cigar recognition:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to recognize cigar from image',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Analyze image using Google Vision API
   */
  @Post('analyze-image')
  @ApiOperation({ 
    summary: 'Analyze image using Google Vision API',
    description: 'Perform comprehensive image analysis including label detection, text extraction, object detection, and logo recognition.'
  })
  @ApiBody({ type: AnalyzeImageDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Image analysis completed successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid image URL' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Vision API error' })
  async analyzeImage(
    @Request() req: any,
    @Body() analyzeImageDto: AnalyzeImageDto
  ) {
    try {
      const { imageUrl } = analyzeImageDto;

      if (!imageUrl) {
        throw new HttpException('Image URL is required', HttpStatus.BAD_REQUEST);
      }

      this.logger.log(`Analyzing image for user ${req.user.id}: ${imageUrl}`);

      const analysis = await this.visionService.analyzeImage(imageUrl);

      this.logger.log(`Image analysis completed:`, {
        userId: req.user.id,
        labelsCount: analysis.labels.length,
        textLength: analysis.text.length,
        objectsCount: analysis.objects.length,
        logosCount: analysis.logos.length,
      });

      return {
        analysis,
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error('Error in image analysis:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to analyze image',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Extract text from image using OCR
   */
  @Post('extract-text')
  @ApiOperation({ 
    summary: 'Extract text from image using OCR',
    description: 'Use Google Vision API OCR to extract all text content from an image.'
  })
  @ApiBody({ type: AnalyzeImageDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Text extraction completed successfully',
    schema: {
      type: 'object',
      properties: {
        extractedText: {
          type: 'array',
          items: { type: 'string' },
        },
        timestamp: { type: 'string', format: 'date-time' },
      },
    },
  })
  async extractText(
    @Request() req: any,
    @Body() analyzeImageDto: AnalyzeImageDto
  ) {
    try {
      const { imageUrl } = analyzeImageDto;

      if (!imageUrl) {
        throw new HttpException('Image URL is required', HttpStatus.BAD_REQUEST);
      }

      this.logger.log(`Extracting text from image for user ${req.user.id}: ${imageUrl}`);

      const extractedText = await this.visionService.extractText(imageUrl);

      return {
        extractedText,
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error('Error in text extraction:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to extract text from image',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Detect logos in image
   */
  @Post('detect-logos')
  @ApiOperation({ 
    summary: 'Detect logos in image',
    description: 'Use Google Vision API to detect and identify logos in an image.'
  })
  @ApiBody({ type: AnalyzeImageDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Logo detection completed successfully',
    schema: {
      type: 'object',
      properties: {
        logos: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              confidence: { type: 'number' },
            },
          },
        },
        timestamp: { type: 'string', format: 'date-time' },
      },
    },
  })
  async detectLogos(
    @Request() req: any,
    @Body() analyzeImageDto: AnalyzeImageDto
  ) {
    try {
      const { imageUrl } = analyzeImageDto;

      if (!imageUrl) {
        throw new HttpException('Image URL is required', HttpStatus.BAD_REQUEST);
      }

      this.logger.log(`Detecting logos in image for user ${req.user.id}: ${imageUrl}`);

      const logos = await this.visionService.detectLogos(imageUrl);

      return {
        logos,
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error('Error in logo detection:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to detect logos in image',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get Vision API status
   */
  @Get('status')
  @ApiOperation({ 
    summary: 'Get Vision API status',
    description: 'Check if Google Vision API is enabled and available.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Vision API status retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        enabled: { type: 'boolean' },
        available: { type: 'boolean' },
        timestamp: { type: 'string', format: 'date-time' },
      },
    },
  })
  async getVisionStatus() {
    try {
      const enabled = this.visionService.isVisionEnabled();

      return {
        enabled,
        available: enabled,
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error('Error getting vision status:', error);
      return {
        enabled: false,
        available: false,
        timestamp: new Date(),
        error: error.message,
      };
    }
  }
}
