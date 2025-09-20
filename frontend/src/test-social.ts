/**
 * Social Features Test Suite
 * Comprehensive testing for social functionality
 */

import { database, collections } from './database';
import { SyncManager } from './database/sync/SyncManager';

interface TestResult {
  test: string;
  passed: boolean;
  error?: string;
  duration: number;
}

class SocialFeaturesTester {
  private results: TestResult[] = [];
  private syncManager = SyncManager.getInstance();

  async runAllTests(): Promise<TestResult[]> {
    console.log('🧪 Starting Social Features Test Suite...\n');

    const tests = [
      this.testPostCreation,
      this.testPostLiking,
      this.testCommentCreation,
      this.testCommentLiking,
      this.testUserFollowing,
      this.testOfflineSync,
      this.testProductTagging,
      this.testSocialFeed,
      this.testUserProfile,
      this.testRealTimeUpdates,
    ];

    for (const test of tests) {
      await this.runTest(test.name, test.bind(this));
    }

    this.printResults();
    return this.results;
  }

  private async runTest(testName: string, testFn: () => Promise<void>): Promise<void> {
    const startTime = Date.now();
    try {
      await testFn();
      const duration = Date.now() - startTime;
      this.results.push({
        test: testName,
        passed: true,
        duration,
      });
      console.log(`✅ ${testName} - ${duration}ms`);
    } catch (error) {
      const duration = Date.now() - startTime;
      this.results.push({
        test: testName,
        passed: false,
        error: error.message,
        duration,
      });
      console.log(`❌ ${testName} - ${error.message} - ${duration}ms`);
    }
  }

  private async testPostCreation(): Promise<void> {
    const postData = {
      serverId: 'test-post-1',
      userId: 'test-user-1',
      content: 'Testing post creation with offline-first architecture! 🚬',
      images: JSON.stringify([{
        url: 'https://example.com/cigar.jpg',
        caption: 'Amazing Cohiba'
      }]),
      productId: 'test-cigar-1',
      productType: 'cigar',
      location: 'Test Cigar Lounge',
      tags: JSON.stringify(['test', 'cohiba', 'premium']),
      visibility: 'public',
      likeCount: 0,
      commentCount: 0,
      shareCount: 0,
      isLikedByUser: false,
      syncStatus: 'synced',
    };

    const post = await database.write(async () => {
      return await collections.posts.create(record => {
        Object.assign(record, postData);
      });
    });

    if (!post || post.content !== postData.content) {
      throw new Error('Post creation failed');
    }

    // Verify post can be retrieved
    const retrievedPost = await collections.posts.find(post.id);
    if (!retrievedPost) {
      throw new Error('Post retrieval failed');
    }
  }

  private async testPostLiking(): Promise<void> {
    // Create a test post first
    const post = await database.write(async () => {
      return await collections.posts.create(record => {
        record.serverId = 'test-post-like';
        record.userId = 'test-user-1';
        record.content = 'Test post for liking';
        record.likeCount = 0;
        record.isLikedByUser = false;
        record.syncStatus = 'synced';
      });
    });

    // Test liking the post
    await database.write(async () => {
      await post.update(record => {
        record.isLikedByUser = true;
        record.likeCount = 1;
        record.syncStatus = 'pending';
      });
    });

    const updatedPost = await collections.posts.find(post.id);
    if (!updatedPost.isLikedByUser || updatedPost.likeCount !== 1) {
      throw new Error('Post liking failed');
    }
  }

  private async testCommentCreation(): Promise<void> {
    // Create a test post first
    const post = await database.write(async () => {
      return await collections.posts.create(record => {
        record.serverId = 'test-post-comment';
        record.userId = 'test-user-1';
        record.content = 'Test post for commenting';
        record.commentCount = 0;
        record.syncStatus = 'synced';
      });
    });

    // Create a comment
    const comment = await database.write(async () => {
      return await collections.comments.create(record => {
        record.serverId = 'test-comment-1';
        record.postId = post.id;
        record.userId = 'test-user-2';
        record.content = 'Great post! Love this cigar too.';
        record.likeCount = 0;
        record.isLikedByUser = false;
        record.syncStatus = 'synced';
      });
    });

    // Update post comment count
    await database.write(async () => {
      await post.update(record => {
        record.commentCount = 1;
      });
    });

    if (!comment || comment.content !== 'Great post! Love this cigar too.') {
      throw new Error('Comment creation failed');
    }

    const updatedPost = await collections.posts.find(post.id);
    if (updatedPost.commentCount !== 1) {
      throw new Error('Post comment count update failed');
    }
  }

  private async testCommentLiking(): Promise<void> {
    // Create a test comment
    const comment = await database.write(async () => {
      return await collections.comments.create(record => {
        record.serverId = 'test-comment-like';
        record.postId = 'test-post-1';
        record.userId = 'test-user-1';
        record.content = 'Test comment for liking';
        record.likeCount = 0;
        record.isLikedByUser = false;
        record.syncStatus = 'synced';
      });
    });

    // Like the comment
    await database.write(async () => {
      await comment.update(record => {
        record.isLikedByUser = true;
        record.likeCount = 1;
        record.syncStatus = 'pending';
      });
    });

    const updatedComment = await collections.comments.find(comment.id);
    if (!updatedComment.isLikedByUser || updatedComment.likeCount !== 1) {
      throw new Error('Comment liking failed');
    }
  }

