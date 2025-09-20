/**
 * Cigar Model
 * WatermelonDB model for cigar data
 */

import { Model } from '@nozbe/watermelondb';
import { field, readonly, date, children, lazy } from '@nozbe/watermelondb/decorators';
import { Associations } from '@nozbe/watermelondb/Model';

export interface CigarTags {
  flavor_profile: string[];
  strength_notes: string[];
  occasions: string[];
  pairings: string[];
}

export default class Cigar extends Model {
  static table = 'cigars';
  static associations: Associations = {
    ratings: { type: 'has_many', foreignKey: 'product_id' },
    collections: { type: 'has_many', foreignKey: 'product_id' },
    posts: { type: 'has_many', foreignKey: 'product_id' },
  };

  @field('server_id') serverId!: string;
  @field('name') name!: string;
  @field('brand') brand!: string;
  @field('origin') origin!: string;
  @field('wrapper') wrapper!: string;
  @field('binder') binder!: string;
  @field('filler') filler!: string;
  @field('strength') strength!: string;
  @field('size') size!: string;
  @field('ring_gauge') ringGauge!: number;
  @field('length') length!: number;
  @field('price') price?: number;
  @field('description') description?: string;
  @field('image_url') imageUrl?: string;
  @field('average_rating') averageRating!: number;
  @field('rating_count') ratingCount!: number;
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
  get tags(): CigarTags {
    try {
      return JSON.parse(this.tagsRaw);
    } catch {
      return {
        flavor_profile: [],
        strength_notes: [],
        occasions: [],
        pairings: [],
      };
    }
  }

  set tags(value: CigarTags) {
    this.tagsRaw = JSON.stringify(value);
  }

  get strengthLevel(): number {
    switch (this.strength.toLowerCase()) {
      case 'mild': return 1;
      case 'medium-mild': return 2;
      case 'medium': return 3;
      case 'medium-full': return 4;
      case 'full': return 5;
      default: return 3;
    }
  }

  get formattedPrice(): string {
    return this.price ? `$${this.price.toFixed(2)}` : 'Price not available';
  }

  get vitola(): string {
    return `${this.size} (${this.ringGauge} x ${this.length}")`;
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
    await this.update(cigar => {
      cigar.averageRating = newAverageRating;
      cigar.ratingCount = newRatingCount;
      cigar.syncStatus = 'pending';
    });
  }

  async addToTags(category: keyof CigarTags, newTags: string[]) {
    await this.update(cigar => {
      const currentTags = cigar.tags;
      currentTags[category] = [...new Set([...currentTags[category], ...newTags])];
      cigar.tags = currentTags;
      cigar.syncStatus = 'pending';
    });
  }

  async removeFromTags(category: keyof CigarTags, tagsToRemove: string[]) {
    await this.update(cigar => {
      const currentTags = cigar.tags;
      currentTags[category] = currentTags[category].filter(tag => !tagsToRemove.includes(tag));
      cigar.tags = currentTags;
      cigar.syncStatus = 'pending';
    });
  }

  async markForSync() {
    await this.update(cigar => {
      cigar.syncStatus = 'pending';
    });
  }

  async markAsSynced() {
    await this.update(cigar => {
      cigar.syncStatus = 'synced';
      cigar.lastSyncedAt = new Date();
    });
  }

  async markAsConflicted() {
    await this.update(cigar => {
      cigar.syncStatus = 'conflict';
    });
  }

  // Search and filter helpers
  static getSearchableFields(): string[] {
    return ['name', 'brand', 'origin', 'wrapper', 'strength', 'category'];
  }

  matchesSearch(query: string): boolean {
    const searchTerm = query.toLowerCase();
    return (
      this.name.toLowerCase().includes(searchTerm) ||
      this.brand.toLowerCase().includes(searchTerm) ||
      this.origin.toLowerCase().includes(searchTerm) ||
      this.wrapper.toLowerCase().includes(searchTerm) ||
      this.strength.toLowerCase().includes(searchTerm) ||
      this.category.toLowerCase().includes(searchTerm) ||
      (this.description && this.description.toLowerCase().includes(searchTerm))
    );
  }

  matchesFilters(filters: {
    brands?: string[];
    origins?: string[];
    strengths?: string[];
    categories?: string[];
    priceRange?: [number, number];
    ratingRange?: [number, number];
  }): boolean {
    if (filters.brands && !filters.brands.includes(this.brand)) return false;
    if (filters.origins && !filters.origins.includes(this.origin)) return false;
    if (filters.strengths && !filters.strengths.includes(this.strength)) return false;
    if (filters.categories && !filters.categories.includes(this.category)) return false;
    
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
