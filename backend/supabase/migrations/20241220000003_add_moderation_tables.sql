-- Content Moderation System Database Schema
-- Migration: Add comprehensive moderation tables

-- Moderation Results Table
-- Stores results of AI and manual content moderation
CREATE TABLE IF NOT EXISTS moderation_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id UUID NOT NULL,
    content_type VARCHAR(50) NOT NULL CHECK (content_type IN ('post', 'comment', 'image', 'profile', 'message')),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Moderation decision
    is_approved BOOLEAN NOT NULL DEFAULT true,
    confidence DECIMAL(3,2) NOT NULL DEFAULT 1.0 CHECK (confidence >= 0 AND confidence <= 1),
    
    -- Flags and reasons
    flags JSONB DEFAULT '[]'::jsonb,
    reasons JSONB DEFAULT '[]'::jsonb,
    severity VARCHAR(20) NOT NULL DEFAULT 'low' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    
    -- Review requirements
    requires_human_review BOOLEAN NOT NULL DEFAULT false,
    auto_actions JSONB DEFAULT '[]'::jsonb,
    
    -- Processing metadata
    processing_time_ms INTEGER,
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Reports Table
-- Stores user-submitted reports for community moderation
CREATE TABLE IF NOT EXISTS user_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reported_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    content_id UUID,
    content_type VARCHAR(50) CHECK (content_type IN ('post', 'comment', 'profile', 'message')),
    
    -- Report details
    report_type VARCHAR(50) NOT NULL CHECK (report_type IN (
        'spam', 'harassment', 'hate_speech', 'violence', 
        'inappropriate_content', 'fake_account', 'copyright', 'other'
    )),
    reason TEXT NOT NULL,
    evidence JSONB DEFAULT '[]'::jsonb,
    
    -- Priority and status
    priority VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'investigating', 'resolved', 'dismissed')),
    
    -- Resolution
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES users(id),
    resolution TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT user_reports_target_check CHECK (
        (reported_user_id IS NOT NULL) OR (content_id IS NOT NULL)
    )
);

-- Moderation Queue Table
-- Manages content requiring human moderation review
CREATE TABLE IF NOT EXISTS moderation_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id UUID NOT NULL,
    content_type VARCHAR(50) NOT NULL CHECK (content_type IN ('post', 'comment', 'image', 'profile', 'message')),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Queue management
    priority VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_review', 'approved', 'rejected', 'escalated')),
    
    -- Moderation details
    flags JSONB DEFAULT '[]'::jsonb,
    reasons JSONB DEFAULT '[]'::jsonb,
    severity VARCHAR(20) NOT NULL DEFAULT 'low' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    confidence DECIMAL(3,2) NOT NULL DEFAULT 1.0 CHECK (confidence >= 0 AND confidence <= 1),
    
    -- Assignment and review
    assigned_to UUID REFERENCES users(id),
    assigned_at TIMESTAMP WITH TIME ZONE,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID REFERENCES users(id),
    review_notes TEXT,
    escalation_reason TEXT,
    
    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Moderation Appeals Table
-- Handles appeals of moderation decisions
CREATE TABLE IF NOT EXISTS moderation_appeals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id UUID NOT NULL,
    content_type VARCHAR(50) NOT NULL CHECK (content_type IN ('post', 'comment', 'image', 'profile', 'message')),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Appeal details
    appeal_reason TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'approved', 'denied')),
    
    -- Resolution
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID REFERENCES users(id),
    resolution TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Auto-Moderation Rules Table
-- Configurable rules for automatic content moderation
CREATE TABLE IF NOT EXISTS auto_moderation_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Rule configuration
    rule_type VARCHAR(50) NOT NULL CHECK (rule_type IN ('content', 'user', 'behavior')),
    condition_type VARCHAR(100) NOT NULL,
    condition_params JSONB DEFAULT '{}'::jsonb,
    
    -- Actions
    action_type VARCHAR(100) NOT NULL,
    action_params JSONB DEFAULT '{}'::jsonb,
    severity VARCHAR(20) NOT NULL DEFAULT 'low' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    
    -- Status
    is_active BOOLEAN NOT NULL DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_moderation_results_content ON moderation_results(content_id, content_type);
