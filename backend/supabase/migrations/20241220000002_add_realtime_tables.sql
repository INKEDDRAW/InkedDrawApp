-- Real-time Features Database Migration
-- Creates tables for notifications, presence, chat, and live feed

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('post', 'comment', 'like', 'follow', 'message', 'recommendation', 'system')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    image_url TEXT,
    action_url TEXT,
    priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    is_read BOOLEAN NOT NULL DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    scheduled_for TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User presence table
CREATE TABLE IF NOT EXISTS user_presence (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    is_online BOOLEAN NOT NULL DEFAULT false,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    current_activity TEXT DEFAULT 'offline',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User activity log
CREATE TABLE IF NOT EXISTS user_activity_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat rooms table
CREATE TABLE IF NOT EXISTS chat_rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT,
    type TEXT NOT NULL DEFAULT 'direct' CHECK (type IN ('direct', 'group', 'public')),
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    metadata JSONB DEFAULT '{}',
    last_message_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat participants table
CREATE TABLE IF NOT EXISTS chat_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_seen_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    role TEXT DEFAULT 'member' CHECK (role IN ('member', 'admin', 'owner')),
    UNIQUE(room_id, user_id)
);

-- Chat messages table
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'system')),
    reply_to_id UUID REFERENCES chat_messages(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    edited_at TIMESTAMP WITH TIME ZONE
);

-- Feed activities table (for live feed)
CREATE TABLE IF NOT EXISTS feed_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    activity_type TEXT NOT NULL CHECK (activity_type IN ('post', 'comment', 'like', 'follow', 'rating', 'collection_add')),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_id UUID,
    target_type TEXT,
    content TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Push subscriptions table
