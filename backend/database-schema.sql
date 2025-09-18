-- INKED DRAW Database Schema
-- Supabase PostgreSQL Schema for User Collections

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'inkeddraw-super-secret-jwt-key-change-in-production';

-- =============================================
-- USERS TABLE (extends Supabase auth.users)
-- =============================================
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar_url TEXT,
  bio TEXT,
  location TEXT,
  website TEXT,
  is_premium BOOLEAN DEFAULT FALSE,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Users can view and update their own profile
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- =============================================
-- COLLECTIONS TABLE
-- =============================================
CREATE TABLE public.collections (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT CHECK (type IN ('cigar', 'wine', 'beer', 'mixed')) NOT NULL,
  is_public BOOLEAN DEFAULT FALSE,
  cover_image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;

-- Users can manage their own collections
CREATE POLICY "Users can view own collections" ON public.collections
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view public collections" ON public.collections
  FOR SELECT USING (is_public = TRUE);

CREATE POLICY "Users can insert own collections" ON public.collections
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own collections" ON public.collections
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own collections" ON public.collections
  FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- COLLECTION ITEMS TABLE
-- =============================================
CREATE TABLE public.collection_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  collection_id UUID REFERENCES public.collections(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Product Information
  name TEXT NOT NULL,
  brand TEXT,
  type TEXT CHECK (type IN ('cigar', 'wine', 'beer')) NOT NULL,
  description TEXT,
  
  -- Scan Information
  scan_id TEXT, -- Reference to original scan
  confidence DECIMAL(3,2), -- 0.00 to 1.00
  image_url TEXT,
  
  -- User Data
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  notes TEXT,
  price DECIMAL(10,2),
  purchase_date DATE,
  location_purchased TEXT,
  
  -- Metadata
  tags TEXT[], -- Array of tags
  is_favorite BOOLEAN DEFAULT FALSE,
  is_wishlist BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.collection_items ENABLE ROW LEVEL SECURITY;

-- Users can manage their own collection items
CREATE POLICY "Users can view own collection items" ON public.collection_items
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view public collection items" ON public.collection_items
  FOR SELECT USING (
    collection_id IN (
      SELECT id FROM public.collections WHERE is_public = TRUE
    )
  );

CREATE POLICY "Users can insert own collection items" ON public.collection_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own collection items" ON public.collection_items
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own collection items" ON public.collection_items
  FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- SOCIAL POSTS TABLE
-- =============================================
CREATE TABLE public.posts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  collection_item_id UUID REFERENCES public.collection_items(id) ON DELETE SET NULL,
  
  content TEXT NOT NULL,
  image_url TEXT,
  location TEXT,
  
  -- Engagement
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- Posts are public by default (social feed)
CREATE POLICY "Anyone can view posts" ON public.posts
  FOR SELECT USING (TRUE);

CREATE POLICY "Users can insert own posts" ON public.posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own posts" ON public.posts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own posts" ON public.posts
  FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- POST LIKES TABLE
-- =============================================
CREATE TABLE public.post_likes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(post_id, user_id)
);

-- Enable RLS
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view post likes" ON public.post_likes
  FOR SELECT USING (TRUE);

CREATE POLICY "Users can manage own post likes" ON public.post_likes
  FOR ALL USING (auth.uid() = user_id);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Users
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_created_at ON public.users(created_at);

-- Collections
CREATE INDEX idx_collections_user_id ON public.collections(user_id);
CREATE INDEX idx_collections_type ON public.collections(type);
CREATE INDEX idx_collections_is_public ON public.collections(is_public);
CREATE INDEX idx_collections_created_at ON public.collections(created_at);

-- Collection Items
CREATE INDEX idx_collection_items_collection_id ON public.collection_items(collection_id);
CREATE INDEX idx_collection_items_user_id ON public.collection_items(user_id);
CREATE INDEX idx_collection_items_type ON public.collection_items(type);
CREATE INDEX idx_collection_items_is_favorite ON public.collection_items(is_favorite);
CREATE INDEX idx_collection_items_rating ON public.collection_items(rating);
CREATE INDEX idx_collection_items_created_at ON public.collection_items(created_at);

-- Posts
CREATE INDEX idx_posts_user_id ON public.posts(user_id);
CREATE INDEX idx_posts_created_at ON public.posts(created_at DESC);
CREATE INDEX idx_posts_likes_count ON public.posts(likes_count DESC);

-- Post Likes
CREATE INDEX idx_post_likes_post_id ON public.post_likes(post_id);
CREATE INDEX idx_post_likes_user_id ON public.post_likes(user_id);

-- =============================================
-- FUNCTIONS AND TRIGGERS
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_collections_updated_at BEFORE UPDATE ON public.collections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_collection_items_updated_at BEFORE UPDATE ON public.collection_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update post likes count
CREATE OR REPLACE FUNCTION update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts SET likes_count = likes_count - 1 WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ language 'plpgsql';

-- Apply likes count triggers
CREATE TRIGGER update_post_likes_count_trigger
  AFTER INSERT OR DELETE ON public.post_likes
  FOR EACH ROW EXECUTE FUNCTION update_post_likes_count();

-- =============================================
-- SAMPLE DATA (for development)
-- =============================================

-- Note: In production, users will be created through Supabase Auth
-- This is just for development/testing purposes

-- Sample collections will be created through the API
-- Sample collection items will be created through scanning