CREATE INDEX IF NOT EXISTS idx_moderation_results_user ON moderation_results(user_id);
CREATE INDEX IF NOT EXISTS idx_moderation_results_created_at ON moderation_results(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_moderation_results_severity ON moderation_results(severity);
CREATE INDEX IF NOT EXISTS idx_moderation_results_approval ON moderation_results(is_approved);

CREATE INDEX IF NOT EXISTS idx_user_reports_reporter ON user_reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_user_reports_reported_user ON user_reports(reported_user_id);
CREATE INDEX IF NOT EXISTS idx_user_reports_content ON user_reports(content_id, content_type);
CREATE INDEX IF NOT EXISTS idx_user_reports_status ON user_reports(status);
CREATE INDEX IF NOT EXISTS idx_user_reports_priority ON user_reports(priority);
CREATE INDEX IF NOT EXISTS idx_user_reports_created_at ON user_reports(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_moderation_queue_status ON moderation_queue(status);
CREATE INDEX IF NOT EXISTS idx_moderation_queue_priority ON moderation_queue(priority);
CREATE INDEX IF NOT EXISTS idx_moderation_queue_assigned_to ON moderation_queue(assigned_to);
CREATE INDEX IF NOT EXISTS idx_moderation_queue_created_at ON moderation_queue(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_moderation_queue_content ON moderation_queue(content_id, content_type);

CREATE INDEX IF NOT EXISTS idx_moderation_appeals_user ON moderation_appeals(user_id);
CREATE INDEX IF NOT EXISTS idx_moderation_appeals_content ON moderation_appeals(content_id, content_type);
CREATE INDEX IF NOT EXISTS idx_moderation_appeals_status ON moderation_appeals(status);
CREATE INDEX IF NOT EXISTS idx_moderation_appeals_created_at ON moderation_appeals(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_auto_moderation_rules_active ON auto_moderation_rules(is_active);
CREATE INDEX IF NOT EXISTS idx_auto_moderation_rules_type ON auto_moderation_rules(rule_type);

-- Add full-text search indexes for content analysis
CREATE INDEX IF NOT EXISTS idx_user_reports_reason_fts ON user_reports USING gin(to_tsvector('english', reason));
CREATE INDEX IF NOT EXISTS idx_moderation_queue_review_notes_fts ON moderation_queue USING gin(to_tsvector('english', review_notes));

-- Row Level Security (RLS) Policies

-- Enable RLS on all moderation tables
ALTER TABLE moderation_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderation_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderation_appeals ENABLE ROW LEVEL SECURITY;
ALTER TABLE auto_moderation_rules ENABLE ROW LEVEL SECURITY;

-- Moderation Results Policies
-- Users can view their own moderation results
CREATE POLICY "Users can view own moderation results" ON moderation_results
    FOR SELECT USING (user_id = auth.uid());

-- Moderators can view all moderation results
CREATE POLICY "Moderators can view all moderation results" ON moderation_results
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND (is_moderator = true OR is_admin = true)
        )
    );

-- System can insert moderation results
CREATE POLICY "System can insert moderation results" ON moderation_results
    FOR INSERT WITH CHECK (true);

-- User Reports Policies
-- Users can submit reports
CREATE POLICY "Users can submit reports" ON user_reports
    FOR INSERT WITH CHECK (reporter_id = auth.uid());

-- Users can view their own submitted reports
CREATE POLICY "Users can view own reports" ON user_reports
    FOR SELECT USING (reporter_id = auth.uid());

-- Moderators can view and manage all reports
CREATE POLICY "Moderators can manage reports" ON user_reports
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND (is_moderator = true OR is_admin = true)
        )
    );

-- Moderation Queue Policies
-- Only moderators can access the moderation queue
CREATE POLICY "Moderators can access queue" ON moderation_queue
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND (is_moderator = true OR is_admin = true)
        )
    );

-- Moderation Appeals Policies
-- Users can submit appeals for their own content
CREATE POLICY "Users can submit appeals" ON moderation_appeals
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can view their own appeals
CREATE POLICY "Users can view own appeals" ON moderation_appeals
    FOR SELECT USING (user_id = auth.uid());

-- Moderators can view and manage all appeals
CREATE POLICY "Moderators can manage appeals" ON moderation_appeals
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND (is_moderator = true OR is_admin = true)
        )
    );

