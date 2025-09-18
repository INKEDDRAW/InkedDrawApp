# Database Setup Guide

## Overview

The InkedDraw database schema is designed for a luxury social platform focused on cigar, wine, and beer collections. It uses Supabase (PostgreSQL) with Row Level Security (RLS) for secure multi-tenant data access.

## Schema Structure

### Core Tables

1. **`users`** - Extended user profiles (linked to Supabase auth.users)
2. **`collections`** - User-created collections (e.g., "My Humidor", "Wine Cellar")
3. **`collection_items`** - Individual items in collections (cigars, wines, beers)
4. **`posts`** - Social media posts about collection items
5. **`post_likes`** - Like interactions on posts

### Key Features

- **Row Level Security (RLS)** - Users can only access their own data
- **Public Collections** - Users can make collections public for sharing
- **Social Features** - Posts, likes, and engagement tracking
- **Rich Metadata** - Ratings, notes, purchase info, tags
- **Scan Integration** - Links to AI scanner results

## Setup Instructions

### 1. Supabase Project Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Note your project URL and API keys
3. Update your `.env` file:
   ```env
   SUPABASE_URL=https://your-project-ref.supabase.co
   SUPABASE_ANON_KEY=your-anon-key-here
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
   ```

### 2. Run Database Schema

1. Open the Supabase Dashboard
2. Go to **SQL Editor**
3. Copy and paste the contents of `database-schema.sql`
4. Click **Run** to execute the schema

### 3. Configure Authentication

1. In Supabase Dashboard, go to **Authentication > Settings**
2. Configure your site URL: `http://localhost:3000` (for development)
3. Add any additional redirect URLs for production

### 4. Test Database Connection

Run the backend server and test the connection:
```bash
npm run start:dev
```

Check the logs for "Supabase client initialized" message.

## Data Model Relationships

```
auth.users (Supabase Auth)
    ↓
users (Extended Profile)
    ↓
collections (User Collections)
    ↓
collection_items (Individual Items)
    ↓
posts (Social Posts)
    ↓
post_likes (Engagement)
```

## Security Model

### Row Level Security Policies

- **Users**: Can only view/edit their own profile
- **Collections**: Can view own + public collections
- **Collection Items**: Can view own + items in public collections
- **Posts**: Public viewing, own editing
- **Post Likes**: Public viewing, own management

### API Security

- All collection endpoints require JWT authentication
- User ID extracted from JWT token
- No direct user_id parameters in API calls

## Usage Examples

### Creating a Collection
```sql
INSERT INTO collections (user_id, name, type, description)
VALUES (auth.uid(), 'My Humidor', 'cigar', 'Premium cigar collection');
```

### Adding a Scanned Item
```sql
INSERT INTO collection_items (
  collection_id, user_id, name, brand, type, 
  scan_id, confidence, description
) VALUES (
  'collection-uuid', auth.uid(), 'Cohiba Robusto', 'Cohiba', 'cigar',
  'scan_123', 0.85, 'Premium Cuban cigar'
);
```

### Creating a Social Post
```sql
INSERT INTO posts (user_id, collection_item_id, content)
VALUES (auth.uid(), 'item-uuid', 'Enjoying this amazing Cohiba tonight! 🔥');
```

## Performance Considerations

### Indexes
- All foreign keys are indexed
- Common query patterns are optimized
- Composite indexes for complex queries

### Pagination
- Use `created_at` for cursor-based pagination
- Limit results to reasonable page sizes (20-50 items)

### Caching
- Consider Redis for frequently accessed data
- Cache user profiles and public collections

## Development vs Production

### Development
- Use local Supabase instance or development project
- Enable detailed logging
- Use sample data for testing

### Production
- Use production Supabase project
- Enable connection pooling
- Set up database backups
- Monitor query performance

## Migration Strategy

### Initial Setup
1. Run the complete schema on a fresh database
2. No migrations needed for initial deployment

### Future Changes
1. Create migration files for schema changes
2. Use Supabase CLI for version control
3. Test migrations on staging environment first

## Monitoring and Maintenance

### Key Metrics to Monitor
- Database connection count
- Query performance (slow queries)
- Storage usage growth
- RLS policy effectiveness

### Regular Maintenance
- Analyze query performance monthly
- Review and optimize indexes
- Clean up orphaned records
- Update RLS policies as needed

## Troubleshooting

### Common Issues

1. **RLS Policy Errors**
   - Check that `auth.uid()` is available
   - Verify JWT token is valid
   - Ensure user exists in users table

2. **Foreign Key Violations**
   - Verify referenced records exist
   - Check cascade delete settings
   - Ensure proper transaction handling

3. **Performance Issues**
   - Check for missing indexes
   - Analyze query execution plans
   - Consider query optimization

### Debug Queries

```sql
-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'collections';

-- View current user context
SELECT auth.uid(), auth.role();

-- Check table permissions
SELECT * FROM information_schema.table_privileges 
WHERE table_name = 'collections';
```
