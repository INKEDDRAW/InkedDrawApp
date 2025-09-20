# Supabase Database Schema

This directory contains the complete Supabase database schema and configuration for the Inked Draw application.

## Files Overview

- `schema.sql` - Complete database schema with all tables, indexes, triggers, and RLS policies
- `config.ts` - Supabase client configuration and connection setup
- `types.ts` - TypeScript type definitions for database tables
- `migrations/` - Database migration files for version control
- `README.md` - This documentation file

## Database Architecture

### Core Tables

**User Management:**
- `users` - Core user data (extends Supabase auth.users)
- `profiles` - Extended user profiles with preferences and privacy settings

**Product Catalogs:**
- `cigars` - Comprehensive cigar database with detailed attributes
- `beers` - Beer catalog with brewing details and characteristics
- `wines` - Wine database with vintage and tasting information

**User Interactions:**
- `user_cigars` - User ratings and reviews for cigars
- `user_beers` - User ratings and reviews for beers  
- `user_wines` - User ratings and reviews for wines

**Social Features:**
- `posts` - User-generated content and social feed
- `comments` - Comments on posts with nested support
- `post_likes` / `comment_likes` - Engagement tracking
- `user_follows` - Social connections between users

**AI & Data Processing:**
- `ingestion_review_items` - Content moderation and data ingestion pipeline
- `user_preference_vectors` - AI preference embeddings for recommendations
- `product_embeddings` - Product similarity vectors for matching

### Key Features

**Security:**
- Row Level Security (RLS) policies on all user-related tables
- Privacy controls for profiles and user interactions
- Secure authentication integration with Supabase Auth

**Performance:**
- Comprehensive indexing strategy for fast queries
- Full-text search with tsvector columns
- Vector similarity search using pgvector extension

**Real-time:**
- Optimized for Supabase Realtime subscriptions
- Live updates for social feed, comments, and likes
- Efficient change tracking with triggers

**AI Ready:**
- Vector embeddings for recommendation engine
- Preference learning from user interactions
- Content similarity matching

## Setup Instructions

### 1. Environment Variables

Create a `.env` file in the backend directory:

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 2. Database Setup

**Option A: Using Supabase Dashboard**
1. Copy the contents of `schema.sql`
2. Paste into the Supabase SQL Editor
3. Execute the script

**Option B: Using Supabase CLI**
```bash
# Install Supabase CLI
npm install -g supabase

# Initialize project
supabase init

# Link to your project
supabase link --project-ref your-project-ref

# Apply migration
supabase db push
```

### 3. Verify Setup

After running the schema, you should have:
- ✅ All tables created with proper relationships
- ✅ Indexes applied for performance
- ✅ RLS policies enabled for security
- ✅ Triggers active for data consistency
- ✅ Sample data inserted for development

## Usage Examples

### Basic Client Setup

```typescript
import { supabase } from './supabase/config';

// Get user profile
const { data: profile } = await supabase
  .from('profiles')
  .select('*')
  .eq('user_id', userId)
  .single();

// Search cigars
const { data: cigars } = await supabase
  .from('cigars')
  .select('*')
  .textSearch('search_vector', 'padron maduro');

// Create a post
const { data: post } = await supabase
  .from('posts')
  .insert({
    user_id: userId,
    content: 'Just tried an amazing cigar!',
    cigar_id: cigarId,
    post_type: 'review'
  });
```

### Real-time Subscriptions

```typescript
// Subscribe to new posts
const subscription = supabase
  .channel('posts_channel')
  .on('postgres_changes', 
    { event: 'INSERT', schema: 'public', table: 'posts' },
    (payload) => {
      console.log('New post:', payload.new);
    }
  )
  .subscribe();
```

## Migration Strategy

The database uses a migration-based approach for version control:

1. **001_initial_schema.sql** - Complete initial schema
2. Future migrations will be numbered sequentially
3. Each migration includes rollback instructions
4. All changes are tracked in version control

## Security Considerations

- **RLS Policies**: All user data is protected by Row Level Security
- **Privacy Controls**: Users can control visibility of their profiles and interactions
- **Data Validation**: Check constraints ensure data integrity
- **Audit Trail**: All tables include created_at and updated_at timestamps

## Performance Optimization

- **Indexes**: Strategic indexing on frequently queried columns
- **Partitioning**: Ready for table partitioning as data grows
- **Caching**: Optimized for Redis caching layer
- **Vector Search**: Efficient similarity search using pgvector

## Monitoring & Maintenance

- Monitor query performance using Supabase dashboard
- Regular VACUUM and ANALYZE operations
- Index usage monitoring
- RLS policy performance tracking

This schema provides a solid foundation for a scalable, secure, and feature-rich social platform for connoisseurs.
