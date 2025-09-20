/**
 * Collection Model
 * WatermelonDB model for user's personal collection/inventory
 */

import { Model } from '@nozbe/watermelondb';
import { field, readonly, date, relation } from '@nozbe/watermelondb/decorators';
import { Associations } from '@nozbe/watermelondb/Model';
import User from './User';

export default class Collection extends Model {
  static table = 'collections';
  static associations: Associations = {
    user: { type: 'belongs_to', key: 'user_id' },
    cigar: { type: 'belongs_to', key: 'product_id' },
    beer: { type: 'belongs_to', key: 'product_id' },
    wine: { type: 'belongs_to', key: 'product_id' },
  };

  @field('server_id') serverId!: string;
  @field('user_id') userId!: string;
  @field('product_id') productId!: string;
  @field('product_type') productType!: 'cigar' | 'beer' | 'wine';
  @field('quantity') quantity!: number;
  @date('purchase_date') purchaseDate?: Date;
  @field('purchase_price') purchasePrice?: number;
  @field('storage_location') storageLocation?: string;
  @field('notes') notes?: string;
  @field('is_wishlist') isWishlist!: boolean;
  @field('is_favorite') isFavorite!: boolean;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
  @date('last_synced_at') lastSyncedAt?: Date;
  @field('sync_status') syncStatus!: string;

  // Relationships
  @relation('users', 'user_id') user!: User;

  // Computed properties
  get totalValue(): number {
    return this.purchasePrice ? this.purchasePrice * this.quantity : 0;
  }

  get formattedPurchasePrice(): string {
    return this.purchasePrice ? `$${this.purchasePrice.toFixed(2)}` : 'Not specified';
  }

  get formattedTotalValue(): string {
    return `$${this.totalValue.toFixed(2)}`;
  }

  get ageInDays(): number {
    if (!this.purchaseDate) return 0;
    return Math.floor((Date.now() - this.purchaseDate.getTime()) / (1000 * 60 * 60 * 24));
  }

  get isRecent(): boolean {
    return this.ageInDays <= 30;
  }

  get isInStock(): boolean {
    return this.quantity > 0;
  }

  get isLowStock(): boolean {
    return this.quantity > 0 && this.quantity <= 2;
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

  // Helper methods
  async updateQuantity(newQuantity: number) {
    await this.update(collection => {
      collection.quantity = Math.max(0, newQuantity);
      collection.syncStatus = 'pending';
    });
  }

  async incrementQuantity(amount: number = 1) {
    await this.updateQuantity(this.quantity + amount);
  }

  async decrementQuantity(amount: number = 1) {
    await this.updateQuantity(this.quantity - amount);
  }

  async toggleFavorite() {
    await this.update(collection => {
      collection.isFavorite = !collection.isFavorite;
      collection.syncStatus = 'pending';
    });
  }

  async toggleWishlist() {
    await this.update(collection => {
      collection.isWishlist = !collection.isWishlist;
      collection.syncStatus = 'pending';
    });
  }

  async updateNotes(newNotes: string) {
    await this.update(collection => {
      collection.notes = newNotes;
      collection.syncStatus = 'pending';
    });
  }

  async updateStorageLocation(newLocation: string) {
    await this.update(collection => {
      collection.storageLocation = newLocation;
      collection.syncStatus = 'pending';
    });
  }

  async updatePurchaseInfo(price?: number, date?: Date) {
    await this.update(collection => {
      if (price !== undefined) collection.purchasePrice = price;
      if (date !== undefined) collection.purchaseDate = date;
      collection.syncStatus = 'pending';
    });
  }

  async markForSync() {
    await this.update(collection => {
      collection.syncStatus = 'pending';
    });
  }

  async markAsSynced() {
    await this.update(collection => {
      collection.syncStatus = 'synced';
      collection.lastSyncedAt = new Date();
    });
  }

  async markAsConflicted() {
    await this.update(collection => {
      collection.syncStatus = 'conflict';
    });
  }

  // Search helpers
  matchesSearch(query: string): boolean {
    const searchTerm = query.toLowerCase();
    return (
      (this.notes && this.notes.toLowerCase().includes(searchTerm)) ||
      (this.storageLocation && this.storageLocation.toLowerCase().includes(searchTerm))
    );
  }

  // Filter helpers
  matchesFilters(filters: {
    productTypes?: string[];
    inStock?: boolean;
    favorites?: boolean;
    wishlist?: boolean;
    recentlyAdded?: boolean;
    priceRange?: [number, number];
    storageLocations?: string[];
  }): boolean {
    if (filters.productTypes && !filters.productTypes.includes(this.productType)) return false;
    if (filters.inStock !== undefined && this.isInStock !== filters.inStock) return false;
    if (filters.favorites !== undefined && this.isFavorite !== filters.favorites) return false;
    if (filters.wishlist !== undefined && this.isWishlist !== filters.wishlist) return false;
    if (filters.recentlyAdded !== undefined && this.isRecent !== filters.recentlyAdded) return false;
    
    if (filters.priceRange && this.purchasePrice) {
      const [minPrice, maxPrice] = filters.priceRange;
      if (this.purchasePrice < minPrice || this.purchasePrice > maxPrice) return false;
    }
    
    if (filters.storageLocations && this.storageLocation) {
      if (!filters.storageLocations.includes(this.storageLocation)) return false;
    }
    
    return true;
  }
}
