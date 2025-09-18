import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, ScrollView } from 'react-native';
import { theme } from '../components';

/**
 * INKED DRAW Simple Tab Navigator
 * 
 * Simplified version without problematic native modules
 * Five tabs: Home, Collections, Scanner, Locator, Profile
 */

const SimpleScreen = ({ title, description, features }) => (
  <ScrollView style={styles.screenContainer}>
    <View style={styles.screenContent}>
      <Text style={styles.screenTitle}>{title}</Text>
      <Text style={styles.screenDescription}>{description}</Text>
      
      <View style={styles.featuresContainer}>
        {features.map((feature, index) => (
          <View key={index} style={styles.featureCard}>
            <Text style={styles.featureTitle}>{feature.title}</Text>
            <Text style={styles.featureText}>{feature.description}</Text>
          </View>
        ))}
      </View>
    </View>
  </ScrollView>
);

const TabNavigator = () => {
  const [activeTab, setActiveTab] = useState('home');

  const tabs = [
    { id: 'home', label: 'Home', icon: '🏠' },
    { id: 'collections', label: 'Collections', icon: '📚' },
    { id: 'scanner', label: 'Scanner', icon: '📷' },
    { id: 'locator', label: 'Locator', icon: '📍' },
    { id: 'profile', label: 'Profile', icon: '👤' },
  ];

  const screens = {
    home: {
      title: 'Social Feed',
      description: 'Connect with fellow connoisseurs and share your experiences',
      features: [
        { title: 'Premium Posts', description: 'Share your cigar, wine, and beer experiences' },
        { title: 'Expert Reviews', description: 'Read detailed tasting notes from experts' },
        { title: 'Community', description: 'Connect with like-minded enthusiasts' },
      ]
    },
    collections: {
      title: 'My Collections',
      description: 'Track and manage your premium collection',
      features: [
        { title: 'Virtual Humidor', description: 'Catalog your cigar collection' },
        { title: 'Wine Cellar', description: 'Track your wine inventory' },
        { title: 'Beer Library', description: 'Document your craft beer tastings' },
      ]
    },
    scanner: {
      title: 'Product Scanner',
      description: 'Identify and learn about premium products',
      features: [
        { title: 'Smart Recognition', description: 'Scan labels and bands for instant info' },
        { title: 'Price Tracking', description: 'Monitor market values' },
        { title: 'Authenticity Check', description: 'Verify genuine products' },
      ]
    },
    locator: {
      title: 'Venue Locator',
      description: 'Discover exclusive venues and events',
      features: [
        { title: 'Premium Lounges', description: 'Find cigar lounges and wine bars' },
        { title: 'Exclusive Events', description: 'Discover tastings and releases' },
        { title: 'Member Reviews', description: 'Read authentic venue reviews' },
      ]
    },
    profile: {
      title: 'My Profile',
      description: 'Manage your connoisseur profile and preferences',
      features: [
        { title: 'Taste Profile', description: 'Track your flavor preferences' },
        { title: 'Achievement Badges', description: 'Showcase your expertise' },
        { title: 'Social Network', description: 'Connect with other members' },
      ]
    }
  };

  return (
    <View style={styles.container}>
      {/* Screen Content */}
      <SimpleScreen {...screens[activeTab]} />
      
      {/* Bottom Tab Bar */}
      <View style={styles.tabBar}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.tabButton,
              activeTab === tab.id && styles.activeTabButton
            ]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Text style={[
              styles.tabIcon,
              activeTab === tab.id && styles.activeTabIcon
            ]}>
              {tab.icon}
            </Text>
            <Text style={[
              styles.tabLabel,
              activeTab === tab.id && styles.activeTabLabel
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  screenContainer: {
    flex: 1,
  },
  screenContent: {
    padding: 24,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.primary,
    marginBottom: 12,
    textAlign: 'center',
  },
  screenDescription: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  featuresContainer: {
    gap: 16,
  },
  featureCard: {
    backgroundColor: '#2C2C2E',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.primary,
    marginBottom: 8,
  },
  featureText: {
    fontSize: 14,
    color: theme.colors.text,
    lineHeight: 20,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#2C2C2E',
    borderTopWidth: 1,
    borderTopColor: theme.colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  activeTabButton: {
    backgroundColor: theme.colors.primary + '20',
    borderRadius: 8,
  },
  tabIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  activeTabIcon: {
    transform: [{ scale: 1.1 }],
  },
  tabLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  activeTabLabel: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
});

export default TabNavigator;
