# Offline-First Architecture Guide

## Overview

Inked Draw implements a comprehensive offline-first architecture using WatermelonDB, ensuring the app works seamlessly without an internet connection while providing automatic synchronization when online.

## Architecture Components

### 1. Local Database (WatermelonDB)
- **SQLite-based**: Fast, reliable local storage
- **Reactive**: Real-time updates across components
- **Optimized**: Built for React Native performance
- **Sync-ready**: Designed for bidirectional synchronization

### 2. Sync Manager
- **Intelligent Sync**: Handles online/offline transitions
- **Conflict Resolution**: Resolves data conflicts automatically
- **Queue Management**: Manages pending changes when offline
- **Background Sync**: Syncs data in the background

### 3. Offline Context
- **Network Monitoring**: Tracks connection status
- **Sync State**: Manages synchronization progress
- **Database Stats**: Provides insights into local data
- **Utilities**: Helper functions for offline operations

## Database Schema

### Core Tables
```sql
-- Users and Authentication
users: user profiles, preferences, sync status

-- Product Catalogs
cigars: cigar database with ratings, tags, metadata
beers: beer database with brewery, style, ABV info
wines: wine database with vintage, region, varietal info

-- User Data
ratings: user reviews and ratings for products
collections: personal inventory and wishlists
posts: social posts with images and product links
comments: post comments and replies
follows: user following relationships

-- System Tables
sync_queue: pending changes for synchronization
app_settings: app configuration and cache
```

### Sync Status Fields
Every record includes:
- `sync_status`: 'synced', 'pending', 'conflict'
- `last_synced_at`: timestamp of last successful sync
- `server_id`: unique identifier from server

## Usage Examples

### 1. Querying Data (Offline-First)
```typescript
import { useOfflineCigars } from '../hooks/useOfflineQuery';

const CigarList = () => {
  const { 
    data: cigars, 
    loading, 
    refresh, 
    loadMore,
    hasMore 
  } = useOfflineCigars({
    where: [Q.where('strength', 'full')],
    limit: 20,
    refreshOnOnline: true
  });

  return (
    <FlatList
      data={cigars}
      onRefresh={refresh}
      onEndReached={loadMore}
      onEndReachedThreshold={0.1}
      // ... render items
    />
  );
};
```

### 2. Creating Data (Optimistic Updates)
```typescript
import { useCreateRating } from '../hooks/useOfflineMutation';

const RatingForm = ({ productId, productType }) => {
  const createRating = useCreateRating();

  const handleSubmit = async (data) => {
    try {
      // This works offline with optimistic updates
      await createRating.mutate({
        productId,
        productType,
        rating: data.rating,
        review: data.review,
        flavorNotes: data.flavorNotes
      });
      
      // UI updates immediately, syncs when online
      navigation.goBack();
    } catch (error) {
      // Handle error
    }
  };

  return (
    <RatingForm 
      onSubmit={handleSubmit}
      loading={createRating.loading}
    />
  );
};
```

### 3. Monitoring Offline State
```typescript
import { useOffline } from '../contexts/OfflineContext';

const SyncIndicator = () => {
  const { 
    isOnline, 
    isSyncing, 
    pendingSyncItems,
    lastSyncTime,
    syncNow 
  } = useOffline();

  return (
    <View>
      <Text>Status: {isOnline ? 'Online' : 'Offline'}</Text>
      {isSyncing && <Text>Syncing...</Text>}
      {pendingSyncItems > 0 && (
        <Text>{pendingSyncItems} items pending sync</Text>
      )}
      <Button onPress={syncNow} title="Sync Now" />
    </View>
  );
};
```

### 4. Feature Availability Checks
```typescript
import { useOfflineCapability } from '../contexts/OfflineContext';

const PostCreator = () => {
  const canCreatePosts = useOfflineCapability('create_posts');
  const canUploadImages = useOfflineCapability('upload_images');

  if (!canCreatePosts) {
    return <Text>This feature requires an internet connection</Text>;
  }

  return (
    <PostForm 
      allowImages={canUploadImages}
      // ... other props
    />
  );
};
```

## Sync Strategies

### 1. Optimistic Updates
- **Immediate UI Response**: Changes appear instantly
- **Background Sync**: Actual sync happens in background
- **Rollback on Failure**: Reverts changes if sync fails
- **User Experience**: Feels like online app

