/**
 * API Configuration Service
 * Centralized configuration for API endpoints and settings
 */

// Environment configuration
const ENV = __DEV__ ? 'development' : 'production';

const API_CONFIGS = {
  development: {
    BASE_URL: 'http://localhost:3000/api/v1',
    TIMEOUT: 10000,
    USE_TEST_TOKEN: true, // Use test token endpoint for development
  },
  production: {
    BASE_URL: 'https://your-production-api.com/api/v1', // Update this when deploying
    TIMEOUT: 15000,
    USE_TEST_TOKEN: false,
  }
};

class ApiConfig {
  constructor() {
    this.config = API_CONFIGS[ENV];
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
  }

  get baseUrl() {
    return this.config.BASE_URL;
  }

  get timeout() {
    return this.config.TIMEOUT;
  }

  get useTestToken() {
    return this.config.USE_TEST_TOKEN;
  }

  get endpoints() {
    return {
      // Authentication
      auth: {
        signup: '/auth/signup',
        signin: '/auth/signin',
        testToken: '/auth/test-token', // For development testing
        refresh: '/auth/refresh',
      },
      
      // Users
      users: {
        profile: '/users',
        byId: (id) => `/users/${id}`,
      },
      
      // Scanner/Vision AI
      scanner: {
        identifyCigar: '/scanner/identify-cigar',
        identifyWine: '/scanner/identify-wine',
        identifyBeer: '/scanner/identify-beer',
        testVision: '/scanner/test-vision',
        testCigarScan: '/scanner/test-cigar-scan',
      },
      
      // Collections
      collections: {
        list: '/collections',
        byId: (id) => `/collections/${id}`,
        items: (id) => `/collections/${id}/items`,
        itemById: (collectionId, itemId) => `/collections/${collectionId}/items/${itemId}`,
        stats: (id) => `/collections/${id}/stats`,
      },
      
      // Social
      social: {
        feed: '/social/feed',
        posts: '/social/posts',
        postById: (id) => `/social/posts/${id}`,
        postLike: (id) => `/social/posts/${id}/like`,
        postLikes: (id) => `/social/posts/${id}/likes`,
        userPosts: (userId) => `/social/users/${userId}/posts`,
        userProfile: (userId) => `/social/users/${userId}/profile`,
      },
      
      // Health
      health: '/health',
    };
  }

  /**
   * Get full URL for an endpoint
   * @param {string} endpoint - Endpoint path
   * @returns {string} Full URL
   */
  getUrl(endpoint) {
    return `${this.baseUrl}${endpoint}`;
  }

  /**
   * Get default headers for API requests
   * @param {Object} additionalHeaders - Additional headers to merge
   * @returns {Object} Headers object
   */
  getHeaders(additionalHeaders = {}) {
    return {
      ...this.defaultHeaders,
      ...additionalHeaders,
    };
  }

  /**
   * Get authenticated headers with token
   * @param {string} token - JWT token
   * @param {Object} additionalHeaders - Additional headers to merge
   * @returns {Object} Headers object with Authorization
   */
  getAuthHeaders(token, additionalHeaders = {}) {
    return {
      ...this.defaultHeaders,
      'Authorization': `Bearer ${token}`,
      ...additionalHeaders,
    };
  }

  /**
   * Create fetch options with default settings
   * @param {Object} options - Fetch options
   * @returns {Object} Enhanced fetch options
   */
  getFetchOptions(options = {}) {
    return {
      timeout: this.timeout,
      ...options,
      headers: {
        ...this.defaultHeaders,
        ...options.headers,
      },
    };
  }

  /**
   * Create authenticated fetch options
   * @param {string} token - JWT token
   * @param {Object} options - Fetch options
   * @returns {Object} Enhanced fetch options with auth
   */
  getAuthFetchOptions(token, options = {}) {
    return {
      timeout: this.timeout,
      ...options,
      headers: {
        ...this.getAuthHeaders(token),
        ...options.headers,
      },
    };
  }

  /**
   * Check if we're in development mode
   * @returns {boolean} True if in development
   */
  isDevelopment() {
    return ENV === 'development';
  }

  /**
   * Check if we're in production mode
   * @returns {boolean} True if in production
   */
  isProduction() {
    return ENV === 'production';
  }

  /**
   * Log API request for debugging (development only)
   * @param {string} method - HTTP method
   * @param {string} url - Request URL
   * @param {Object} options - Request options
   */
  logRequest(method, url, options = {}) {
    if (this.isDevelopment()) {
      console.log(`🌐 API ${method.toUpperCase()}: ${url}`);
      if (options.body) {
        console.log('📤 Request body:', options.body);
      }
    }
  }

  /**
   * Log API response for debugging (development only)
   * @param {string} method - HTTP method
   * @param {string} url - Request URL
   * @param {Response} response - Fetch response
   * @param {*} data - Response data
   */
  logResponse(method, url, response, data = null) {
    if (this.isDevelopment()) {
      const status = response.status;
      const statusEmoji = status >= 200 && status < 300 ? '✅' : '❌';
      console.log(`${statusEmoji} API ${method.toUpperCase()} ${status}: ${url}`);
      if (data) {
        console.log('📥 Response data:', data);
      }
    }
  }
}

export default new ApiConfig();
