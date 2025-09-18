import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Animated, Dimensions, PanResponder, Vibration } from 'react-native';
import { TabIcon, BodyText, theme } from '../components';
import {
  SocialFeedScreen,
  CollectionHomeScreen,
  ScannerScreen,
  LocatorScreen,
  ProfileScreen,
} from '../screens';

/**
 * INKED DRAW Tab Navigator
 * 
 * Custom bottom tab navigator with luxury styling
 * Five tabs: Home (Social Feed), Collections, Scan (central), Locator, Profile
 * Central scan button is stylized as specified
 */

const { width: screenWidth } = Dimensions.get('window');

const TabNavigator = () => {
  const [activeTab, setActiveTab] = React.useState('home');

  // Animation values for smooth screen transitions
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const tabIndicatorAnim = useRef(new Animated.Value(0)).current;

  const tabs = [
    {
      id: 'home',
      label: 'Intel',
      icon: 'home',
      component: SocialFeedScreen,
    },
    {
      id: 'collections',
      label: 'Portfolio',
      icon: 'collections',
      component: CollectionHomeScreen,
    },
    {
      id: 'scan',
      label: 'Capture',
      icon: 'scan',
      component: ScannerScreen,
      isCenter: true, // Central stylized button
    },
    {
      id: 'locator',
      label: 'Network',
      icon: 'locator',
      component: LocatorScreen,
    },
    {
      id: 'profile',
      label: 'Executive',
      icon: 'profile',
      component: ProfileScreen,
    },
  ];

  // Swipe navigation logic with natural horizontal transitions
  const navigateToTab = (direction) => {
    const currentIndex = tabs.findIndex(tab => tab.id === activeTab);
    let newIndex;

    if (direction === 'left') {
      // Swipe left = go to next tab (right)
      newIndex = currentIndex < tabs.length - 1 ? currentIndex + 1 : 0; // Loop to first
    } else {
      // Swipe right = go to previous tab (left)
      newIndex = currentIndex > 0 ? currentIndex - 1 : tabs.length - 1; // Loop to last
    }

    const newTabId = tabs[newIndex].id;

    // Create natural horizontal screen transition for swipes
    const isMovingRight = direction === 'left'; // Swipe left moves to next tab (rightward)
    // CORRECTED: When moving right, current exits RIGHT and new enters from LEFT
    // When moving left, current exits LEFT and new enters from RIGHT
    const exitDirection = isMovingRight ? screenWidth * 0.3 : -screenWidth * 0.3; // Current screen exits right when moving right, exits left when moving left
    const enterDirection = isMovingRight ? -screenWidth * 0.3 : screenWidth * 0.3; // New screen starts from left when moving right, starts from right when moving left

    // Phase 1: Exit current screen
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: theme.animation.fast,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: exitDirection,
        duration: theme.animation.fast,
        useNativeDriver: true,
      }),
      // Move tab indicator (using false for layout-based animations)
      Animated.timing(tabIndicatorAnim, {
        toValue: newIndex,
        duration: theme.animation.medium,
        useNativeDriver: false, // Required for translateX interpolation
      }),
    ]).start(() => {
      // Phase 2: Switch to new screen and enter from opposite side
      setActiveTab(newTabId);
      slideAnim.setValue(enterDirection); // Position new screen off-screen on opposite side

      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: theme.animation.medium,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0, // Slide new screen into center
          duration: theme.animation.medium,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  // Pan responder for swipe gestures
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Only respond to horizontal swipes with sufficient movement
        const { dx, dy } = gestureState;
        return Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 20;
      },
      onPanResponderGrant: () => {
        // Gesture started - could add visual feedback here if needed
      },
      onPanResponderMove: (evt, gestureState) => {
        // Optional: Add visual feedback during swipe
        const { dx } = gestureState;
        const progress = Math.max(-1, Math.min(1, dx / (screenWidth * 0.3)));

        // Subtle screen movement during swipe
        slideAnim.setValue(progress * 20);
      },
      onPanResponderRelease: (evt, gestureState) => {
        const { dx, vx } = gestureState;
        const swipeThreshold = screenWidth * 0.25; // 25% of screen width
        const velocityThreshold = 0.5;

        // Reset slide animation
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: theme.animation.fast,
          useNativeDriver: true,
        }).start();

        // Determine if swipe was significant enough
        if (Math.abs(dx) > swipeThreshold || Math.abs(vx) > velocityThreshold) {
          // Add subtle haptic feedback for successful swipe (with error handling)
          try {
            Vibration.vibrate(10);
          } catch (error) {
            // Silently fail if vibration is not available - visual feedback is sufficient
            // This ensures the app works on all devices regardless of permission status
          }

          if (dx > 0) {
            // Swiped right (go to previous tab)
            navigateToTab('right');
          } else {
            // Swiped left (go to next tab)
            navigateToTab('left');
          }
        }
      },
      onPanResponderTerminate: () => {
        // Reset on gesture termination
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: theme.animation.fast,
          useNativeDriver: true,
        }).start();
      },
    })
  ).current;

  // Enhanced tab press with natural horizontal flow transitions
  const handleTabPress = (tabId) => {
    if (tabId === activeTab) return; // Don't animate if same tab

    const currentIndex = tabs.findIndex(tab => tab.id === activeTab);
    const newIndex = tabs.findIndex(tab => tab.id === tabId);

    // Determine natural flow direction based on tab positions
    const isMovingRight = newIndex > currentIndex; // Moving to a tab on the right
    // CORRECTED: When moving right, current exits RIGHT and new enters from LEFT
    // When moving left, current exits LEFT and new enters from RIGHT
    const exitDirection = isMovingRight ? screenWidth * 0.3 : -screenWidth * 0.3; // Current screen exits right when moving right, exits left when moving left
    const enterDirection = isMovingRight ? -screenWidth * 0.3 : screenWidth * 0.3; // New screen starts from left when moving right, starts from right when moving left

    // Phase 1: Exit current screen in natural direction
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: theme.animation.fast,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: exitDirection,
        duration: theme.animation.fast,
        useNativeDriver: true,
      }),
      // Move tab indicator (using false for layout-based animations)
      Animated.timing(tabIndicatorAnim, {
        toValue: newIndex,
        duration: theme.animation.medium,
        useNativeDriver: false, // Required for translateX interpolation
      }),
    ]).start(() => {
      // Phase 2: Switch to new screen and enter from opposite side
      setActiveTab(tabId);
      slideAnim.setValue(enterDirection); // Position new screen off-screen on opposite side

      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: theme.animation.medium,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0, // Slide new screen into center
          duration: theme.animation.medium,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  // Initialize tab indicator position
  useEffect(() => {
    const activeIndex = tabs.findIndex(tab => tab.id === activeTab);
    tabIndicatorAnim.setValue(activeIndex);
  }, []);

  const renderTabButton = (tab) => {
    const isActive = activeTab === tab.id;
    
    if (tab.isCenter) {
      // Central Scan Button - Stylized
      return (
        <TouchableOpacity
          key={tab.id}
          style={styles.centerTabButton}
          onPress={() => handleTabPress(tab.id)}
          activeOpacity={0.8}
        >
          <View style={[
            styles.centerTabIcon,
            isActive && styles.centerTabIconActive
          ]}>
            <TabIcon 
              name={tab.icon} 
              active={isActive}
              color={isActive ? theme.colors.background : theme.colors.text}
            />
          </View>
        </TouchableOpacity>
      );
    }

    // Regular Tab Button
    return (
      <TouchableOpacity
        key={tab.id}
        style={styles.tabButton}
        onPress={() => handleTabPress(tab.id)}
        activeOpacity={0.7}
      >
        <TabIcon name={tab.icon} active={isActive} />
        <BodyText 
          size="xs" 
          color={isActive ? theme.colors.primary : theme.colors.textTertiary}
          style={styles.tabLabel}
        >
          {tab.label}
        </BodyText>
      </TouchableOpacity>
    );
  };

  const renderActiveScreen = () => {
    const activeTabData = tabs.find(tab => tab.id === activeTab);
    const ActiveComponent = activeTabData?.component;

    if (!ActiveComponent) {
      return <View style={styles.screenContainer} />;
    }

    return (
      <Animated.View
        style={[
          styles.screenContainer,
          {
            opacity: fadeAnim,
            transform: [
              { translateX: slideAnim },
            ],
          },
        ]}
        {...panResponder.panHandlers}
      >
        <ActiveComponent />
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Active Screen with Swipe Gestures */}
      {renderActiveScreen()}

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        {/* Tab Bar Background */}
        <View style={styles.tabBarBackground} />

        {/* Animated Tab Indicator */}
        <Animated.View
          style={[
            styles.tabIndicator,
            {
              transform: [
                {
                  translateX: tabIndicatorAnim.interpolate({
                    inputRange: [0, 1, 2, 3, 4],
                    outputRange: [
                      // Calculate exact center positions accounting for padding
                      // Available width = screenWidth - (padding * 2)
                      // Each tab width = availableWidth / 5
                      // Tab center = padding + (tabWidth * index) + (tabWidth / 2) - (indicatorWidth / 2)

                      // Home tab center (index 0)
                      theme.spacing.lg + ((screenWidth - theme.spacing.lg * 2) / 5) * 0.5 - 20,
                      // Collections tab center (index 1)
                      theme.spacing.lg + ((screenWidth - theme.spacing.lg * 2) / 5) * 1.5 - 20,
                      // Scan tab center (index 2)
                      theme.spacing.lg + ((screenWidth - theme.spacing.lg * 2) / 5) * 2.5 - 20,
                      // Locator tab center (index 3)
                      theme.spacing.lg + ((screenWidth - theme.spacing.lg * 2) / 5) * 3.5 - 20,
                      // Profile tab center (index 4)
                      theme.spacing.lg + ((screenWidth - theme.spacing.lg * 2) / 5) * 4.5 - 20,
                    ],
                  }),
                },
              ],
            },
          ]}
        />

        {/* Tab Buttons */}
        <View style={styles.tabButtonsContainer}>
          {tabs.map(renderTabButton)}
        </View>
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
  
  // Tab Bar
  tabBar: {
    position: 'relative',
    backgroundColor: 'transparent',
  },
  tabBarBackground: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 90,
    backgroundColor: '#111111',
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    ...theme.shadows.card,
  },
  tabButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
    paddingTop: theme.spacing.md,
  },

  // Animated Tab Indicator
  tabIndicator: {
    position: 'absolute',
    bottom: theme.spacing.lg + 2,
    left: 0,
    width: 40, // Fixed width that works well for all tab labels
    height: 2,
    backgroundColor: theme.colors.primary,
    borderRadius: 1,
  },
  
  // Regular Tab Button
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    minHeight: theme.dimensions.touchTarget,
    justifyContent: 'center',
  },
  tabLabel: {
    marginTop: theme.spacing.xs,
    textAlign: 'center',
  },
  
  // Center Tab Button (Scan)
  centerTabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    marginBottom: theme.spacing.md, // Elevate the center button
  },
  centerTabIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.button,
    borderWidth: 3,
    borderColor: theme.colors.surface,
  },
  centerTabIconActive: {
    backgroundColor: theme.colors.premium,
    borderColor: theme.colors.premium,
    transform: [{ scale: 1.1 }],
  },
});

export default TabNavigator;

// === USAGE NOTES ===
/*

Tab Navigation Features:
- Five tabs with luxury styling
- Central scan button is elevated and stylized
- Active states with color changes
- Proper touch targets (44dp minimum)
- Smooth transitions between screens
- Custom tab bar with shadows and borders
- **NEW: Swipe left/right navigation between tabs**
- Haptic feedback on successful swipe
- Visual feedback during swipe gesture
- Circular navigation (loops from last to first tab)

Swipe Navigation:
- Swipe left: Navigate to next tab (right direction)
- Swipe right: Navigate to previous tab (left direction)
- Minimum swipe distance: 25% of screen width
- Velocity threshold for quick swipes
- Subtle haptic feedback (10ms vibration)
- Visual feedback with screen movement during swipe

Tab Structure:
1. Home - Social Feed Screen
2. Collections - Collection Home Screen
3. Scan - AI Scanner Screen (central, stylized)
4. Locator - Connoisseur Locator Screen
5. Profile - User Profile Screen

The central scan button is larger and elevated to emphasize
the core AI scanning functionality of the app.

Swipe gestures work across the entire screen area for
intuitive navigation between tabs.

*/
