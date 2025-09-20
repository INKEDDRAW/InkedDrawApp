/**
 * Offline-First Architecture Test Suite
 * Tests for WatermelonDB integration and offline functionality
 */

import { database, collections, DatabaseUtils } from './database';
import { SyncManager } from './database/sync/SyncManager';

// Test data
const testCigar = {
  serverId: 'test-cigar-1',
  name: 'Cohiba Behike 52',
  brand: 'Cohiba',
  origin: 'Cuba',
  wrapper: 'Connecticut Shade',
  binder: 'Dominican',
  filler: 'Dominican, Nicaraguan',
  strength: 'medium-full',
  size: 'Robusto',
  ringGauge: 52,
  length: 5.0,
  price: 45.00,
  description: 'A premium cigar with complex flavors',
  averageRating: 4.5,
  ratingCount: 128,
  category: 'premium',
  tags: JSON.stringify({
    flavor_profile: ['woody', 'spicy', 'leather'],
    strength_notes: ['medium-full'],
    occasions: ['special', 'evening'],
    pairings: ['whiskey', 'coffee']
  }),
  syncStatus: 'synced'
};

const testUser = {
  serverId: 'test-user-1',
  email: 'test@example.com',
  username: 'testuser',
  displayName: 'Test User',
  isAgeVerified: true,
  preferences: JSON.stringify({
    cigars: ['premium', 'medium'],
    beers: ['ipa', 'stout'],
    wines: ['red', 'cabernet'],
    notifications: {
      posts: true,
      comments: true,
      follows: true,
      recommendations: true
    },
    privacy: {
      profile_visibility: 'public',
      collection_visibility: 'public',
      activity_visibility: 'public'
    }
  }),
  syncStatus: 'synced'
};

/**
 * Test database initialization and basic operations
 */
export async function testDatabaseBasics(): Promise<void> {
  console.log('🧪 Testing database basics...');

  try {
    // Test database connection
    const stats = await DatabaseUtils.getDatabaseStats();
    console.log('✅ Database connected, stats:', stats);

    // Test creating a user
    const user = await database.write(async () => {
      return collections.users.create(record => {
        Object.assign(record, testUser);
      });
    });
    console.log('✅ User created:', user.username);

    // Test creating a cigar
    const cigar = await database.write(async () => {
      return collections.cigars.create(record => {
        Object.assign(record, testCigar);
      });
    });
    console.log('✅ Cigar created:', cigar.name);

    // Test querying
    const allCigars = await collections.cigars.query().fetch();
    console.log('✅ Query successful, found', allCigars.length, 'cigars');

    // Test reactive queries
    const subscription = collections.cigars.query().observe().subscribe({
      next: (cigars) => {
        console.log('🔄 Reactive update: found', cigars.length, 'cigars');
      }
    });

    // Clean up
    setTimeout(() => {
      subscription.unsubscribe();
      console.log('✅ Subscription cleaned up');
    }, 1000);

  } catch (error) {
    console.error('❌ Database basics test failed:', error);
    throw error;
  }
}

/**
 * Test offline mutations and optimistic updates
 */
export async function testOfflineMutations(): Promise<void> {
  console.log('🧪 Testing offline mutations...');

  try {
    // Test creating a rating (offline)
    const rating = await database.write(async () => {
      return collections.ratings.create(record => {
        record.serverId = `temp_${Date.now()}_${Math.random()}`;
        record.userId = testUser.serverId;
        record.productId = testCigar.serverId;
        record.productType = 'cigar';
        record.rating = 5;
        record.review = 'Excellent cigar, highly recommended!';
        record.isPrivate = false;
        record.syncStatus = 'pending';
      });
    });
    console.log('✅ Rating created (offline):', rating.rating, 'stars');

    // Test creating a collection item
    const collectionItem = await database.write(async () => {
      return collections.collections.create(record => {
        record.serverId = `temp_${Date.now()}_${Math.random()}`;
        record.userId = testUser.serverId;
        record.productId = testCigar.serverId;
        record.productType = 'cigar';
        record.quantity = 3;
        record.purchasePrice = 45.00;
        record.purchaseDate = new Date();
        record.storageLocation = 'Humidor A';
        record.notes = 'Birthday gift from friend';
        record.isWishlist = false;
        record.isFavorite = true;
        record.syncStatus = 'pending';
      });
    });
    console.log('✅ Collection item created:', collectionItem.quantity, 'items');

    // Test creating a post
    const post = await database.write(async () => {
      return collections.posts.create(record => {
        record.serverId = `temp_${Date.now()}_${Math.random()}`;
        record.userId = testUser.serverId;
        record.content = 'Just enjoyed an amazing Cohiba Behike! Perfect for a special evening. 🔥';
        record.productId = testCigar.serverId;
        record.productType = 'cigar';
        record.location = 'Local Cigar Lounge';
        record.tagsRaw = JSON.stringify(['cohiba', 'premium', 'evening']);
        record.visibility = 'public';
        record.likeCount = 0;
        record.commentCount = 0;
        record.shareCount = 0;
        record.isLikedByUser = false;
        record.syncStatus = 'pending';
      });
    });
    console.log('✅ Post created:', post.content.substring(0, 50) + '...');

  } catch (error) {
    console.error('❌ Offline mutations test failed:', error);
    throw error;
  }
}

