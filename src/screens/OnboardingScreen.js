import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ImageBackground,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import {
  BrandText,
  BodyText,
  Button,
  theme,
} from '../components';
import SignUpScreen from './SignUpScreen';
import SignInScreen from './SignInScreen';


/**
 * INKED DRAW Onboarding Screen
 * 
 * Luxury onboarding with INKED DRAW wordmark and authentication options
 * Features elegant background and premium button styling
 */

const OnboardingScreen = () => {
  const [currentScreen, setCurrentScreen] = useState('onboarding'); // 'onboarding', 'signup', 'signin'

  const handleSignUp = () => {
    setCurrentScreen('signup');
  };

  const handleSignIn = () => {
    setCurrentScreen('signin');
  };

  const handleBack = () => {
    setCurrentScreen('onboarding');
  };

  // Show sign up screen
  if (currentScreen === 'signup') {
    return <SignUpScreen onBack={handleBack} />;
  }

  // Show sign in screen
  if (currentScreen === 'signin') {
    return <SignInScreen onBack={handleBack} />;
  }

  // Show main onboarding screen
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />

      {/* Background Image */}
      <ImageBackground
        source={require('../../assets/images/onboarding-bg.png')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        {/* Translucent overlay for text readability */}
        <View style={styles.translucentOverlay} />

        {/* Content Container */}
        <View style={styles.contentContainer}>
          
          {/* Brand Section */}
          <View style={styles.brandSection}>
            <BrandText style={styles.brandText}>
              INKED DRAW
            </BrandText>
            <BodyText
              size="lg"
              weight="medium"
              color={theme.colors.textSecondary}
              style={styles.tagline}
            >
              Your Executive Intelligence Platform
            </BodyText>
            <BodyText
              size="md"
              color={theme.colors.textTertiary}
              style={styles.description}
            >
              Optimize your portfolio, track performance metrics,
              and scale your connoisseur expertise.
            </BodyText>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionSection}>
            <Button
              title="LAUNCH PLATFORM"
              variant="primary"
              size="large"
              onPress={handleSignUp}
              style={styles.primaryButton}
            />

            <Button
              title="ACCESS ACCOUNT"
              variant="secondary"
              size="large"
              onPress={handleSignIn}
              style={styles.secondaryButton}
            />

            {/* Terms and Privacy */}
            <BodyText
              size="sm"
              color={theme.colors.textTertiary}
              style={styles.legalText}
            >
              Proceeding confirms your agreement to Terms & Privacy Policy
            </BodyText>
          </View>

          {/* Premium Badge */}
          <View style={styles.premiumBadge}>
            <BodyText
              size="xs"
              weight="medium"
              color={theme.colors.premium}
              style={styles.premiumText}
            >
              EXECUTIVE ACCESS
            </BodyText>
          </View>
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background, // Pure black base
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  translucentOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)', // Darker semi-transparent black overlay for better text readability
    zIndex: 1,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xxxl,
    paddingBottom: theme.spacing.xxxl,
    zIndex: 2, // Ensure content is above translucent overlay
  },
  
  // Brand Section
  brandSection: {
    alignItems: 'center',
    marginTop: theme.spacing.xxxl,
  },
  brandText: {
    fontSize: 48,
    letterSpacing: 4,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  tagline: {
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
    letterSpacing: 1,
  },
  description: {
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: theme.spacing.md,
    maxWidth: 320,
  },
  
  // Action Section
  actionSection: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  primaryButton: {
    width: '100%',
    marginBottom: theme.spacing.md,
    ...theme.shadows.button,
  },
  secondaryButton: {
    width: '100%',
    marginBottom: theme.spacing.lg,
  },
  legalText: {
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: theme.spacing.lg,
    opacity: 0.8,
  },
  
  // Premium Badge
  premiumBadge: {
    position: 'absolute',
    top: theme.spacing.xl,
    right: theme.spacing.lg,
    backgroundColor: 'rgba(196, 165, 127, 0.1)',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.premium,
  },
  premiumText: {
    letterSpacing: 1,
  },
});

export default OnboardingScreen;

// === USAGE EXAMPLE ===
/*

<OnboardingScreen 
  onSignUp={() => navigation.navigate('SignUp')}
  onSignIn={() => navigation.navigate('SignIn')}
/>

*/
