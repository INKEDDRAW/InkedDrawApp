/**
 * Wine Model
 * WatermelonDB model for wine data
 */

import { Model } from '@nozbe/watermelondb';
import { field, readonly, date, children, lazy } from '@nozbe/watermelondb/decorators';
import { Associations } from '@nozbe/watermelondb/Model';

export interface WineTags {
  flavor_profile: string[];
  tasting_notes: string[];
  occasions: string[];
  pairings: string[];
}

export default class Wine extends Model {
  static table = 'wines';
  static associations: Associations = {
    ratings: { type: 'has_many', foreignKey: 'product_id' },
    collections: { type: 'has_many', foreignKey: 'product_id' },
    posts: { type: 'has_many', foreignKey: 'product_id' },
  };

  @field('server_id') serverId!: string;
  @field('name') name!: string;
  @field('winery') winery!: string;
  @field('varietal') varietal!: string;
  @field('vintage') vintage!: number;
  @field('region') region!: string;
  @field('country') country!: string;
  @field('type') type!: string;
  @field('alcohol_content') alcoholContent!: number;
  @field('description') description?: string;
  @field('image_url') imageUrl?: string;
  @field('average_rating') averageRating!: number;
  @field('rating_count') ratingCount!: number;
  @field('price') price?: number;
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
  get tags(): WineTags {
    try {
      return JSON.parse(this.tagsRaw);
    } catch {
      return {
        flavor_profile: [],
        tasting_notes: [],
        occasions: [],
        pairings: [],
      };
    }
  }

  set tags(value: WineTags) {
    this.tagsRaw = JSON.stringify(value);
  }

  get formattedAlcoholContent(): string {
    return `${this.alcoholContent.toFixed(1)}% ABV`;
  }

  get formattedPrice(): string {
    return this.price ? `$${this.price.toFixed(2)}` : 'Price not available';
  }

  get fullName(): string {
    return `${this.winery} ${this.name} ${this.vintage}`;
  }

  get ageInYears(): number {
    return new Date().getFullYear() - this.vintage;
  }

  get isVintage(): boolean {
    return this.ageInYears >= 5;
  }

  get wineTypeColor(): string {
    switch (this.type.toLowerCase()) {
      case 'red': return '#722F37';
      case 'white': return '#F7E7CE';
      case 'rosé': case 'rose': return '#FFB6C1';
      case 'sparkling': return '#F0F8FF';
      case 'dessert': return '#DDA0DD';
      default: return '#8B4513';
    }
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
    await this.update(wine => {
      wine.averageRating = newAverageRating;
      wine.ratingCount = newRatingCount;
      wine.syncStatus = 'pending';
    });
  }

  async markForSync() {
    await this.update(wine => {
      wine.syncStatus = 'pending';
    });
  }

  async markAsSynced() {
    await this.update(wine => {
      wine.syncStatus = 'synced';
      wine.lastSyncedAt = new Date();
    });
  }

  async markAsConflicted() {
    await this.update(wine => {
      wine.syncStatus = 'conflict';
    });
  }

  // Search and filter helpers
  matchesSearch(query: string): boolean {
    const searchTerm = query.toLowerCase();
    return (
      this.name.toLowerCase().includes(searchTerm) ||
      this.winery.toLowerCase().includes(searchTerm) ||
      this.varietal.toLowerCase().includes(searchTerm) ||
      this.region.toLowerCase().includes(searchTerm) ||
      this.country.toLowerCase().includes(searchTerm) ||
      this.type.toLowerCase().includes(searchTerm) ||
      this.category.toLowerCase().includes(searchTerm) ||
      this.vintage.toString().includes(searchTerm) ||
      (this.description && this.description.toLowerCase().includes(searchTerm))
    );
  }

  matchesFilters(filters: {
    wineries?: string[];
    varietals?: string[];
    regions?: string[];
    countries?: string[];
    types?: string[];
    categories?: string[];
    vintageRange?: [number, number];
    alcoholRange?: [number, number];
    priceRange?: [number, number];
    ratingRange?: [number, number];
  }): boolean {
    if (filters.wineries && !filters.wineries.includes(this.winery)) return false;
    if (filters.varietals && !filters.varietals.includes(this.varietal)) return false;
    if (filters.regions && !filters.regions.includes(this.region)) return false;
    if (filters.countries && !filters.countries.includes(this.country)) return false;
    if (filters.types && !filters.types.includes(this.type)) return false;
    if (filters.categories && !filters.categories.includes(this.category)) return false;
    
    if (filters.vintageRange) {
      const [minVintage, maxVintage] = filters.vintageRange;
      if (this.vintage < minVintage || this.vintage > maxVintage) return false;
    }
    
    if (filters.alcoholRange) {
      const [minAlcohol, maxAlcohol] = filters.alcoholRange;
      if (this.alcoholContent < minAlcohol || this.alcoholContent > maxAlcohol) return false;
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
