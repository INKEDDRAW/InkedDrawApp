import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, SafeAreaView, StatusBar } from 'react-native';
import { theme } from '../components';
import {
  SocialFeedScreen,
  CollectionHomeScreen,
  ScannerScreen,
  LocatorScreen,
  ProfileScreen,
} from '../screens';

/**
 * INKED DRAW Tab Navigator - Working Version
 * 
 * Custom bottom tab navigator with luxury styling
 * Five tabs: Home (Social Feed), Collections, Scan (central), Locator, Profile
 */

const TabNavigator = () => {
  const [activeTab, setActiveTab] = useState('home');

  const tabs = [
    { id: 'home', label: 'Home', icon: '🏠', component: SocialFeedScreen },
    { id: 'collections', label: 'Collections', icon: '📚', component: CollectionHomeScreen },
    { id: 'scanner', label: 'Scanner', icon: '📷', component: ScannerScreen },
    { id: 'locator', label: 'Locator', icon: '📍', component: LocatorScreen },
    { id: 'profile', label: 'Profile', icon: '👤', component: ProfileScreen },
  ];

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || SocialFeedScreen;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={theme.colors.background}
      />
      
      {/* Screen Content */}
      <View style={styles.screenContainer}>
        <ActiveComponent />
      </View>
      
      {/* Bottom Tab Bar */}
      <View style={styles.tabBar}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.tabButton,
              activeTab === tab.id && styles.activeTabButton,
              tab.id === 'scanner' && styles.scannerButton,
            ]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Text style={[
              styles.tabIcon,
              activeTab === tab.id && styles.activeTabIcon,
              tab.id === 'scanner' && styles.scannerIcon,
            ]}>
              {tab.icon}
            </Text>
            <Text style={[
              styles.tabLabel,
              activeTab === tab.id && styles.activeTabLabel,
              tab.id === 'scanner' && styles.scannerLabel,
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
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
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#2C2C2E',
    borderTopWidth: 1,
    borderTopColor: theme.colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 4,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 8,
  },
  activeTabButton: {
    backgroundColor: theme.colors.primary + '20',
  },
  scannerButton: {
    backgroundColor: theme.colors.primary,
    marginHorizontal: 8,
    borderRadius: 25,
    paddingVertical: 12,
  },
  tabIcon: {
    fontSize: 20,
    marginBottom: 4,
    color: theme.colors.textSecondary,
  },
  activeTabIcon: {
    color: theme.colors.primary,
    transform: [{ scale: 1.1 }],
  },
  scannerIcon: {
    color: theme.colors.background,
    fontSize: 24,
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
  scannerLabel: {
    color: theme.colors.background,
    fontWeight: '600',
  },
});

export default TabNavigator;
