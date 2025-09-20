/**
 * Smoke Shop Service
 * Find smoke shops and retailers that carry specific cigars
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DatabaseService } from '../database/database.service';
import { LocationService } from './location.service';

export interface SmokeShop {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  latitude: number;
  longitude: number;
  phone?: string;
  website?: string;
  email?: string;
  hours?: {
    [day: string]: string;
  };
  specialties: string[];
  brands: string[];
  rating: number;
  reviewCount: number;
  distance?: number;
  hasProduct?: boolean;
  productAvailability?: {
    inStock: boolean;
    price?: number;
    lastUpdated: Date;
  };
}

export interface SmokeShopSearchOptions {
  latitude: number;
  longitude: number;
  radius: number; // in miles
  productId?: string;
  productType?: 'cigar' | 'beer' | 'wine';
  brand?: string;
  limit?: number;
  sortBy?: 'distance' | 'rating' | 'availability';
}

export interface SmokeShopSearchResult {
  shops: SmokeShop[];
  totalCount: number;
  searchRadius: number;
  searchLocation: {
    latitude: number;
    longitude: number;
  };
}

@Injectable()
export class SmokeShopService {
  private readonly logger = new Logger(SmokeShopService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly databaseService: DatabaseService,
    private readonly locationService: LocationService,
  ) {}

  /**
   * Find smoke shops near a location
   */
  async findNearbyShops(options: SmokeShopSearchOptions): Promise<SmokeShopSearchResult> {
    try {
      this.logger.log(`Finding smoke shops near ${options.latitude}, ${options.longitude}`);

      const { latitude, longitude, radius, limit = 20, sortBy = 'distance' } = options;

      // Build the base query
      let query = `
        SELECT 
          s.*,
          (
            3959 * acos(
              cos(radians($1)) * cos(radians(s.latitude)) *
              cos(radians(s.longitude) - radians($2)) +
              sin(radians($1)) * sin(radians(s.latitude))
            )
          ) AS distance
        FROM smoke_shops s
        WHERE (
          3959 * acos(
            cos(radians($1)) * cos(radians(s.latitude)) *
            cos(radians(s.longitude) - radians($2)) +
            sin(radians($1)) * sin(radians(s.latitude))
          )
        ) <= $3
      `;

      const params = [latitude, longitude, radius];
      let paramIndex = 4;

      // Add product/brand filtering if specified
      if (options.productId || options.brand) {
        query += ` AND EXISTS (
          SELECT 1 FROM shop_inventory si
          WHERE si.shop_id = s.id
        `;

        if (options.productId) {
          query += ` AND si.product_id = $${paramIndex}`;
          params.push(options.productId);
          paramIndex++;
        }

        if (options.brand) {
          query += ` AND LOWER(si.brand) LIKE $${paramIndex}`;
          params.push(`%${options.brand.toLowerCase()}%`);
          paramIndex++;
        }

        if (options.productType) {
          query += ` AND si.product_type = $${paramIndex}`;
          params.push(options.productType);
          paramIndex++;
        }

        query += `)`;
      }

      // Add sorting
      switch (sortBy) {
        case 'distance':
          query += ` ORDER BY distance ASC`;
          break;
        case 'rating':
          query += ` ORDER BY s.rating DESC, distance ASC`;
          break;
        case 'availability':
          query += ` ORDER BY 
            CASE WHEN EXISTS (
              SELECT 1 FROM shop_inventory si 
              WHERE si.shop_id = s.id AND si.in_stock = true
            ) THEN 0 ELSE 1 END,
            distance ASC`;
          break;
      }

      query += ` LIMIT $${paramIndex}`;
      params.push(limit);

      const results = await this.databaseService.query(query, params);

      // Enrich results with product availability if searching for specific product
      const shops = await Promise.all(
        results.map(async (row) => await this.enrichShopData(row, options))
      );

      // Get total count for pagination
      const countQuery = query.replace(/SELECT.*?FROM/, 'SELECT COUNT(*) as total FROM').replace(/ORDER BY.*?LIMIT.*$/, '');
      const countParams = params.slice(0, -1); // Remove limit parameter
      const countResult = await this.databaseService.query(countQuery, countParams);
      const totalCount = parseInt(countResult[0]?.total || '0');

      return {
        shops,
        totalCount,
        searchRadius: radius,
        searchLocation: { latitude, longitude },
      };
    } catch (error) {
      this.logger.error('Error finding nearby smoke shops:', error);
      throw new Error(`Failed to find smoke shops: ${error.message}`);
    }
  }

  /**
   * Find shops that carry a specific product
   */
  async findShopsWithProduct(
    productId: string,
    productType: 'cigar' | 'beer' | 'wine',
    userLocation: { latitude: number; longitude: number },
    radius: number = 25
  ): Promise<SmokeShop[]> {
    try {
      const options: SmokeShopSearchOptions = {
        ...userLocation,
        radius,
        productId,
        productType,
        sortBy: 'availability',
      };

      const result = await this.findNearbyShops(options);
      return result.shops.filter(shop => shop.hasProduct);
    } catch (error) {
      this.logger.error('Error finding shops with product:', error);
      return [];
    }
  }

  /**
   * Find shops that carry products from a specific brand
   */
  async findShopsWithBrand(
    brand: string,
    userLocation: { latitude: number; longitude: number },
    radius: number = 25
  ): Promise<SmokeShop[]> {
    try {
      const options: SmokeShopSearchOptions = {
        ...userLocation,
        radius,
        brand,
        sortBy: 'rating',
      };

      const result = await this.findNearbyShops(options);
      return result.shops;
    } catch (error) {
      this.logger.error('Error finding shops with brand:', error);
      return [];
    }
  }

  /**
   * Get detailed information about a specific smoke shop
   */
  async getShopDetails(shopId: string): Promise<SmokeShop | null> {
    try {
      const query = `
        SELECT 
          s.*,
          COALESCE(AVG(r.rating), 0) as rating,
          COUNT(r.id) as review_count
        FROM smoke_shops s
        LEFT JOIN shop_reviews r ON s.id = r.shop_id
        WHERE s.id = $1
        GROUP BY s.id
      `;

      const results = await this.databaseService.query(query, [shopId]);
      
      if (results.length === 0) {
        return null;
      }

      const shop = results[0];
      return this.formatShopData(shop);
    } catch (error) {
      this.logger.error('Error getting shop details:', error);
      return null;
    }
  }

  /**
   * Get product inventory for a specific shop
   */
  async getShopInventory(
    shopId: string,
    productType?: 'cigar' | 'beer' | 'wine'
  ): Promise<Array<{
    productId: string;
    productType: string;
    brand: string;
    name: string;
    inStock: boolean;
    price?: number;
    lastUpdated: Date;
  }>> {
    try {
      let query = `
        SELECT 
          si.product_id,
          si.product_type,
          si.brand,
          si.name,
          si.in_stock,
          si.price,
          si.last_updated
        FROM shop_inventory si
        WHERE si.shop_id = $1
      `;

      const params = [shopId];

      if (productType) {
        query += ` AND si.product_type = $2`;
        params.push(productType);
      }

      query += ` ORDER BY si.brand, si.name`;

      const results = await this.databaseService.query(query, params);

      return results.map(row => ({
        productId: row.product_id,
        productType: row.product_type,
        brand: row.brand,
        name: row.name,
        inStock: row.in_stock,
        price: row.price,
        lastUpdated: new Date(row.last_updated),
      }));
    } catch (error) {
      this.logger.error('Error getting shop inventory:', error);
      return [];
    }
  }

  /**
   * Add or update shop inventory
   */
  async updateShopInventory(
    shopId: string,
    productId: string,
    productType: 'cigar' | 'beer' | 'wine',
    inventoryData: {
      brand: string;
      name: string;
      inStock: boolean;
      price?: number;
    }
  ): Promise<void> {
    try {
      const query = `
        INSERT INTO shop_inventory (
          shop_id, product_id, product_type, brand, name, in_stock, price, last_updated
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
        ON CONFLICT (shop_id, product_id, product_type)
        DO UPDATE SET
          brand = EXCLUDED.brand,
          name = EXCLUDED.name,
          in_stock = EXCLUDED.in_stock,
          price = EXCLUDED.price,
          last_updated = NOW()
      `;

      await this.databaseService.query(query, [
        shopId,
        productId,
        productType,
        inventoryData.brand,
        inventoryData.name,
        inventoryData.inStock,
        inventoryData.price,
      ]);

      this.logger.log(`Updated inventory for shop ${shopId}, product ${productId}`);
    } catch (error) {
      this.logger.error('Error updating shop inventory:', error);
      throw error;
    }
  }

  /**
   * Enrich shop data with product availability and other details
   */
  private async enrichShopData(shopRow: any, options: SmokeShopSearchOptions): Promise<SmokeShop> {
    const shop = this.formatShopData(shopRow);

    // Check product availability if searching for specific product
    if (options.productId) {
      const inventoryQuery = `
        SELECT in_stock, price, last_updated
        FROM shop_inventory
        WHERE shop_id = $1 AND product_id = $2 AND product_type = $3
      `;

      const inventoryResults = await this.databaseService.query(inventoryQuery, [
        shop.id,
        options.productId,
        options.productType,
      ]);

      if (inventoryResults.length > 0) {
        const inventory = inventoryResults[0];
        shop.hasProduct = true;
        shop.productAvailability = {
          inStock: inventory.in_stock,
          price: inventory.price,
          lastUpdated: new Date(inventory.last_updated),
        };
      } else {
        shop.hasProduct = false;
      }
    }

    return shop;
  }

  /**
   * Format raw shop data from database
   */
  private formatShopData(row: any): SmokeShop {
    return {
      id: row.id,
      name: row.name,
      address: row.address,
      city: row.city,
      state: row.state,
      zipCode: row.zip_code,
      country: row.country,
      latitude: parseFloat(row.latitude),
      longitude: parseFloat(row.longitude),
      phone: row.phone,
      website: row.website,
      email: row.email,
      hours: row.hours ? JSON.parse(row.hours) : undefined,
      specialties: row.specialties || [],
      brands: row.brands || [],
      rating: parseFloat(row.rating || '0'),
      reviewCount: parseInt(row.review_count || '0'),
      distance: row.distance ? parseFloat(row.distance) : undefined,
    };
  }

  /**
   * Get popular smoke shops in a region
   */
  async getPopularShops(
    latitude: number,
    longitude: number,
    radius: number = 50,
    limit: number = 10
  ): Promise<SmokeShop[]> {
    try {
      const query = `
        SELECT 
          s.*,
          COALESCE(AVG(r.rating), 0) as rating,
          COUNT(r.id) as review_count,
          (
            3959 * acos(
              cos(radians($1)) * cos(radians(s.latitude)) *
              cos(radians(s.longitude) - radians($2)) +
              sin(radians($1)) * sin(radians(s.latitude))
            )
          ) AS distance
        FROM smoke_shops s
        LEFT JOIN shop_reviews r ON s.id = r.shop_id
        WHERE (
          3959 * acos(
            cos(radians($1)) * cos(radians(s.latitude)) *
            cos(radians(s.longitude) - radians($2)) +
            sin(radians($1)) * sin(radians(s.latitude))
          )
        ) <= $3
        GROUP BY s.id
        HAVING COUNT(r.id) >= 5 OR AVG(r.rating) >= 4.0
        ORDER BY AVG(r.rating) DESC, COUNT(r.id) DESC, distance ASC
        LIMIT $4
      `;

      const results = await this.databaseService.query(query, [latitude, longitude, radius, limit]);
      return results.map(row => this.formatShopData(row));
    } catch (error) {
      this.logger.error('Error getting popular shops:', error);
      return [];
    }
  }
}
