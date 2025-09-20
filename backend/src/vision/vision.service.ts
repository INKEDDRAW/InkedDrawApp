/**
 * Vision Service
 * Google Vision API integration for image analysis and text extraction
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ImageAnnotatorClient } from '@google-cloud/vision';

export interface VisionAnalysisResult {
  labels: Array<{
    description: string;
    score: number;
    confidence: number;
  }>;
  text: string;
  objects: Array<{
    name: string;
    score: number;
    boundingBox: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  }>;
  logos: Array<{
    description: string;
    score: number;
    boundingBox: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  }>;
  colors: Array<{
    color: {
      red: number;
      green: number;
      blue: number;
    };
    score: number;
    pixelFraction: number;
  }>;
  safeSearch: {
    adult: string;
    spoof: string;
    medical: string;
    violence: string;
    racy: string;
  };
}



@Injectable()
export class VisionService {
  private readonly logger = new Logger(VisionService.name);
  private visionClient: ImageAnnotatorClient;
  private isEnabled: boolean;

  constructor(private configService: ConfigService) {
    this.isEnabled = this.configService.get<boolean>('GOOGLE_VISION_ENABLED', false);
    
    if (this.isEnabled) {
      try {
        // Initialize Google Vision client
        const credentials = this.configService.get<string>('GOOGLE_VISION_CREDENTIALS');
        const projectId = this.configService.get<string>('GOOGLE_CLOUD_PROJECT_ID');
        
        if (credentials) {
          this.visionClient = new ImageAnnotatorClient({
            credentials: JSON.parse(credentials),
            projectId,
          });
        } else {
          // Use default credentials (for production deployment)
          this.visionClient = new ImageAnnotatorClient({
            projectId,
          });
        }
        
        this.logger.log('Google Vision API client initialized successfully');
      } catch (error) {
        this.logger.error('Failed to initialize Google Vision API client:', error);
        this.isEnabled = false;
      }
    } else {
      this.logger.warn('Google Vision API is disabled - using mock responses');
    }
  }

  /**
   * Analyze image using Google Vision API
   */
  async analyzeImage(imageUrl: string): Promise<VisionAnalysisResult> {
    if (!this.isEnabled || !this.visionClient) {
      return this.getMockAnalysis(imageUrl);
    }

    try {
      this.logger.log(`Analyzing image: ${imageUrl}`);

      // Perform multiple Vision API requests in parallel
      const [
        labelResponse,
        textResponse,
        objectResponse,
        logoResponse,
        colorResponse,
        safeSearchResponse,
      ] = await Promise.all([
        this.visionClient.labelDetection({ image: { source: { imageUri: imageUrl } } }),
        this.visionClient.textDetection({ image: { source: { imageUri: imageUrl } } }),
        this.visionClient.objectLocalization({ image: { source: { imageUri: imageUrl } } }),
        this.visionClient.logoDetection({ image: { source: { imageUri: imageUrl } } }),
        this.visionClient.imageProperties({ image: { source: { imageUri: imageUrl } } }),
        this.visionClient.safeSearchDetection({ image: { source: { imageUri: imageUrl } } }),
      ]);

      // Process labels
      const labels = labelResponse[0].labelAnnotations?.map(label => ({
        description: label.description || '',
        score: label.score || 0,
        confidence: label.score || 0,
      })) || [];

      // Process text
      const textAnnotations = textResponse[0].textAnnotations || [];
      const text = textAnnotations.length > 0 ? textAnnotations[0].description || '' : '';

      // Process objects
      const objects = objectResponse[0].localizedObjectAnnotations?.map(obj => ({
        name: obj.name || '',
        score: obj.score || 0,
        boundingBox: {
          x: obj.boundingPoly?.normalizedVertices?.[0]?.x || 0,
          y: obj.boundingPoly?.normalizedVertices?.[0]?.y || 0,
          width: (obj.boundingPoly?.normalizedVertices?.[2]?.x || 0) - (obj.boundingPoly?.normalizedVertices?.[0]?.x || 0),
          height: (obj.boundingPoly?.normalizedVertices?.[2]?.y || 0) - (obj.boundingPoly?.normalizedVertices?.[0]?.y || 0),
        },
      })) || [];

      // Process logos
      const logos = logoResponse[0].logoAnnotations?.map(logo => ({
        description: logo.description || '',
        score: logo.score || 0,
        boundingBox: {
          x: logo.boundingPoly?.vertices?.[0]?.x || 0,
          y: logo.boundingPoly?.vertices?.[0]?.y || 0,
          width: (logo.boundingPoly?.vertices?.[2]?.x || 0) - (logo.boundingPoly?.vertices?.[0]?.x || 0),
          height: (logo.boundingPoly?.vertices?.[2]?.y || 0) - (logo.boundingPoly?.vertices?.[0]?.y || 0),
        },
      })) || [];

      // Process colors
      const colors = colorResponse[0].imagePropertiesAnnotation?.dominantColors?.colors?.map(color => ({
        color: {
          red: color.color?.red || 0,
          green: color.color?.green || 0,
          blue: color.color?.blue || 0,
        },
        score: color.score || 0,
        pixelFraction: color.pixelFraction || 0,
      })) || [];

      // Process safe search
      const safeSearch = {
        adult: safeSearchResponse[0].safeSearchAnnotation?.adult || 'UNKNOWN',
        spoof: safeSearchResponse[0].safeSearchAnnotation?.spoof || 'UNKNOWN',
        medical: safeSearchResponse[0].safeSearchAnnotation?.medical || 'UNKNOWN',
        violence: safeSearchResponse[0].safeSearchAnnotation?.violence || 'UNKNOWN',
        racy: safeSearchResponse[0].safeSearchAnnotation?.racy || 'UNKNOWN',
      };

      const result: VisionAnalysisResult = {
        labels,
        text,
        objects,
        logos,
        colors,
        safeSearch,
      };

      this.logger.log(`Vision analysis completed for ${imageUrl}:`, {
        labelsCount: labels.length,
        textLength: text.length,
        objectsCount: objects.length,
        logosCount: logos.length,
        colorsCount: colors.length,
      });

      return result;
    } catch (error) {
      this.logger.error('Error analyzing image with Google Vision API:', error);
      throw new Error(`Vision API analysis failed: ${error.message}`);
    }
  }

  /**
   * Extract text from image using OCR
   */
  async extractText(imageUrl: string): Promise<string[]> {
    if (!this.isEnabled || !this.visionClient) {
      return this.getMockTextExtraction();
    }

    try {
      const [result] = await this.visionClient.textDetection({
        image: { source: { imageUri: imageUrl } },
      });

      const textAnnotations = result.textAnnotations || [];
      
      // First annotation contains all text, subsequent ones are individual words/lines
      const allText = textAnnotations.length > 0 ? textAnnotations[0].description || '' : '';
      const individualTexts = textAnnotations.slice(1).map(annotation => annotation.description || '');

      // Return both full text and individual text elements
      return [allText, ...individualTexts].filter(text => text.trim().length > 0);
    } catch (error) {
      this.logger.error('Error extracting text from image:', error);
      return [];
    }
  }

  /**
   * Detect logos in image
   */
  async detectLogos(imageUrl: string): Promise<Array<{ name: string; confidence: number }>> {
    if (!this.isEnabled || !this.visionClient) {
      return this.getMockLogoDetection();
    }

    try {
      const [result] = await this.visionClient.logoDetection({
        image: { source: { imageUri: imageUrl } },
      });

      const logos = result.logoAnnotations || [];
      
      return logos.map(logo => ({
        name: logo.description || '',
        confidence: logo.score || 0,
      }));
    } catch (error) {
      this.logger.error('Error detecting logos in image:', error);
      return [];
    }
  }

  /**
   * Get mock analysis for development/testing
   */
  private getMockAnalysis(imageUrl: string): VisionAnalysisResult {
    const mockLabels = [
      { description: 'Cigar', score: 0.95, confidence: 0.95 },
      { description: 'Tobacco', score: 0.88, confidence: 0.88 },
      { description: 'Brown', score: 0.82, confidence: 0.82 },
      { description: 'Cylinder', score: 0.76, confidence: 0.76 },
      { description: 'Wood', score: 0.71, confidence: 0.71 },
    ];

    const mockText = 'COHIBA\nBEHIKE 52\nHABANA CUBA\nHECHO A MANO';

    return {
      labels: mockLabels,
      text: mockText,
      objects: [
        {
          name: 'Cigar',
          score: 0.92,
          boundingBox: { x: 0.1, y: 0.2, width: 0.8, height: 0.6 },
        },
      ],
      logos: [
        {
          description: 'Cohiba',
          score: 0.89,
          boundingBox: { x: 0.2, y: 0.1, width: 0.6, height: 0.2 },
        },
      ],
      colors: [
        { color: { red: 139, green: 69, blue: 19 }, score: 0.8, pixelFraction: 0.4 },
        { color: { red: 160, green: 82, blue: 45 }, score: 0.6, pixelFraction: 0.3 },
      ],
      safeSearch: {
        adult: 'VERY_UNLIKELY',
        spoof: 'VERY_UNLIKELY',
        medical: 'UNLIKELY',
        violence: 'VERY_UNLIKELY',
        racy: 'VERY_UNLIKELY',
      },
    };
  }

  /**
   * Get mock text extraction for development/testing
   */
  private getMockTextExtraction(): string[] {
    return [
      'COHIBA BEHIKE 52 HABANA CUBA HECHO A MANO',
      'COHIBA',
      'BEHIKE',
      '52',
      'HABANA',
      'CUBA',
      'HECHO',
      'A',
      'MANO',
    ];
  }

  /**
   * Get mock logo detection for development/testing
   */
  private getMockLogoDetection(): Array<{ name: string; confidence: number }> {
    return [
      { name: 'Cohiba', confidence: 0.89 },
      { name: 'Habanos', confidence: 0.76 },
    ];
  }

  /**
   * Check if Vision API is enabled and available
   */
  isVisionEnabled(): boolean {
    return this.isEnabled && !!this.visionClient;
  }
}
