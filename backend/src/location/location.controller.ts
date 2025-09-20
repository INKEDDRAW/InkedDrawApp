/**
 * Location Controller
 * API endpoints for location-based services and smoke shop discovery
 */

import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
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
  ApiParam,
} from '@nestjs/swagger';
import { LocationService, Coordinates } from './location.service';
import { SmokeShopService, SmokeShopSearchOptions } from './smoke-shop.service';

class FindNearbyShopsDto {
  latitude: number;
  longitude: number;
  radius?: number;
  productId?: string;
  productType?: 'cigar' | 'beer' | 'wine';
  brand?: string;
  limit?: number;
  sortBy?: 'distance' | 'rating' | 'availability';
}

class GeocodeAddressDto {
  address: string;
}

class UpdateInventoryDto {
  productId: string;
  productType: 'cigar' | 'beer' | 'wine';
  brand: string;
  name: string;
  inStock: boolean;
  price?: number;
}

@ApiTags('Location & Smoke Shops')
@Controller('api/location')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class LocationController {
  private readonly logger = new Logger(LocationController.name);

  constructor(
    private readonly locationService: LocationService,
    private readonly smokeShopService: SmokeShopService,
  ) {}

  /**
   * Find nearby smoke shops
   */
  @Post('nearby-shops')
  @ApiOperation({ 
    summary: 'Find nearby smoke shops',
    description: 'Find smoke shops near a specific location, optionally filtered by product availability or brand.'
  })
  @ApiBody({ type: FindNearbyShopsDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Nearby shops found successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid coordinates or parameters' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findNearbyShops(
    @Request() req: any,
    @Body() findNearbyShopsDto: FindNearbyShopsDto
  ) {
    try {
      const { latitude, longitude, radius = 25, ...options } = findNearbyShopsDto;

      // Validate coordinates
      if (!this.locationService.validateCoordinates({ latitude, longitude })) {
        throw new HttpException('Invalid coordinates', HttpStatus.BAD_REQUEST);
      }

      this.logger.log(`Finding nearby shops for user ${req.user.id} at ${latitude}, ${longitude}`);

      const searchOptions: SmokeShopSearchOptions = {
        latitude,
        longitude,
        radius,
        ...options,
      };

      const result = await this.smokeShopService.findNearbyShops(searchOptions);

      this.logger.log(`Found ${result.shops.length} shops within ${radius} miles`);

      return result;
    } catch (error) {
      this.logger.error('Error finding nearby shops:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to find nearby shops',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Find shops that carry a specific product
   */
  @Get('shops-with-product/:productId')
  @ApiOperation({ 
    summary: 'Find shops that carry a specific product',
    description: 'Find smoke shops that have a specific cigar, beer, or wine in stock.'
  })
  @ApiParam({ name: 'productId', description: 'Product ID to search for' })
  @ApiQuery({ name: 'productType', enum: ['cigar', 'beer', 'wine'], required: true })
  @ApiQuery({ name: 'latitude', type: 'number', required: true })
  @ApiQuery({ name: 'longitude', type: 'number', required: true })
  @ApiQuery({ name: 'radius', type: 'number', required: false, description: 'Search radius in miles (default: 25)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Shops with product found successfully',
  })
  async findShopsWithProduct(
    @Request() req: any,
    @Param('productId') productId: string,
    @Query('productType') productType: 'cigar' | 'beer' | 'wine',
    @Query('latitude') latitude: string,
    @Query('longitude') longitude: string,
    @Query('radius') radius?: string
  ) {
    try {
      const lat = parseFloat(latitude);
      const lon = parseFloat(longitude);
      const searchRadius = radius ? parseFloat(radius) : 25;

      if (!this.locationService.validateCoordinates({ latitude: lat, longitude: lon })) {
        throw new HttpException('Invalid coordinates', HttpStatus.BAD_REQUEST);
      }

      if (!['cigar', 'beer', 'wine'].includes(productType)) {
        throw new HttpException('Invalid product type', HttpStatus.BAD_REQUEST);
      }

      this.logger.log(`Finding shops with product ${productId} for user ${req.user.id}`);

      const shops = await this.smokeShopService.findShopsWithProduct(
        productId,
        productType,
        { latitude: lat, longitude: lon },
        searchRadius
      );

      return {
        shops,
        productId,
        productType,
        searchLocation: { latitude: lat, longitude: lon },
        searchRadius,
        totalCount: shops.length,
      };
    } catch (error) {
      this.logger.error('Error finding shops with product:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to find shops with product',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Find shops that carry products from a specific brand
   */
  @Get('shops-with-brand')
  @ApiOperation({ 
    summary: 'Find shops that carry products from a specific brand',
    description: 'Find smoke shops that carry products from a specific brand (e.g., Cohiba, Davidoff).'
  })
  @ApiQuery({ name: 'brand', type: 'string', required: true })
  @ApiQuery({ name: 'latitude', type: 'number', required: true })
  @ApiQuery({ name: 'longitude', type: 'number', required: true })
  @ApiQuery({ name: 'radius', type: 'number', required: false, description: 'Search radius in miles (default: 25)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Shops with brand found successfully',
  })
  async findShopsWithBrand(
    @Request() req: any,
    @Query('brand') brand: string,
    @Query('latitude') latitude: string,
    @Query('longitude') longitude: string,
    @Query('radius') radius?: string
  ) {
    try {
      const lat = parseFloat(latitude);
      const lon = parseFloat(longitude);
      const searchRadius = radius ? parseFloat(radius) : 25;

      if (!this.locationService.validateCoordinates({ latitude: lat, longitude: lon })) {
        throw new HttpException('Invalid coordinates', HttpStatus.BAD_REQUEST);
      }

      if (!brand || brand.trim().length === 0) {
        throw new HttpException('Brand is required', HttpStatus.BAD_REQUEST);
      }

      this.logger.log(`Finding shops with brand ${brand} for user ${req.user.id}`);

      const shops = await this.smokeShopService.findShopsWithBrand(
        brand,
        { latitude: lat, longitude: lon },
        searchRadius
      );

      return {
        shops,
        brand,
        searchLocation: { latitude: lat, longitude: lon },
        searchRadius,
        totalCount: shops.length,
      };
    } catch (error) {
      this.logger.error('Error finding shops with brand:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to find shops with brand',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get popular smoke shops in an area
   */
  @Get('popular-shops')
  @ApiOperation({ 
    summary: 'Get popular smoke shops in an area',
    description: 'Find highly-rated smoke shops in a specific area.'
  })
  @ApiQuery({ name: 'latitude', type: 'number', required: true })
  @ApiQuery({ name: 'longitude', type: 'number', required: true })
  @ApiQuery({ name: 'radius', type: 'number', required: false, description: 'Search radius in miles (default: 50)' })
  @ApiQuery({ name: 'limit', type: 'number', required: false, description: 'Maximum number of results (default: 10)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Popular shops found successfully',
  })
  async getPopularShops(
    @Request() req: any,
    @Query('latitude') latitude: string,
    @Query('longitude') longitude: string,
    @Query('radius') radius?: string,
    @Query('limit') limit?: string
  ) {
    try {
      const lat = parseFloat(latitude);
      const lon = parseFloat(longitude);
      const searchRadius = radius ? parseFloat(radius) : 50;
      const maxResults = limit ? parseInt(limit) : 10;

      if (!this.locationService.validateCoordinates({ latitude: lat, longitude: lon })) {
        throw new HttpException('Invalid coordinates', HttpStatus.BAD_REQUEST);
      }

      this.logger.log(`Finding popular shops for user ${req.user.id} at ${lat}, ${lon}`);

      const shops = await this.smokeShopService.getPopularShops(
        lat,
        lon,
        searchRadius,
        maxResults
      );

      return {
        shops,
        searchLocation: { latitude: lat, longitude: lon },
        searchRadius,
        totalCount: shops.length,
      };
    } catch (error) {
      this.logger.error('Error finding popular shops:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to find popular shops',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get detailed information about a specific smoke shop
   */
  @Get('shops/:shopId')
  @ApiOperation({ 
    summary: 'Get smoke shop details',
    description: 'Get detailed information about a specific smoke shop including inventory and reviews.'
  })
  @ApiParam({ name: 'shopId', description: 'Smoke shop ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Shop details retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Shop not found' })
  async getShopDetails(
    @Request() req: any,
    @Param('shopId') shopId: string
  ) {
    try {
      this.logger.log(`Getting shop details for ${shopId}, user ${req.user.id}`);

      const shop = await this.smokeShopService.getShopDetails(shopId);

      if (!shop) {
        throw new HttpException('Shop not found', HttpStatus.NOT_FOUND);
      }

      // Get shop inventory
      const inventory = await this.smokeShopService.getShopInventory(shopId);

      return {
        shop,
        inventory,
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error('Error getting shop details:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to get shop details',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get shop inventory
   */
  @Get('shops/:shopId/inventory')
  @ApiOperation({ 
    summary: 'Get shop inventory',
    description: 'Get the current inventory for a specific smoke shop.'
  })
  @ApiParam({ name: 'shopId', description: 'Smoke shop ID' })
  @ApiQuery({ name: 'productType', enum: ['cigar', 'beer', 'wine'], required: false })
  @ApiResponse({ 
    status: 200, 
    description: 'Shop inventory retrieved successfully',
  })
  async getShopInventory(
    @Request() req: any,
    @Param('shopId') shopId: string,
    @Query('productType') productType?: 'cigar' | 'beer' | 'wine'
  ) {
    try {
      this.logger.log(`Getting inventory for shop ${shopId}, user ${req.user.id}`);

      const inventory = await this.smokeShopService.getShopInventory(shopId, productType);

      return {
        shopId,
        productType,
        inventory,
        totalItems: inventory.length,
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error('Error getting shop inventory:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to get shop inventory',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Geocode an address to coordinates
   */
  @Post('geocode')
  @ApiOperation({ 
    summary: 'Geocode address to coordinates',
    description: 'Convert a street address to latitude and longitude coordinates.'
  })
  @ApiBody({ type: GeocodeAddressDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Address geocoded successfully',
    schema: {
      type: 'object',
      properties: {
        coordinates: {
          type: 'object',
          properties: {
            latitude: { type: 'number' },
            longitude: { type: 'number' },
          },
        },
        address: { type: 'string' },
        timestamp: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid address' })
  async geocodeAddress(
    @Request() req: any,
    @Body() geocodeAddressDto: GeocodeAddressDto
  ) {
    try {
      const { address } = geocodeAddressDto;

      if (!address || address.trim().length === 0) {
        throw new HttpException('Address is required', HttpStatus.BAD_REQUEST);
      }

      this.logger.log(`Geocoding address for user ${req.user.id}: ${address}`);

      const coordinates = await this.locationService.geocodeAddress(address);

      if (!coordinates) {
        throw new HttpException('Unable to geocode address', HttpStatus.BAD_REQUEST);
      }

      return {
        coordinates,
        address,
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error('Error geocoding address:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to geocode address',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Calculate distance between two points
   */
  @Get('distance')
  @ApiOperation({ 
    summary: 'Calculate distance between two points',
    description: 'Calculate the distance between two geographic coordinates.'
  })
  @ApiQuery({ name: 'lat1', type: 'number', required: true })
  @ApiQuery({ name: 'lon1', type: 'number', required: true })
  @ApiQuery({ name: 'lat2', type: 'number', required: true })
  @ApiQuery({ name: 'lon2', type: 'number', required: true })
  @ApiQuery({ name: 'unit', enum: ['miles', 'kilometers'], required: false, description: 'Distance unit (default: miles)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Distance calculated successfully',
    schema: {
      type: 'object',
      properties: {
        distance: { type: 'number' },
        unit: { type: 'string', enum: ['miles', 'kilometers'] },
        formattedDistance: { type: 'string' },
        point1: {
          type: 'object',
          properties: {
            latitude: { type: 'number' },
            longitude: { type: 'number' },
          },
        },
        point2: {
          type: 'object',
          properties: {
            latitude: { type: 'number' },
            longitude: { type: 'number' },
          },
        },
      },
    },
  })
  async calculateDistance(
    @Query('lat1') lat1: string,
    @Query('lon1') lon1: string,
    @Query('lat2') lat2: string,
    @Query('lon2') lon2: string,
    @Query('unit') unit: 'miles' | 'kilometers' = 'miles'
  ) {
    try {
      const point1: Coordinates = {
        latitude: parseFloat(lat1),
        longitude: parseFloat(lon1),
      };

      const point2: Coordinates = {
        latitude: parseFloat(lat2),
        longitude: parseFloat(lon2),
      };

      if (!this.locationService.validateCoordinates(point1) || 
          !this.locationService.validateCoordinates(point2)) {
        throw new HttpException('Invalid coordinates', HttpStatus.BAD_REQUEST);
      }

      const distance = this.locationService.calculateDistance(point1, point2, unit);
      const formattedDistance = this.locationService.formatDistance(distance, unit);

      return {
        distance,
        unit,
        formattedDistance,
        point1,
        point2,
      };
    } catch (error) {
      this.logger.error('Error calculating distance:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to calculate distance',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
