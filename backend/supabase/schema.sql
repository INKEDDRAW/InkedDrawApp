-- Inked Draw Database Schema
-- Comprehensive Supabase PostgreSQL schema for the social community platform
-- Based on Features-MVP.md and Technical-Specs.md specifications

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector"; -- For AI recommendations

-- =============================================
-- CORE USER TABLES
-- =============================================

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'premium', 'connoisseur')) NOT NULL
);

-- User profiles with detailed information
CREATE TABLE public.profiles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    username TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    bio TEXT,
    avatar_url TEXT,
    location TEXT,
    website_url TEXT,
    
    -- Preferences
    preferred_cigar_strength TEXT[] DEFAULT '{}',
    preferred_beer_styles TEXT[] DEFAULT '{}',
    preferred_wine_types TEXT[] DEFAULT '{}',
    
    -- Privacy settings
    profile_visibility TEXT DEFAULT 'public' CHECK (profile_visibility IN ('public', 'friends', 'private')) NOT NULL,
    show_location BOOLEAN DEFAULT FALSE,
    show_real_name BOOLEAN DEFAULT FALSE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    UNIQUE(user_id)
);

-- =============================================
-- PRODUCT CATALOG TABLES
-- =============================================

-- Cigars catalog
CREATE TABLE public.cigars (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    brand TEXT NOT NULL,
    origin_country TEXT,
    wrapper_type TEXT,
    binder_type TEXT,
    filler_type TEXT,
    strength TEXT CHECK (strength IN ('mild', 'medium', 'full', 'extra_full')),
    size_name TEXT, -- e.g., "Robusto", "Churchill"
    length_inches DECIMAL(3,1),
    ring_gauge INTEGER,
    price_range TEXT CHECK (price_range IN ('budget', 'mid', 'premium', 'luxury')),
    description TEXT,
    flavor_notes TEXT[],
    image_url TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- Search optimization
    search_vector tsvector GENERATED ALWAYS AS (
        to_tsvector('english', name || ' ' || brand || ' ' || COALESCE(description, ''))
    ) STORED
);

-- Beers catalog
CREATE TABLE public.beers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    brewery TEXT NOT NULL,
    style TEXT NOT NULL, -- IPA, Stout, Lager, etc.
    sub_style TEXT,
    origin_country TEXT,
    abv DECIMAL(4,2), -- Alcohol by volume
    ibu INTEGER, -- International Bitterness Units
    srm INTEGER, -- Standard Reference Method (color)
    price_range TEXT CHECK (price_range IN ('budget', 'mid', 'premium', 'luxury')),
    description TEXT,
    flavor_notes TEXT[],
    image_url TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- Search optimization
    search_vector tsvector GENERATED ALWAYS AS (
        to_tsvector('english', name || ' ' || brewery || ' ' || style || ' ' || COALESCE(description, ''))
    ) STORED
);

-- Wines catalog
CREATE TABLE public.wines (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    winery TEXT NOT NULL,
    wine_type TEXT NOT NULL, -- Red, White, Rosé, Sparkling, Dessert
    varietal TEXT[], -- Grape varieties
    region TEXT,
    country TEXT,
    vintage_year INTEGER,
    abv DECIMAL(4,2),
    price_range TEXT CHECK (price_range IN ('budget', 'mid', 'premium', 'luxury')),
    description TEXT,
    flavor_notes TEXT[],
    image_url TEXT,
    
    -- Wine-specific attributes
    body TEXT CHECK (body IN ('light', 'medium', 'full')),
    sweetness TEXT CHECK (sweetness IN ('bone_dry', 'dry', 'off_dry', 'medium_sweet', 'sweet')),
    tannin_level TEXT CHECK (tannin_level IN ('low', 'medium', 'high')),
    acidity TEXT CHECK (acidity IN ('low', 'medium', 'high')),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- Search optimization
    search_vector tsvector GENERATED ALWAYS AS (
        to_tsvector('english', name || ' ' || winery || ' ' || wine_type || ' ' || COALESCE(description, ''))
    ) STORED
);

-- =============================================
-- USER INTERACTION TABLES
-- =============================================

