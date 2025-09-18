import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ImageAnnotatorClient } from '@google-cloud/vision';

export interface ScanResult {
  id: string;
  type: 'cigar' | 'wine' | 'beer';
  name: string;
  brand?: string;
  description?: string;
  confidence: number;
  image_url?: string;
}

@Injectable()
export class ScannerService {
  private readonly logger = new Logger(ScannerService.name);
  private readonly visionClient: ImageAnnotatorClient;

  constructor(private readonly configService: ConfigService) {
    // Initialize Google Vision AI client
    // In production, you would set GOOGLE_APPLICATION_CREDENTIALS environment variable
    // pointing to your service account key file
    this.visionClient = new ImageAnnotatorClient({
      // For development, you can use a service account key file
      // keyFilename: 'path/to/service-account-key.json',
      // Or use environment variables for authentication
    });
  }

  /**
   * Extract text from image using Google Vision AI
   */
  private async extractTextFromImage(imageBuffer: Buffer): Promise<string[]> {
    try {
      const [result] = await this.visionClient.textDetection({
        image: { content: imageBuffer },
      });

      const detections = result.textAnnotations;
      if (!detections || detections.length === 0) {
        return [];
      }

      // Return all detected text strings
      return detections.slice(1).map(text => text.description || '').filter(Boolean);
    } catch (error) {
      this.logger.error('Error extracting text from image:', error);
      return [];
    }
  }

  /**
   * Analyze extracted text to identify product information
   */
  private analyzeProductText(texts: string[], productType: 'cigar' | 'wine' | 'beer'): Partial<ScanResult> {
    const allText = texts.join(' ').toLowerCase();

    // Basic pattern matching for different product types
    const patterns = {
      cigar: {
        brands: ['cohiba', 'montecristo', 'romeo y julieta', 'davidoff', 'arturo fuente', 'padron'],
        sizes: ['robusto', 'churchill', 'torpedo', 'corona', 'toro', 'petit corona'],
      },
      wine: {
        brands: ['château', 'domaine', 'cuvée', 'reserve', 'vintage'],
        types: ['cabernet', 'merlot', 'chardonnay', 'pinot', 'sauvignon', 'bordeaux'],
      },
      beer: {
        brands: ['westvleteren', 'chimay', 'rochefort', 'orval', 'duvel', 'stella artois'],
        types: ['ipa', 'stout', 'lager', 'ale', 'pilsner', 'wheat'],
      },
    };

    const productPatterns = patterns[productType];
    let confidence = 0.5; // Base confidence
    let detectedBrand = '';
    let detectedName = '';

    // Look for brand matches
    for (const brand of productPatterns.brands) {
      if (allText.includes(brand)) {
        detectedBrand = brand;
        confidence += 0.2;
        break;
      }
    }

    // Look for type/size matches
    if (productType === 'cigar' && 'sizes' in productPatterns) {
      for (const size of productPatterns.sizes) {
        if (allText.includes(size)) {
          detectedName = `${detectedBrand} ${size}`.trim();
          confidence += 0.1;
          break;
        }
      }
    } else if ('types' in productPatterns) {
      for (const type of productPatterns.types) {
        if (allText.includes(type)) {
          detectedName = `${detectedBrand} ${type}`.trim();
          confidence += 0.1;
          break;
        }
      }
    }

    // If no specific matches, use the first few words as name
    if (!detectedName && texts.length > 0) {
      detectedName = texts.slice(0, 3).join(' ');
    }

    return {
      name: detectedName || `Unknown ${productType}`,
      brand: detectedBrand || undefined,
      confidence: Math.min(confidence, 0.95),
    };
  }

