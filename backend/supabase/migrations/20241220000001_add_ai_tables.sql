-- Add AI and recommendation tables
-- This migration adds support for vector embeddings, user preferences, and recommendation tracking

-- Enable pgvector extension for vector similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- Product embeddings table for vector-based recommendations
CREATE TABLE IF NOT EXISTS product_embeddings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID NOT NULL,
    product_type TEXT NOT NULL CHECK (product_type IN ('cigar', 'beer', 'wine')),
    embedding vector(384), -- 384-dimensional vector for embeddings
    characteristics JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(product_id, product_type)
);

-- User preference vectors for personalized recommendations
CREATE TABLE IF NOT EXISTS user_preference_vectors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    vector_data JSONB NOT NULL, -- Stores UserPreferenceVector data
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- Recommendation history for tracking and learning
CREATE TABLE IF NOT EXISTS recommendation_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL,
    product_type TEXT NOT NULL CHECK (product_type IN ('cigar', 'beer', 'wine')),
    algorithm TEXT NOT NULL, -- 'vector', 'collaborative', 'personalized', 'hybrid'
    score DECIMAL(3,2) NOT NULL CHECK (score >= 0 AND score <= 1),
    confidence DECIMAL(3,2) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
    reason TEXT,
    shown_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- User feedback
    viewed_at TIMESTAMP WITH TIME ZONE,
    clicked_at TIMESTAMP WITH TIME ZONE,
    rated_at TIMESTAMP WITH TIME ZONE,
    feedback_rating INTEGER CHECK (feedback_rating >= 1 AND feedback_rating <= 5),
    feedback_action TEXT CHECK (feedback_action IN ('viewed', 'liked', 'purchased', 'dismissed')),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User behavior analytics for personalization
CREATE TABLE IF NOT EXISTS user_behavior_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    behavior_type TEXT NOT NULL, -- 'rating', 'view', 'search', 'filter', 'social_interaction'
    product_id UUID,
    product_type TEXT CHECK (product_type IN ('cigar', 'beer', 'wine')),
    metadata JSONB DEFAULT '{}', -- Additional context data
    session_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recommendation feedback for model improvement
CREATE TABLE IF NOT EXISTS recommendation_feedback (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recommendation_id UUID NOT NULL REFERENCES recommendation_history(id) ON DELETE CASCADE,
    feedback_type TEXT NOT NULL CHECK (feedback_type IN ('positive', 'negative', 'neutral')),
    feedback_score INTEGER CHECK (feedback_score >= 1 AND feedback_score <= 5),
    feedback_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, recommendation_id)
);

-- Similar users cache for collaborative filtering
CREATE TABLE IF NOT EXISTS user_similarity_cache (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    similar_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    similarity_score DECIMAL(5,4) NOT NULL CHECK (similarity_score >= 0 AND similarity_score <= 1),
    common_ratings INTEGER NOT NULL DEFAULT 0,
    algorithm TEXT NOT NULL DEFAULT 'pearson_correlation',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, similar_user_id),
    CHECK(user_id != similar_user_id)
);

-- Product similarity cache for item-based recommendations
CREATE TABLE IF NOT EXISTS product_similarity_cache (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID NOT NULL,
    product_type TEXT NOT NULL CHECK (product_type IN ('cigar', 'beer', 'wine')),
    similar_product_id UUID NOT NULL,
    similar_product_type TEXT NOT NULL CHECK (similar_product_type IN ('cigar', 'beer', 'wine')),
    similarity_score DECIMAL(5,4) NOT NULL CHECK (similarity_score >= 0 AND similarity_score <= 1),
    common_users INTEGER NOT NULL DEFAULT 0,
    algorithm TEXT NOT NULL DEFAULT 'cosine_similarity',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(product_id, product_type, similar_product_id, similar_product_type),
    CHECK(NOT (product_id = similar_product_id AND product_type = similar_product_type))
);

-- Indexes for performance optimization

-- Product embeddings indexes
CREATE INDEX IF NOT EXISTS idx_product_embeddings_product ON product_embeddings(product_id, product_type);
CREATE INDEX IF NOT EXISTS idx_product_embeddings_type ON product_embeddings(product_type);
CREATE INDEX IF NOT EXISTS idx_product_embeddings_embedding ON product_embeddings USING ivfflat (embedding vector_cosine_ops);

-- User preference vectors indexes
CREATE INDEX IF NOT EXISTS idx_user_preference_vectors_user ON user_preference_vectors(user_id);
CREATE INDEX IF NOT EXISTS idx_user_preference_vectors_updated ON user_preference_vectors(updated_at DESC);

-- Recommendation history indexes
CREATE INDEX IF NOT EXISTS idx_recommendation_history_user ON recommendation_history(user_id);
CREATE INDEX IF NOT EXISTS idx_recommendation_history_product ON recommendation_history(product_id, product_type);
CREATE INDEX IF NOT EXISTS idx_recommendation_history_algorithm ON recommendation_history(algorithm);
CREATE INDEX IF NOT EXISTS idx_recommendation_history_shown ON recommendation_history(shown_at DESC);
CREATE INDEX IF NOT EXISTS idx_recommendation_history_feedback ON recommendation_history(feedback_action, feedback_rating);

