/**
 * Product Recognition Service
 * Cigar identification and product matching using Google Vision API
 */

import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { VisionService, VisionAnalysisResult } from './vision.service';

export interface CigarRecognitionResult {
  brand?: string;
  model?: string;
  size?: string;
  wrapper?: string;
  confidence: number;
  extractedText: string[];
  detectedLabels: string[];
  matchedProducts: Array<{
    id: string;
    name: string;
    brand: string;
    confidence: number;
    similarity: number;
  }>;
}

export interface ProductMatchResult {
  productId: string;
  productType: 'cigar' | 'beer' | 'wine';
  name: string;
  brand: string;
  confidence: number;
  matchReasons: string[];
  imageUrl?: string;
  description?: string;
}

@Injectable()
export class ProductRecognitionService {
  private readonly logger = new Logger(ProductRecognitionService.name);

  // Known cigar brands and their variations
  private readonly cigarBrands = new Map([
    ['cohiba', ['cohiba', 'coiba', 'coheba']],
    ['montecristo', ['montecristo', 'monte cristo', 'montechristo']],
    ['romeo y julieta', ['romeo y julieta', 'romeo', 'julieta', 'r&j']],
    ['partagas', ['partagas', 'partagás']],
    ['hoyo de monterrey', ['hoyo de monterrey', 'hoyo', 'monterrey']],
    ['h. upmann', ['h. upmann', 'upmann', 'h upmann']],
    ['bolivar', ['bolivar', 'bolívar']],
    ['punch', ['punch']],
    ['davidoff', ['davidoff']],
    ['arturo fuente', ['arturo fuente', 'fuente', 'a. fuente']],
    ['padron', ['padron', 'padrón']],
    ['oliva', ['oliva']],
    ['rocky patel', ['rocky patel', 'patel']],
    ['ashton', ['ashton']],
    ['cao', ['cao']],
    ['macanudo', ['macanudo']],
    ['acid', ['acid']],
    ['my father', ['my father', 'mi padre']],
    ['liga privada', ['liga privada', 'liga']],
    ['undercrown', ['undercrown']],
  ]);

  // Common cigar sizes and their variations
  private readonly cigarSizes = new Map([
    ['robusto', ['robusto', 'robust']],
    ['churchill', ['churchill']],
    ['corona', ['corona']],
    ['toro', ['toro']],
    ['torpedo', ['torpedo', 'belicoso']],
    ['petit corona', ['petit corona', 'petit']],
    ['lonsdale', ['lonsdale']],
    ['panetela', ['panetela', 'panatela']],
    ['presidente', ['presidente', 'president']],
    ['gordo', ['gordo']],
  ]);

  constructor(
    private readonly visionService: VisionService,
    private readonly databaseService: DatabaseService,
  ) {}

  /**
   * Recognize cigar from image using Google Vision API
   */
  async recognizeCigar(imageUrl: string): Promise<CigarRecognitionResult> {
    try {
      this.logger.log(`Starting cigar recognition for image: ${imageUrl}`);

      // Analyze image with Google Vision API
      const visionResult = await this.visionService.analyzeImage(imageUrl);

      // Extract text from the image
      const extractedText = await this.visionService.extractText(imageUrl);

      // Detect logos
      const detectedLogos = await this.visionService.detectLogos(imageUrl);

      // Process the vision results to identify cigar characteristics
      const recognition = await this.processCigarRecognition(visionResult, extractedText, detectedLogos);

      // Find matching products in database
      const matchedProducts = await this.findMatchingCigars(recognition);

      const result: CigarRecognitionResult = {
        ...recognition,
        extractedText,
        detectedLabels: visionResult.labels.map(label => label.description),
        matchedProducts,
      };

      this.logger.log(`Cigar recognition completed:`, {
        brand: result.brand,
        model: result.model,
        confidence: result.confidence,
        matchedProductsCount: result.matchedProducts.length,
      });

      return result;
    } catch (error) {
      this.logger.error('Error in cigar recognition:', error);
      throw new Error(`Cigar recognition failed: ${error.message}`);
    }
  }

  /**
   * Process vision analysis results to identify cigar characteristics
   */
  private async processCigarRecognition(
    visionResult: VisionAnalysisResult,
    extractedText: string[],
    detectedLogos: Array<{ name: string; confidence: number }>
  ): Promise<Omit<CigarRecognitionResult, 'extractedText' | 'detectedLabels' | 'matchedProducts'>> {
    let brand: string | undefined;
    let model: string | undefined;
    let size: string | undefined;
    let wrapper: string | undefined;
    let confidence = 0;

    // Combine all text sources
    const allText = [
      visionResult.text,
      ...extractedText,
      ...detectedLogos.map(logo => logo.name),
    ].join(' ').toLowerCase();

    // Identify brand from text and logos
    brand = this.identifyBrand(allText, detectedLogos);
    if (brand) {
      confidence += 0.4;
    }

    // Identify model/line from text
    model = this.identifyModel(allText, brand);
    if (model) {
      confidence += 0.3;
    }

    // Identify size from text
    size = this.identifySize(allText);
    if (size) {
      confidence += 0.2;
    }

    // Identify wrapper type from visual analysis
    wrapper = this.identifyWrapper(visionResult);
    if (wrapper) {
      confidence += 0.1;
    }

    // Verify it's actually a cigar based on labels
    const isCigar = this.verifyCigarLabels(visionResult.labels);
    if (!isCigar) {
      confidence *= 0.5; // Reduce confidence if not clearly a cigar
    }

    return {
      brand,
      model,
      size,
      wrapper,
      confidence: Math.min(confidence, 1.0),
    };
  }

