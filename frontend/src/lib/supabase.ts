/**
 * Supabase Client Configuration for Frontend
 * React Native compatible Supabase client setup
 */

import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Database } from './database.types';

// Environment variables
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://gyhpbpfxollqcomxgrqb.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseAnonKey) {
  throw new Error('Missing EXPO_PUBLIC_SUPABASE_ANON_KEY environment variable');
}

// Create Supabase client with React Native configuration
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // Disable for React Native
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Table names for type safety
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
} as const;

// Auth helpers
export const auth = {
  signUp: (email: string, password: string) =>
    supabase.auth.signUp({ email, password }),
  
  signIn: (email: string, password: string) =>
    supabase.auth.signInWithPassword({ email, password }),
  
  signOut: () => supabase.auth.signOut(),
  
  getUser: () => supabase.auth.getUser(),
  
  getSession: () => supabase.auth.getSession(),
  
  onAuthStateChange: (callback: (event: string, session: any) => void) =>
    supabase.auth.onAuthStateChange(callback),
};

// Database helpers
export const db = {
  // Generic CRUD operations
  from: <T extends keyof typeof tables>(table: T) => supabase.from(table),
  
  // Search operations
  searchCigars: (query: string, limit = 20) =>
    supabase
      .from('cigars')
      .select('*')
      .textSearch('search_vector', query)
      .limit(limit),
  
  searchBeers: (query: string, limit = 20) =>
    supabase
      .from('beers')
      .select('*')
      .textSearch('search_vector', query)
      .limit(limit),
  
  searchWines: (query: string, limit = 20) =>
    supabase
      .from('wines')
      .select('*')
      .textSearch('search_vector', query)
      .limit(limit),
  
  // User interactions
  getUserCigars: (userId: string) =>
    supabase
      .from('user_cigars')
      .select(`
        *,
        cigars (
          id, name, brand, strength, description, image_url
        )
      `)
      .eq('user_id', userId),
  
  getUserBeers: (userId: string) =>
    supabase
      .from('user_beers')
      .select(`
        *,
        beers (
          id, name, brewery, style, description, image_url
        )
      `)
      .eq('user_id', userId),
  
  getUserWines: (userId: string) =>
    supabase
      .from('user_wines')
      .select(`
        *,
        wines (
          id, name, winery, wine_type, description, image_url
        )
      `)
      .eq('user_id', userId),
  
  // Social features
  getPosts: (limit = 20) =>
    supabase
      .from('posts')
      .select(`
        *,
        profiles (
          username, display_name, avatar_url
        ),
        cigars (
          id, name, brand
        ),
        beers (
          id, name, brewery
        ),
        wines (
          id, name, winery
        )
      `)
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(limit),
  
  getComments: (postId: string) =>
    supabase
      .from('comments')
      .select(`
        *,
        profiles (
          username, display_name, avatar_url
        )
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: true }),
};

// Real-time subscriptions
export const realtime = {
  subscribeToPosts: (callback: (payload: any) => void) =>
    supabase
      .channel('posts_channel')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'posts' },
        callback
      )
      .subscribe(),
  
  subscribeToComments: (postId: string, callback: (payload: any) => void) =>
    supabase
      .channel(`comments_${postId}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'comments',
          filter: `post_id=eq.${postId}`
        },
        callback
      )
      .subscribe(),
  
  subscribeToLikes: (callback: (payload: any) => void) =>
    supabase
      .channel('likes_channel')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'post_likes' },
        callback
      )
      .subscribe(),
};

export default supabase;
