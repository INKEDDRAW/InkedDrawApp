/**
 * SyncQueue Model
 * WatermelonDB model for managing offline sync queue
 */

import { Model } from '@nozbe/watermelondb';
import { field, readonly, date } from '@nozbe/watermelondb/decorators';

export default class SyncQueue extends Model {
  static table = 'sync_queue';

  @field('table_name') tableName!: string;
  @field('record_id') recordId!: string;
  @field('action') action!: 'create' | 'update' | 'delete';
  @field('data') dataRaw!: string;
  @field('priority') priority!: number;
  @field('retry_count') retryCount!: number;
  @date('last_attempt') lastAttempt?: Date;
  @field('error_message') errorMessage?: string;
  @readonly @date('created_at') createdAt!: Date;

  // Computed properties
  get data(): any {
    try {
      return JSON.parse(this.dataRaw);
    } catch {
      return {};
    }
  }

  set data(value: any) {
    this.dataRaw = JSON.stringify(value);
  }

  get hasError(): boolean {
    return !!this.errorMessage;
  }

  get shouldRetry(): boolean {
    return this.retryCount < 3;
  }

  get nextRetryDelay(): number {
    // Exponential backoff: 1s, 2s, 4s, 8s, etc.
    return Math.pow(2, this.retryCount) * 1000;
  }

  get isHighPriority(): boolean {
    return this.priority >= 5;
  }

  get ageInMinutes(): number {
    return Math.floor((Date.now() - this.createdAt.getTime()) / (1000 * 60));
  }

  get isStale(): boolean {
    return this.ageInMinutes > 60; // Older than 1 hour
  }

  // Helper methods
  async incrementRetryCount(errorMessage?: string) {
    await this.update(item => {
      item.retryCount += 1;
      item.lastAttempt = new Date();
      if (errorMessage) {
        item.errorMessage = errorMessage;
      }
    });
  }

  async clearError() {
    await this.update(item => {
      item.errorMessage = undefined;
    });
  }

  async updatePriority(newPriority: number) {
    await this.update(item => {
      item.priority = newPriority;
    });
  }
}
