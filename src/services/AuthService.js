import * as Keychain from 'react-native-keychain';
import ApiConfig from './ApiConfig';

class AuthService {
  constructor() {
    this.tokenKey = 'inkeddraw_access_token';
    this.refreshTokenKey = 'inkeddraw_refresh_token';
    this.userKey = 'inkeddraw_user_data';
  }

  // Secure token storage using Keychain
  async storeTokens(accessToken, refreshToken) {
    try {
      await Keychain.setInternetCredentials(
        this.tokenKey,
        'access_token',
        accessToken
      );
      
      if (refreshToken) {
        await Keychain.setInternetCredentials(
          this.refreshTokenKey,
          'refresh_token',
          refreshToken
        );
      }
      
      return true;
    } catch (error) {
      console.error('Error storing tokens:', error);
      return false;
    }
  }

  async getAccessToken() {
    try {
      const credentials = await Keychain.getInternetCredentials(this.tokenKey);
      return credentials ? credentials.password : null;
    } catch (error) {
      console.error('Error retrieving access token:', error);
      return null;
    }
  }

  async getRefreshToken() {
    try {
      const credentials = await Keychain.getInternetCredentials(this.refreshTokenKey);
      return credentials ? credentials.password : null;
    } catch (error) {
      console.error('Error retrieving refresh token:', error);
      return null;
    }
  }

  async clearTokens() {
    try {
      await Keychain.resetInternetCredentials(this.tokenKey);
      await Keychain.resetInternetCredentials(this.refreshTokenKey);
      await Keychain.resetInternetCredentials(this.userKey);
      return true;
    } catch (error) {
      console.error('Error clearing tokens:', error);
      return false;
    }
  }

  // User data storage
  async storeUserData(userData) {
    try {
      await Keychain.setInternetCredentials(
        this.userKey,
        'user_data',
        JSON.stringify(userData)
      );
      return true;
    } catch (error) {
      console.error('Error storing user data:', error);
      return false;
    }
  }

  async getUserData() {
    try {
      const credentials = await Keychain.getInternetCredentials(this.userKey);
      return credentials ? JSON.parse(credentials.password) : null;
    } catch (error) {
      console.error('Error retrieving user data:', error);
      return null;
    }
  }

  // Development helper: Get test token
  async getTestToken() {
    if (!ApiConfig.useTestToken) {
      throw new Error('Test tokens are only available in development mode');
    }

    try {
      const response = await fetch(ApiConfig.getUrl(ApiConfig.endpoints.auth.testToken), {
        method: 'GET',
        headers: ApiConfig.getHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to get test token');
      }

      // Store the test token
      await this.storeTokens(data.access_token, null);

      // Create mock user data for testing
      const mockUser = {
        id: 'b921c284-8132-4e2e-8151-870f91164d78',
        email: 'test3@inkeddraw.com',
        name: 'Test User 3',
      };
      await this.storeUserData(mockUser);

      ApiConfig.logResponse('GET', ApiConfig.endpoints.auth.testToken, response, data);

      return { success: true, user: mockUser, token: data.access_token };
    } catch (error) {
      console.error('Test token error:', error);
      return { success: false, error: error.message };
    }
  }

  // API calls
  async signUp(email, password, name) {
    try {
      const url = ApiConfig.getUrl(ApiConfig.endpoints.auth.signup);
      const options = ApiConfig.getFetchOptions({
        method: 'POST',
        body: JSON.stringify({ email, password, name }),
      });

      ApiConfig.logRequest('POST', url, options);

      const response = await fetch(url, options);
      const data = await response.json();

      ApiConfig.logResponse('POST', url, response, data);

      if (!response.ok) {
        throw new Error(data.message || 'Sign up failed');
      }

      // Store tokens and user data
      await this.storeTokens(data.access_token, data.refresh_token);
      await this.storeUserData(data.user);

      return { success: true, user: data.user };
    } catch (error) {
      console.error('Sign up error:', error);
      return { success: false, error: error.message };
    }
  }

  async signIn(email, password) {
    try {
      const url = ApiConfig.getUrl(ApiConfig.endpoints.auth.signin);
      const options = ApiConfig.getFetchOptions({
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      ApiConfig.logRequest('POST', url, options);

      const response = await fetch(url, options);
      const data = await response.json();

      ApiConfig.logResponse('POST', url, response, data);

      if (!response.ok) {
        throw new Error(data.message || 'Sign in failed');
      }

      // Store tokens and user data
      await this.storeTokens(data.access_token, data.refresh_token);
      await this.storeUserData(data.user);

      return { success: true, user: data.user };
    } catch (error) {
      console.error('Sign in error:', error);
      return { success: false, error: error.message };
    }
  }

  async signOut() {
    try {
      await this.clearTokens();
      return { success: true };
    } catch (error) {
      console.error('Sign out error:', error);
      return { success: false, error: error.message };
    }
  }

  async isAuthenticated() {
    const token = await this.getAccessToken();
    const userData = await this.getUserData();
    return !!(token && userData);
  }

  // Authenticated API request helper
  async authenticatedRequest(endpoint, options = {}) {
    const token = await this.getAccessToken();

    if (!token) {
      throw new Error('No authentication token available');
    }

    const url = ApiConfig.getUrl(endpoint);
    const fetchOptions = ApiConfig.getAuthFetchOptions(token, options);

    ApiConfig.logRequest(options.method || 'GET', url, fetchOptions);

    const response = await fetch(url, fetchOptions);

    if (response.status === 401) {
      // Token might be expired, clear tokens and redirect to login
      await this.clearTokens();
      throw new Error('Authentication expired');
    }

    // Log response for debugging
    try {
      const responseClone = response.clone();
      const data = await responseClone.json();
      ApiConfig.logResponse(options.method || 'GET', url, response, data);
    } catch (e) {
      // Response might not be JSON, that's okay
      ApiConfig.logResponse(options.method || 'GET', url, response);
    }

    return response;
  }
}

export default new AuthService();
