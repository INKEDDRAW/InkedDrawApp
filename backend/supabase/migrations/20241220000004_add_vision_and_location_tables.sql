-- Migration: Add Vision and Location Tables
-- Description: Create tables for smoke shops, shop inventory, shop reviews, and vision analysis results

-- Enable PostGIS extension for geographic data
CREATE EXTENSION IF NOT EXISTS postgis;

-- Smoke shops table
CREATE TABLE public.smoke_shops (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    zip_code TEXT NOT NULL,
    country TEXT DEFAULT 'United States' NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    phone TEXT,
    website TEXT,
    email TEXT,
    hours JSONB, -- Store hours as JSON object
    specialties TEXT[] DEFAULT '{}', -- Array of specialties (cigars, pipes, etc.)
    brands TEXT[] DEFAULT '{}', -- Array of brands carried
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- Constraints
    CONSTRAINT valid_latitude CHECK (latitude >= -90 AND latitude <= 90),
    CONSTRAINT valid_longitude CHECK (longitude >= -180 AND longitude <= 180)
);

-- Create spatial index for efficient location queries
CREATE INDEX idx_smoke_shops_location ON public.smoke_shops USING GIST (ST_Point(longitude, latitude));

-- Create indexes for common queries
CREATE INDEX idx_smoke_shops_city_state ON public.smoke_shops (city, state);
CREATE INDEX idx_smoke_shops_brands ON public.smoke_shops USING GIN (brands);
CREATE INDEX idx_smoke_shops_specialties ON public.smoke_shops USING GIN (specialties);

-- Shop inventory table
CREATE TABLE public.shop_inventory (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    shop_id UUID REFERENCES public.smoke_shops(id) ON DELETE CASCADE NOT NULL,
    product_id UUID NOT NULL,
    product_type TEXT CHECK (product_type IN ('cigar', 'beer', 'wine')) NOT NULL,
    brand TEXT NOT NULL,
    name TEXT NOT NULL,
    in_stock BOOLEAN DEFAULT TRUE NOT NULL,
    price DECIMAL(10, 2),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- Unique constraint to prevent duplicate inventory entries
    UNIQUE (shop_id, product_id, product_type)
);

-- Create indexes for inventory queries
CREATE INDEX idx_shop_inventory_shop_id ON public.shop_inventory (shop_id);
CREATE INDEX idx_shop_inventory_product ON public.shop_inventory (product_id, product_type);
CREATE INDEX idx_shop_inventory_brand ON public.shop_inventory (brand);
CREATE INDEX idx_shop_inventory_in_stock ON public.shop_inventory (in_stock);

