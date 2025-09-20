/**
 * Rating Model
 * WatermelonDB model for user ratings and reviews
 */

import { Model } from '@nozbe/watermelondb';
import { field, readonly, date, relation } from '@nozbe/watermelondb/decorators';
import { Associations } from '@nozbe/watermelondb/Model';
import User from './User';
import Cigar from './Cigar';

export interface FlavorNotes {
  primary: string[];
  secondary: string[];
  finish: string[];
}

export interface RatingPhotos {
  url: string;
  localPath?: string;
  caption?: string;
  uploaded: boolean;
}

export default class Rating extends Model {
  static table = 'ratings';
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
  @field('rating') rating!: number;
  @field('review') review?: string;
  @field('flavor_notes') flavorNotesRaw?: string;
  @field('photos') photosRaw?: string;
  @field('location') location?: string;
  @field('occasion') occasion?: string;
  @field('pairing') pairing?: string;
  @field('is_private') isPrivate!: boolean;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
  @date('last_synced_at') lastSyncedAt?: Date;
  @field('sync_status') syncStatus!: string;

  // Relationships
  @relation('users', 'user_id') user!: User;

  // Computed properties
  get flavorNotes(): FlavorNotes {
    try {
      return this.flavorNotesRaw ? JSON.parse(this.flavorNotesRaw) : {
        primary: [],
        secondary: [],
        finish: [],
      };
    } catch {
      return {
        primary: [],
        secondary: [],
        finish: [],
      };
    }
  }

  set flavorNotes(value: FlavorNotes) {
    this.flavorNotesRaw = JSON.stringify(value);
  }

  get photos(): RatingPhotos[] {
    try {
      return this.photosRaw ? JSON.parse(this.photosRaw) : [];
    } catch {
      return [];
    }
  }

  set photos(value: RatingPhotos[]) {
    this.photosRaw = JSON.stringify(value);
  }

  get ratingStars(): string {
    return '★'.repeat(Math.floor(this.rating)) + '☆'.repeat(5 - Math.floor(this.rating));
  }

  get hasReview(): boolean {
    return !!(this.review && this.review.trim().length > 0);
  }

  get hasPhotos(): boolean {
    return this.photos.length > 0;
  }

  get hasFlavorNotes(): boolean {
    const notes = this.flavorNotes;
    return notes.primary.length > 0 || notes.secondary.length > 0 || notes.finish.length > 0;
  }

  get isComplete(): boolean {
    return this.hasReview || this.hasPhotos || this.hasFlavorNotes;
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

  get pendingPhotoUploads(): RatingPhotos[] {
    return this.photos.filter(photo => !photo.uploaded && photo.localPath);
  }

  // Helper methods
  async updateRating(newRating: number) {
    await this.update(rating => {
      rating.rating = newRating;
      rating.syncStatus = 'pending';
    });
  }

  async updateReview(newReview: string) {
    await this.update(rating => {
      rating.review = newReview;
      rating.syncStatus = 'pending';
    });
  }

  async addFlavorNote(category: keyof FlavorNotes, note: string) {
    await this.update(rating => {
      const currentNotes = rating.flavorNotes;
      if (!currentNotes[category].includes(note)) {
        currentNotes[category].push(note);
        rating.flavorNotes = currentNotes;
        rating.syncStatus = 'pending';
      }
    });
  }

  async removeFlavorNote(category: keyof FlavorNotes, note: string) {
    await this.update(rating => {
      const currentNotes = rating.flavorNotes;
      currentNotes[category] = currentNotes[category].filter(n => n !== note);
      rating.flavorNotes = currentNotes;
      rating.syncStatus = 'pending';
    });
  }

  async addPhoto(photo: RatingPhotos) {
    await this.update(rating => {
      const currentPhotos = rating.photos;
      currentPhotos.push(photo);
      rating.photos = currentPhotos;
      rating.syncStatus = 'pending';
    });
  }

  async removePhoto(photoUrl: string) {
    await this.update(rating => {
      const currentPhotos = rating.photos;
      rating.photos = currentPhotos.filter(photo => photo.url !== photoUrl);
      rating.syncStatus = 'pending';
    });
  }

  async markPhotoAsUploaded(photoUrl: string, serverUrl: string) {
    await this.update(rating => {
      const currentPhotos = rating.photos;
      const photoIndex = currentPhotos.findIndex(photo => photo.url === photoUrl);
      if (photoIndex !== -1) {
        currentPhotos[photoIndex].uploaded = true;
        currentPhotos[photoIndex].url = serverUrl;
        rating.photos = currentPhotos;
      }
    });
  }

  async togglePrivacy() {
    await this.update(rating => {
      rating.isPrivate = !rating.isPrivate;
      rating.syncStatus = 'pending';
    });
  }

  async updateLocation(newLocation: string) {
    await this.update(rating => {
      rating.location = newLocation;
      rating.syncStatus = 'pending';
    });
  }

  async updateOccasion(newOccasion: string) {
    await this.update(rating => {
      rating.occasion = newOccasion;
      rating.syncStatus = 'pending';
    });
  }

  async updatePairing(newPairing: string) {
    await this.update(rating => {
      rating.pairing = newPairing;
      rating.syncStatus = 'pending';
    });
  }

  async markForSync() {
    await this.update(rating => {
      rating.syncStatus = 'pending';
    });
  }

  async markAsSynced() {
    await this.update(rating => {
      rating.syncStatus = 'synced';
      rating.lastSyncedAt = new Date();
    });
  }

  async markAsConflicted() {
    await this.update(rating => {
      rating.syncStatus = 'conflict';
    });
  }

  // Validation helpers
  isValidRating(): boolean {
    return this.rating >= 1 && this.rating <= 5;
  }

  hasMinimumContent(): boolean {
    return this.hasReview || this.hasFlavorNotes || this.hasPhotos;
  }

  // Search helpers
  matchesSearch(query: string): boolean {
    const searchTerm = query.toLowerCase();
    return (
      (this.review && this.review.toLowerCase().includes(searchTerm)) ||
      (this.location && this.location.toLowerCase().includes(searchTerm)) ||
      (this.occasion && this.occasion.toLowerCase().includes(searchTerm)) ||
      (this.pairing && this.pairing.toLowerCase().includes(searchTerm)) ||
      this.flavorNotes.primary.some(note => note.toLowerCase().includes(searchTerm)) ||
      this.flavorNotes.secondary.some(note => note.toLowerCase().includes(searchTerm)) ||
      this.flavorNotes.finish.some(note => note.toLowerCase().includes(searchTerm))
    );
  }
}
