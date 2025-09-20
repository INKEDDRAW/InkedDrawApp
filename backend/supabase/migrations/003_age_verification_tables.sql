-- Age Verification Tables Migration
-- Creates tables for managing age verification process

-- Create age_verifications table
CREATE TABLE IF NOT EXISTS age_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id VARCHAR(255) NOT NULL UNIQUE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
    verification_method VARCHAR(20) NOT NULL DEFAULT 'veriff' CHECK (verification_method IN ('veriff', 'manual')),
    
    -- Personal information from verification
    date_of_birth DATE,
    age INTEGER,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    nationality VARCHAR(3), -- ISO 3166-1 alpha-3 country code
    
    -- Document information
    document_type VARCHAR(50),
    document_number VARCHAR(100),
    document_country VARCHAR(3), -- ISO 3166-1 alpha-3 country code
    
    -- Verification timestamps
    verified_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ NOT NULL,
    
    -- Attempt tracking
    attempts INTEGER NOT NULL DEFAULT 1,
    max_attempts INTEGER NOT NULL DEFAULT 3,
    
    -- Additional metadata (JSON for flexibility)
    metadata JSONB DEFAULT '{}',
    
    -- Audit fields
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_age_verifications_user_id ON age_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_age_verifications_session_id ON age_verifications(session_id);
CREATE INDEX IF NOT EXISTS idx_age_verifications_status ON age_verifications(status);
CREATE INDEX IF NOT EXISTS idx_age_verifications_expires_at ON age_verifications(expires_at);
CREATE INDEX IF NOT EXISTS idx_age_verifications_created_at ON age_verifications(created_at);

-- Create composite index for user verification lookups
CREATE INDEX IF NOT EXISTS idx_age_verifications_user_status ON age_verifications(user_id, status, expires_at);

-- Add age verification fields to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_age_verified BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS age_verified_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS age_verification_required BOOLEAN NOT NULL DEFAULT TRUE;

-- Create index on age verification status in profiles
CREATE INDEX IF NOT EXISTS idx_profiles_age_verified ON profiles(is_age_verified);

-- Create verification_audit_log table for compliance tracking
CREATE TABLE IF NOT EXISTS verification_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    verification_id UUID REFERENCES age_verifications(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL, -- 'started', 'completed', 'failed', 'expired', 'manual_override'
    old_status VARCHAR(20),
    new_status VARCHAR(20),
    performed_by UUID REFERENCES auth.users(id), -- For manual actions
    ip_address INET,
    user_agent TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for audit log
CREATE INDEX IF NOT EXISTS idx_verification_audit_log_user_id ON verification_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_audit_log_verification_id ON verification_audit_log(verification_id);
CREATE INDEX IF NOT EXISTS idx_verification_audit_log_action ON verification_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_verification_audit_log_created_at ON verification_audit_log(created_at);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for age_verifications updated_at
CREATE TRIGGER update_age_verifications_updated_at 
    BEFORE UPDATE ON age_verifications 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to log verification status changes
CREATE OR REPLACE FUNCTION log_verification_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Only log if status actually changed
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO verification_audit_log (
            user_id,
            verification_id,
            action,
            old_status,
            new_status,
            metadata
        ) VALUES (
            NEW.user_id,
            NEW.id,
            'status_changed',
            OLD.status,
            NEW.status,
            jsonb_build_object(
                'session_id', NEW.session_id,
                'verification_method', NEW.verification_method,
                'changed_at', NOW()
            )
        );
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for status change logging
CREATE TRIGGER log_age_verification_status_change
    AFTER UPDATE ON age_verifications
    FOR EACH ROW
    EXECUTE FUNCTION log_verification_status_change();

-- Create function to update profile verification status
CREATE OR REPLACE FUNCTION update_profile_verification_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Update profile when verification is approved
    IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
        UPDATE profiles 
        SET 
            is_age_verified = TRUE,
            age_verified_at = NEW.verified_at
        WHERE user_id = NEW.user_id;
    END IF;
    
    -- Remove verification if status changes from approved to something else
    IF OLD.status = 'approved' AND NEW.status != 'approved' THEN
        UPDATE profiles 
        SET 
            is_age_verified = FALSE,
            age_verified_at = NULL
        WHERE user_id = NEW.user_id;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to update profile verification status
CREATE TRIGGER update_profile_on_verification_change
    AFTER UPDATE ON age_verifications
    FOR EACH ROW
    EXECUTE FUNCTION update_profile_verification_status();

-- Row Level Security (RLS) Policies

-- Enable RLS on age_verifications table
ALTER TABLE age_verifications ENABLE ROW LEVEL SECURITY;

-- Users can only see their own verification records
CREATE POLICY "Users can view own age verifications" ON age_verifications
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own verification records (via service)
CREATE POLICY "Users can insert own age verifications" ON age_verifications
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Only service role can update verification records
CREATE POLICY "Service can update age verifications" ON age_verifications
    FOR UPDATE USING (auth.role() = 'service_role');

-- Enable RLS on verification_audit_log table
ALTER TABLE verification_audit_log ENABLE ROW LEVEL SECURITY;

-- Users can view their own audit logs
CREATE POLICY "Users can view own verification audit logs" ON verification_audit_log
    FOR SELECT USING (auth.uid() = user_id);

-- Service role can insert audit logs
CREATE POLICY "Service can insert verification audit logs" ON verification_audit_log
    FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON age_verifications TO authenticated;
GRANT SELECT, INSERT ON verification_audit_log TO authenticated;
GRANT ALL ON age_verifications TO service_role;
GRANT ALL ON verification_audit_log TO service_role;

-- Create view for verification statistics (admin use)
CREATE OR REPLACE VIEW verification_statistics AS
SELECT 
    DATE_TRUNC('day', created_at) as date,
    status,
    verification_method,
    COUNT(*) as count,
    AVG(EXTRACT(EPOCH FROM (verified_at - created_at))/60) as avg_completion_minutes
FROM age_verifications 
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', created_at), status, verification_method
ORDER BY date DESC;

-- Grant access to statistics view
GRANT SELECT ON verification_statistics TO service_role;
