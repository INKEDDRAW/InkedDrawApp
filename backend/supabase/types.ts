/**
 * Supabase Database Types
 * Auto-generated types for type-safe database operations
 * Based on the schema.sql file
 */

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          created_at: string;
          updated_at: string;
          last_seen_at: string | null;
          is_active: boolean;
          subscription_tier: 'free' | 'premium' | 'connoisseur';
        };
        Insert: {
          id: string;
          email: string;
          created_at?: string;
          updated_at?: string;
          last_seen_at?: string | null;
          is_active?: boolean;
          subscription_tier?: 'free' | 'premium' | 'connoisseur';
        };
        Update: {
          id?: string;
          email?: string;
          created_at?: string;
          updated_at?: string;
          last_seen_at?: string | null;
          is_active?: boolean;
          subscription_tier?: 'free' | 'premium' | 'connoisseur';
        };
      };
      profiles: {
        Row: {
          id: string;
          user_id: string;
          username: string;
          display_name: string;
          bio: string | null;
          avatar_url: string | null;
          location: string | null;
          website_url: string | null;
          preferred_cigar_strength: string[];
          preferred_beer_styles: string[];
          preferred_wine_types: string[];
          profile_visibility: 'public' | 'friends' | 'private';
          show_location: boolean;
          show_real_name: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          username: string;
          display_name: string;
          bio?: string | null;
          avatar_url?: string | null;
          location?: string | null;
          website_url?: string | null;
          preferred_cigar_strength?: string[];
          preferred_beer_styles?: string[];
          preferred_wine_types?: string[];
          profile_visibility?: 'public' | 'friends' | 'private';
          show_location?: boolean;
          show_real_name?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          username?: string;
          display_name?: string;
          bio?: string | null;
          avatar_url?: string | null;
          location?: string | null;
          website_url?: string | null;
          preferred_cigar_strength?: string[];
          preferred_beer_styles?: string[];
          preferred_wine_types?: string[];
          profile_visibility?: 'public' | 'friends' | 'private';
          show_location?: boolean;
          show_real_name?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      cigars: {
        Row: {
          id: string;
          name: string;
          brand: string;
          origin_country: string | null;
          wrapper_type: string | null;
          binder_type: string | null;
          filler_type: string | null;
          strength: 'mild' | 'medium' | 'full' | 'extra_full' | null;
          size_name: string | null;
          length_inches: number | null;
          ring_gauge: number | null;
          price_range: 'budget' | 'mid' | 'premium' | 'luxury' | null;
          description: string | null;
          flavor_notes: string[];
          image_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          brand: string;
          origin_country?: string | null;
          wrapper_type?: string | null;
          binder_type?: string | null;
          filler_type?: string | null;
          strength?: 'mild' | 'medium' | 'full' | 'extra_full' | null;
          size_name?: string | null;
          length_inches?: number | null;
          ring_gauge?: number | null;
          price_range?: 'budget' | 'mid' | 'premium' | 'luxury' | null;
          description?: string | null;
          flavor_notes?: string[];
          image_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          brand?: string;
          origin_country?: string | null;
          wrapper_type?: string | null;
          binder_type?: string | null;
          filler_type?: string | null;
          strength?: 'mild' | 'medium' | 'full' | 'extra_full' | null;
          size_name?: string | null;
          length_inches?: number | null;
          ring_gauge?: number | null;
          price_range?: 'budget' | 'mid' | 'premium' | 'luxury' | null;
          description?: string | null;
          flavor_notes?: string[];
          image_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      // Additional table types would continue here...
      // For brevity, showing the pattern with key tables
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