-- User's cigar experiences and ratings
CREATE TABLE public.user_cigars (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    cigar_id UUID REFERENCES public.cigars(id) ON DELETE CASCADE NOT NULL,

    -- Experience details
    rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
    review_text TEXT,
    smoke_date DATE,
    location TEXT,
    occasion TEXT,
    pairing_notes TEXT, -- What they paired it with

    -- Experience metadata
    burn_quality INTEGER CHECK (burn_quality >= 1 AND burn_quality <= 5),
    draw_quality INTEGER CHECK (draw_quality >= 1 AND draw_quality <= 5),
    construction_quality INTEGER CHECK (construction_quality >= 1 AND construction_quality <= 5),

    -- Social features
    is_favorite BOOLEAN DEFAULT FALSE,
    is_wishlist BOOLEAN DEFAULT FALSE,
    is_public BOOLEAN DEFAULT TRUE,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

    UNIQUE(user_id, cigar_id)
);

-- User's beer experiences and ratings
CREATE TABLE public.user_beers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    beer_id UUID REFERENCES public.beers(id) ON DELETE CASCADE NOT NULL,

    -- Experience details
    rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
    review_text TEXT,
    tasting_date DATE,
    location TEXT,
    occasion TEXT,
    pairing_notes TEXT,

    -- Beer-specific metadata
    serving_temperature TEXT,
    glassware_used TEXT,

    -- Social features
    is_favorite BOOLEAN DEFAULT FALSE,
    is_wishlist BOOLEAN DEFAULT FALSE,
    is_public BOOLEAN DEFAULT TRUE,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

    UNIQUE(user_id, beer_id)
);

-- User's wine experiences and ratings
CREATE TABLE public.user_wines (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    wine_id UUID REFERENCES public.wines(id) ON DELETE CASCADE NOT NULL,

    -- Experience details
    rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
    review_text TEXT,
    tasting_date DATE,
    location TEXT,
    occasion TEXT,
    pairing_notes TEXT,

    -- Wine-specific metadata
    serving_temperature TEXT,
    decanting_time INTEGER, -- minutes
    glassware_used TEXT,

    -- Social features
    is_favorite BOOLEAN DEFAULT FALSE,
    is_wishlist BOOLEAN DEFAULT FALSE,
    is_public BOOLEAN DEFAULT TRUE,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

    UNIQUE(user_id, wine_id)
);

-- =============================================
-- SOCIAL FEATURES TABLES
-- =============================================

-- Posts (social feed content)
CREATE TABLE public.posts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,

    -- Content
    content TEXT NOT NULL,
    image_urls TEXT[] DEFAULT '{}',

    -- Product associations (optional)
    cigar_id UUID REFERENCES public.cigars(id) ON DELETE SET NULL,
    beer_id UUID REFERENCES public.beers(id) ON DELETE SET NULL,
    wine_id UUID REFERENCES public.wines(id) ON DELETE SET NULL,

    -- Post metadata
    post_type TEXT DEFAULT 'general' CHECK (post_type IN ('general', 'review', 'pairing', 'event', 'question')) NOT NULL,
    location TEXT,
    tags TEXT[] DEFAULT '{}',

    -- Engagement metrics
    likes_count INTEGER DEFAULT 0 NOT NULL,
    comments_count INTEGER DEFAULT 0 NOT NULL,
    shares_count INTEGER DEFAULT 0 NOT NULL,

    -- Visibility
    is_public BOOLEAN DEFAULT TRUE NOT NULL,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

    -- Search optimization
    search_vector tsvector GENERATED ALWAYS AS (
        to_tsvector('english', content || ' ' || array_to_string(tags, ' '))
    ) STORED
);

-- Comments on posts
CREATE TABLE public.comments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    parent_comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE, -- For nested comments

    -- Content
    content TEXT NOT NULL,

    -- Engagement
    likes_count INTEGER DEFAULT 0 NOT NULL,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Post likes
CREATE TABLE public.post_likes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

    UNIQUE(post_id, user_id)
);

-- Comment likes
CREATE TABLE public.comment_likes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

    UNIQUE(comment_id, user_id)
);