-- Auto-Moderation Rules Policies
-- Only admins can manage auto-moderation rules
CREATE POLICY "Admins can manage auto-moderation rules" ON auto_moderation_rules
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND is_admin = true
        )
    );

-- Moderators can view auto-moderation rules
CREATE POLICY "Moderators can view auto-moderation rules" ON auto_moderation_rules
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND (is_moderator = true OR is_admin = true)
        )
    );

-- Create functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_moderation_results_updated_at 
    BEFORE UPDATE ON moderation_results 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_reports_updated_at 
    BEFORE UPDATE ON user_reports 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_moderation_queue_updated_at 
    BEFORE UPDATE ON moderation_queue 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_moderation_appeals_updated_at 
    BEFORE UPDATE ON moderation_appeals 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_auto_moderation_rules_updated_at 
    BEFORE UPDATE ON auto_moderation_rules 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add moderation-related columns to existing tables
-- Add moderation flags to user profiles
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS is_moderator BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS moderation_flags INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS ban_until TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS suspended_until TIMESTAMP WITH TIME ZONE;

-- Add moderation fields to posts
ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS hidden_reason TEXT,
ADD COLUMN IF NOT EXISTS is_removed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS removed_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS removed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;

-- Add moderation fields to comments
ALTER TABLE comments 
ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS hidden_reason TEXT,
ADD COLUMN IF NOT EXISTS is_removed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS removed_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS removed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;

-- Create materialized view for moderation dashboard statistics
CREATE MATERIALIZED VIEW IF NOT EXISTS moderation_dashboard_stats AS
SELECT 
    -- Overall statistics
    COUNT(*) as total_moderation_actions,
    COUNT(CASE WHEN is_approved = false THEN 1 END) as rejected_content,
    COUNT(CASE WHEN requires_human_review = true THEN 1 END) as human_reviews_required,
    
    -- Statistics by time period
    COUNT(CASE WHEN created_at >= NOW() - INTERVAL '24 hours' THEN 1 END) as actions_last_24h,
    COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as actions_last_7d,
    COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as actions_last_30d,
    
    -- Statistics by severity
    COUNT(CASE WHEN severity = 'low' THEN 1 END) as low_severity,
    COUNT(CASE WHEN severity = 'medium' THEN 1 END) as medium_severity,
    COUNT(CASE WHEN severity = 'high' THEN 1 END) as high_severity,
    COUNT(CASE WHEN severity = 'critical' THEN 1 END) as critical_severity,
    
    -- Performance metrics
    AVG(processing_time_ms) as avg_processing_time,
    AVG(confidence) as avg_confidence,
    
    -- Last updated
    NOW() as last_updated
FROM moderation_results
WHERE created_at >= NOW() - INTERVAL '90 days';

-- Create index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_moderation_dashboard_stats_unique ON moderation_dashboard_stats (last_updated);

-- Create function to refresh materialized view
CREATE OR REPLACE FUNCTION refresh_moderation_dashboard_stats()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY moderation_dashboard_stats;
END;
$$ LANGUAGE plpgsql;

-- Create cleanup function for old moderation data
CREATE OR REPLACE FUNCTION cleanup_old_moderation_data()
RETURNS void AS $$
BEGIN
    -- Delete old moderation results (older than 1 year)
    DELETE FROM moderation_results 
    WHERE created_at < NOW() - INTERVAL '1 year';
    
    -- Delete resolved reports older than 6 months
    DELETE FROM user_reports 
    WHERE status IN ('resolved', 'dismissed') 
    AND created_at < NOW() - INTERVAL '6 months';
    
    -- Delete completed queue items older than 3 months
    DELETE FROM moderation_queue 
    WHERE status IN ('approved', 'rejected') 
    AND created_at < NOW() - INTERVAL '3 months';
    
    -- Delete old appeals (older than 1 year)
    DELETE FROM moderation_appeals 
    WHERE created_at < NOW() - INTERVAL '1 year';
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON moderation_results TO authenticated;
GRANT SELECT, INSERT, UPDATE ON user_reports TO authenticated;
GRANT SELECT, INSERT, UPDATE ON moderation_queue TO authenticated;
GRANT SELECT, INSERT, UPDATE ON moderation_appeals TO authenticated;
GRANT SELECT ON auto_moderation_rules TO authenticated;
GRANT SELECT ON moderation_dashboard_stats TO authenticated;