CREATE TABLE IF NOT EXISTS push_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subscription_data JSONB NOT NULL,
    user_agent TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_created ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_unread ON notifications(user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type_created ON notifications(type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_expires_at ON notifications(expires_at) WHERE expires_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_user_presence_online ON user_presence(is_online, last_seen DESC);
CREATE INDEX IF NOT EXISTS idx_user_presence_activity ON user_presence(current_activity, last_seen DESC);

CREATE INDEX IF NOT EXISTS idx_user_activity_log_user_created ON user_activity_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_activity_log_activity_created ON user_activity_log(activity_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_chat_rooms_type_created ON chat_rooms(type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_created_by ON chat_rooms(created_by);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_last_message ON chat_rooms(last_message_at DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS idx_chat_participants_room_id ON chat_participants(room_id);
CREATE INDEX IF NOT EXISTS idx_chat_participants_user_id ON chat_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_participants_active ON chat_participants(user_id, is_active);

CREATE INDEX IF NOT EXISTS idx_chat_messages_room_created ON chat_messages(room_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_created ON chat_messages(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_reply_to ON chat_messages(reply_to_id) WHERE reply_to_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_chat_messages_content_search ON chat_messages USING gin(to_tsvector('english', content));

CREATE INDEX IF NOT EXISTS idx_feed_activities_user_created ON feed_activities(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feed_activities_type_created ON feed_activities(activity_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feed_activities_target ON feed_activities(target_type, target_id);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_active ON push_subscriptions(user_id, is_active);

-- Row Level Security (RLS) policies
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE feed_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Notifications policies
CREATE POLICY "Users can view their own notifications" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- User presence policies
CREATE POLICY "Users can view all user presence" ON user_presence
    FOR SELECT USING (true);

CREATE POLICY "Users can update their own presence" ON user_presence
    FOR ALL USING (auth.uid() = user_id);

-- User activity log policies
CREATE POLICY "Users can view their own activity log" ON user_activity_log
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own activity log" ON user_activity_log
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Chat rooms policies
CREATE POLICY "Users can view rooms they participate in" ON chat_rooms
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM chat_participants 
            WHERE room_id = chat_rooms.id 
            AND user_id = auth.uid() 
            AND is_active = true
        )
    );

CREATE POLICY "Users can create chat rooms" ON chat_rooms
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Room creators can update their rooms" ON chat_rooms
    FOR UPDATE USING (auth.uid() = created_by);

-- Chat participants policies
CREATE POLICY "Users can view participants of their rooms" ON chat_participants
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM chat_participants cp2
            WHERE cp2.room_id = chat_participants.room_id 
            AND cp2.user_id = auth.uid() 
            AND cp2.is_active = true
        )
    );

CREATE POLICY "Users can manage their own participation" ON chat_participants
    FOR ALL USING (auth.uid() = user_id);

-- Chat messages policies
CREATE POLICY "Users can view messages in their rooms" ON chat_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM chat_participants 
            WHERE room_id = chat_messages.room_id 
            AND user_id = auth.uid() 
            AND is_active = true
        )
    );

CREATE POLICY "Users can send messages to their rooms" ON chat_messages
    FOR INSERT WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM chat_participants 
            WHERE room_id = chat_messages.room_id 
            AND user_id = auth.uid() 
            AND is_active = true
        )
    );

CREATE POLICY "Users can update their own messages" ON chat_messages
    FOR UPDATE USING (auth.uid() = user_id);

-- Feed activities policies
CREATE POLICY "Users can view public feed activities" ON feed_activities
    FOR SELECT USING (true);

CREATE POLICY "Users can create their own feed activities" ON feed_activities
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Push subscriptions policies
CREATE POLICY "Users can manage their own push subscriptions" ON push_subscriptions
    FOR ALL USING (auth.uid() = user_id);

-- Functions and triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON notifications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_presence_updated_at BEFORE UPDATE ON user_presence
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chat_rooms_updated_at BEFORE UPDATE ON chat_rooms
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_push_subscriptions_updated_at BEFORE UPDATE ON push_subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to clean up old notifications
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS void AS $$
BEGIN
    -- Delete read notifications older than 30 days
    DELETE FROM notifications 
    WHERE is_read = true 
    AND read_at < NOW() - INTERVAL '30 days';
    
    -- Delete expired notifications
    DELETE FROM notifications 
    WHERE expires_at IS NOT NULL 
    AND expires_at < NOW();
    
    -- Delete old unread low priority notifications (older than 7 days)
    DELETE FROM notifications 
    WHERE is_read = false 
    AND priority = 'low' 
    AND created_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- Function to clean up old activity logs
CREATE OR REPLACE FUNCTION cleanup_old_activity_logs()
RETURNS void AS $$
BEGIN
    -- Delete activity logs older than 90 days
    DELETE FROM user_activity_log 
    WHERE created_at < NOW() - INTERVAL '90 days';
    
    -- Delete feed activities older than 90 days
    DELETE FROM feed_activities 
    WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- Create a view for unread notification counts
CREATE OR REPLACE VIEW user_notification_counts AS
SELECT 
    user_id,
    COUNT(*) as total_unread,
    COUNT(CASE WHEN type = 'message' THEN 1 END) as unread_messages,
    COUNT(CASE WHEN type = 'post' THEN 1 END) as unread_posts,
    COUNT(CASE WHEN type = 'comment' THEN 1 END) as unread_comments,
    COUNT(CASE WHEN type = 'like' THEN 1 END) as unread_likes,
    COUNT(CASE WHEN type = 'follow' THEN 1 END) as unread_follows,
    COUNT(CASE WHEN priority = 'high' OR priority = 'urgent' THEN 1 END) as high_priority_unread
FROM notifications
WHERE is_read = false 
    AND (expires_at IS NULL OR expires_at > NOW())
GROUP BY user_id;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON notifications TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_presence TO authenticated;
GRANT SELECT, INSERT ON user_activity_log TO authenticated;
GRANT SELECT, INSERT, UPDATE ON chat_rooms TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON chat_participants TO authenticated;
GRANT SELECT, INSERT, UPDATE ON chat_messages TO authenticated;
GRANT SELECT, INSERT ON feed_activities TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON push_subscriptions TO authenticated;
GRANT SELECT ON user_notification_counts TO authenticated;
