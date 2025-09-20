/**
 * Database Types for Frontend
 * Simplified types for React Native usage
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
      // Additional table types would be defined here...
      // For brevity, showing the pattern with key tables
      beers: {
        Row: {
          id: string;
          name: string;
          brewery: string;
          style: string;
          sub_style: string | null;
          origin_country: string | null;
          abv: number | null;
          ibu: number | null;
          srm: number | null;
          price_range: 'budget' | 'mid' | 'premium' | 'luxury' | null;
          description: string | null;
          flavor_notes: string[];
          image_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: any;
        Update: any;
      };
      wines: {
        Row: {
          id: string;
          name: string;
          winery: string;
          wine_type: string;
          varietal: string[];
          region: string | null;
          country: string | null;
          vintage_year: number | null;
          abv: number | null;
          price_range: 'budget' | 'mid' | 'premium' | 'luxury' | null;
          description: string | null;
          flavor_notes: string[];
          image_url: string | null;
          body: 'light' | 'medium' | 'full' | null;
          sweetness: 'bone_dry' | 'dry' | 'off_dry' | 'medium_sweet' | 'sweet' | null;
          tannin_level: 'low' | 'medium' | 'high' | null;
          acidity: 'low' | 'medium' | 'high' | null;
          created_at: string;
          updated_at: string;
        };
        Insert: any;
        Update: any;
      };
      user_cigars: {
        Row: {
          id: string;
          user_id: string;
          cigar_id: string;
          rating: number;
          review_text: string | null;
          smoke_date: string | null;
          location: string | null;
          occasion: string | null;
          pairing_notes: string | null;
          burn_quality: number | null;
          draw_quality: number | null;
          construction_quality: number | null;
          is_favorite: boolean;
          is_wishlist: boolean;
          is_public: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: any;
        Update: any;
      };
      user_beers: {
        Row: {
          id: string;
          user_id: string;
          beer_id: string;
          rating: number;
          review_text: string | null;
          tasting_date: string | null;
          location: string | null;
          occasion: string | null;
          pairing_notes: string | null;
          serving_temperature: string | null;
          glassware_used: string | null;
          is_favorite: boolean;
          is_wishlist: boolean;
          is_public: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: any;
        Update: any;
      };
      user_wines: {
        Row: {
          id: string;
          user_id: string;
          wine_id: string;
          rating: number;
          review_text: string | null;
          tasting_date: string | null;
          location: string | null;
          occasion: string | null;
          pairing_notes: string | null;
          serving_temperature: string | null;
          decanting_time: number | null;
          glassware_used: string | null;
          is_favorite: boolean;
          is_wishlist: boolean;
          is_public: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: any;
        Update: any;
      };
      posts: {
        Row: {
          id: string;
          user_id: string;
          content: string;
          image_urls: string[];
          cigar_id: string | null;
          beer_id: string | null;
          wine_id: string | null;
          post_type: 'general' | 'review' | 'pairing' | 'event' | 'question';
          location: string | null;
          tags: string[];
          likes_count: number;
          comments_count: number;
          shares_count: number;
          is_public: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: any;
        Update: any;
      };
      comments: {
        Row: {
          id: string;
          post_id: string;
          user_id: string;
          parent_comment_id: string | null;
          content: string;
          likes_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: any;
        Update: any;
      };
      post_likes: {
        Row: {
          id: string;
          post_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: any;
        Update: any;
      };
      comment_likes: {
        Row: {
          id: string;
          comment_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: any;
        Update: any;
      };
      user_follows: {
        Row: {
          id: string;
          follower_id: string;
          following_id: string;
          created_at: string;
        };
        Insert: any;
        Update: any;
      };
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
