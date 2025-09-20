-- Migration: 002_add_missing_tables
-- Description: Add missing tables for multi-category support (beers, wines) and AI features
-- Created: 2024-01-19
-- 
-- This migration adds the missing tables to support the new Inked Draw requirements:
-- - Beer and wine product catalogs
-- - User interaction tables for all three categories
-- - AI recommendation system tables
-- - Enhanced social features

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector"; -- For AI recommendations

-- =============================================
-- ADD MISSING PRODUCT CATALOG TABLES
-- =============================================

-- Beers catalog
CREATE TABLE IF NOT EXISTS public.beers (
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
CREATE TABLE IF NOT EXISTS public.wines (
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
-- ADD USER INTERACTION TABLES
-- =============================================

-- User's cigar experiences and ratings
CREATE TABLE IF NOT EXISTS public.user_cigars (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
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
CREATE TABLE IF NOT EXISTS public.user_beers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
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
CREATE TABLE IF NOT EXISTS public.user_wines (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
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
-- ADD AI RECOMMENDATION TABLES
-- =============================================

-- Data ingestion and review items
CREATE TABLE IF NOT EXISTS public.ingestion_review_items (
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
    reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
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
CREATE TABLE IF NOT EXISTS public.user_preference_vectors (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

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
CREATE TABLE IF NOT EXISTS public.product_embeddings (
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
-- ADD INDEXES FOR NEW TABLES
-- =============================================

-- Product catalog indexes
CREATE INDEX IF NOT EXISTS idx_beers_brewery ON public.beers(brewery);
CREATE INDEX IF NOT EXISTS idx_beers_style ON public.beers(style);
CREATE INDEX IF NOT EXISTS idx_beers_search_vector ON public.beers USING gin(search_vector);
CREATE INDEX IF NOT EXISTS idx_wines_winery ON public.wines(winery);
CREATE INDEX IF NOT EXISTS idx_wines_wine_type ON public.wines(wine_type);
CREATE INDEX IF NOT EXISTS idx_wines_search_vector ON public.wines USING gin(search_vector);

-- User interaction indexes
CREATE INDEX IF NOT EXISTS idx_user_cigars_user_id ON public.user_cigars(user_id);
CREATE INDEX IF NOT EXISTS idx_user_cigars_cigar_id ON public.user_cigars(cigar_id);
CREATE INDEX IF NOT EXISTS idx_user_cigars_rating ON public.user_cigars(rating);
CREATE INDEX IF NOT EXISTS idx_user_cigars_is_favorite ON public.user_cigars(is_favorite) WHERE is_favorite = true;
CREATE INDEX IF NOT EXISTS idx_user_beers_user_id ON public.user_beers(user_id);
CREATE INDEX IF NOT EXISTS idx_user_beers_beer_id ON public.user_beers(beer_id);
CREATE INDEX IF NOT EXISTS idx_user_beers_rating ON public.user_beers(rating);
CREATE INDEX IF NOT EXISTS idx_user_wines_user_id ON public.user_wines(user_id);
CREATE INDEX IF NOT EXISTS idx_user_wines_wine_id ON public.user_wines(wine_id);
CREATE INDEX IF NOT EXISTS idx_user_wines_rating ON public.user_wines(rating);

-- AI and ingestion indexes
CREATE INDEX IF NOT EXISTS idx_ingestion_review_items_status ON public.ingestion_review_items(status);
CREATE INDEX IF NOT EXISTS idx_ingestion_review_items_product_type ON public.ingestion_review_items(product_type);
CREATE INDEX IF NOT EXISTS idx_user_preference_vectors_user_id ON public.user_preference_vectors(user_id);
CREATE INDEX IF NOT EXISTS idx_product_embeddings_product_type ON public.product_embeddings(product_type);

-- Vector similarity search indexes (using pgvector)
CREATE INDEX IF NOT EXISTS idx_user_preference_vectors_cigar ON public.user_preference_vectors USING ivfflat (cigar_preferences vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_user_preference_vectors_beer ON public.user_preference_vectors USING ivfflat (beer_preferences vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_user_preference_vectors_wine ON public.user_preference_vectors USING ivfflat (wine_preferences vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_product_embeddings_content ON public.product_embeddings USING ivfflat (content_embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_product_embeddings_rating ON public.product_embeddings USING ivfflat (user_rating_embedding vector_cosine_ops);

-- =============================================
-- ADD RLS POLICIES FOR NEW TABLES
-- =============================================

-- Enable RLS on new user-related tables
ALTER TABLE public.user_cigars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_beers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_wines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preference_vectors ENABLE ROW LEVEL SECURITY;

-- User interaction policies (cigars, beers, wines)
CREATE POLICY "Users can view own cigar interactions" ON public.user_cigars FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view public cigar interactions" ON public.user_cigars FOR SELECT USING (is_public = true);
CREATE POLICY "Users can modify own cigar interactions" ON public.user_cigars FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own beer interactions" ON public.user_beers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view public beer interactions" ON public.user_beers FOR SELECT USING (is_public = true);
CREATE POLICY "Users can modify own beer interactions" ON public.user_beers FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own wine interactions" ON public.user_wines FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view public wine interactions" ON public.user_wines FOR SELECT USING (is_public = true);
CREATE POLICY "Users can modify own wine interactions" ON public.user_wines FOR ALL USING (auth.uid() = user_id);

-- User preference vectors (private to user)
CREATE POLICY "Users can view own preference vectors" ON public.user_preference_vectors FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own preference vectors" ON public.user_preference_vectors FOR ALL USING (auth.uid() = user_id);

-- Grant public read access to new product catalogs
GRANT SELECT ON public.beers TO anon, authenticated;
GRANT SELECT ON public.wines TO anon, authenticated;

-- Grant authenticated users access to new user-related tables
GRANT ALL ON public.user_cigars TO authenticated;
GRANT ALL ON public.user_beers TO authenticated;
GRANT ALL ON public.user_wines TO authenticated;
GRANT ALL ON public.user_preference_vectors TO authenticated;

-- Grant service role access to all new tables
GRANT ALL ON public.beers TO service_role;
GRANT ALL ON public.wines TO service_role;
GRANT ALL ON public.user_cigars TO service_role;
GRANT ALL ON public.user_beers TO service_role;
GRANT ALL ON public.user_wines TO service_role;
GRANT ALL ON public.ingestion_review_items TO service_role;
GRANT ALL ON public.user_preference_vectors TO service_role;
GRANT ALL ON public.product_embeddings TO service_role;
