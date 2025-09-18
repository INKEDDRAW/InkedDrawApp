import React from 'react';
import {
  View,
  StyleSheet,
  ImageBackground,
  SafeAreaView,
  StatusBar,
  Text,
} from 'react-native';
import { theme } from '../theme';
import { BottomFadeGradient } from '../components/GradientOverlay';

/**
 * Bottom Fade Demo Screen
 * 
 * Demonstrates the dramatic black-to-clear gradient effect
 * matching the reference image aesthetic
 */

const BottomFadeDemo = () => {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      
      {/* Background Image Simulation */}
      <View style={styles.backgroundImage}>
        {/* Simulated food/content image area */}
        <View style={styles.contentArea}>
          <Text style={styles.contentText}>
            A stylish way to welcome guests to a dinner party
            and the perfect bite for raw fish lovers. Its crispy s...
          </Text>
          
          {/* Stats/Info Section */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Level</Text>
              <Text style={styles.statValue}>Beginner</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Cooking</Text>
              <Text style={styles.statValue}>15m</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Overall</Text>
              <Text style={styles.statValue}>35m</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Ready</Text>
              <Text style={styles.statValue}>3:03pm</Text>
            </View>
          </View>
        </View>
        
        {/* Dramatic Bottom Fade Gradient */}
        <BottomFadeGradient height="60%" />
        
        {/* Bottom Navigation Area */}
        <View style={styles.bottomNav}>
          <View style={styles.navIcons}>
            <View style={styles.navIcon}>
              <Text style={styles.navIconText}>🏠</Text>
            </View>
            <View style={styles.navIcon}>
              <Text style={styles.navIconText}>⚡</Text>
            </View>
            <View style={[styles.navIcon, styles.centerIcon]}>
              <Text style={styles.navIconText}>✨</Text>
            </View>
            <View style={styles.navIcon}>
              <Text style={styles.navIconText}>🛒</Text>
            </View>
            <View style={styles.navIcon}>
              <Text style={styles.navIconText}>👤</Text>
            </View>
          </View>
          
          {/* Home Indicator */}
          <View style={styles.homeIndicator} />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000', // Pure black base
  },
  backgroundImage: {
    flex: 1,
    backgroundColor: '#1A1A1A', // Dark content area
    position: 'relative',
  },
  
  // Content Area (upper portion)
  contentArea: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xxxl,
    justifyContent: 'flex-start',
  },
  contentText: {
    color: theme.colors.text,
    fontSize: 16,
    lineHeight: 24,
    marginBottom: theme.spacing.xl,
    fontFamily: theme.typography.body,
  },
  
  // Stats Container
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xl,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    color: theme.colors.textTertiary,
    fontSize: 12,
    marginBottom: theme.spacing.xs,
    fontFamily: theme.typography.body,
  },
  statValue: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '600',
    fontFamily: theme.typography.bodyMedium,
  },
  
  // Bottom Navigation (positioned over gradient)
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
    zIndex: 30, // Above gradient
  },
  navIcons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  navIcon: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22,
  },
  centerIcon: {
    backgroundColor: theme.colors.primary, // Golden brass center icon
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  navIconText: {
    fontSize: 20,
    color: theme.colors.text,
  },
  
  // Home Indicator
  homeIndicator: {
    width: 134,
    height: 5,
    backgroundColor: theme.colors.text,
    borderRadius: 3,
    alignSelf: 'center',
    opacity: 0.3,
  },
});

export default BottomFadeDemo;