  /**
   * Identify cigar brand from text and logos
   */
  private identifyBrand(text: string, logos: Array<{ name: string; confidence: number }>): string | undefined {
    // First check logos (highest confidence)
    for (const logo of logos) {
      const logoName = logo.name.toLowerCase();
      for (const [brand, variations] of this.cigarBrands) {
        if (variations.some(variation => logoName.includes(variation))) {
          return brand;
        }
      }
    }

    // Then check extracted text
    for (const [brand, variations] of this.cigarBrands) {
      for (const variation of variations) {
        if (text.includes(variation)) {
          return brand;
        }
      }
    }

    return undefined;
  }

  /**
   * Identify cigar model/line from text
   */
  private identifyModel(text: string, brand?: string): string | undefined {
    // Common model patterns based on brand
    const modelPatterns = {
      'cohiba': ['behike', 'siglo', 'esplendidos', 'robustos', 'lanceros'],
      'montecristo': ['no. 2', 'no. 4', 'edmundo', 'petit edmundo', 'open'],
      'romeo y julieta': ['churchill', 'cazadores', 'petit coronas', 'wide churchills'],
      'partagas': ['serie d', 'serie p', 'lusitanias', '8-9-8'],
      'davidoff': ['millennium', 'signature', 'grand cru', 'aniversario'],
      'arturo fuente': ['hemingway', 'opus x', 'don carlos', 'chateau fuente'],
      'padron': ['1964', '1926', 'family reserve', 'damaso'],
    };

    if (brand && modelPatterns[brand]) {
      for (const model of modelPatterns[brand]) {
        if (text.includes(model)) {
          return model;
        }
      }
    }

    // Generic model detection
    const genericModels = [
      'reserva', 'especial', 'maduro', 'natural', 'connecticut',
      'habano', 'corojo', 'oscuro', 'claro', 'vintage'
    ];

    for (const model of genericModels) {
      if (text.includes(model)) {
        return model;
      }
    }

    return undefined;
  }

  /**
   * Identify cigar size from text
   */
  private identifySize(text: string): string | undefined {
    for (const [size, variations] of this.cigarSizes) {
      for (const variation of variations) {
        if (text.includes(variation)) {
          return size;
        }
      }
    }

    // Look for ring gauge and length patterns
    const ringGaugeMatch = text.match(/(\d{2,3})\s*(?:rg|ring|gauge)/i);
    const lengthMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:inch|in|")/i);

    if (ringGaugeMatch || lengthMatch) {
      const ringGauge = ringGaugeMatch ? parseInt(ringGaugeMatch[1]) : null;
      const length = lengthMatch ? parseFloat(lengthMatch[1]) : null;

      // Estimate size based on dimensions
      if (ringGauge && length) {
        if (ringGauge >= 50 && length >= 5.5) return 'robusto';
        if (ringGauge >= 47 && length >= 7) return 'churchill';
        if (ringGauge >= 42 && length >= 5.5) return 'corona';
        if (ringGauge >= 50 && length >= 6) return 'toro';
      }
    }

    return undefined;
  }

  /**
   * Identify wrapper type from visual analysis
   */
  private identifyWrapper(visionResult: VisionAnalysisResult): string | undefined {
    const colors = visionResult.colors;
    if (!colors || colors.length === 0) return undefined;

    // Analyze dominant colors to determine wrapper type
    const dominantColor = colors[0].color;
    const { red, green, blue } = dominantColor;

    // Calculate color characteristics
    const brightness = (red + green + blue) / 3;
    const redness = red / (green + blue + 1);

    // Determine wrapper type based on color analysis
    if (brightness < 80 && redness > 1.2) {
      return 'maduro'; // Dark, reddish-brown
    } else if (brightness > 150 && redness < 1.1) {
      return 'connecticut'; // Light, yellowish
    } else if (brightness > 100 && redness > 1.1) {
      return 'natural'; // Medium brown
    } else if (brightness < 100 && redness > 1.3) {
      return 'habano'; // Medium-dark brown
    }

    return 'natural'; // Default
  }

