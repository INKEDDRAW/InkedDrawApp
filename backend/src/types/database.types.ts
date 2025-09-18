/**
 * Database Type Definitions for InkedDraw
 * 
 * TypeScript interfaces matching the Supabase database schema
 */

export interface User {
  id: string; // UUID from auth.users
  email: string;
  name?: string;
  avatar_url?: string;
  bio?: string;
  location?: string;
  website?: string;
  is_premium: boolean;
  preferences: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Collection {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  type: 'cigar' | 'wine' | 'beer' | 'mixed';
  is_public: boolean;
  cover_image_url?: string;
  created_at: string;
  updated_at: string;
}

export interface CollectionItem {
  id: string;
  collection_id: string;
  user_id: string;
  
  // Product Information
  name: string;
  brand?: string;
  type: 'cigar' | 'wine' | 'beer';
  description?: string;
  
  // Scan Information
  scan_id?: string;
  confidence?: number; // 0.00 to 1.00
  image_url?: string;
  
  // User Data
  rating?: number; // 1-5
  notes?: string;
  price?: number;
  purchase_date?: string; // ISO date string
  location_purchased?: string;
  
  // Metadata
  tags?: string[];
  is_favorite: boolean;
  is_wishlist: boolean;
  
  created_at: string;
  updated_at: string;
}

export interface Post {
  id: string;
  user_id: string;
  collection_item_id?: string;
  content: string;
  image_url?: string;
  location?: string;
  likes_count: number;
  comments_count: number;
  created_at: string;
  updated_at: string;
}

export interface PostLike {
  id: string;
  post_id: string;
  user_id: string;
  created_at: string;
}

// DTO Types for API requests/responses

export interface CreateCollectionDto {
  name: string;
  description?: string;
  type: 'cigar' | 'wine' | 'beer' | 'mixed';
  is_public?: boolean;
  cover_image_url?: string;
}

export interface UpdateCollectionDto {
  name?: string;
  description?: string;
  type?: 'cigar' | 'wine' | 'beer' | 'mixed';
  is_public?: boolean;
  cover_image_url?: string;
}

export interface CreateCollectionItemDto {
  collection_id: string;
  name: string;
  brand?: string;
  type: 'cigar' | 'wine' | 'beer';
  description?: string;
  scan_id?: string;
  confidence?: number;
  image_url?: string;
  rating?: number;
  notes?: string;
  price?: number;
  purchase_date?: string;
  location_purchased?: string;
  tags?: string[];
  is_favorite?: boolean;
  is_wishlist?: boolean;
}

export interface UpdateCollectionItemDto {
  name?: string;
  brand?: string;
  description?: string;
  rating?: number;
  notes?: string;
  price?: number;
  purchase_date?: string;
  location_purchased?: string;
  tags?: string[];
  is_favorite?: boolean;
  is_wishlist?: boolean;
}

export interface CreatePostDto {
  collection_item_id?: string;
  content: string;
  image_url?: string;
  location?: string;
}

export interface UpdatePostDto {
  content?: string;
  image_url?: string;
  location?: string;
}

// Response Types with Relations

export interface CollectionWithStats extends Collection {
  items_count: number;
  total_value?: number;
  avg_rating?: number;
}

export interface CollectionItemWithCollection extends CollectionItem {
  collection: Collection;
}

export interface PostWithUser extends Post {
  user: Pick<User, 'id' | 'name' | 'avatar_url'>;
  collection_item?: Pick<CollectionItem, 'id' | 'name' | 'type' | 'image_url'>;
  is_liked?: boolean; // Whether current user liked this post
}

export interface UserProfile extends User {
  collections_count: number;
  items_count: number;
  posts_count: number;
  followers_count?: number;
  following_count?: number;
}

// Query Filter Types

export interface CollectionFilters {
  type?: 'cigar' | 'wine' | 'beer' | 'mixed';
  is_public?: boolean;
  user_id?: string;
  search?: string;
}

export interface CollectionItemFilters {
  collection_id?: string;
  type?: 'cigar' | 'wine' | 'beer';
  is_favorite?: boolean;
  is_wishlist?: boolean;
  rating?: number;
  search?: string;
  tags?: string[];
}

export interface PostFilters {
  user_id?: string;
  collection_item_id?: string;
  search?: string;
}

// Pagination Types

export interface PaginationParams {
  page?: number;
  limit?: number;
  cursor?: string; // For cursor-based pagination
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    has_more: boolean;
    next_cursor?: string;
  };
}

// Statistics Types

export interface CollectionStats {
  total_items: number;
  items_by_type: {
    cigar: number;
    wine: number;
    beer: number;
  };
  total_value: number;
  avg_rating: number;
  recent_additions: number; // Last 30 days
}

export interface UserStats {
  total_collections: number;
  total_items: number;
  total_posts: number;
  total_likes_received: number;
  items_by_type: {
    cigar: number;
    wine: number;
    beer: number;
  };
  avg_rating: number;
  total_value: number;
}

// Error Types

export interface DatabaseError {
  code: string;
  message: string;
  details?: any;
}

// Supabase Response Types

export interface SupabaseResponse<T> {
  data: T | null;
  error: DatabaseError | null;
}

export interface SupabaseListResponse<T> {
  data: T[] | null;
  error: DatabaseError | null;
  count?: number;
}