-- User follows/connections
CREATE TABLE public.user_follows (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    follower_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    following_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

    UNIQUE(follower_id, following_id),
    CHECK (follower_id != following_id)
);

-- =============================================
-- DATA INGESTION & AI TABLES
-- =============================================

-- Ingestion review items (for data processing pipeline)
CREATE TABLE public.ingestion_review_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,

    -- Source information
    source_type TEXT NOT NULL CHECK (source_type IN ('api', 'scraping', 'manual', 'user_submission')),
    source_url TEXT,
    source_identifier TEXT,

    -- Product information
    product_type TEXT NOT NULL CHECK (product_type IN ('cigar', 'beer', 'wine')),
    raw_data JSONB NOT NULL, -- Original scraped/API data
    processed_data JSONB, -- Cleaned and structured data

    -- Processing status
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'approved', 'rejected', 'duplicate')) NOT NULL,
    confidence_score DECIMAL(3,2), -- AI confidence in data quality (0.00-1.00)

    -- Review information
    reviewed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    review_notes TEXT,

    -- Final product mapping
    final_cigar_id UUID REFERENCES public.cigars(id) ON DELETE SET NULL,
    final_beer_id UUID REFERENCES public.beers(id) ON DELETE SET NULL,
    final_wine_id UUID REFERENCES public.wines(id) ON DELETE SET NULL,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- User preference vectors for AI recommendations
CREATE TABLE public.user_preference_vectors (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,

    -- Preference vectors (using pgvector extension)
    cigar_preferences vector(128), -- Embedding for cigar preferences
    beer_preferences vector(128),  -- Embedding for beer preferences
    wine_preferences vector(128),  -- Embedding for wine preferences

    -- Metadata for vector updates
    last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    update_trigger TEXT, -- What triggered the update (new_rating, profile_change, etc.)

    UNIQUE(user_id)
);

-- Product embeddings for similarity search
CREATE TABLE public.product_embeddings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,

    -- Product reference
    product_type TEXT NOT NULL CHECK (product_type IN ('cigar', 'beer', 'wine')),
    cigar_id UUID REFERENCES public.cigars(id) ON DELETE CASCADE,
    beer_id UUID REFERENCES public.beers(id) ON DELETE CASCADE,
    wine_id UUID REFERENCES public.wines(id) ON DELETE CASCADE,

    -- Embeddings
    content_embedding vector(128), -- Based on description, flavor notes, etc.
    user_rating_embedding vector(128), -- Based on user ratings and reviews

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

    -- Ensure only one product type is set
    CHECK (
        (cigar_id IS NOT NULL AND beer_id IS NULL AND wine_id IS NULL) OR
        (cigar_id IS NULL AND beer_id IS NOT NULL AND wine_id IS NULL) OR
        (cigar_id IS NULL AND beer_id IS NULL AND wine_id IS NOT NULL)
    )
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- User and profile indexes
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_subscription_tier ON public.users(subscription_tier);
CREATE INDEX idx_profiles_username ON public.profiles(username);
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);

-- Product catalog indexes
CREATE INDEX idx_cigars_brand ON public.cigars(brand);
CREATE INDEX idx_cigars_strength ON public.cigars(strength);
CREATE INDEX idx_cigars_search_vector ON public.cigars USING gin(search_vector);
CREATE INDEX idx_beers_brewery ON public.beers(brewery);
CREATE INDEX idx_beers_style ON public.beers(style);
CREATE INDEX idx_beers_search_vector ON public.beers USING gin(search_vector);
CREATE INDEX idx_wines_winery ON public.wines(winery);
CREATE INDEX idx_wines_wine_type ON public.wines(wine_type);
CREATE INDEX idx_wines_search_vector ON public.wines USING gin(search_vector);