  /**
   * Verify that the image contains a cigar based on labels
   */
  private verifyCigarLabels(labels: Array<{ description: string; confidence: number }>): boolean {
    const cigarKeywords = ['cigar', 'tobacco', 'smoking', 'cylinder', 'brown', 'rolled'];
    const labelDescriptions = labels.map(label => label.description.toLowerCase());

    const matches = cigarKeywords.filter(keyword => 
      labelDescriptions.some(desc => desc.includes(keyword))
    );

    return matches.length >= 2; // Require at least 2 cigar-related labels
  }

  /**
   * Find matching cigars in database based on recognition results
   */
  private async findMatchingCigars(
    recognition: Omit<CigarRecognitionResult, 'extractedText' | 'detectedLabels' | 'matchedProducts'>
  ): Promise<Array<{
    id: string;
    name: string;
    brand: string;
    confidence: number;
    similarity: number;
  }>> {
    try {
      const conditions = [];
      const params = [];
      let paramIndex = 1;

      // Build search query based on recognized characteristics
      if (recognition.brand) {
        conditions.push(`LOWER(brand) LIKE $${paramIndex}`);
        params.push(`%${recognition.brand.toLowerCase()}%`);
        paramIndex++;
      }

      if (recognition.model) {
        conditions.push(`(LOWER(name) LIKE $${paramIndex} OR LOWER(description) LIKE $${paramIndex})`);
        params.push(`%${recognition.model.toLowerCase()}%`);
        paramIndex++;
      }

      if (recognition.size) {
        conditions.push(`LOWER(size_name) LIKE $${paramIndex}`);
        params.push(`%${recognition.size.toLowerCase()}%`);
        paramIndex++;
      }

      let query = `
        SELECT 
          id,
          name,
          brand,
          size_name,
          description,
          image_url
        FROM cigars
      `;

      if (conditions.length > 0) {
        query += ` WHERE ${conditions.join(' AND ')}`;
      }

      query += ` ORDER BY 
        CASE 
          WHEN LOWER(brand) = $${paramIndex} THEN 1
          WHEN LOWER(brand) LIKE $${paramIndex + 1} THEN 2
          ELSE 3
        END,
        name
        LIMIT 10
      `;

      // Add brand matching parameters
      if (recognition.brand) {
        params.push(recognition.brand.toLowerCase());
        params.push(`%${recognition.brand.toLowerCase()}%`);
      } else {
        params.push('');
        params.push('');
      }

      const results = await this.databaseService.query(query, params);

      return results.map(row => ({
        id: row.id,
        name: row.name,
        brand: row.brand,
        confidence: this.calculateMatchConfidence(recognition, row),
        similarity: this.calculateSimilarity(recognition, row),
      }));
    } catch (error) {
      this.logger.error('Error finding matching cigars:', error);
      return [];
    }
  }

  /**
   * Calculate match confidence between recognition and database product
   */
  private calculateMatchConfidence(
    recognition: Omit<CigarRecognitionResult, 'extractedText' | 'detectedLabels' | 'matchedProducts'>,
    product: any
  ): number {
    let confidence = 0;

    // Brand match (40% weight)
    if (recognition.brand && product.brand) {
      const brandMatch = product.brand.toLowerCase().includes(recognition.brand.toLowerCase());
      if (brandMatch) confidence += 0.4;
    }

    // Model/name match (30% weight)
    if (recognition.model && product.name) {
      const nameMatch = product.name.toLowerCase().includes(recognition.model.toLowerCase());
      if (nameMatch) confidence += 0.3;
    }

    // Size match (20% weight)
    if (recognition.size && product.size_name) {
      const sizeMatch = product.size_name.toLowerCase().includes(recognition.size.toLowerCase());
      if (sizeMatch) confidence += 0.2;
    }

    // Base confidence from recognition (10% weight)
    confidence += recognition.confidence * 0.1;

    return Math.min(confidence, 1.0);
  }

  /**
   * Calculate similarity score between recognition and database product
   */
  private calculateSimilarity(
    recognition: Omit<CigarRecognitionResult, 'extractedText' | 'detectedLabels' | 'matchedProducts'>,
    product: any
  ): number {
    // This is a simplified similarity calculation
    // In production, you might use more sophisticated text similarity algorithms
    let similarity = 0;
    let factors = 0;

    if (recognition.brand && product.brand) {
      similarity += this.textSimilarity(recognition.brand, product.brand);
      factors++;
    }

    if (recognition.model && product.name) {
      similarity += this.textSimilarity(recognition.model, product.name);
      factors++;
    }

    if (recognition.size && product.size_name) {
      similarity += this.textSimilarity(recognition.size, product.size_name);
      factors++;
    }

    return factors > 0 ? similarity / factors : 0;
  }

  /**
   * Calculate text similarity between two strings
   */
  private textSimilarity(text1: string, text2: string): number {
    const str1 = text1.toLowerCase();
    const str2 = text2.toLowerCase();

    if (str1 === str2) return 1.0;
    if (str1.includes(str2) || str2.includes(str1)) return 0.8;

    // Simple Jaccard similarity
    const set1 = new Set(str1.split(''));
    const set2 = new Set(str2.split(''));
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);

    return intersection.size / union.size;
  }
}
