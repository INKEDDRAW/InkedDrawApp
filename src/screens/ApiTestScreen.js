import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Button, BodyText, HeadingText } from '../components';
import { theme } from '../theme';
import AuthService from '../services/AuthService';
import CollectionsService from '../services/CollectionsService';
import SocialService from '../services/SocialService';
import ApiConfig from '../services/ApiConfig';

/**
 * API Test Screen - Development Only
 * Tests all API endpoints to verify integration
 */
export default function ApiTestScreen() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    const authenticated = await AuthService.isAuthenticated();
    setIsAuthenticated(authenticated);
  };

  const addResult = (test, success, message, data = null) => {
    const result = {
      id: Date.now(),
      test,
      success,
      message,
      data,
      timestamp: new Date().toLocaleTimeString(),
    };
    setResults(prev => [result, ...prev]);
  };

  const clearResults = () => {
    setResults([]);
  };

  // Test 1: Get Test Token (Development)
  const testGetToken = async () => {
    setLoading(true);
    try {
      const result = await AuthService.getTestToken();
      if (result.success) {
        addResult('Get Test Token', true, 'Token obtained successfully', result);
        setIsAuthenticated(true);
      } else {
        addResult('Get Test Token', false, result.error);
      }
    } catch (error) {
      addResult('Get Test Token', false, error.message);
    }
    setLoading(false);
  };

  // Test 2: Health Check
  const testHealthCheck = async () => {
    setLoading(true);
    try {
      const response = await fetch(ApiConfig.getUrl(ApiConfig.endpoints.health));
      const data = await response.json();
      
      if (response.ok) {
        addResult('Health Check', true, 'API is healthy', data);
      } else {
        addResult('Health Check', false, `HTTP ${response.status}`);
      }
    } catch (error) {
      addResult('Health Check', false, error.message);
    }
    setLoading(false);
  };

  // Test 3: Get Collections
  const testGetCollections = async () => {
    if (!isAuthenticated) {
      Alert.alert('Error', 'Please get a test token first');
      return;
    }

    setLoading(true);
    try {
      const collections = await CollectionsService.getCollections();
      addResult('Get Collections', true, `Found ${collections.length} collections`, collections);
    } catch (error) {
      addResult('Get Collections', false, error.message);
    }
    setLoading(false);
  };

  // Test 4: Get Social Feed
  const testGetSocialFeed = async () => {
    if (!isAuthenticated) {
      Alert.alert('Error', 'Please get a test token first');
      return;
    }

    setLoading(true);
    try {
      const feed = await SocialService.getFeed();
      addResult('Get Social Feed', true, `Found ${feed.length} posts`, feed);
    } catch (error) {
      addResult('Get Social Feed', false, error.message);
    }
    setLoading(false);
  };

  // Test 5: Test Vision API
  const testVisionAPI = async () => {
    if (!isAuthenticated) {
      Alert.alert('Error', 'Please get a test token first');
      return;
    }

    setLoading(true);
    try {
      const response = await AuthService.authenticatedRequest(ApiConfig.endpoints.scanner.testVision);
      const data = await response.json();
      
      if (response.ok) {
        addResult('Vision API Test', true, 'Vision API is working', data);
      } else {
        addResult('Vision API Test', false, `HTTP ${response.status}: ${data.message}`);
      }
    } catch (error) {
      addResult('Vision API Test', false, error.message);
    }
    setLoading(false);
  };

  // Test 6: Run All Tests
  const runAllTests = async () => {
    clearResults();
    await testHealthCheck();
    await new Promise(resolve => setTimeout(resolve, 500)); // Small delay
    await testGetToken();
    await new Promise(resolve => setTimeout(resolve, 500));
    await testVisionAPI();
    await new Promise(resolve => setTimeout(resolve, 500));
    await testGetCollections();
    await new Promise(resolve => setTimeout(resolve, 500));
    await testGetSocialFeed();
  };

  const renderResult = (result) => (
    <View key={result.id} style={[styles.resultCard, result.success ? styles.successCard : styles.errorCard]}>
      <View style={styles.resultHeader}>
        <BodyText style={styles.resultTest}>{result.test}</BodyText>
        <BodyText style={styles.resultTime}>{result.timestamp}</BodyText>
      </View>
      <BodyText style={[styles.resultMessage, result.success ? styles.successText : styles.errorText]}>
        {result.success ? '✅' : '❌'} {result.message}
      </BodyText>
      {result.data && (
        <BodyText style={styles.resultData}>
          {typeof result.data === 'object' ? JSON.stringify(result.data, null, 2) : result.data}
        </BodyText>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <HeadingText style={styles.title}>API Integration Test</HeadingText>
        <BodyText style={styles.subtitle}>
          Environment: {ApiConfig.isDevelopment() ? 'Development' : 'Production'}
        </BodyText>
        <BodyText style={styles.subtitle}>
          Auth Status: {isAuthenticated ? '🔐 Authenticated' : '🔓 Not Authenticated'}
        </BodyText>
      </View>

      <View style={styles.buttonContainer}>
        <Button
          title="Run All Tests"
          onPress={runAllTests}
          disabled={loading}
          style={styles.primaryButton}
        />
        <View style={styles.buttonRow}>
          <Button
            title="Health"
            onPress={testHealthCheck}
            disabled={loading}
            style={styles.smallButton}
          />
          <Button
            title="Token"
            onPress={testGetToken}
            disabled={loading}
            style={styles.smallButton}
          />
          <Button
            title="Vision"
            onPress={testVisionAPI}
            disabled={loading}
            style={styles.smallButton}
          />
        </View>
        <View style={styles.buttonRow}>
          <Button
            title="Collections"
            onPress={testGetCollections}
            disabled={loading}
            style={styles.smallButton}
          />
          <Button
            title="Social"
            onPress={testGetSocialFeed}
            disabled={loading}
            style={styles.smallButton}
          />
          <Button
            title="Clear"
            onPress={clearResults}
            disabled={loading}
            style={styles.smallButton}
          />
        </View>
      </View>

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <BodyText style={styles.loadingText}>Running tests...</BodyText>
        </View>
      )}

      <ScrollView style={styles.resultsContainer} showsVerticalScrollIndicator={false}>
        {results.map(renderResult)}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.md,
  },
  header: {
    marginBottom: theme.spacing.lg,
  },
  title: {
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    marginBottom: theme.spacing.xs,
  },
  buttonContainer: {
    marginBottom: theme.spacing.lg,
  },
  primaryButton: {
    marginBottom: theme.spacing.md,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  smallButton: {
    flex: 1,
    marginHorizontal: theme.spacing.xs,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  loadingText: {
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.sm,
  },
  resultsContainer: {
    flex: 1,
  },
  resultCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
  },
  successCard: {
    borderColor: '#4CAF50',
  },
  errorCard: {
    borderColor: '#F44336',
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  resultTest: {
    color: theme.colors.text,
    fontWeight: '600',
  },
  resultTime: {
    color: theme.colors.textSecondary,
    fontSize: 12,
  },
  resultMessage: {
    marginBottom: theme.spacing.xs,
  },
  successText: {
    color: '#4CAF50',
  },
  errorText: {
    color: '#F44336',
  },
  resultData: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontFamily: 'monospace',
    backgroundColor: theme.colors.background,
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
  },
});
