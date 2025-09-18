import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Button, BodyText, HeadingText } from '../components';
import { theme } from '../theme';

/**
 * Simple API Demo - Minimal React Native API Integration Test
 * Shows the API working with the React Native frontend
 */
export default function SimpleApiDemo() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [token, setToken] = useState(null);

  const API_BASE = 'http://localhost:3000/api/v1';

  const addResult = (test, success, message, data = null) => {
    const result = {
      id: Date.now(),
      test,
      success,
      message,
      data: data ? JSON.stringify(data, null, 2) : null,
      timestamp: new Date().toLocaleTimeString(),
    };
    setResults(prev => [result, ...prev.slice(0, 4)]); // Keep only last 5 results
  };

  const clearResults = () => {
    setResults([]);
    setToken(null);
  };

  // Test 1: Health Check
  const testHealth = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/health`);
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

  // Test 2: Get Test Token
  const testGetToken = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/auth/test-token`);
      const data = await response.json();
      
      if (response.ok && data.access_token) {
        setToken(data.access_token);
        addResult('Get Token', true, 'Token obtained successfully', {
          message: data.message,
          tokenLength: data.access_token.length,
        });
      } else {
        addResult('Get Token', false, data.message || 'Failed to get token');
      }
    } catch (error) {
      addResult('Get Token', false, error.message);
    }
    setLoading(false);
  };

  // Test 3: Test Authenticated Request
  const testAuthenticatedRequest = async () => {
    if (!token) {
      Alert.alert('Error', 'Please get a token first');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (response.ok) {
        addResult('Users API', true, `Found ${data.length} users`, {
          usersCount: data.length,
          firstUser: data[0] ? data[0].name : 'No users',
        });
      } else {
        addResult('Users API', false, `HTTP ${response.status}: ${data.message}`);
      }
    } catch (error) {
      addResult('Users API', false, error.message);
    }
    setLoading(false);
  };

  // Test 4: Test Vision API
  const testVisionAPI = async () => {
    if (!token) {
      Alert.alert('Error', 'Please get a token first');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/scanner/test-vision`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (response.ok) {
        addResult('Vision API', true, 'Vision API is working', data);
      } else {
        addResult('Vision API', false, `HTTP ${response.status}: ${data.message}`);
      }
    } catch (error) {
      addResult('Vision API', false, error.message);
    }
    setLoading(false);
  };

  // Run all tests in sequence
  const runAllTests = async () => {
    clearResults();
    await testHealth();
    await new Promise(resolve => setTimeout(resolve, 1000));
    await testGetToken();
    await new Promise(resolve => setTimeout(resolve, 1000));
    await testAuthenticatedRequest();
    await new Promise(resolve => setTimeout(resolve, 1000));
    await testVisionAPI();
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
        <ScrollView style={styles.dataContainer} horizontal showsHorizontalScrollIndicator={false}>
          <BodyText style={styles.resultData}>{result.data}</BodyText>
        </ScrollView>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <HeadingText style={styles.title}>React Native ↔ API Demo</HeadingText>
        <BodyText style={styles.subtitle}>
          Testing InkedDraw API integration
        </BodyText>
        <BodyText style={styles.subtitle}>
          Token: {token ? '🔐 Ready' : '🔓 None'}
        </BodyText>
      </View>

      <View style={styles.buttonContainer}>
        <Button
          title="🚀 Run All Tests"
          onPress={runAllTests}
          disabled={loading}
          style={styles.primaryButton}
        />
        
        <View style={styles.buttonRow}>
          <Button
            title="Health"
            onPress={testHealth}
            disabled={loading}
            style={styles.smallButton}
          />
          <Button
            title="Token"
            onPress={testGetToken}
            disabled={loading}
            style={styles.smallButton}
          />
        </View>
        
        <View style={styles.buttonRow}>
          <Button
            title="Users"
            onPress={testAuthenticatedRequest}
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
        
        <Button
          title="Clear Results"
          onPress={clearResults}
          disabled={loading}
          style={styles.clearButton}
        />
      </View>

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <BodyText style={styles.loadingText}>Testing API...</BodyText>
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
    alignItems: 'center',
  },
  title: {
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    marginBottom: theme.spacing.xs,
    textAlign: 'center',
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
  clearButton: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
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
  dataContainer: {
    maxHeight: 100,
  },
  resultData: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    fontFamily: 'monospace',
    backgroundColor: theme.colors.background,
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
  },
});
