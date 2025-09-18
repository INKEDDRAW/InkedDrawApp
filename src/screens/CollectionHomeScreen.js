import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Dimensions,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {
  Card,
  Heading,
  BodyText,
  StatsText,
  Icon,
  theme,
} from '../components';
import CollectionsService from '../services/CollectionsService';

/**
 * INKED DRAW Collection Home Screen
 * 
 * Three horizontally swipeable collection cards:
 * - My Virtual Humidor
 * - My Wine Cellar  
 * - My Beer Log
 */

const { width: screenWidth } = Dimensions.get('window');
const CARD_WIDTH = screenWidth - (theme.spacing.lg * 2);
const CARD_SPACING = theme.spacing.md;

const CollectionHomeScreen = ({ navigation }) => {
  const flatListRef = useRef(null);
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Load collections on component mount
  useEffect(() => {
    loadCollections();
  }, []);

  const loadCollections = async () => {
    try {
      setLoading(true);
      const apiCollections = await CollectionsService.getCollections();

      // Transform API data to match UI expectations
      const transformedCollections = await Promise.all(
        apiCollections.map(async (collection) => {
          try {
            const stats = await CollectionsService.getCollectionStats(collection.id);
            return {
              id: collection.id,
              title: collection.name,
              stats: `${stats.total_items} Items | ${getTypeIcon(collection.type)} Collection`,
              imageUrl: collection.cover_image_url || getDefaultImage(collection.type),
              icon: getTypeIcon(collection.type),
              color: getTypeColor(collection.type),
              type: collection.type,
              description: collection.description,
              is_public: collection.is_public,
            };
          } catch (error) {
            console.warn('Error loading stats for collection:', collection.id, error);
            return {
              id: collection.id,
              title: collection.name,
              stats: 'Loading...',
              imageUrl: collection.cover_image_url || getDefaultImage(collection.type),
              icon: getTypeIcon(collection.type),
              color: getTypeColor(collection.type),
              type: collection.type,
              description: collection.description,
              is_public: collection.is_public,
            };
          }
        })
      );

      setCollections(transformedCollections);
    } catch (error) {
      console.error('Error loading collections:', error);
      Alert.alert(
        'Error',
        'Failed to load collections. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCollections();
    setRefreshing(false);
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'cigar': return 'cigar';
      case 'wine': return 'wine';
      case 'beer': return 'coffee';
      default: return 'star';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'cigar': return theme.colors.secondary;
      case 'wine': return theme.colors.primary;
      case 'beer': return theme.colors.premium;
      default: return theme.colors.accent;
    }
  };

  const getDefaultImage = (type) => {
    switch (type) {
      case 'cigar': return 'https://placehold.co/600x800/6D213C/F4F1ED?text=Cigar+Collection';
      case 'wine': return 'https://placehold.co/600x800/FFC684/F4F1ED?text=Wine+Collection';
      case 'beer': return 'https://placehold.co/600x800/FFC684/1A1A1A?text=Beer+Collection';
      default: return 'https://placehold.co/600x800/1A1A1A/F4F1ED?text=Collection';
    }
  };

  const handleCollectionPress = (collection) => {
    // Navigate to specific collection screen
    console.log(`Opening ${collection.title}`);
    // TODO: Navigate to collection detail screen
    // navigation.navigate('CollectionDetail', { collectionId: collection.id });
  };

  const handleCreateCollection = () => {
    // Navigate to create collection screen
    console.log('Creating new collection');
    // TODO: Navigate to create collection screen
    // navigation.navigate('CreateCollection');
  };

  const handleQuickAction = (action) => {
    switch (action) {
      case 'scan':
        navigation.navigate('Scanner');
        break;
      case 'add':
        handleCreateCollection();
        break;
      case 'favorites':
        console.log('Show favorites');
        // TODO: Navigate to favorites screen
        break;
      default:
        console.log('Unknown action:', action);
    }
  };

  const renderCollection = ({ item: collection, index }) => (
    <View style={[styles.cardContainer, { width: CARD_WIDTH }]}>
      <Card
        variant="collection"
        imageSource={{ uri: collection.imageUrl }}
        onPress={() => handleCollectionPress(collection)}
        style={styles.collectionCard}
      >
        {/* Collection Info Overlay */}
        <View style={styles.collectionOverlay}>
          <View style={styles.collectionHeader}>
            <Icon 
              name={collection.icon}
              size="large"
              color={theme.colors.text}
              style={styles.collectionIcon}
            />
            <Heading level={3} style={styles.collectionTitle}>
              {collection.title}
            </Heading>
          </View>
          
          <StatsText style={styles.collectionStats}>
            {collection.stats}
          </StatsText>
          
          <View style={styles.collectionActions}>
            <TouchableOpacity style={styles.actionButton}>
              <BodyText weight="medium" size="sm" color={theme.colors.text}>
                Analyze Performance
              </BodyText>
              <Icon name="chevronRight" size="small" color={theme.colors.text} />
            </TouchableOpacity>
          </View>
        </View>
      </Card>
    </View>
  );

  const renderDots = () => (
    <View style={styles.dotsContainer}>
      {collections.map((_, index) => (
        <View
          key={index}
          style={[
            styles.dot,
            // You could add active state logic here
          ]}
        />
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <Heading level={2}>Portfolio Dashboard</Heading>
        <TouchableOpacity>
          <Icon name="plus" color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Subtitle */}
      <View style={styles.subtitleContainer}>
        <BodyText
          size="md"
          color={theme.colors.textSecondary}
          style={styles.subtitle}
        >
          Optimize performance and scale your expertise
        </BodyText>
      </View>

      {/* Collection Cards */}
      <View style={styles.collectionsContainer}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <BodyText style={styles.loadingText}>Loading collections...</BodyText>
          </View>
        ) : collections.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Icon name="plus" size="large" color={theme.colors.textSecondary} />
            <Heading level={3} style={styles.emptyTitle}>No Collections Yet</Heading>
            <BodyText style={styles.emptyText}>
              Create your first collection to start tracking your luxury items
            </BodyText>
            <TouchableOpacity style={styles.createButton} onPress={handleCreateCollection}>
              <BodyText weight="medium" color={theme.colors.text}>
                Create Collection
              </BodyText>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={collections}
            renderItem={renderCollection}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={CARD_WIDTH + CARD_SPACING}
            decelerationRate="fast"
            contentContainerStyle={styles.cardsContainer}
            ItemSeparatorComponent={() => <View style={{ width: CARD_SPACING }} />}
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        )}
      </View>

      {/* Dots Indicator */}
      {renderDots()}

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={() => handleQuickAction('scan')}
        >
          <Icon name="scan" color={theme.colors.primary} />
          <BodyText weight="medium" size="sm" style={styles.quickActionText}>
            Capture Intel
          </BodyText>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={() => handleQuickAction('add')}
        >
          <Icon name="plus" color={theme.colors.premium} />
          <BodyText weight="medium" size="sm" style={styles.quickActionText}>
            Log Asset
          </BodyText>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={() => handleQuickAction('favorites')}
        >
          <Icon name="star" color={theme.colors.secondary} />
          <BodyText weight="medium" size="sm" style={styles.quickActionText}>
            Target List
          </BodyText>
        </TouchableOpacity>
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
    paddingTop: theme.spacing.md,
  },
  subtitleContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  subtitle: {
    textAlign: 'center',
    marginTop: theme.spacing.sm,
  },
  
  // Collections
  collectionsContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  loadingText: {
    marginTop: theme.spacing.md,
    color: theme.colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  emptyTitle: {
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  emptyText: {
    textAlign: 'center',
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xl,
  },
  createButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },
  cardsContainer: {
    paddingHorizontal: theme.spacing.lg,
  },
  cardContainer: {
    height: 400,
  },
  collectionCard: {
    height: '100%',
    ...theme.shadows.card,
  },
  collectionOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(26, 26, 26, 0.85)',
    padding: theme.spacing.lg,
    borderBottomLeftRadius: theme.borderRadius.lg,
    borderBottomRightRadius: theme.borderRadius.lg,
  },
  collectionHeader: {
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  collectionIcon: {
    marginBottom: theme.spacing.sm,
  },
  collectionTitle: {
    textAlign: 'center',
    marginBottom: 0,
  },
  collectionStats: {
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
    color: theme.colors.premium,
  },
  collectionActions: {
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
  
  // Dots Indicator
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: theme.spacing.lg,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.textTertiary,
    marginHorizontal: theme.spacing.xs,
  },
  
  // Quick Actions
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  quickActionButton: {
    alignItems: 'center',
    padding: theme.spacing.md,
  },
  quickActionText: {
    marginTop: theme.spacing.xs,
    color: theme.colors.textSecondary,
  },
});

export default CollectionHomeScreen;
