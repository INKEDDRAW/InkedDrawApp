/**
 * Profile Screen
 * User profile display and editing
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useInkedTheme } from '../../theme/ThemeProvider';
import { Button, H1, H2, Body, Card } from '../../components/ui';

export const ProfileScreen: React.FC = () => {
  const theme = useInkedTheme();
  const { user, profile, signOut, loading } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsSigningOut(true);
              await signOut();
            } catch (error: any) {
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            } finally {
              setIsSigningOut(false);
            }
          },
        },
      ]
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background.primary,
    },
    scrollContainer: {
      padding: theme.semanticSpacing.screenPadding,
    },
    header: {
      alignItems: 'center',
      marginBottom: theme.semanticSpacing.xl,
    },
    avatar: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: theme.colors.background.secondary,
      marginBottom: theme.semanticSpacing.md,
    },
    avatarPlaceholder: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: theme.colors.background.secondary,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: theme.semanticSpacing.md,
    },
    username: {
      color: theme.colors.accent.primary,
      marginBottom: theme.semanticSpacing.xs,
    },
    displayName: {
      marginBottom: theme.semanticSpacing.sm,
    },
    bio: {
      textAlign: 'center',
      marginBottom: theme.semanticSpacing.md,
    },
    infoCard: {
      marginBottom: theme.semanticSpacing.lg,
    },
    infoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: theme.semanticSpacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border.primary,
    },
    infoLabel: {
      color: theme.colors.text.secondary,
    },
    infoValue: {
      color: theme.colors.text.primary,
    },
    preferencesCard: {
      marginBottom: theme.semanticSpacing.lg,
    },
    preferenceSection: {
      marginBottom: theme.semanticSpacing.md,
    },
    preferenceTitle: {
      marginBottom: theme.semanticSpacing.sm,
    },
    preferenceList: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.semanticSpacing.xs,
    },
    preferenceTag: {
      backgroundColor: theme.colors.accent.primary,
      paddingHorizontal: theme.semanticSpacing.sm,
      paddingVertical: theme.semanticSpacing.xs,
      borderRadius: theme.borderRadius.sm,
    },
    preferenceText: {
      color: theme.colors.background.primary,
      fontSize: theme.typography.sizes.sm,
    },
    actionsCard: {
      marginBottom: theme.semanticSpacing.xl,
    },
    actionButton: {
      marginBottom: theme.semanticSpacing.md,
    },
    signOutButton: {
      marginTop: theme.semanticSpacing.md,
    },
  });

  if (loading || !profile) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Body>Loading profile...</Body>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContainer}>
      {/* Profile Header */}
      <View style={styles.header}>
        {profile.avatarUrl ? (
          <Image source={{ uri: profile.avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Body style={{ color: theme.colors.text.secondary }}>
              {profile.displayName.charAt(0).toUpperCase()}
            </Body>
          </View>
        )}
        
        <Body style={styles.username}>@{profile.username}</Body>
        <H1 style={styles.displayName}>{profile.displayName}</H1>
        
        {profile.bio && (
          <Body style={styles.bio}>{profile.bio}</Body>
        )}
      </View>

      {/* Profile Information */}
      <Card style={styles.infoCard}>
        <H2 style={{ marginBottom: theme.semanticSpacing.md }}>Profile Information</H2>
        
        <View style={styles.infoRow}>
          <Body style={styles.infoLabel}>Email</Body>
          <Body style={styles.infoValue}>{user?.email}</Body>
        </View>
        
        {profile.location && (
          <View style={styles.infoRow}>
            <Body style={styles.infoLabel}>Location</Body>
            <Body style={styles.infoValue}>{profile.location}</Body>
          </View>
        )}
        
        {profile.websiteUrl && (
          <View style={styles.infoRow}>
            <Body style={styles.infoLabel}>Website</Body>
            <Body style={styles.infoValue}>{profile.websiteUrl}</Body>
          </View>
        )}
        
        <View style={styles.infoRow}>
          <Body style={styles.infoLabel}>Profile Visibility</Body>
          <Body style={styles.infoValue}>{profile.profileVisibility}</Body>
        </View>
        
        <View style={styles.infoRow}>
          <Body style={styles.infoLabel}>Member Since</Body>
          <Body style={styles.infoValue}>
            {new Date(profile.createdAt).toLocaleDateString()}
          </Body>
        </View>
      </Card>

      {/* Preferences */}
      <Card style={styles.preferencesCard}>
        <H2 style={{ marginBottom: theme.semanticSpacing.md }}>Preferences</H2>
        
        {profile.preferredCigarStrength.length > 0 && (
          <View style={styles.preferenceSection}>
            <Body style={styles.preferenceTitle}>Preferred Cigar Strength</Body>
            <View style={styles.preferenceList}>
              {profile.preferredCigarStrength.map((strength, index) => (
                <View key={index} style={styles.preferenceTag}>
                  <Body style={styles.preferenceText}>{strength}</Body>
                </View>
              ))}
            </View>
          </View>
        )}
        
        {profile.preferredBeerStyles.length > 0 && (
          <View style={styles.preferenceSection}>
            <Body style={styles.preferenceTitle}>Preferred Beer Styles</Body>
            <View style={styles.preferenceList}>
              {profile.preferredBeerStyles.map((style, index) => (
                <View key={index} style={styles.preferenceTag}>
                  <Body style={styles.preferenceText}>{style}</Body>
                </View>
              ))}
            </View>
          </View>
        )}
        
        {profile.preferredWineTypes.length > 0 && (
          <View style={styles.preferenceSection}>
            <Body style={styles.preferenceTitle}>Preferred Wine Types</Body>
            <View style={styles.preferenceList}>
              {profile.preferredWineTypes.map((type, index) => (
                <View key={index} style={styles.preferenceTag}>
                  <Body style={styles.preferenceText}>{type}</Body>
                </View>
              ))}
            </View>
          </View>
        )}
      </Card>

      {/* Actions */}
      <Card style={styles.actionsCard}>
        <Button
          title="Edit Profile"
          onPress={() => {
            // TODO: Navigate to edit profile screen
            Alert.alert('Coming Soon', 'Profile editing will be available soon!');
          }}
          variant="primary"
          style={styles.actionButton}
        />
        
        <Button
          title="Settings"
          onPress={() => {
            // TODO: Navigate to settings screen
            Alert.alert('Coming Soon', 'Settings will be available soon!');
          }}
          variant="secondary"
          style={styles.actionButton}
        />
        
        <Button
          title={isSigningOut ? 'Signing Out...' : 'Sign Out'}
          onPress={handleSignOut}
          variant="secondary"
          disabled={isSigningOut}
          loading={isSigningOut}
          style={styles.signOutButton}
        />
      </Card>
    </ScrollView>
  );
};
