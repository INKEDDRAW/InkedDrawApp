/**
 * Age Gate Component
 * Protects age-restricted content and enforces verification
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Modal,
} from 'react-native';
import { useAgeVerification } from '../contexts/AgeVerificationContext';
import { useAuth } from '../contexts/AuthContext';
import { useInkedTheme } from '../theme/ThemeProvider';
import { AgeVerificationScreen } from '../screens/verification/AgeVerificationScreen';
import { Button, H2, Body, Card } from './ui';

interface AgeGateProps {
  children: React.ReactNode;
  requireVerification?: boolean;
  fallbackContent?: React.ReactNode;
  onVerificationRequired?: () => void;
}

export const AgeGate: React.FC<AgeGateProps> = ({
  children,
  requireVerification = true,
  fallbackContent,
  onVerificationRequired,
}) => {
  const theme = useInkedTheme();
  const { user } = useAuth();
  const { verificationStatus, loading, checkVerificationRequired } = useAgeVerification();
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [hasShownWarning, setHasShownWarning] = useState(false);

  useEffect(() => {
    if (user && requireVerification && checkVerificationRequired()) {
      const needsVerification = !verificationStatus?.isVerified;
      
      if (needsVerification && !hasShownWarning && onVerificationRequired) {
        onVerificationRequired();
        setHasShownWarning(true);
      }
    }
  }, [user, verificationStatus, requireVerification, hasShownWarning, onVerificationRequired]);

  const handleStartVerification = () => {
    setShowVerificationModal(true);
  };

  const handleVerificationComplete = () => {
    setShowVerificationModal(false);
  };

  const handleSkipVerification = () => {
    setShowVerificationModal(false);
    // User chose to skip, they'll see restricted content message
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    restrictedContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.semanticSpacing.screenPadding,
      backgroundColor: theme.colors.background.primary,
    },
    restrictedCard: {
      width: '100%',
      maxWidth: 400,
      alignItems: 'center',
    },
    restrictedTitle: {
      textAlign: 'center',
      marginBottom: theme.semanticSpacing.md,
      color: theme.colors.accent.primary,
    },
    restrictedMessage: {
      textAlign: 'center',
      marginBottom: theme.semanticSpacing.xl,
      color: theme.colors.text.secondary,
    },
    buttonContainer: {
      width: '100%',
      gap: theme.semanticSpacing.md,
    },
    modalContainer: {
      flex: 1,
      backgroundColor: theme.colors.background.primary,
    },
  });

  // Show loading state
  if (loading) {
    return (
      <View style={styles.restrictedContainer}>
        <Body>Checking verification status...</Body>
      </View>
    );
  }

  // If user is not logged in, show children (auth will handle this)
  if (!user) {
    return <View style={styles.container}>{children}</View>;
  }

  // If verification is not required, show children
  if (!requireVerification || !checkVerificationRequired()) {
    return <View style={styles.container}>{children}</View>;
  }

  // If user is verified, show children
  if (verificationStatus?.isVerified) {
    return <View style={styles.container}>{children}</View>;
  }

  // If user needs verification, show restricted content or fallback
  const restrictedContent = fallbackContent || (
    <View style={styles.restrictedContainer}>
      <Card style={styles.restrictedCard}>
        <H2 style={styles.restrictedTitle}>Age Verification Required</H2>
        <Body style={styles.restrictedMessage}>
          This content is restricted to users 21 years and older. 
          Please verify your age to access premium cigar, beer, and wine content.
        </Body>
        
        <View style={styles.buttonContainer}>
          <Button
            title="Verify My Age"
            onPress={handleStartVerification}
            variant="primary"
          />
          
          {verificationStatus?.status === 'pending' && (
            <Body style={{ 
              textAlign: 'center', 
              color: theme.colors.accent.primary,
              marginTop: theme.semanticSpacing.sm 
            }}>
              Verification in progress...
            </Body>
          )}
          
          {verificationStatus?.status === 'rejected' && (
            <Body style={{ 
              textAlign: 'center', 
              color: theme.colors.error || '#FF6B6B',
              marginTop: theme.semanticSpacing.sm 
            }}>
              Previous verification failed. Please try again.
            </Body>
          )}
          
          {verificationStatus && !verificationStatus.canStartVerification && (
            <Body style={{ 
              textAlign: 'center', 
              color: theme.colors.text.secondary,
              marginTop: theme.semanticSpacing.sm 
            }}>
              Maximum verification attempts reached. Please contact support.
            </Body>
          )}
        </View>
      </Card>
      
      {/* Verification Modal */}
      <Modal
        visible={showVerificationModal}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <View style={styles.modalContainer}>
          <AgeVerificationScreen
            onVerificationComplete={handleVerificationComplete}
            onSkip={handleSkipVerification}
          />
        </View>
      </Modal>
    </View>
  );

  return restrictedContent;
};

// Higher-order component for easy wrapping
export const withAgeGate = <P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    requireVerification?: boolean;
    fallbackContent?: React.ReactNode;
  }
) => {
  return (props: P) => (
    <AgeGate 
      requireVerification={options?.requireVerification}
      fallbackContent={options?.fallbackContent}
    >
      <Component {...props} />
    </AgeGate>
  );
};
