/**
 * Authentication Navigator
 * Handles navigation between sign in and sign up screens
 */

import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { SignInScreen } from '../screens/auth/SignInScreen';
import { SignUpScreen } from '../screens/auth/SignUpScreen';
import { useInkedTheme } from '../theme/ThemeProvider';

type AuthScreen = 'signin' | 'signup';

export const AuthNavigator: React.FC = () => {
  const theme = useInkedTheme();
  const [currentScreen, setCurrentScreen] = useState<AuthScreen>('signin');

  const navigateToSignUp = () => setCurrentScreen('signup');
  const navigateToSignIn = () => setCurrentScreen('signin');

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background.primary,
    },
  });

  return (
    <View style={styles.container}>
      {currentScreen === 'signin' ? (
        <SignInScreen onNavigateToSignUp={navigateToSignUp} />
      ) : (
        <SignUpScreen onNavigateToSignIn={navigateToSignIn} />
      )}
    </View>
  );
};
