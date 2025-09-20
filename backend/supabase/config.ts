/**
 * Supabase Configuration for Inked Draw
 * Centralized configuration for database connection and client setup
 */

import { createClient } from '@supabase/supabase-js';
import { Database } from './types';

// Environment variables validation
const supabaseUrl = process.env.SUPABASE_URL || 'https://gyhpbpfxollqcomxgrqb.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error('Missing SUPABASE_URL environment variable');
}

if (!supabaseAnonKey) {
  throw new Error('Missing SUPABASE_ANON_KEY environment variable');
}

// Public client (for frontend and authenticated operations)
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Admin client (for backend operations requiring elevated privileges)
export const supabaseAdmin = createClient<Database>(
  supabaseUrl,
  supabaseServiceKey || supabaseAnonKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Database configuration
export const dbConfig = {
  // Connection pool settings
  maxConnections: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  
  // Query settings
  statementTimeout: 30000,
  queryTimeout: 30000,
  
  // SSL settings for production
  ssl: process.env.NODE_ENV === 'production',
};

// Realtime configuration
export const realtimeConfig = {
  // Channels for live updates
  channels: {
    posts: 'posts_channel',
    comments: 'comments_channel',
    likes: 'likes_channel',
    follows: 'follows_channel',
  },
  
  // Event types
  events: {
    INSERT: 'INSERT',
    UPDATE: 'UPDATE',
    DELETE: 'DELETE',
  },
};

// Table names (for type safety)
export const tables = {
  users: 'users',
  profiles: 'profiles',
  cigars: 'cigars',
  beers: 'beers',
  wines: 'wines',
  userCigars: 'user_cigars',
  userBeers: 'user_beers',
  userWines: 'user_wines',
  posts: 'posts',
  comments: 'comments',
  postLikes: 'post_likes',
  commentLikes: 'comment_likes',
  userFollows: 'user_follows',
  ingestionReviewItems: 'ingestion_review_items',
  userPreferenceVectors: 'user_preference_vectors',
  productEmbeddings: 'product_embeddings',
} as const;

export type TableName = keyof typeof tables;
