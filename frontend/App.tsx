import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from './src/theme/ThemeProvider';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { AgeVerificationProvider, useAgeVerification } from './src/contexts/AgeVerificationContext';
import { AnalyticsProvider } from './src/contexts/AnalyticsContext';
import { OfflineProvider } from './src/contexts/OfflineContext';
import { RealtimeProvider } from './src/contexts/RealtimeContext';
import { AuthNavigator } from './src/navigation/AuthNavigator';
import { ProfileScreen } from './src/screens/profile/ProfileScreen';
import { AgeVerificationScreen } from './src/screens/verification/AgeVerificationScreen';
import { Body } from './src/components/ui';
import { PerformanceDashboard } from './src/components/performance/PerformanceDashboard';

const AppContent: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const { verificationStatus, loading: verificationLoading } = useAgeVerification();

  if (authLoading || verificationLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#121212' }}>
        <ActivityIndicator size="large" color="#C4A464" />
        <Body style={{ color: '#EAEAEA', marginTop: 16 }}>Loading...</Body>
      </View>
    );
  }

  // If user is not authenticated, show auth flow
  if (!user) {
    return <AuthNavigator />;
  }

  // If user is authenticated but not age verified, show age verification
  if (!verificationStatus?.isVerified) {
    return <AgeVerificationScreen onVerificationComplete={() => {
      // Verification complete, the context will handle the state update
    }} />;
  }

  // User is authenticated and age verified, show main app
  return <ProfileScreen />;
};

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <OfflineProvider>
            <RealtimeProvider>
              <AgeVerificationProvider>
                <AnalyticsProvider>
                  <StatusBar style="light" backgroundColor="#121212" />
                  <AppContent />
                </AnalyticsProvider>
              </AgeVerificationProvider>
            </RealtimeProvider>
          </OfflineProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