-- User interaction indexes
CREATE INDEX idx_user_cigars_user_id ON public.user_cigars(user_id);
CREATE INDEX idx_user_cigars_cigar_id ON public.user_cigars(cigar_id);
CREATE INDEX idx_user_cigars_rating ON public.user_cigars(rating);
CREATE INDEX idx_user_cigars_is_favorite ON public.user_cigars(is_favorite) WHERE is_favorite = true;
CREATE INDEX idx_user_beers_user_id ON public.user_beers(user_id);
CREATE INDEX idx_user_beers_beer_id ON public.user_beers(beer_id);
CREATE INDEX idx_user_beers_rating ON public.user_beers(rating);
CREATE INDEX idx_user_wines_user_id ON public.user_wines(user_id);
CREATE INDEX idx_user_wines_wine_id ON public.user_wines(wine_id);
CREATE INDEX idx_user_wines_rating ON public.user_wines(rating);

-- Social features indexes
CREATE INDEX idx_posts_user_id ON public.posts(user_id);
CREATE INDEX idx_posts_created_at ON public.posts(created_at DESC);
CREATE INDEX idx_posts_is_public ON public.posts(is_public) WHERE is_public = true;
CREATE INDEX idx_posts_search_vector ON public.posts USING gin(search_vector);
CREATE INDEX idx_comments_post_id ON public.comments(post_id);
CREATE INDEX idx_comments_user_id ON public.comments(user_id);
CREATE INDEX idx_comments_parent_comment_id ON public.comments(parent_comment_id);
CREATE INDEX idx_post_likes_post_id ON public.post_likes(post_id);
CREATE INDEX idx_post_likes_user_id ON public.post_likes(user_id);
CREATE INDEX idx_comment_likes_comment_id ON public.comment_likes(comment_id);
CREATE INDEX idx_user_follows_follower_id ON public.user_follows(follower_id);
CREATE INDEX idx_user_follows_following_id ON public.user_follows(following_id);

-- AI and ingestion indexes
CREATE INDEX idx_ingestion_review_items_status ON public.ingestion_review_items(status);
CREATE INDEX idx_ingestion_review_items_product_type ON public.ingestion_review_items(product_type);
CREATE INDEX idx_user_preference_vectors_user_id ON public.user_preference_vectors(user_id);
CREATE INDEX idx_product_embeddings_product_type ON public.product_embeddings(product_type);

-- Vector similarity search indexes (using pgvector)
CREATE INDEX idx_user_preference_vectors_cigar ON public.user_preference_vectors USING ivfflat (cigar_preferences vector_cosine_ops);
CREATE INDEX idx_user_preference_vectors_beer ON public.user_preference_vectors USING ivfflat (beer_preferences vector_cosine_ops);
CREATE INDEX idx_user_preference_vectors_wine ON public.user_preference_vectors USING ivfflat (wine_preferences vector_cosine_ops);
CREATE INDEX idx_product_embeddings_content ON public.product_embeddings USING ivfflat (content_embedding vector_cosine_ops);
CREATE INDEX idx_product_embeddings_rating ON public.product_embeddings USING ivfflat (user_rating_embedding vector_cosine_ops);

-- =============================================
-- TRIGGERS AND FUNCTIONS
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to all relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cigars_updated_at BEFORE UPDATE ON public.cigars FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_beers_updated_at BEFORE UPDATE ON public.beers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_wines_updated_at BEFORE UPDATE ON public.wines FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_cigars_updated_at BEFORE UPDATE ON public.user_cigars FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_beers_updated_at BEFORE UPDATE ON public.user_beers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_wines_updated_at BEFORE UPDATE ON public.user_wines FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON public.posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON public.comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ingestion_review_items_updated_at BEFORE UPDATE ON public.ingestion_review_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_product_embeddings_updated_at BEFORE UPDATE ON public.product_embeddings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update engagement counts
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

CREATE OR REPLACE FUNCTION update_comment_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.comments SET likes_count = likes_count + 1 WHERE id = NEW.comment_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.comments SET likes_count = likes_count - 1 WHERE id = OLD.comment_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION update_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.posts SET comments_count = comments_count - 1 WHERE id = OLD.post_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

-- Apply engagement count triggers
CREATE TRIGGER trigger_update_post_likes_count AFTER INSERT OR DELETE ON public.post_likes FOR EACH ROW EXECUTE FUNCTION update_post_likes_count();
CREATE TRIGGER trigger_update_comment_likes_count AFTER INSERT OR DELETE ON public.comment_likes FOR EACH ROW EXECUTE FUNCTION update_comment_likes_count();
CREATE TRIGGER trigger_update_post_comments_count AFTER INSERT OR DELETE ON public.comments FOR EACH ROW EXECUTE FUNCTION update_post_comments_count();

