import React from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  View,
  ActivityIndicator,
} from 'react-native';
import { OnboardingScreen } from './src/screens';
import TabNavigator from './src/navigation/TabNavigator';
import { theme, BodyText } from './src/components';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';

/**
 * INKED DRAW - Luxury Social Platform
 * 
 * A sophisticated mobile application for cigar, wine, and beer connoisseurs
 * Features premium design with leather-bound journal aesthetic
 * 
 * Design Philosophy:
 * - Private member's lounge atmosphere
 * - Deliberate, weighty motion (no bouncy animations)
 * - Premium, tactile, sophisticated experience
 * 
 * Technical Specifications:
 * - React Native with StyleSheet
 * - Single, self-contained App.js file
 * - iPhone frame simulation
 * - Horizontal swiping and tapping interactions
 * - 44dp minimum touch targets
 * - lucide-react-native icons
 * 
 * Color Palette:
 * - Background: #1A1A1A (Charcoal Gray)
 * - Surface: #2C2C2E (Surface Gray)
 * - Text: #F4F1ED (Parchment White)
 * - Primary: #8D5B2E (Leather Brown)
 * - Secondary: #6D213C (Deep Burgundy)
 * - Premium: #C4A57F (Antique Gold)
 * 
 * Typography:
 * - Headings: Playfair Display (Bold, 700)
 * - Body/UI: Inter (Regular 400, Medium 500, Bold 700)
 * 
 * Component Specifications:
 * - Buttons: 8dp corner radius, 48dp height
 * - Cards: 12dp corner radius, "precisely cut tiles"
 * - Icons: 1.5dp stroke, 24dp size
 * - Spacing: 8dp grid system
 */

// Main App Content Component
const AppContent = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <BodyText style={styles.loadingText}>Loading...</BodyText>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={theme.colors.background}
        translucent={false}
      />

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
      <AppContent />
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
});

export default App;
