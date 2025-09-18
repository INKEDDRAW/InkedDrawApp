import React, { useState } from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  View,
  ActivityIndicator,
} from 'react-native';
import { OnboardingScreen } from './src/screens';
import SimpleApiDemo from './src/screens/SimpleApiDemo';
import TabNavigator from './src/navigation/TabNavigator';
import { theme, BodyText, Button } from './src/components';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';

/**
 * INKED DRAW - Development Version
 * 
 * This version includes API testing capabilities for development
 * Switch between normal app flow and API testing
 */

// Development App Content Component
const DevAppContent = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [showApiTest, setShowApiTest] = useState(false);

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <BodyText style={styles.loadingText}>Loading...</BodyText>
      </View>
    );
  }

  // Development mode toggle
  if (showApiTest) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar
          barStyle="light-content"
          backgroundColor={theme.colors.background}
          translucent={false}
        />
        <View style={styles.devHeader}>
          <Button
            title="← Back to App"
            onPress={() => setShowApiTest(false)}
            style={styles.backButton}
          />
        </View>
        <SimpleApiDemo />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={theme.colors.background}
        translucent={false}
      />

      {/* Development Controls */}
      <View style={styles.devControls}>
        <Button
          title="🧪 API Test"
          onPress={() => setShowApiTest(true)}
          style={styles.devButton}
        />
      </View>

      {!isAuthenticated ? (
        <OnboardingScreen />
      ) : (
        <TabNavigator />
      )}
    </SafeAreaView>
  );
};

// Root App Component with Auth Provider
const App = () => {
  return (
    <AuthProvider>
      <DevAppContent />
    </AuthProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: theme.colors.textSecondary,
  },
  devControls: {
    position: 'absolute',
    top: 50,
    right: 16,
    zIndex: 1000,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.xs,
  },
  devButton: {
    minWidth: 80,
    height: 32,
    paddingHorizontal: theme.spacing.sm,
  },
  devHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    minWidth: 100,
    height: 36,
  },
});

export default App;