-- User behavior analytics indexes
CREATE INDEX IF NOT EXISTS idx_user_behavior_user ON user_behavior_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_user_behavior_type ON user_behavior_analytics(behavior_type);
CREATE INDEX IF NOT EXISTS idx_user_behavior_product ON user_behavior_analytics(product_id, product_type);
CREATE INDEX IF NOT EXISTS idx_user_behavior_created ON user_behavior_analytics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_behavior_session ON user_behavior_analytics(session_id);

-- Recommendation feedback indexes
CREATE INDEX IF NOT EXISTS idx_recommendation_feedback_user ON recommendation_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_recommendation_feedback_recommendation ON recommendation_feedback(recommendation_id);
CREATE INDEX IF NOT EXISTS idx_recommendation_feedback_type ON recommendation_feedback(feedback_type);

-- User similarity cache indexes
CREATE INDEX IF NOT EXISTS idx_user_similarity_user ON user_similarity_cache(user_id);
CREATE INDEX IF NOT EXISTS idx_user_similarity_similar ON user_similarity_cache(similar_user_id);
CREATE INDEX IF NOT EXISTS idx_user_similarity_score ON user_similarity_cache(similarity_score DESC);
CREATE INDEX IF NOT EXISTS idx_user_similarity_updated ON user_similarity_cache(updated_at DESC);

-- Product similarity cache indexes
CREATE INDEX IF NOT EXISTS idx_product_similarity_product ON product_similarity_cache(product_id, product_type);
CREATE INDEX IF NOT EXISTS idx_product_similarity_similar ON product_similarity_cache(similar_product_id, similar_product_type);
CREATE INDEX IF NOT EXISTS idx_product_similarity_score ON product_similarity_cache(similarity_score DESC);
CREATE INDEX IF NOT EXISTS idx_product_similarity_updated ON product_similarity_cache(updated_at DESC);

-- Row Level Security (RLS) policies

-- Enable RLS on all tables
ALTER TABLE product_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preference_vectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendation_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_behavior_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendation_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_similarity_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_similarity_cache ENABLE ROW LEVEL SECURITY;

-- Product embeddings - readable by all authenticated users, writable by service role
CREATE POLICY "Product embeddings are viewable by authenticated users" ON product_embeddings
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Product embeddings are writable by service role" ON product_embeddings
    FOR ALL USING (auth.role() = 'service_role');

-- User preference vectors - users can only access their own data
CREATE POLICY "Users can view their own preference vectors" ON user_preference_vectors
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own preference vectors" ON user_preference_vectors
    FOR ALL USING (auth.uid() = user_id);

-- Recommendation history - users can only access their own data
CREATE POLICY "Users can view their own recommendation history" ON recommendation_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage recommendation history" ON recommendation_history
    FOR ALL USING (auth.role() = 'service_role');

-- User behavior analytics - users can only access their own data
CREATE POLICY "Users can view their own behavior analytics" ON user_behavior_analytics
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage behavior analytics" ON user_behavior_analytics
    FOR ALL USING (auth.role() = 'service_role');

-- Recommendation feedback - users can only access their own feedback
CREATE POLICY "Users can manage their own recommendation feedback" ON recommendation_feedback
    FOR ALL USING (auth.uid() = user_id);

-- User similarity cache - users can view similarities involving them
CREATE POLICY "Users can view their similarity data" ON user_similarity_cache
    FOR SELECT USING (auth.uid() = user_id OR auth.uid() = similar_user_id);

CREATE POLICY "Service role can manage user similarity cache" ON user_similarity_cache
    FOR ALL USING (auth.role() = 'service_role');

-- Product similarity cache - readable by all authenticated users
CREATE POLICY "Product similarity is viewable by authenticated users" ON product_similarity_cache
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Service role can manage product similarity cache" ON product_similarity_cache
    FOR ALL USING (auth.role() = 'service_role');

-- Functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at columns
CREATE TRIGGER update_product_embeddings_updated_at BEFORE UPDATE ON product_embeddings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preference_vectors_updated_at BEFORE UPDATE ON user_preference_vectors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recommendation_history_updated_at BEFORE UPDATE ON recommendation_history
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_similarity_cache_updated_at BEFORE UPDATE ON user_similarity_cache
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_similarity_cache_updated_at BEFORE UPDATE ON product_similarity_cache
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE product_embeddings IS 'Stores vector embeddings for products used in similarity calculations';
COMMENT ON TABLE user_preference_vectors IS 'Stores user preference vectors for personalized recommendations';
COMMENT ON TABLE recommendation_history IS 'Tracks all recommendations shown to users for learning and analytics';
COMMENT ON TABLE user_behavior_analytics IS 'Captures user behavior for personalization and analytics';
COMMENT ON TABLE recommendation_feedback IS 'Stores user feedback on recommendations for model improvement';
COMMENT ON TABLE user_similarity_cache IS 'Caches user similarity scores for collaborative filtering';
COMMENT ON TABLE product_similarity_cache IS 'Caches product similarity scores for item-based recommendations';
