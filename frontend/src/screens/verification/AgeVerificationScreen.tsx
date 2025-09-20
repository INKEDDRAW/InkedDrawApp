/**
 * Age Verification Screen
 * Handles the age verification process for users
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  ScrollView,
  Linking,
} from 'react-native';
import { useAgeVerification } from '../../contexts/AgeVerificationContext';
import { useInkedTheme } from '../../theme/ThemeProvider';
import { Button, H1, H2, Body, Card } from '../../components/ui';

interface AgeVerificationScreenProps {
  onVerificationComplete?: () => void;
  onSkip?: () => void;
}

export const AgeVerificationScreen: React.FC<AgeVerificationScreenProps> = ({
  onVerificationComplete,
  onSkip,
}) => {
  const theme = useInkedTheme();
  const { 
    verificationStatus, 
    loading, 
    startVerification, 
    refreshStatus 
  } = useAgeVerification();
  const [isStartingVerification, setIsStartingVerification] = useState(false);

  useEffect(() => {
    // Refresh status when component mounts
    refreshStatus();
  }, []);

  useEffect(() => {
    // Check if verification is complete
    if (verificationStatus?.isVerified && onVerificationComplete) {
      onVerificationComplete();
    }
  }, [verificationStatus?.isVerified, onVerificationComplete]);

  const handleStartVerification = async () => {
    try {
      setIsStartingVerification(true);
      
      const result = await startVerification();
      
      // Open verification URL
      const supported = await Linking.canOpenURL(result.verificationUrl);
      if (supported) {
        await Linking.openURL(result.verificationUrl);
      } else {
        Alert.alert(
          'Unable to Open Verification',
          'Please copy the verification URL and open it in your browser.',
          [
            { text: 'Copy URL', onPress: () => {
              // TODO: Copy to clipboard
              console.log('Copy URL:', result.verificationUrl);
            }},
            { text: 'OK' }
          ]
        );
      }
    } catch (error: any) {
      Alert.alert(
        'Verification Error',
        error.message || 'Failed to start verification process. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsStartingVerification(false);
    }
  };

  const getStatusMessage = () => {
    if (!verificationStatus) return null;

    switch (verificationStatus.status) {
      case 'pending':
        return {
          title: 'Verification in Progress',
          message: 'Your age verification is being processed. This usually takes a few minutes.',
          color: theme.colors.accent.primary,
        };
      case 'approved':
        return {
          title: 'Verification Complete',
          message: `Congratulations! Your age has been verified. You are ${verificationStatus.age} years old.`,
          color: theme.colors.success || theme.colors.accent.primary,
        };
      case 'rejected':
        return {
          title: 'Verification Failed',
          message: 'Your verification was not successful. Please try again with a clear photo of your ID.',
          color: theme.colors.error || '#FF6B6B',
        };
      case 'expired':
        return {
          title: 'Verification Expired',
          message: 'Your verification session has expired. Please start a new verification.',
          color: theme.colors.text.secondary,
        };
      default:
        return null;
    }
  };

  const statusMessage = getStatusMessage();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background.primary,
    },
    scrollContainer: {
      flexGrow: 1,
      padding: theme.semanticSpacing.screenPadding,
    },
    header: {
      textAlign: 'center',
      marginBottom: theme.semanticSpacing.md,
    },
    subtitle: {
      textAlign: 'center',
      marginBottom: theme.semanticSpacing.xl,
      color: theme.colors.text.secondary,
    },
    card: {
      marginBottom: theme.semanticSpacing.lg,
    },
    statusCard: {
      marginBottom: theme.semanticSpacing.lg,
      borderLeftWidth: 4,
      borderLeftColor: statusMessage?.color || theme.colors.border.primary,
    },
    statusTitle: {
      marginBottom: theme.semanticSpacing.sm,
      color: statusMessage?.color || theme.colors.text.primary,
    },
    statusMessage: {
      color: theme.colors.text.secondary,
    },
    requirementsList: {
      marginTop: theme.semanticSpacing.md,
    },
    requirementItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: theme.semanticSpacing.sm,
    },
    requirementBullet: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: theme.colors.accent.primary,
      marginTop: 8,
      marginRight: theme.semanticSpacing.sm,
    },
    requirementText: {
      flex: 1,
      color: theme.colors.text.secondary,
    },
    buttonContainer: {
      gap: theme.semanticSpacing.md,
      marginTop: theme.semanticSpacing.xl,
    },
    attemptsText: {
      textAlign: 'center',
      color: theme.colors.text.secondary,
      marginTop: theme.semanticSpacing.sm,
    },
    skipButton: {
      marginTop: theme.semanticSpacing.lg,
    },
  });

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Body>Loading verification status...</Body>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContainer}>
      <H1 style={styles.header}>Age Verification Required</H1>
      <Body style={styles.subtitle}>
        To access premium content on Inked Draw, we need to verify that you are 21 or older.
      </Body>

      {statusMessage && (
        <Card style={styles.statusCard}>
          <H2 style={styles.statusTitle}>{statusMessage.title}</H2>
          <Body style={styles.statusMessage}>{statusMessage.message}</Body>
        </Card>
      )}

      <Card style={styles.card}>
        <H2 style={{ marginBottom: theme.semanticSpacing.md }}>Why We Need This</H2>
        <Body style={{ marginBottom: theme.semanticSpacing.md }}>
          Inked Draw features content related to cigars, craft beer, and fine wine. 
          Legal regulations require us to verify that our users are of legal age to 
          access such content.
        </Body>
        
        <View style={styles.requirementsList}>
          <View style={styles.requirementItem}>
            <View style={styles.requirementBullet} />
            <Body style={styles.requirementText}>
              Must be 21 years or older
            </Body>
          </View>
          <View style={styles.requirementItem}>
            <View style={styles.requirementBullet} />
            <Body style={styles.requirementText}>
              Valid government-issued photo ID required
            </Body>
          </View>
          <View style={styles.requirementItem}>
            <View style={styles.requirementBullet} />
            <Body style={styles.requirementText}>
              Secure verification process powered by Veriff
            </Body>
          </View>
          <View style={styles.requirementItem}>
            <View style={styles.requirementBullet} />
            <Body style={styles.requirementText}>
              Your personal information is encrypted and protected
            </Body>
          </View>
        </View>
      </Card>

      <Card style={styles.card}>
        <H2 style={{ marginBottom: theme.semanticSpacing.md }}>Verification Process</H2>
        <Body style={{ marginBottom: theme.semanticSpacing.sm }}>
          1. Take a photo of your government-issued ID
        </Body>
        <Body style={{ marginBottom: theme.semanticSpacing.sm }}>
          2. Take a selfie to confirm your identity
        </Body>
        <Body style={{ marginBottom: theme.semanticSpacing.sm }}>
          3. Wait for automatic verification (usually under 5 minutes)
        </Body>
        <Body>
          4. Access all premium content once approved
        </Body>
      </Card>

      <View style={styles.buttonContainer}>
        {verificationStatus?.canStartVerification && (
          <>
            <Button
              title={isStartingVerification ? 'Starting Verification...' : 'Start Age Verification'}
              onPress={handleStartVerification}
              variant="primary"
              disabled={isStartingVerification}
              loading={isStartingVerification}
            />
            
            {verificationStatus.attemptsRemaining > 0 && (
              <Body style={styles.attemptsText}>
                {verificationStatus.attemptsRemaining} attempt{verificationStatus.attemptsRemaining !== 1 ? 's' : ''} remaining
              </Body>
            )}
          </>
        )}

        {verificationStatus?.status === 'pending' && (
          <Button
            title="Check Status"
            onPress={refreshStatus}
            variant="secondary"
            disabled={loading}
          />
        )}

        {verificationStatus?.status === 'rejected' && verificationStatus.canStartVerification && (
          <Button
            title="Try Again"
            onPress={handleStartVerification}
            variant="primary"
            disabled={isStartingVerification}
            loading={isStartingVerification}
          />
        )}
      </View>

      {onSkip && (
        <Button
          title="Skip for Now"
          onPress={onSkip}
          variant="secondary"
          style={styles.skipButton}
        />
      )}
    </ScrollView>
  );
};
