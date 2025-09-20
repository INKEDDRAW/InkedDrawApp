/**
 * Beer Model
 * WatermelonDB model for beer data
 */

import { Model } from '@nozbe/watermelondb';
import { field, readonly, date, children, lazy } from '@nozbe/watermelondb/decorators';
import { Associations } from '@nozbe/watermelondb/Model';

export interface BeerTags {
  flavor_profile: string[];
  style_notes: string[];
  occasions: string[];
  pairings: string[];
}

export default class Beer extends Model {
  static table = 'beers';
  static associations: Associations = {
    ratings: { type: 'has_many', foreignKey: 'product_id' },
    collections: { type: 'has_many', foreignKey: 'product_id' },
    posts: { type: 'has_many', foreignKey: 'product_id' },
  };

  @field('server_id') serverId!: string;
  @field('name') name!: string;
  @field('brewery') brewery!: string;
  @field('style') style!: string;
  @field('abv') abv!: number;
  @field('ibu') ibu?: number;
  @field('description') description?: string;
  @field('image_url') imageUrl?: string;
  @field('average_rating') averageRating!: number;
  @field('rating_count') ratingCount!: number;
  @field('price') price?: number;
  @field('availability') availability!: string;
  @field('origin') origin!: string;
  @field('category') category!: string;
  @field('tags') tagsRaw!: string;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
  @date('last_synced_at') lastSyncedAt?: Date;
  @field('sync_status') syncStatus!: string;

  // Relationships
  @children('ratings') ratings!: any;
  @children('collections') collections!: any;
  @children('posts') posts!: any;

  // Computed properties
  get tags(): BeerTags {
    try {
      return JSON.parse(this.tagsRaw);
    } catch {
      return {
        flavor_profile: [],
        style_notes: [],
        occasions: [],
        pairings: [],
      };
    }
  }

  set tags(value: BeerTags) {
    this.tagsRaw = JSON.stringify(value);
  }

  get formattedAbv(): string {
    return `${this.abv.toFixed(1)}% ABV`;
  }

  get formattedIbu(): string {
    return this.ibu ? `${this.ibu} IBU` : 'IBU not available';
  }

  get formattedPrice(): string {
    return this.price ? `$${this.price.toFixed(2)}` : 'Price not available';
  }

  get strengthLevel(): number {
    // Convert ABV to strength level (1-5)
    if (this.abv < 4) return 1;
    if (this.abv < 6) return 2;
    if (this.abv < 8) return 3;
    if (this.abv < 10) return 4;
    return 5;
  }

  get isOnline(): boolean {
    return this.syncStatus === 'synced';
  }

  get needsSync(): boolean {
    return this.syncStatus === 'pending';
  }

  get hasConflict(): boolean {
    return this.syncStatus === 'conflict';
  }

  // Lazy queries for related data
  @lazy userRating = this.collections
    .get('ratings')
    .query()
    .observeWithColumns(['rating']);

  @lazy isInCollection = this.collections
    .get('collections')
    .query()
    .observeCount();

  @lazy isFavorite = this.collections
    .get('collections')
    .query()
    .observeWithColumns(['is_favorite']);

  @lazy relatedPosts = this.posts.observe();

  // Helper methods
  async updateRating(newAverageRating: number, newRatingCount: number) {
    await this.update(beer => {
      beer.averageRating = newAverageRating;
      beer.ratingCount = newRatingCount;
      beer.syncStatus = 'pending';
    });
  }

  async markForSync() {
    await this.update(beer => {
      beer.syncStatus = 'pending';
    });
  }

  async markAsSynced() {
    await this.update(beer => {
      beer.syncStatus = 'synced';
      beer.lastSyncedAt = new Date();
    });
  }

  async markAsConflicted() {
    await this.update(beer => {
      beer.syncStatus = 'conflict';
    });
  }

  // Search and filter helpers
  matchesSearch(query: string): boolean {
    const searchTerm = query.toLowerCase();
    return (
      this.name.toLowerCase().includes(searchTerm) ||
      this.brewery.toLowerCase().includes(searchTerm) ||
      this.style.toLowerCase().includes(searchTerm) ||
      this.origin.toLowerCase().includes(searchTerm) ||
      this.category.toLowerCase().includes(searchTerm) ||
      (this.description && this.description.toLowerCase().includes(searchTerm))
    );
  }

  matchesFilters(filters: {
    breweries?: string[];
    styles?: string[];
    origins?: string[];
    categories?: string[];
    abvRange?: [number, number];
    ibuRange?: [number, number];
    priceRange?: [number, number];
    ratingRange?: [number, number];
  }): boolean {
    if (filters.breweries && !filters.breweries.includes(this.brewery)) return false;
    if (filters.styles && !filters.styles.includes(this.style)) return false;
    if (filters.origins && !filters.origins.includes(this.origin)) return false;
    if (filters.categories && !filters.categories.includes(this.category)) return false;
    
    if (filters.abvRange) {
      const [minAbv, maxAbv] = filters.abvRange;
      if (this.abv < minAbv || this.abv > maxAbv) return false;
    }
    
    if (filters.ibuRange && this.ibu) {
      const [minIbu, maxIbu] = filters.ibuRange;
      if (this.ibu < minIbu || this.ibu > maxIbu) return false;
    }
    
    if (filters.priceRange && this.price) {
      const [minPrice, maxPrice] = filters.priceRange;
      if (this.price < minPrice || this.price > maxPrice) return false;
    }
    
    if (filters.ratingRange) {
      const [minRating, maxRating] = filters.ratingRange;
      if (this.averageRating < minRating || this.averageRating > maxRating) return false;
    }
    
    return true;
  }
}
