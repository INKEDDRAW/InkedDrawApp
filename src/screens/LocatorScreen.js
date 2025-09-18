import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import {
  Card,
  Heading,
  BodyText,
  Caption,
  Button,
  Icon,
  StatsText,
  theme,
} from '../components';

/**
 * INKED DRAW Connoisseur Locator Screen
 * 
 * Map-based interface with nearby lounges and location details
 * Features floating cards and bottom sheet for selected locations
 */

const LocatorScreen = () => {
  const [selectedLounge, setSelectedLounge] = useState(null);

  const lounges = [
    {
      id: '1',
      name: 'Executive Reserve',
      type: 'Strategic Hub',
      distance: '0.3 miles',
      rating: 4.8,
      price: '$$$',
      address: '123 Madison Ave, New York, NY',
      hours: 'Open until 11:00 PM',
      features: ['Premium Assets', 'Full Service', 'Private Suites'],
      image: 'https://placehold.co/300x200/FFC684/F4F1ED?text=Lounge',
    },
    {
      id: '2',
      name: 'Portfolio & Spirits',
      type: 'Investment Lounge',
      distance: '0.7 miles',
      rating: 4.6,
      price: '$$$$',
      address: '456 Park Ave, New York, NY',
      hours: 'Open until 12:00 AM',
      features: ['Rare Holdings', 'Expert Advisor', 'Market Events'],
      image: 'https://placehold.co/300x200/6D213C/F4F1ED?text=Wine+Bar',
    },
    {
      id: '3',
      name: 'Analytics & Barrel',
      type: 'Data Center',
      distance: '1.2 miles',
      rating: 4.5,
      price: '$$',
      address: '789 Broadway, New York, NY',
      hours: 'Open until 10:00 PM',
      features: ['Local Intel', 'Insight Flights', 'Strategy Sessions'],
      image: 'https://placehold.co/300x200/FFC684/1A1A1A?text=Beer+Hall',
    },
  ];

  const handleLoungeSelect = (lounge) => {
    setSelectedLounge(lounge);
  };

  const renderMapPin = (lounge, index) => (
    <TouchableOpacity
      key={lounge.id}
      style={[
        styles.mapPin,
        {
          top: 150 + (index * 80),
          left: 100 + (index * 60),
        },
        selectedLounge?.id === lounge.id && styles.selectedPin,
      ]}
      onPress={() => handleLoungeSelect(lounge)}
    >
      <Icon 
        name="mapPin" 
        color={selectedLounge?.id === lounge.id ? theme.colors.premium : theme.colors.primary}
        size="medium"
      />
    </TouchableOpacity>
  );

  const renderLocationCard = (lounge) => (
    <Card
      key={lounge.id}
      style={styles.locationCard}
      onPress={() => handleLoungeSelect(lounge)}
    >
      <View style={styles.locationHeader}>
        <View style={styles.locationInfo}>
          <BodyText weight="bold" size="md">
            {lounge.name}
          </BodyText>
          <Caption>{lounge.type} • {lounge.distance}</Caption>
        </View>
        <View style={styles.locationMeta}>
          <View style={styles.ratingContainer}>
            <Icon name="star" size="small" color={theme.colors.premium} />
            <BodyText size="sm" weight="medium">
              {lounge.rating}
            </BodyText>
          </View>
          <BodyText size="sm" color={theme.colors.textSecondary}>
            {lounge.price}
          </BodyText>
        </View>
      </View>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <Heading level={2}>Network Intelligence</Heading>
        <TouchableOpacity>
          <Icon name="search" color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Map View Simulation */}
      <View style={styles.mapContainer}>
        <View style={styles.mapView}>
          {/* Map Background Simulation */}
          <View style={styles.mapBackground} />
          
          {/* Map Pins */}
          {lounges.map((lounge, index) => renderMapPin(lounge, index))}
          
          {/* User Location */}
          <View style={styles.userLocation}>
            <View style={styles.userLocationDot} />
          </View>
        </View>

        {/* Map Controls */}
        <View style={styles.mapControls}>
          <TouchableOpacity style={styles.mapControlButton}>
            <Icon name="plus" color={theme.colors.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.mapControlButton}>
            <Icon name="minus" color={theme.colors.text} />
          </TouchableOpacity>
        </View>

        {/* Filter Buttons */}
        <View style={styles.filterContainer}>
          <TouchableOpacity style={[styles.filterButton, styles.activeFilter]}>
            <Icon name="cigar" size="small" color={theme.colors.background} />
            <BodyText size="sm" weight="medium" color={theme.colors.background}>
              Cigars
            </BodyText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.filterButton}>
            <Icon name="wine" size="small" color={theme.colors.text} />
            <BodyText size="sm" weight="medium" color={theme.colors.text}>
              Wine
            </BodyText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.filterButton}>
            <Icon name="coffee" size="small" color={theme.colors.text} />
            <BodyText size="sm" weight="medium" color={theme.colors.text}>
              Beer
            </BodyText>
          </TouchableOpacity>
        </View>
      </View>

      {/* Location List / Bottom Sheet */}
      <View style={styles.bottomSheet}>
        {selectedLounge ? (
          // Selected Location Details
          <ScrollView style={styles.locationDetails}>
            <Card style={styles.selectedLocationCard}>
              <View style={styles.selectedLocationHeader}>
                <View style={styles.selectedLocationInfo}>
                  <Heading level={3}>{selectedLounge.name}</Heading>
                  <Caption>{selectedLounge.type}</Caption>
                  <BodyText size="sm" color={theme.colors.textSecondary}>
                    {selectedLounge.address}
                  </BodyText>
                </View>
                <TouchableOpacity onPress={() => setSelectedLounge(null)}>
                  <Icon name="close" color={theme.colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <View style={styles.locationStats}>
                <View style={styles.statItem}>
                  <Icon name="star" size="small" color={theme.colors.premium} />
                  <StatsText>{selectedLounge.rating}</StatsText>
                  <Caption>Rating</Caption>
                </View>
                <View style={styles.statItem}>
                  <Icon name="mapPin" size="small" color={theme.colors.primary} />
                  <StatsText>{selectedLounge.distance}</StatsText>
                  <Caption>Away</Caption>
                </View>
                <View style={styles.statItem}>
                  <Icon name="clock" size="small" color={theme.colors.secondary} />
                  <StatsText>Open</StatsText>
                  <Caption>Now</Caption>
                </View>
              </View>

              <View style={styles.locationFeatures}>
                {selectedLounge.features.map((feature, index) => (
                  <View key={index} style={styles.featureTag}>
                    <BodyText size="xs" color={theme.colors.textSecondary}>
                      {feature}
                    </BodyText>
                  </View>
                ))}
              </View>

              <View style={styles.locationActions}>
                <Button
                  title="Navigate"
                  variant="primary"
                  style={styles.actionButton}
                />
                <Button
                  title="Connect"
                  variant="secondary"
                  style={styles.actionButton}
                />
              </View>
            </Card>
          </ScrollView>
        ) : (
          // Location List
          <ScrollView style={styles.locationList}>
            <BodyText weight="medium" size="lg" style={styles.listTitle}>
              Strategic Venues
            </BodyText>
            {lounges.map(renderLocationCard)}
          </ScrollView>
        )}
      </View>
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
  
  // Map Container
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  mapView: {
    flex: 1,
    backgroundColor: '#1A1A1A', // Updated to match main background color
    position: 'relative',
  },
  mapBackground: {
    flex: 1,
    backgroundColor: '#1A1A1A', // Updated to match main background color
    // Add map-like patterns or gradients here
  },
  
  // Map Pins
  mapPin: {
    position: 'absolute',
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    ...theme.shadows.button,
  },
  selectedPin: {
    borderColor: theme.colors.premium,
    backgroundColor: theme.colors.premium,
  },
  
  // User Location
  userLocation: {
    position: 'absolute',
    top: 200,
    left: 150,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userLocationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: theme.colors.premium,
    borderWidth: 2,
    borderColor: theme.colors.text,
  },
  
  // Map Controls
  mapControls: {
    position: 'absolute',
    right: theme.spacing.lg,
    top: theme.spacing.xl,
  },
  mapControlButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 22,
    marginBottom: theme.spacing.sm,
    ...theme.shadows.button,
  },
  
  // Filter Buttons
  filterContainer: {
    position: 'absolute',
    top: theme.spacing.lg,
    left: theme.spacing.lg,
    flexDirection: 'row',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    marginRight: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  activeFilter: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  
  // Bottom Sheet
  bottomSheet: {
    height: 300,
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    paddingTop: theme.spacing.md,
  },
  
  // Location List
  locationList: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
  },
  listTitle: {
    marginBottom: theme.spacing.md,
  },
  locationCard: {
    marginBottom: theme.spacing.sm,
  },
  locationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  locationInfo: {
    flex: 1,
  },
  locationMeta: {
    alignItems: 'flex-end',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  
  // Selected Location Details
  locationDetails: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
  },
  selectedLocationCard: {
    marginBottom: theme.spacing.lg,
  },
  selectedLocationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  selectedLocationInfo: {
    flex: 1,
  },
  locationStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: theme.colors.border,
  },
  statItem: {
    alignItems: 'center',
  },
  locationFeatures: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: theme.spacing.lg,
  },
  featureTag: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
    marginRight: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  locationActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    marginHorizontal: theme.spacing.xs,
  },
});

export default LocatorScreen;
