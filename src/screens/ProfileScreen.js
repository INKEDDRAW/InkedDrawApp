import React from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {
  Card,
  Heading,
  BodyText,
  Caption,
  Button,
  Icon,
  StatsText,
  PremiumIcon,
  theme,
} from '../components';
import { useAuth } from '../contexts/AuthContext';

/**
 * INKED DRAW Profile Screen
 * 
 * User profile with luxury aesthetic
 * Features stats, collections overview, and premium features
 */

const ProfileScreen = () => {
  const { signOut, user: authUser } = useAuth();

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            const result = await signOut();
            if (!result.success) {
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          },
        },
      ]
    );
  };

  const user = {
    name: 'Eleanor Vance',
    username: '@eleanor_v',
    avatar: 'https://placehold.co/120x120/2C2C2E/F4F1ED?text=EV',
    memberSince: 'Executive since 2023',
    isPremium: true,
    stats: {
      cigars: 142,
      wines: 89,
      beers: 234,
      posts: 67,
      followers: 1248,
      following: 892,
    },
  };

  const achievements = [
    { id: '1', title: 'Portfolio Expert', description: '100+ assets analyzed', icon: 'star' },
    { id: '2', title: 'Network Leader', description: '50+ insights shared', icon: 'heart' },
    { id: '3', title: 'Market Scout', description: '25+ venues mapped', icon: 'mapPin' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />
      
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity>
            <Icon name="settings" color={theme.colors.textSecondary} />
          </TouchableOpacity>
          <Heading level={2}>Executive Dashboard</Heading>
          <TouchableOpacity>
            <Icon name="share" color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Profile Info */}
        <Card style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <Image source={{ uri: user.avatar }} style={styles.avatar} />
            <View style={styles.profileInfo}>
              <View style={styles.nameContainer}>
                <Heading level={3}>{user.name}</Heading>
                {user.isPremium && (
                  <PremiumIcon name="star" size="small" />
                )}
              </View>
              <BodyText color={theme.colors.textSecondary}>
                {user.username}
              </BodyText>
              <Caption>{user.memberSince}</Caption>
            </View>
          </View>

          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <StatsText>{user.stats.cigars}</StatsText>
              <Caption>Assets</Caption>
            </View>
            <View style={styles.statItem}>
              <StatsText>{user.stats.wines}</StatsText>
              <Caption>Holdings</Caption>
            </View>
            <View style={styles.statItem}>
              <StatsText>{user.stats.beers}</StatsText>
              <Caption>Insights</Caption>
            </View>
          </View>

          <View style={styles.socialStats}>
            <View style={styles.socialStatItem}>
              <BodyText weight="bold">{user.stats.posts}</BodyText>
              <Caption>Reports</Caption>
            </View>
            <View style={styles.socialStatItem}>
              <BodyText weight="bold">{user.stats.followers}</BodyText>
              <Caption>Network</Caption>
            </View>
            <View style={styles.socialStatItem}>
              <BodyText weight="bold">{user.stats.following}</BodyText>
              <Caption>Sources</Caption>
            </View>
          </View>

          <Button
            title="Optimize Profile"
            variant="secondary"
            style={styles.editButton}
          />
        </Card>

        {/* Premium Features */}
        {user.isPremium && (
          <Card style={styles.premiumCard}>
            <View style={styles.premiumHeader}>
              <PremiumIcon name="star" />
              <Heading level={4} color={theme.colors.premium}>
                Executive Access
              </Heading>
            </View>
            <BodyText size="sm" color={theme.colors.textSecondary}>
              Advanced analytics and priority intelligence
            </BodyText>
            <Button
              title="Optimize Access"
              variant="premium"
              size="small"
              style={styles.premiumButton}
            />
          </Card>
        )}

        {/* Achievements */}
        <Card style={styles.achievementsCard}>
          <Heading level={4}>Performance Milestones</Heading>
          <View style={styles.achievementsList}>
            {achievements.map((achievement) => (
              <View key={achievement.id} style={styles.achievementItem}>
                <Icon 
                  name={achievement.icon} 
                  color={theme.colors.premium} 
                  size="medium"
                />
                <View style={styles.achievementInfo}>
                  <BodyText weight="medium">{achievement.title}</BodyText>
                  <Caption>{achievement.description}</Caption>
                </View>
              </View>
            ))}
          </View>
        </Card>

        {/* Quick Actions */}
        <Card style={styles.actionsCard}>
          <Heading level={4}>Executive Tools</Heading>
          <View style={styles.actionsList}>
            <TouchableOpacity style={styles.actionItem}>
              <Icon name="heart" color={theme.colors.primary} />
              <BodyText>Endorsed Content</BodyText>
              <Icon name="chevronRight" color={theme.colors.textTertiary} size="small" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionItem}>
              <Icon name="collections" color={theme.colors.secondary} />
              <BodyText>Intelligence Reports</BodyText>
              <Icon name="chevronRight" color={theme.colors.textTertiary} size="small" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionItem}>
              <Icon name="mapPin" color={theme.colors.premium} />
              <BodyText>Network Venues</BodyText>
              <Icon name="chevronRight" color={theme.colors.textTertiary} size="small" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionItem}>
              <Icon name="settings" color={theme.colors.textSecondary} />
              <BodyText>System Config</BodyText>
              <Icon name="chevronRight" color={theme.colors.textTertiary} size="small" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionItem} onPress={handleSignOut}>
              <Icon name="logOut" color={theme.colors.error} />
              <BodyText style={{ color: theme.colors.error }}>Sign Out</BodyText>
              <Icon name="chevronRight" color={theme.colors.textTertiary} size="small" />
            </TouchableOpacity>
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  
  // Profile Card
  profileCard: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: theme.spacing.md,
  },
  profileInfo: {
    flex: 1,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  
  // Stats
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: theme.spacing.lg,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.md,
  },
  statItem: {
    alignItems: 'center',
  },
  socialStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: theme.spacing.lg,
  },
  socialStatItem: {
    alignItems: 'center',
  },
  editButton: {
    marginTop: theme.spacing.sm,
  },
  
  // Premium Card
  premiumCard: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.premium,
  },
  premiumHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  premiumButton: {
    marginTop: theme.spacing.md,
  },
  
  // Achievements
  achievementsCard: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  achievementsList: {
    marginTop: theme.spacing.md,
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
  achievementInfo: {
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  
  // Actions
  actionsCard: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  actionsList: {
    marginTop: theme.spacing.md,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
});

export default ProfileScreen;