  async identifyCigar(imageBuffer: Buffer): Promise<ScanResult> {
    this.logger.log('Processing cigar identification with Google Vision AI...');

    try {
      // Extract text from the image
      const extractedTexts = await this.extractTextFromImage(imageBuffer);
      this.logger.debug('Extracted texts:', extractedTexts);

      // Analyze the text to identify cigar information
      const analysis = this.analyzeProductText(extractedTexts, 'cigar');

      return {
        id: `cigar_${Date.now()}`,
        type: 'cigar',
        name: analysis.name || 'Unknown Cigar',
        brand: analysis.brand,
        description: `Identified from image analysis. ${extractedTexts.length > 0 ? 'Text detected on band/label.' : 'Limited text detected.'}`,
        confidence: analysis.confidence || 0.5,
        image_url: undefined, // Could store uploaded image URL here
      };
    } catch (error) {
      this.logger.error('Error in cigar identification:', error);

      // Fallback to mock data if Vision AI fails
      return {
        id: `cigar_${Date.now()}`,
        type: 'cigar',
        name: 'Unknown Cigar',
        brand: undefined,
        description: 'Unable to identify from image. Please try again with better lighting.',
        confidence: 0.3,
        image_url: undefined,
      };
    }
  }

  async identifyWine(imageBuffer: Buffer): Promise<ScanResult> {
    this.logger.log('Processing wine identification with Google Vision AI...');

    try {
      const extractedTexts = await this.extractTextFromImage(imageBuffer);
      this.logger.debug('Extracted texts:', extractedTexts);

      const analysis = this.analyzeProductText(extractedTexts, 'wine');

      return {
        id: `wine_${Date.now()}`,
        type: 'wine',
        name: analysis.name || 'Unknown Wine',
        brand: analysis.brand,
        description: `Identified from label analysis. ${extractedTexts.length > 0 ? 'Text detected on label.' : 'Limited text detected.'}`,
        confidence: analysis.confidence || 0.5,
        image_url: undefined,
      };
    } catch (error) {
      this.logger.error('Error in wine identification:', error);

      return {
        id: `wine_${Date.now()}`,
        type: 'wine',
        name: 'Unknown Wine',
        brand: undefined,
        description: 'Unable to identify from image. Please try again with better lighting.',
        confidence: 0.3,
        image_url: undefined,
      };
    }
  }

  async identifyBeer(imageBuffer: Buffer): Promise<ScanResult> {
    this.logger.log('Processing beer identification with Google Vision AI...');

    try {
      const extractedTexts = await this.extractTextFromImage(imageBuffer);
      this.logger.debug('Extracted texts:', extractedTexts);

      const analysis = this.analyzeProductText(extractedTexts, 'beer');

      return {
        id: `beer_${Date.now()}`,
        type: 'beer',
        name: analysis.name || 'Unknown Beer',
        brand: analysis.brand,
        description: `Identified from label analysis. ${extractedTexts.length > 0 ? 'Text detected on label.' : 'Limited text detected.'}`,
        confidence: analysis.confidence || 0.5,
        image_url: undefined,
      };
    } catch (error) {
      this.logger.error('Error in beer identification:', error);

      return {
        id: `beer_${Date.now()}`,
        type: 'beer',
        name: 'Unknown Beer',
        brand: undefined,
        description: 'Unable to identify from image. Please try again with better lighting.',
        confidence: 0.3,
        image_url: undefined,
      };
    }
  }

  /**
   * Test Google Vision API connection
   */
  async testVisionConnection(): Promise<any> {
    try {
      this.logger.log('Testing Google Vision API connection...');

      // Create a simple test image (1x1 white pixel PNG)
      const testImageBuffer = Buffer.from([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
        0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
        0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, 0x00, 0x00, 0x00,
        0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0xD7, 0x63, 0xF8, 0x0F, 0x00, 0x00,
        0x01, 0x00, 0x01, 0x5C, 0xC2, 0x8A, 0x8E, 0x00, 0x00, 0x00, 0x00, 0x49,
        0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
      ]);

      // Test text detection
      const [result] = await this.visionClient.textDetection({
        image: { content: testImageBuffer },
      });

      this.logger.log('Vision API test successful');

      return {
        success: true,
        message: 'Google Vision API is working correctly',
        projectId: this.configService.get('GOOGLE_CLOUD_PROJECT_ID'),
        credentialsPath: this.configService.get('GOOGLE_APPLICATION_CREDENTIALS'),
        testResult: {
          textAnnotations: result.textAnnotations?.length || 0,
          hasDetections: !!result.textAnnotations
        }
      };
    } catch (error) {
      this.logger.error('Vision API test failed:', error);
      throw new Error(`Vision API test failed: ${error.message}`);
    }
  }
}