/**
 * Test sync queue functionality
 */
export async function testSyncQueue(): Promise<void> {
  console.log('🧪 Testing sync queue...');

  try {
    const syncManager = SyncManager.getInstance();

    // Add items to sync queue
    await syncManager.addToSyncQueue(
      'ratings',
      'test-rating-1',
      'create',
      { rating: 5, review: 'Test review' },
      8 // High priority
    );

    await syncManager.addToSyncQueue(
      'posts',
      'test-post-1',
      'update',
      { content: 'Updated post content' },
      5 // Medium priority
    );

    // Check sync queue status
    const queueStatus = await syncManager.getSyncQueueStatus();
    console.log('✅ Sync queue status:', queueStatus);

    // Test queue processing (would normally happen automatically)
    console.log('✅ Sync queue items added successfully');

  } catch (error) {
    console.error('❌ Sync queue test failed:', error);
    throw error;
  }
}

/**
 * Test search and filtering functionality
 */
export async function testSearchAndFiltering(): Promise<void> {
  console.log('🧪 Testing search and filtering...');

  try {
    // Test global search
    const searchResults = await DatabaseUtils.globalSearch('cohiba', 10);
    console.log('✅ Global search results:', {
      cigars: searchResults.cigars.length,
      beers: searchResults.beers.length,
      wines: searchResults.wines.length,
      posts: searchResults.posts.length,
      users: searchResults.users.length
    });

    // Test cigar filtering
    const premiumCigars = await collections.cigars
      .query()
      .where('category', 'premium')
      .fetch();
    console.log('✅ Premium cigars found:', premiumCigars.length);

    // Test user ratings
    const userRatings = await collections.ratings
      .query()
      .where('user_id', testUser.serverId)
      .fetch();
    console.log('✅ User ratings found:', userRatings.length);

  } catch (error) {
    console.error('❌ Search and filtering test failed:', error);
    throw error;
  }
}

/**
 * Test database utilities and maintenance
 */
export async function testDatabaseUtilities(): Promise<void> {
  console.log('🧪 Testing database utilities...');

  try {
    // Test app settings
    await DatabaseUtils.setAppSetting('test_setting', 'test_value');
    const settingValue = await DatabaseUtils.getAppSetting('test_setting');
    console.log('✅ App setting test:', settingValue === 'test_value' ? 'PASS' : 'FAIL');

    // Test database integrity
    const isHealthy = await DatabaseUtils.checkIntegrity();
    console.log('✅ Database integrity:', isHealthy ? 'HEALTHY' : 'CORRUPTED');

    // Test database stats
    const stats = await DatabaseUtils.getDatabaseStats();
    console.log('✅ Database statistics:', {
      totalRecords: stats.totalRecords,
      pendingSync: stats.pendingSyncItems,
      lastSync: stats.lastSyncTime
    });

  } catch (error) {
    console.error('❌ Database utilities test failed:', error);
    throw error;
  }
}

/**
 * Run all offline tests
 */
export async function runOfflineTests(): Promise<void> {
  console.log('🚀 Starting offline-first architecture tests...\n');

  try {
    await testDatabaseBasics();
    console.log('');
    
    await testOfflineMutations();
    console.log('');
    
    await testSyncQueue();
    console.log('');
    
    await testSearchAndFiltering();
    console.log('');
    
    await testDatabaseUtilities();
    console.log('');

    console.log('🎉 All offline tests completed successfully!');
    
    // Final stats
    const finalStats = await DatabaseUtils.getDatabaseStats();
    console.log('\n📊 Final Database Statistics:');
    console.log('- Total Records:', finalStats.totalRecords);
    console.log('- Users:', finalStats.tableStats.users || 0);
    console.log('- Cigars:', finalStats.tableStats.cigars || 0);
    console.log('- Ratings:', finalStats.tableStats.ratings || 0);
    console.log('- Collections:', finalStats.tableStats.collections || 0);
    console.log('- Posts:', finalStats.tableStats.posts || 0);
    console.log('- Pending Sync:', finalStats.pendingSyncItems);

  } catch (error) {
    console.error('💥 Offline tests failed:', error);
    throw error;
  }
}

// Export for use in development
if (__DEV__) {
  // @ts-ignore
  global.testOffline = runOfflineTests;
  console.log('💡 Run offline tests with: testOffline()');
}
