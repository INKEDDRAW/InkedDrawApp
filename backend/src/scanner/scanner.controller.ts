import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  BadRequestException,
  Body,
  Request,
  Get,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { ScannerService } from './scanner.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CollectionsService } from '../collections/collections.service';

@ApiTags('scanner')
@Controller('scanner')
export class ScannerController {
  constructor(
    private readonly scannerService: ScannerService,
    private readonly collectionsService: CollectionsService
  ) {}

  @Post('identify-cigar')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('image'))
  @ApiOperation({ summary: 'Identify a cigar from an image' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 200, description: 'Cigar identified successfully' })
  @ApiResponse({ status: 400, description: 'Invalid image file' })
  async identifyCigar(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Image file is required');
    }

    return await this.scannerService.identifyCigar(file.buffer);
  }

  @Post('identify-wine')
  @UseInterceptors(FileInterceptor('image'))
  @ApiOperation({ summary: 'Identify a wine from an image' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 200, description: 'Wine identified successfully' })
  @ApiResponse({ status: 400, description: 'Invalid image file' })
  async identifyWine(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Image file is required');
    }

    return await this.scannerService.identifyWine(file.buffer);
  }

  @Post('identify-beer')
  @UseInterceptors(FileInterceptor('image'))
  @ApiOperation({ summary: 'Identify a beer from an image' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 200, description: 'Beer identified successfully' })
  @ApiResponse({ status: 400, description: 'Invalid image file' })
  async identifyBeer(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Image file is required');
    }

    return await this.scannerService.identifyBeer(file.buffer);
  }

  @Post('scan-and-add/:collectionId')
  @UseInterceptors(FileInterceptor('image'))
  @ApiOperation({ summary: 'Scan product and add to collection' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Product scanned and added to collection successfully' })
  @ApiResponse({ status: 400, description: 'Invalid image file or collection' })
  async scanAndAddToCollection(
    @Request() req,
    @UploadedFile() file: Express.Multer.File,
    @Body('type') type: 'cigar' | 'wine' | 'beer',
    @Body('collection_id') collectionId: string
  ) {
    if (!file) {
      throw new BadRequestException('Image file is required');
    }

    if (!type || !['cigar', 'wine', 'beer'].includes(type)) {
      throw new BadRequestException('Valid product type is required (cigar, wine, beer)');
    }

    // Scan the product
    let scanResult;
    switch (type) {
      case 'cigar':
        scanResult = await this.scannerService.identifyCigar(file.buffer);
        break;
      case 'wine':
        scanResult = await this.scannerService.identifyWine(file.buffer);
        break;
      case 'beer':
        scanResult = await this.scannerService.identifyBeer(file.buffer);
        break;
    }

    // Create collection item from scan result
    const itemDto = {
      collection_id: collectionId,
      name: scanResult.name || 'Unknown Product',
      brand: scanResult.brand,
      type: type,
      description: scanResult.description,
      scan_id: scanResult.scan_id,
      confidence: scanResult.confidence,
      image_url: scanResult.image_url,
    };

    // Add to collection
    const collectionItem = await this.collectionsService.createCollectionItem(
      req.user.id,
      itemDto
    );

    return {
      scan_result: scanResult,
      collection_item: collectionItem,
    };
  }

  @Get('test-vision')
  @ApiOperation({ summary: 'Test Google Vision API connection' })
  @ApiResponse({ status: 200, description: 'Vision API test successful' })
  async testVisionAPI() {
    try {
      const result = await this.scannerService.testVisionConnection();
      return {
        message: 'Vision API test successful',
        result,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        message: 'Vision API test failed',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  @Post('test-cigar-scan')
  @ApiOperation({ summary: 'Test cigar identification with sample data' })
  @ApiResponse({ status: 200, description: 'Cigar scan test successful' })
  async testCigarScan(@Body() body: { text?: string }) {
    try {
      // Create a test image buffer with some text
      const testText = body.text || 'Cohiba Robusto Cuban Cigar Premium';
      const testBuffer = Buffer.from(testText, 'utf8');

      const result = await this.scannerService.identifyCigar(testBuffer);
      return {
        message: 'Cigar scan test successful',
        input: testText,
        result,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        message: 'Cigar scan test failed',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}
