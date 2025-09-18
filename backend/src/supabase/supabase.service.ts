import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private readonly logger = new Logger(SupabaseService.name);
  private supabase: SupabaseClient;
  private adminSupabase: SupabaseClient;

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_ANON_KEY');
    const supabaseServiceKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase URL and Key must be provided');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);

    // Create admin client with service role key (bypasses RLS)
    if (supabaseServiceKey) {
      this.adminSupabase = createClient(supabaseUrl, supabaseServiceKey);
      this.logger.log('Supabase client and admin client initialized');
    } else {
      this.adminSupabase = this.supabase;
      this.logger.log('Supabase client initialized (no service key)');
    }
  }

  getClient(): SupabaseClient {
    return this.supabase;
  }

  getAdminClient(): SupabaseClient {
    return this.adminSupabase;
  }

  // Auth methods
  async signUp(email: string, password: string, metadata?: any) {
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    });

    if (error) {
      this.logger.error('Signup error:', error.message);
      throw error;
    }

    return data;
  }

  async signIn(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      this.logger.error('Signin error:', error.message);
      throw error;
    }

    return data;
  }

  async getUser(jwt: string) {
    const { data, error } = await this.supabase.auth.getUser(jwt);

    if (error) {
      this.logger.error('Get user error:', error.message);
      throw error;
    }

    return data;
  }

  // Database methods
  query(table: string) {
    return this.supabase.from(table);
  }

  async insert(table: string, data: any) {
    const { data: result, error } = await this.supabase
      .from(table)
      .insert(data)
      .select();

    if (error) {
      this.logger.error(`Insert error in ${table}:`, error.message);
      throw error;
    }

    return result;
  }

  async update(table: string, id: string, data: any) {
    const { data: result, error } = await this.supabase
      .from(table)
      .update(data)
      .eq('id', id)
      .select();

    if (error) {
      this.logger.error(`Update error in ${table}:`, error.message);
      throw error;
    }

    return result;
  }

  async delete(table: string, id: string) {
    const { error } = await this.supabase
      .from(table)
      .delete()
      .eq('id', id);

    if (error) {
      this.logger.error(`Delete error in ${table}:`, error.message);
      throw error;
    }

    return { success: true };
  }
}
