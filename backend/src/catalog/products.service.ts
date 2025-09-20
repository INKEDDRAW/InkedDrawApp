/**
 * Products Service
 * Business logic for product catalog management
 */

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

export interface ProductFilters {
  category?: 'cigars' | 'beers' | 'wines';
  priceRange?: 'budget' | 'mid' | 'premium' | 'luxury';
  minRating?: number;
  search?: string;
  tags?: string[];
  sortBy?: 'name' | 'rating' | 'price' | 'newest';
  sortOrder?: 'asc' | 'desc';
}

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Get products with filtering and pagination
   */
  async getProducts(
    filters: ProductFilters = {},
    limit: number = 20,
    offset: number = 0
  ): Promise<any[]> {
    try {
      const {
        category,
        priceRange,
        minRating,
        search,
        tags,
        sortBy = 'rating',
        sortOrder = 'desc',
      } = filters;

      // Build base query for each product type
      const queries = [];
      
      if (!category || category === 'cigars') {
        queries.push(this.buildCigarQuery(filters));
      }
      
      if (!category || category === 'beers') {
        queries.push(this.buildBeerQuery(filters));
      }
      
      if (!category || category === 'wines') {
        queries.push(this.buildWineQuery(filters));
      }

      // Union all queries
      const unionQuery = queries.join(' UNION ALL ');
      
      // Add ordering and pagination
      const finalQuery = `
        SELECT * FROM (${unionQuery}) AS products
        ORDER BY ${this.getSortField(sortBy)} ${sortOrder.toUpperCase()}
        LIMIT $1 OFFSET $2
      `;

      const result = await this.databaseService.query(finalQuery, [limit, offset]);
      
      return result.map(product => this.formatProduct(product));
    } catch (error) {
      this.logger.error('Error getting products:', error);
      throw error;
    }
  }

  /**
   * Get product by ID and type
   */
  async getProductById(productId: string, productType: 'cigar' | 'beer' | 'wine'): Promise<any> {
    try {
      let query: string;
      let tableName: string;

      switch (productType) {
        case 'cigar':
          tableName = 'cigars';
          query = `
            SELECT 
              c.*,
              'cigar' as product_type,
              COALESCE(AVG(r.rating), 0) as average_rating,
              COUNT(r.id) as rating_count
            FROM cigars c
            LEFT JOIN user_cigars r ON c.id = r.cigar_id
            WHERE c.id = $1
            GROUP BY c.id
          `;
          break;
        case 'beer':
          tableName = 'beers';
          query = `
            SELECT 
              b.*,
              'beer' as product_type,
              COALESCE(AVG(r.rating), 0) as average_rating,
              COUNT(r.id) as rating_count
            FROM beers b
            LEFT JOIN user_beers r ON b.id = r.beer_id
            WHERE b.id = $1
            GROUP BY b.id
          `;
          break;
        case 'wine':
          tableName = 'wines';
          query = `
            SELECT 
              w.*,
              'wine' as product_type,
              COALESCE(AVG(r.rating), 0) as average_rating,
              COUNT(r.id) as rating_count
            FROM wines w
            LEFT JOIN user_wines r ON w.id = r.wine_id
            WHERE w.id = $1
            GROUP BY w.id
          `;
          break;
        default:
          throw new Error('Invalid product type');
      }

      const result = await this.databaseService.query(query, [productId]);
      
      if (result.length === 0) {
        throw new NotFoundException('Product not found');
      }

      return this.formatProduct(result[0]);
    } catch (error) {
      this.logger.error(`Error getting product ${productId}:`, error);
      throw error;
    }
  }

  /**
   * Search products with full-text search
   */
  async searchProducts(
    searchQuery: string,
    filters: ProductFilters = {},
    limit: number = 20,
    offset: number = 0
  ): Promise<any[]> {
    try {
      const queries = [];
      
      if (!filters.category || filters.category === 'cigars') {
        queries.push(`
          SELECT 
            c.*,
            'cigar' as product_type,
            COALESCE(AVG(r.rating), 0) as average_rating,
            COUNT(r.id) as rating_count,
            ts_rank(to_tsvector('english', c.name || ' ' || c.brand || ' ' || COALESCE(c.description, '')), plainto_tsquery('english', $1)) as search_rank
          FROM cigars c
          LEFT JOIN user_cigars r ON c.id = r.cigar_id
          WHERE to_tsvector('english', c.name || ' ' || c.brand || ' ' || COALESCE(c.description, '')) @@ plainto_tsquery('english', $1)
          GROUP BY c.id
        `);
      }
      
      if (!filters.category || filters.category === 'beers') {
        queries.push(`
          SELECT 
            b.*,
            'beer' as product_type,
            COALESCE(AVG(r.rating), 0) as average_rating,
            COUNT(r.id) as rating_count,
            ts_rank(to_tsvector('english', b.name || ' ' || b.brewery || ' ' || COALESCE(b.description, '')), plainto_tsquery('english', $1)) as search_rank
          FROM beers b
          LEFT JOIN user_beers r ON b.id = r.beer_id
          WHERE to_tsvector('english', b.name || ' ' || b.brewery || ' ' || COALESCE(b.description, '')) @@ plainto_tsquery('english', $1)
          GROUP BY b.id
        `);
      }
      
      if (!filters.category || filters.category === 'wines') {
        queries.push(`
          SELECT 
            w.*,
            'wine' as product_type,
            COALESCE(AVG(r.rating), 0) as average_rating,
            COUNT(r.id) as rating_count,
            ts_rank(to_tsvector('english', w.name || ' ' || w.winery || ' ' || COALESCE(w.description, '')), plainto_tsquery('english', $1)) as search_rank
          FROM wines w
          LEFT JOIN user_wines r ON w.id = r.wine_id
          WHERE to_tsvector('english', w.name || ' ' || w.winery || ' ' || COALESCE(w.description, '')) @@ plainto_tsquery('english', $1)
          GROUP BY w.id
        `);
      }

      const unionQuery = queries.join(' UNION ALL ');
      const finalQuery = `
        SELECT * FROM (${unionQuery}) AS products
        ORDER BY search_rank DESC, average_rating DESC
        LIMIT $2 OFFSET $3
      `;

      const result = await this.databaseService.query(finalQuery, [searchQuery, limit, offset]);
      
      return result.map(product => this.formatProduct(product));
    } catch (error) {
      this.logger.error('Error searching products:', error);
      throw error;
    }
  }

  /**
   * Get similar products based on tags and characteristics
   */
  async getSimilarProducts(
    productId: string,
    productType: 'cigar' | 'beer' | 'wine',
    limit: number = 6
  ): Promise<any[]> {
    try {
      // Get the current product to find similar ones
      const currentProduct = await this.getProductById(productId, productType);
      
      let query: string;
      
      switch (productType) {
        case 'cigar':
          query = `
            SELECT 
              c.*,
              'cigar' as product_type,
              COALESCE(AVG(r.rating), 0) as average_rating,
              COUNT(r.id) as rating_count
            FROM cigars c
            LEFT JOIN user_cigars r ON c.id = r.cigar_id
            WHERE c.id != $1
              AND (c.strength = $2 OR c.origin_country = $3 OR c.wrapper_type = $4)
            GROUP BY c.id
            ORDER BY average_rating DESC
            LIMIT $5
          `;
          
          return await this.databaseService.query(query, [
            productId,
            currentProduct.strength,
            currentProduct.origin_country,
            currentProduct.wrapper_type,
            limit,
          ]);
          
        case 'beer':
          query = `
            SELECT 
              b.*,
              'beer' as product_type,
              COALESCE(AVG(r.rating), 0) as average_rating,
              COUNT(r.id) as rating_count
            FROM beers b
            LEFT JOIN user_beers r ON b.id = r.beer_id
            WHERE b.id != $1
              AND (b.style = $2 OR b.origin_country = $3)
            GROUP BY b.id
            ORDER BY average_rating DESC
            LIMIT $4
          `;
          
          return await this.databaseService.query(query, [
            productId,
            currentProduct.style,
            currentProduct.origin_country,
            limit,
          ]);
          
        case 'wine':
          query = `
            SELECT 
              w.*,
              'wine' as product_type,
              COALESCE(AVG(r.rating), 0) as average_rating,
              COUNT(r.id) as rating_count
            FROM wines w
            LEFT JOIN user_wines r ON w.id = r.wine_id
            WHERE w.id != $1
              AND (w.wine_type = $2 OR w.region = $3 OR w.country = $4)
            GROUP BY w.id
            ORDER BY average_rating DESC
            LIMIT $5
          `;
          
          return await this.databaseService.query(query, [
            productId,
            currentProduct.wine_type,
            currentProduct.region,
            currentProduct.country,
            limit,
          ]);
          
        default:
          return [];
      }
    } catch (error) {
      this.logger.error(`Error getting similar products for ${productId}:`, error);
      return [];
    }
  }

  /**
   * Build cigar query with filters
   */
  private buildCigarQuery(filters: ProductFilters): string {
    const conditions = ['1=1'];
    
    if (filters.priceRange) {
      conditions.push(`c.price_range = '${filters.priceRange}'`);
    }
    
    if (filters.minRating) {
      conditions.push(`COALESCE(AVG(r.rating), 0) >= ${filters.minRating}`);
    }

    return `
      SELECT 
        c.*,
        'cigar' as product_type,
        COALESCE(AVG(r.rating), 0) as average_rating,
        COUNT(r.id) as rating_count
      FROM cigars c
      LEFT JOIN user_cigars r ON c.id = r.cigar_id
      WHERE ${conditions.join(' AND ')}
      GROUP BY c.id
    `;
  }

  /**
   * Build beer query with filters
   */
  private buildBeerQuery(filters: ProductFilters): string {
    const conditions = ['1=1'];
    
    if (filters.priceRange) {
      conditions.push(`b.price_range = '${filters.priceRange}'`);
    }
    
    if (filters.minRating) {
      conditions.push(`COALESCE(AVG(r.rating), 0) >= ${filters.minRating}`);
    }

    return `
      SELECT 
        b.*,
        'beer' as product_type,
        COALESCE(AVG(r.rating), 0) as average_rating,
        COUNT(r.id) as rating_count
      FROM beers b
      LEFT JOIN user_beers r ON b.id = r.beer_id
      WHERE ${conditions.join(' AND ')}
      GROUP BY b.id
    `;
  }

  /**
   * Build wine query with filters
   */
  private buildWineQuery(filters: ProductFilters): string {
    const conditions = ['1=1'];
    
    if (filters.priceRange) {
      conditions.push(`w.price_range = '${filters.priceRange}'`);
    }
    
    if (filters.minRating) {
      conditions.push(`COALESCE(AVG(r.rating), 0) >= ${filters.minRating}`);
    }

    return `
      SELECT 
        w.*,
        'wine' as product_type,
        COALESCE(AVG(r.rating), 0) as average_rating,
        COUNT(r.id) as rating_count
      FROM wines w
      LEFT JOIN user_wines r ON w.id = r.wine_id
      WHERE ${conditions.join(' AND ')}
      GROUP BY w.id
    `;
  }

  /**
   * Get sort field for SQL query
   */
  private getSortField(sortBy: string): string {
    switch (sortBy) {
      case 'name':
        return 'name';
      case 'rating':
        return 'average_rating';
      case 'price':
        return 'price_range';
      case 'newest':
        return 'created_at';
      default:
        return 'average_rating';
    }
  }

  /**
   * Format product data for response
   */
  private formatProduct(product: any): any {
    return {
      id: product.id,
      type: product.product_type,
      name: product.name,
      brand: product.brand || product.brewery || product.winery,
      description: product.description,
      imageUrl: product.image_url,
      averageRating: parseFloat(product.average_rating) || 0,
      ratingCount: parseInt(product.rating_count) || 0,
      priceRange: product.price_range,
      flavorNotes: product.flavor_notes || [],
      createdAt: product.created_at,
      updatedAt: product.updated_at,
      // Type-specific fields
      ...(product.product_type === 'cigar' && {
        origin: product.origin_country,
        strength: product.strength,
        size: product.size_name,
        ringGauge: product.ring_gauge,
        length: product.length_inches,
        wrapper: product.wrapper_type,
        binder: product.binder_type,
        filler: product.filler_type,
      }),
      ...(product.product_type === 'beer' && {
        brewery: product.brewery,
        style: product.style,
        abv: product.abv,
        ibu: product.ibu,
        origin: product.origin_country,
      }),
      ...(product.product_type === 'wine' && {
        winery: product.winery,
        type: product.wine_type,
        varietal: product.varietal,
        vintage: product.vintage_year,
        region: product.region,
        country: product.country,
        abv: product.abv,
        body: product.body,
        sweetness: product.sweetness,
        tannin: product.tannin_level,
        acidity: product.acidity,
      }),
    };
  }
}