-- Shop reviews table
CREATE TABLE public.shop_reviews (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    shop_id UUID REFERENCES public.smoke_shops(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
    review_text TEXT,
    visit_date DATE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- Unique constraint to prevent duplicate reviews from same user
    UNIQUE (shop_id, user_id)
);

-- Create indexes for review queries
CREATE INDEX idx_shop_reviews_shop_id ON public.shop_reviews (shop_id);
CREATE INDEX idx_shop_reviews_user_id ON public.shop_reviews (user_id);
CREATE INDEX idx_shop_reviews_rating ON public.shop_reviews (rating);

-- Vision analysis results table (for caching and analytics)
CREATE TABLE public.vision_analysis_results (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    image_url TEXT NOT NULL,
    analysis_type TEXT CHECK (analysis_type IN ('cigar_recognition', 'general_analysis', 'text_extraction', 'logo_detection')) NOT NULL,
    
    -- Vision API results
    labels JSONB, -- Array of detected labels with confidence scores
    extracted_text TEXT[], -- Array of extracted text
    detected_objects JSONB, -- Array of detected objects with bounding boxes
    detected_logos JSONB, -- Array of detected logos with confidence scores
    dominant_colors JSONB, -- Array of dominant colors
    safe_search JSONB, -- Safe search annotations
    
    -- Cigar recognition specific results
    recognized_brand TEXT,
    recognized_model TEXT,
    recognized_size TEXT,
    recognized_wrapper TEXT,
    recognition_confidence DECIMAL(3, 2), -- 0.00 to 1.00
    matched_products JSONB, -- Array of matched products with confidence scores
    
    -- Processing metadata
    processing_time_ms INTEGER,
    api_cost_cents INTEGER, -- Track API costs
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for vision analysis queries
CREATE INDEX idx_vision_analysis_user_id ON public.vision_analysis_results (user_id);
CREATE INDEX idx_vision_analysis_type ON public.vision_analysis_results (analysis_type);
CREATE INDEX idx_vision_analysis_brand ON public.vision_analysis_results (recognized_brand);
CREATE INDEX idx_vision_analysis_created_at ON public.vision_analysis_results (created_at);

-- User location preferences table
CREATE TABLE public.user_location_preferences (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    
    -- Default search preferences
    default_search_radius INTEGER DEFAULT 25 NOT NULL, -- in miles
    preferred_unit TEXT DEFAULT 'miles' CHECK (preferred_unit IN ('miles', 'kilometers')) NOT NULL,
    
    -- Location sharing preferences
    share_location BOOLEAN DEFAULT FALSE NOT NULL,
    share_with_friends_only BOOLEAN DEFAULT TRUE NOT NULL,
    
    -- Notification preferences for nearby shops
    notify_new_shops BOOLEAN DEFAULT TRUE NOT NULL,
    notify_product_availability BOOLEAN DEFAULT TRUE NOT NULL,
    notify_shop_promotions BOOLEAN DEFAULT FALSE NOT NULL,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- User favorite shops table
CREATE TABLE public.user_favorite_shops (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    shop_id UUID REFERENCES public.smoke_shops(id) ON DELETE CASCADE NOT NULL,
    notes TEXT, -- Personal notes about the shop
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- Unique constraint to prevent duplicate favorites
    UNIQUE (user_id, shop_id)
);

-- Create indexes for user preferences and favorites
CREATE INDEX idx_user_favorite_shops_user_id ON public.user_favorite_shops (user_id);
CREATE INDEX idx_user_favorite_shops_shop_id ON public.user_favorite_shops (shop_id);

-- Insert sample smoke shops for development and testing
INSERT INTO public.smoke_shops (name, address, city, state, zip_code, latitude, longitude, phone, website, specialties, brands) VALUES
('Premium Cigars NYC', '123 Madison Ave', 'New York', 'NY', '10016', 40.7505, -73.9934, '(212) 555-0123', 'https://premiumcigarsnyc.com', ARRAY['cigars', 'humidors', 'accessories'], ARRAY['Cohiba', 'Montecristo', 'Davidoff', 'Arturo Fuente']),
('The Cigar Lounge', '456 Sunset Blvd', 'Los Angeles', 'CA', '90028', 34.0983, -118.3267, '(323) 555-0456', 'https://cigarloungela.com', ARRAY['cigars', 'lounge', 'events'], ARRAY['Padron', 'Oliva', 'Rocky Patel', 'My Father']),
('Windy City Tobacco', '789 Michigan Ave', 'Chicago', 'IL', '60611', 41.8976, -87.6244, '(312) 555-0789', 'https://windycitytobacco.com', ARRAY['cigars', 'pipes', 'tobacco'], ARRAY['Liga Privada', 'Undercrown', 'Ashton', 'CAO']),
('Miami Smoke Shop', '321 Ocean Drive', 'Miami', 'FL', '33139', 25.7753, -80.1901, '(305) 555-0321', 'https://miamismokeshop.com', ARRAY['cigars', 'beach_lounge'], ARRAY['Cohiba', 'Romeo y Julieta', 'Partagas', 'H. Upmann']),
('Golden Gate Cigars', '654 Market St', 'San Francisco', 'CA', '94102', 37.7879, -122.4075, '(415) 555-0654', 'https://goldengatecigars.com', ARRAY['cigars', 'wine_pairing'], ARRAY['Davidoff', 'Montecristo', 'Arturo Fuente', 'Padron']);

-- Insert sample shop inventory
INSERT INTO public.shop_inventory (shop_id, product_id, product_type, brand, name, in_stock, price) 
SELECT 
    s.id,
    gen_random_uuid(),
    'cigar',
    brand,
    brand || ' ' || (ARRAY['Robusto', 'Churchill', 'Toro', 'Corona'])[floor(random() * 4 + 1)],
    random() > 0.3, -- 70% chance of being in stock
    round((random() * 50 + 10)::numeric, 2) -- Price between $10-60
FROM public.smoke_shops s
CROSS JOIN unnest(s.brands) AS brand
WHERE array_length(s.brands, 1) > 0;

-- Insert sample shop reviews
INSERT INTO public.shop_reviews (shop_id, user_id, rating, review_text, visit_date)
SELECT 
    s.id,
    u.id,
    floor(random() * 5 + 1)::integer,
    (ARRAY[
        'Great selection and knowledgeable staff!',
        'Excellent atmosphere for enjoying cigars.',
        'Good prices and quality products.',
        'Friendly service and comfortable lounge.',
        'Wide variety of premium cigars available.'
    ])[floor(random() * 5 + 1)],
    CURRENT_DATE - (random() * 365)::integer
FROM public.smoke_shops s
CROSS JOIN (SELECT id FROM public.users LIMIT 10) u
WHERE random() > 0.7; -- Only some users leave reviews

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_smoke_shops_updated_at BEFORE UPDATE ON public.smoke_shops FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_shop_inventory_updated_at BEFORE UPDATE ON public.shop_inventory FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_shop_reviews_updated_at BEFORE UPDATE ON public.shop_reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vision_analysis_results_updated_at BEFORE UPDATE ON public.vision_analysis_results FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_location_preferences_updated_at BEFORE UPDATE ON public.user_location_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_favorite_shops_updated_at BEFORE UPDATE ON public.user_favorite_shops FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.smoke_shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vision_analysis_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_location_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_favorite_shops ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Smoke shops are publicly readable
CREATE POLICY "Smoke shops are publicly readable" ON public.smoke_shops FOR SELECT USING (true);

-- Shop inventory is publicly readable
CREATE POLICY "Shop inventory is publicly readable" ON public.shop_inventory FOR SELECT USING (true);

-- Shop reviews are publicly readable
CREATE POLICY "Shop reviews are publicly readable" ON public.shop_reviews FOR SELECT USING (true);

-- Users can create their own reviews
CREATE POLICY "Users can create their own reviews" ON public.shop_reviews FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own reviews
CREATE POLICY "Users can update their own reviews" ON public.shop_reviews FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own reviews
CREATE POLICY "Users can delete their own reviews" ON public.shop_reviews FOR DELETE USING (auth.uid() = user_id);

-- Vision analysis results are private to the user
CREATE POLICY "Users can access their own vision analysis" ON public.vision_analysis_results FOR ALL USING (auth.uid() = user_id);

-- User location preferences are private to the user
CREATE POLICY "Users can access their own location preferences" ON public.user_location_preferences FOR ALL USING (auth.uid() = user_id);

-- User favorite shops are private to the user
CREATE POLICY "Users can access their own favorite shops" ON public.user_favorite_shops FOR ALL USING (auth.uid() = user_id);