-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Enable RLS on all user-related tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_cigars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_beers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_wines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preference_vectors ENABLE ROW LEVEL SECURITY;

-- Users can only see and modify their own user record
CREATE POLICY "Users can view own user data" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own user data" ON public.users FOR UPDATE USING (auth.uid() = id);

-- Profile policies based on visibility settings
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (profile_visibility = 'public');
CREATE POLICY "Private profiles are viewable by owner only" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User interaction policies (cigars, beers, wines)
CREATE POLICY "Users can view own interactions" ON public.user_cigars FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view public interactions" ON public.user_cigars FOR SELECT USING (is_public = true);
CREATE POLICY "Users can modify own interactions" ON public.user_cigars FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own beer interactions" ON public.user_beers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view public beer interactions" ON public.user_beers FOR SELECT USING (is_public = true);
CREATE POLICY "Users can modify own beer interactions" ON public.user_beers FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own wine interactions" ON public.user_wines FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view public wine interactions" ON public.user_wines FOR SELECT USING (is_public = true);
CREATE POLICY "Users can modify own wine interactions" ON public.user_wines FOR ALL USING (auth.uid() = user_id);

-- Post policies
CREATE POLICY "Users can view public posts" ON public.posts FOR SELECT USING (is_public = true);
CREATE POLICY "Users can view own posts" ON public.posts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create posts" ON public.posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own posts" ON public.posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own posts" ON public.posts FOR DELETE USING (auth.uid() = user_id);

-- Comment policies
CREATE POLICY "Users can view comments on viewable posts" ON public.comments FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.posts
        WHERE posts.id = comments.post_id
        AND (posts.is_public = true OR posts.user_id = auth.uid())
    )
);
CREATE POLICY "Users can create comments" ON public.comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own comments" ON public.comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments" ON public.comments FOR DELETE USING (auth.uid() = user_id);

-- Like policies
CREATE POLICY "Users can view likes on viewable posts" ON public.post_likes FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.posts
        WHERE posts.id = post_likes.post_id
        AND (posts.is_public = true OR posts.user_id = auth.uid())
    )
);
CREATE POLICY "Users can manage own post likes" ON public.post_likes FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view comment likes" ON public.comment_likes FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.comments
        JOIN public.posts ON posts.id = comments.post_id
        WHERE comments.id = comment_likes.comment_id
        AND (posts.is_public = true OR posts.user_id = auth.uid())
    )
);
CREATE POLICY "Users can manage own comment likes" ON public.comment_likes FOR ALL USING (auth.uid() = user_id);

-- Follow policies
CREATE POLICY "Users can view follows" ON public.user_follows FOR SELECT USING (true);
CREATE POLICY "Users can manage own follows" ON public.user_follows FOR ALL USING (auth.uid() = follower_id);

-- User preference vectors (private to user)
CREATE POLICY "Users can view own preference vectors" ON public.user_preference_vectors FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own preference vectors" ON public.user_preference_vectors FOR ALL USING (auth.uid() = user_id);

-- =============================================
-- PUBLIC TABLE POLICIES (No RLS needed)
-- =============================================

-- Product catalogs are publicly readable
-- cigars, beers, wines tables don't need RLS - they're public catalogs
-- ingestion_review_items and product_embeddings are admin/system tables

-- Grant public read access to product catalogs
GRANT SELECT ON public.cigars TO anon, authenticated;
GRANT SELECT ON public.beers TO anon, authenticated;
GRANT SELECT ON public.wines TO anon, authenticated;

-- Grant authenticated users access to user-related tables
GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.user_cigars TO authenticated;
GRANT ALL ON public.user_beers TO authenticated;
GRANT ALL ON public.user_wines TO authenticated;
GRANT ALL ON public.posts TO authenticated;
GRANT ALL ON public.comments TO authenticated;
GRANT ALL ON public.post_likes TO authenticated;
GRANT ALL ON public.comment_likes TO authenticated;
GRANT ALL ON public.user_follows TO authenticated;
GRANT ALL ON public.user_preference_vectors TO authenticated;