### 2. Conflict Resolution
```typescript
// Default conflict resolution strategy
const conflictResolver = (table, local, remote) => {
  switch (table) {
    case 'ratings':
      // User's personal data always wins
      return local.user_id === remote.user_id ? local : remote;
    
    case 'collections':
      // User's collection always wins
      return local.user_id === remote.user_id ? local : remote;
    
    case 'users':
      // Merge preferences, server wins for other fields
      return {
        ...remote,
        preferences: local.preferences || remote.preferences,
      };
    
    default:
      // Last write wins (server timestamp)
      return remote.updated_at > local.updated_at ? remote : local;
  }
};
```

### 3. Sync Queue Management
- **Priority System**: Important changes sync first
- **Retry Logic**: Exponential backoff for failed syncs
- **Batch Processing**: Multiple changes in single request
- **Error Handling**: Graceful failure recovery

## Performance Optimizations

### 1. Database Performance
- **Indexed Queries**: Fast lookups on common fields
- **Lazy Loading**: Load related data on demand
- **Pagination**: Limit initial data load
- **Caching**: Smart caching of frequently accessed data

### 2. Sync Performance
- **Incremental Sync**: Only sync changed data
- **Compression**: Compress sync payloads
- **Background Processing**: Sync during idle time
- **Smart Scheduling**: Sync based on usage patterns

### 3. Memory Management
- **Reactive Queries**: Automatic cleanup of unused subscriptions
- **Garbage Collection**: Remove old cached data
- **Image Optimization**: Compress and cache images locally
- **Database Compaction**: Regular database maintenance

## Offline Capabilities

### ✅ Works Offline
- Browse product catalogs (cigars, beers, wines)
- View personal collection and inventory
- Rate and review products
- Create social posts and comments
- Search local data
- View user profiles and preferences
- Like and interact with cached posts
- Edit personal information

### ❌ Requires Online
- Initial data download
- Image uploads
- Real-time notifications
- Live chat features
- Payment processing
- Account creation/deletion
- Password reset
- Social discovery (finding new users)

## Best Practices

### 1. Data Design
- **Denormalization**: Store related data together for offline access
- **Minimal Dependencies**: Reduce cross-table dependencies
- **Smart Defaults**: Provide sensible defaults for missing data
- **Graceful Degradation**: App works with partial data

### 2. User Experience
- **Clear Indicators**: Show online/offline status
- **Pending Actions**: Indicate when actions are queued
- **Error Messages**: Explain what requires internet
- **Offline Onboarding**: Teach users about offline features

### 3. Development
- **Test Offline**: Regularly test with no internet
- **Monitor Sync**: Track sync success rates
- **Handle Conflicts**: Plan for data conflicts
- **Performance Testing**: Test with large local datasets

## Troubleshooting

### Common Issues

1. **Sync Failures**
   - Check network connectivity
   - Verify authentication tokens
   - Review conflict resolution logs
   - Clear sync queue if corrupted

2. **Performance Issues**
   - Monitor database size
   - Check query optimization
   - Review memory usage
   - Compact database regularly

3. **Data Inconsistencies**
   - Force full sync
   - Check conflict resolution rules
   - Verify server-side data integrity
   - Review sync queue priorities

### Debug Tools
```typescript
// Get database statistics
const stats = await DatabaseUtils.getDatabaseStats();
console.log('Database stats:', stats);

// Check sync queue status
const syncStatus = await syncManager.getSyncQueueStatus();
console.log('Sync queue:', syncStatus);

// Force database integrity check
const isHealthy = await DatabaseUtils.checkIntegrity();
console.log('Database healthy:', isHealthy);
```

## Migration and Updates

### Schema Migrations
- **Version Control**: Track schema versions
- **Backward Compatibility**: Support older app versions
- **Data Migration**: Migrate existing user data
- **Rollback Strategy**: Plan for migration failures

### App Updates
- **Incremental Updates**: Update schema incrementally
- **Data Preservation**: Preserve user data during updates
- **Sync Compatibility**: Maintain sync protocol compatibility
- **Testing**: Thoroughly test migration paths

This offline-first architecture ensures Inked Draw provides a premium, responsive experience regardless of network conditions, making it perfect for cigar lounges with poor WiFi, travel scenarios, or basement humidors where connectivity is limited.
