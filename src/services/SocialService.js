import AuthService from './AuthService';

const API_BASE_URL = 'http://localhost:3000/api/v1'; // Update this for production

class SocialService {
  constructor() {
    this.cache = new Map(); // Simple in-memory cache for posts
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  // =============================================
  // POSTS MANAGEMENT
  // =============================================

  /**
   * Get social feed with pagination
   * @param {number} limit - Number of posts to fetch
   * @param {number} offset - Offset for pagination
   * @returns {Promise<Array>} Array of posts
   */
  async getFeed(limit = 20, offset = 0) {
    try {
      const cacheKey = `feed_${limit}_${offset}`;
      const cached = this.getCachedData(cacheKey);
      if (cached) return cached;

      const response = await AuthService.authenticatedRequest('/social/feed', {
        method: 'GET',
        params: { limit, offset }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const posts = await response.json();
      this.setCachedData(cacheKey, posts);
      return posts;
    } catch (error) {
      console.error('Error fetching social feed:', error);
      throw error;
    }
  }

  /**
   * Get a specific post by ID
   * @param {string} postId - Post ID
   * @returns {Promise<Object>} Post object
   */
  async getPost(postId) {
    try {
      const cacheKey = `post_${postId}`;
      const cached = this.getCachedData(cacheKey);
      if (cached) return cached;

      const response = await AuthService.authenticatedRequest(`/social/posts/${postId}`, {
        method: 'GET'
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Post not found');
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const post = await response.json();
      this.setCachedData(cacheKey, post);
      return post;
    } catch (error) {
      console.error('Error fetching post:', error);
      throw error;
    }
  }

  /**
   * Create a new post
   * @param {Object} postData - Post data
   * @param {string} postData.content - Post content
   * @param {string} postData.image_url - Optional image URL
   * @param {string} postData.item_type - Optional item type (cigar, wine, beer)
   * @param {string} postData.item_name - Optional item name
   * @returns {Promise<Object>} Created post
   */
  async createPost(postData) {
    try {
      const response = await AuthService.authenticatedRequest('/social/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const newPost = await response.json();
      
      // Clear feed cache since we have a new post
      this.clearFeedCache();
      
      return newPost;
    } catch (error) {
      console.error('Error creating post:', error);
      throw error;
    }
  }

  /**
   * Delete a post
   * @param {string} postId - Post ID to delete
   * @returns {Promise<boolean>} Success status
   */
  async deletePost(postId) {
    try {
      const response = await AuthService.authenticatedRequest(`/social/posts/${postId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Clear caches
      this.clearPostCache(postId);
      this.clearFeedCache();

      return true;
    } catch (error) {
      console.error('Error deleting post:', error);
      throw error;
    }
  }

  // =============================================
  // LIKES MANAGEMENT
  // =============================================

  /**
   * Like or unlike a post
   * @param {string} postId - Post ID
   * @returns {Promise<Object>} Updated like status
   */
  async toggleLike(postId) {
    try {
      const response = await AuthService.authenticatedRequest(`/social/posts/${postId}/like`, {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Clear post cache to get updated like count
      this.clearPostCache(postId);
      this.clearFeedCache();

      return result;
    } catch (error) {
      console.error('Error toggling like:', error);
      throw error;
    }
  }

  /**
   * Get users who liked a post
   * @param {string} postId - Post ID
   * @returns {Promise<Array>} Array of users who liked the post
   */
  async getPostLikes(postId) {
    try {
      const response = await AuthService.authenticatedRequest(`/social/posts/${postId}/likes`, {
        method: 'GET'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching post likes:', error);
      throw error;
    }
  }

  // =============================================
  // USER INTERACTIONS
  // =============================================

  /**
   * Get user's posts
   * @param {string} userId - User ID
   * @param {number} limit - Number of posts to fetch
   * @param {number} offset - Offset for pagination
   * @returns {Promise<Array>} Array of user posts
   */
  async getUserPosts(userId, limit = 20, offset = 0) {
    try {
      const response = await AuthService.authenticatedRequest(`/social/users/${userId}/posts`, {
        method: 'GET',
        params: { limit, offset }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching user posts:', error);
      throw error;
    }
  }

  /**
   * Get user profile with social stats
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User profile with social stats
   */
  async getUserProfile(userId) {
    try {
      const response = await AuthService.authenticatedRequest(`/social/users/${userId}/profile`, {
        method: 'GET'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  }

  // =============================================
  // CACHE MANAGEMENT
  // =============================================

  getCachedData(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  setCachedData(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  clearPostCache(postId) {
    this.cache.delete(`post_${postId}`);
  }

  clearFeedCache() {
    // Clear all feed-related cache entries
    for (const key of this.cache.keys()) {
      if (key.startsWith('feed_')) {
        this.cache.delete(key);
      }
    }
  }

  clearAllCache() {
    this.cache.clear();
  }

  // =============================================
  // UTILITY METHODS
  // =============================================

  /**
   * Format post data for UI display
   * @param {Object} post - Raw post data from API
   * @returns {Object} Formatted post data
   */
  formatPost(post) {
    return {
      ...post,
      created_at: new Date(post.created_at),
      updated_at: new Date(post.updated_at),
      timeAgo: this.getTimeAgo(post.created_at),
      user: {
        ...post.user,
        avatarUrl: post.user?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(post.user?.name || 'User')}&background=8D5B2E&color=F4F1ED`
      }
    };
  }

  /**
   * Get human-readable time ago string
   * @param {string} dateString - ISO date string
   * @returns {string} Time ago string
   */
  getTimeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    
    return date.toLocaleDateString();
  }
}

export default new SocialService();
