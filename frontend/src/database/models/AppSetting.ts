/**
 * AppSetting Model
 * WatermelonDB model for app settings and cache
 */

import { Model } from '@nozbe/watermelondb';
import { field, date } from '@nozbe/watermelondb/decorators';

export default class AppSetting extends Model {
  static table = 'app_settings';

  @field('key') key!: string;
  @field('value') value!: string;
  @date('updated_at') updatedAt!: Date;

  // Computed properties
  get parsedValue(): any {
    try {
      return JSON.parse(this.value);
    } catch {
      return this.value;
    }
  }

  get isBoolean(): boolean {
    return this.value === 'true' || this.value === 'false';
  }

  get isNumber(): boolean {
    return !isNaN(Number(this.value));
  }

  get isJSON(): boolean {
    try {
      JSON.parse(this.value);
      return true;
    } catch {
      return false;
    }
  }

  get booleanValue(): boolean {
    return this.value === 'true';
  }

  get numberValue(): number {
    return Number(this.value);
  }

  // Helper methods
  async updateValue(newValue: any) {
    await this.update(setting => {
      setting.value = typeof newValue === 'string' ? newValue : JSON.stringify(newValue);
      setting.updatedAt = new Date();
    });
  }
}
