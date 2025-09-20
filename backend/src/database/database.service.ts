/**
 * Database Service
 * Centralized service for Supabase database operations
 */

import { Injectable, Logger } from '@nestjs/common';
import { supabase, supabaseAdmin, tables } from '../../supabase/config';
import { Database } from '../../supabase/types';

type Tables = Database['public']['Tables'];

@Injectable()
export class DatabaseService {
  private readonly logger = new Logger(DatabaseService.name);

  constructor() {
    this.logger.log('Database service initialized with Supabase');
  }

  // Public client (for authenticated operations)
  get client() {
    return supabase;
  }

  // Admin client (for elevated operations)
  get adminClient() {
    return supabaseAdmin;
  }

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    try {
      const { data, error } = await supabase
        .from(tables.cigars)
        .select('count(*)')
        .limit(1);

      if (error) {
        this.logger.error('Health check failed:', error.message);
        throw error;
      }

      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Database health check failed:', error);
      throw error;
    }
  }

  // Generic query methods
  async findMany<T extends keyof Tables>(
    table: T,
    options?: {
      select?: string;
      filter?: Record<string, any>;
      limit?: number;
      offset?: number;
      orderBy?: { column: string; ascending?: boolean };
    }
  ) {
    try {
      let query = supabase.from(table).select(options?.select || '*');

      if (options?.filter) {
        Object.entries(options.filter).forEach(([key, value]) => {
          query = query.eq(key, value);
        });
      }

      if (options?.orderBy) {
        query = query.order(options.orderBy.column, {
          ascending: options.orderBy.ascending ?? true,
        });
      }

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      if (options?.offset) {
        query = query.range(options.offset, (options.offset + (options.limit || 10)) - 1);
      }

      const { data, error } = await query;

      if (error) {
        this.logger.error(`Error querying ${table}:`, error.message);
        throw error;
      }

      return data;
    } catch (error) {
      this.logger.error(`Database query failed for table ${table}:`, error);
      throw error;
    }
  }

  async findById<T extends keyof Tables>(
    table: T,
    id: string,
    select?: string
  ) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select(select || '*')
        .eq('id', id)
        .single();

      if (error) {
        this.logger.error(`Error finding ${table} by ID:`, error.message);
        throw error;
      }

      return data;
    } catch (error) {
      this.logger.error(`Database findById failed for table ${table}:`, error);
      throw error;
    }
  }

  async create<T extends keyof Tables>(
    table: T,
    data: Tables[T]['Insert']
  ) {
    try {
      const { data: result, error } = await supabase
        .from(table)
        .insert(data)
        .select()
        .single();

      if (error) {
        this.logger.error(`Error creating ${table}:`, error.message);
        throw error;
      }

      return result;
    } catch (error) {
      this.logger.error(`Database create failed for table ${table}:`, error);
      throw error;
    }
  }

  async update<T extends keyof Tables>(
    table: T,
    id: string,
    data: Tables[T]['Update']
  ) {
    try {
      const { data: result, error } = await supabase
        .from(table)
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        this.logger.error(`Error updating ${table}:`, error.message);
        throw error;
      }

      return result;
    } catch (error) {
      this.logger.error(`Database update failed for table ${table}:`, error);
      throw error;
    }
  }

  async delete<T extends keyof Tables>(table: T, id: string) {
    try {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id);

      if (error) {
        this.logger.error(`Error deleting from ${table}:`, error.message);
        throw error;
      }

      return { success: true };
    } catch (error) {
      this.logger.error(`Database delete failed for table ${table}:`, error);
      throw error;
    }
  }

  // Search functionality
  async search<T extends keyof Tables>(
    table: T,
    query: string,
    options?: {
      limit?: number;
      select?: string;
    }
  ) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select(options?.select || '*')
        .textSearch('search_vector', query)
        .limit(options?.limit || 20);

      if (error) {
        this.logger.error(`Error searching ${table}:`, error.message);
        throw error;
      }

      return data;
    } catch (error) {
      this.logger.error(`Database search failed for table ${table}:`, error);
      throw error;
    }
  }
}