-- Grant service role access to all tables (for admin operations)
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- =============================================
-- SAMPLE DATA (Optional - for development)
-- =============================================

-- Sample cigars
INSERT INTO public.cigars (name, brand, origin_country, wrapper_type, strength, size_name, length_inches, ring_gauge, price_range, description, flavor_notes) VALUES
('Padron 1964 Anniversary Series', 'Padron', 'Nicaragua', 'Maduro', 'full', 'Robusto', 5.0, 50, 'premium', 'A rich, complex cigar with exceptional construction and flavor.', ARRAY['chocolate', 'coffee', 'leather', 'spice']),
('Arturo Fuente Hemingway', 'Arturo Fuente', 'Dominican Republic', 'Natural', 'medium', 'Short Story', 4.0, 49, 'premium', 'A classic Dominican cigar with smooth, refined flavors.', ARRAY['cedar', 'cream', 'nuts', 'mild spice']),
('Romeo y Julieta 1875', 'Romeo y Julieta', 'Dominican Republic', 'Natural', 'mild', 'Churchill', 7.0, 50, 'mid', 'A mild, approachable cigar perfect for beginners.', ARRAY['wood', 'vanilla', 'light spice']);

-- Sample beers
INSERT INTO public.beers (name, brewery, style, origin_country, abv, ibu, description, flavor_notes) VALUES
('Pliny the Elder', 'Russian River Brewing', 'Double IPA', 'United States', 8.0, 100, 'A legendary double IPA with intense hop character.', ARRAY['citrus', 'pine', 'tropical fruit', 'bitter']),
('Guinness Draught', 'Guinness', 'Irish Stout', 'Ireland', 4.2, 45, 'The iconic Irish stout with a creamy texture and roasted flavor.', ARRAY['coffee', 'chocolate', 'roasted barley', 'cream']),
('Weihenstephaner Hefeweizen', 'Weihenstephaner', 'Hefeweizen', 'Germany', 5.4, 14, 'A classic German wheat beer from the worlds oldest brewery.', ARRAY['banana', 'clove', 'wheat', 'citrus']);

-- Sample wines
INSERT INTO public.wines (name, winery, wine_type, varietal, region, country, vintage_year, abv, price_range, description, flavor_notes, body, sweetness, tannin_level, acidity) VALUES
('Opus One', 'Opus One Winery', 'Red', ARRAY['Cabernet Sauvignon', 'Merlot'], 'Napa Valley', 'United States', 2019, 14.5, 'luxury', 'A prestigious Bordeaux-style blend from Napa Valley.', ARRAY['blackcurrant', 'cedar', 'vanilla', 'tobacco'], 'full', 'dry', 'high', 'medium'),
('Dom Pérignon', 'Moët & Chandon', 'Sparkling', ARRAY['Chardonnay', 'Pinot Noir'], 'Champagne', 'France', 2012, 12.5, 'luxury', 'The pinnacle of Champagne excellence.', ARRAY['brioche', 'citrus', 'mineral', 'almond'], 'medium', 'dry', 'low', 'high'),
('Kendall-Jackson Vintners Reserve Chardonnay', 'Kendall-Jackson', 'White', ARRAY['Chardonnay'], 'California', 'United States', 2021, 13.5, 'mid', 'A well-balanced Chardonnay with oak aging.', ARRAY['apple', 'pear', 'vanilla', 'butter'], 'medium', 'dry', 'low', 'medium');

-- =============================================
-- SCHEMA COMPLETE
-- =============================================

-- This schema provides:
-- 1. Complete user management with profiles and preferences
-- 2. Comprehensive product catalogs (cigars, beers, wines)
-- 3. User interaction tracking (ratings, reviews, favorites)
-- 4. Social features (posts, comments, likes, follows)
-- 5. Data ingestion pipeline for content management
-- 6. AI recommendation system with vector embeddings
-- 7. Proper indexing for performance
-- 8. Row Level Security for data protection
-- 9. Triggers for data consistency
-- 10. Sample data for development

-- Ready for Supabase deployment!