  private async testUserFollowing(): Promise<void> {
    // Create a follow relationship
    const follow = await database.write(async () => {
      return await collections.follows.create(record => {
        record.serverId = 'test-follow-1';
        record.followerId = 'test-user-1';
        record.followingId = 'test-user-2';
        record.syncStatus = 'synced';
      });
    });

    if (!follow || follow.followerId !== 'test-user-1') {
      throw new Error('Follow relationship creation failed');
    }

    // Test querying follows
    const follows = await collections.follows
      .query()
      .where('follower_id', 'test-user-1')
      .fetch();

    if (follows.length === 0) {
      throw new Error('Follow relationship query failed');
    }
  }

  private async testOfflineSync(): Promise<void> {
    // Create a post that needs syncing
    const post = await database.write(async () => {
      return await collections.posts.create(record => {
        record.serverId = `temp_${Date.now()}`;
        record.userId = 'test-user-1';
        record.content = 'Offline post test';
        record.syncStatus = 'pending';
      });
    });

    // Add to sync queue
    await database.write(async () => {
      return await collections.syncQueue.create(record => {
        record.tableName = 'posts';
        record.recordId = post.id;
        record.operation = 'create';
        record.priority = 8;
        record.attempts = 0;
        record.data = JSON.stringify({
          content: post.content,
          userId: post.userId,
        });
      });
    });

    // Verify sync queue entry
    const syncItems = await collections.syncQueue
      .query()
      .where('record_id', post.id)
      .fetch();

    if (syncItems.length === 0) {
      throw new Error('Sync queue entry creation failed');
    }
  }

  private async testProductTagging(): Promise<void> {
    // Create a post with product tagging
    const post = await database.write(async () => {
      return await collections.posts.create(record => {
        record.serverId = 'test-post-product';
        record.userId = 'test-user-1';
        record.content = 'Amazing cigar experience!';
        record.productId = 'test-cigar-cohiba';
        record.productType = 'cigar';
        record.tags = JSON.stringify(['cohiba', 'premium', 'evening']);
        record.syncStatus = 'synced';
      });
    });

    if (!post.productId || post.productType !== 'cigar') {
      throw new Error('Product tagging failed');
    }

    const tags = JSON.parse(post.tags || '[]');
    if (!tags.includes('cohiba')) {
      throw new Error('Post tags parsing failed');
    }
  }

  private async testSocialFeed(): Promise<void> {
    // Query posts for social feed
    const posts = await collections.posts
      .query()
      .sortBy('created_at', 'desc')
      .take(10);

    if (!Array.isArray(posts)) {
      throw new Error('Social feed query failed');
    }

    // Test filtering by product type
    const cigarPosts = await collections.posts
      .query()
      .where('product_type', 'cigar')
      .fetch();

    if (!Array.isArray(cigarPosts)) {
      throw new Error('Product type filtering failed');
    }
  }

  private async testUserProfile(): Promise<void> {
    // Query user's posts
    const userPosts = await collections.posts
      .query()
      .where('user_id', 'test-user-1')
      .sortBy('created_at', 'desc')
      .fetch();

    if (!Array.isArray(userPosts)) {
      throw new Error('User posts query failed');
    }

    // Query user's followers
    const followers = await collections.follows
      .query()
      .where('following_id', 'test-user-1')
      .fetch();

    if (!Array.isArray(followers)) {
      throw new Error('User followers query failed');
    }
  }

  private async testRealTimeUpdates(): Promise<void> {
    // Test reactive queries
    let updateReceived = false;

    const subscription = collections.posts
      .query()
      .observe()
      .subscribe(() => {
        updateReceived = true;
      });

    // Create a new post to trigger update
    await database.write(async () => {
      return await collections.posts.create(record => {
        record.serverId = 'test-realtime';
        record.userId = 'test-user-1';
        record.content = 'Real-time update test';
        record.syncStatus = 'synced';
      });
    });

    // Wait for reactive update
    await new Promise(resolve => setTimeout(resolve, 100));

    subscription.unsubscribe();

    if (!updateReceived) {
      throw new Error('Real-time updates not working');
    }
  }

  private printResults(): void {
    console.log('\n📊 Social Features Test Results:');
    console.log('================================');

    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.filter(r => r.failed).length;
    const totalTime = this.results.reduce((sum, r) => sum + r.duration, 0);

    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⏱️  Total Time: ${totalTime}ms`);
    console.log(`📈 Success Rate: ${((passed / this.results.length) * 100).toFixed(1)}%`);

    if (failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.results
        .filter(r => !r.passed)
        .forEach(r => {
          console.log(`   • ${r.test}: ${r.error}`);
        });
    }

    console.log('\n🎉 Social features testing complete!');
  }
}

// Export test runner
export const testSocialFeatures = async (): Promise<TestResult[]> => {
  const tester = new SocialFeaturesTester();
  return await tester.runAllTests();
};

// Auto-run in development
if (__DEV__) {
  // Uncomment to run tests automatically
  // testSocialFeatures();
}
