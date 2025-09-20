/**
 * Product Specifications Component
 * Displays detailed product specifications based on type
 */

import React from 'react';
import {
  View,
  StyleSheet,
} from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { H2, Body, Caption } from '../ui/Typography';
import { Card } from '../ui/Card';

interface ProductSpecsProps {
  product: any;
  productType: 'cigar' | 'beer' | 'wine';
}

export const ProductSpecs: React.FC<ProductSpecsProps> = ({
  product,
  productType,
}) => {
  const theme = useTheme();

  const renderCigarSpecs = () => (
    <View style={styles.specsGrid}>
      <View style={styles.specItem}>
        <Caption style={styles.specLabel}>Origin</Caption>
        <Body style={styles.specValue}>{product.origin || 'Unknown'}</Body>
      </View>
      
      <View style={styles.specItem}>
        <Caption style={styles.specLabel}>Strength</Caption>
        <Body style={styles.specValue}>{product.strength || 'Unknown'}</Body>
      </View>
      
      <View style={styles.specItem}>
        <Caption style={styles.specLabel}>Size</Caption>
        <Body style={styles.specValue}>{product.size || 'Unknown'}</Body>
      </View>
      
      <View style={styles.specItem}>
        <Caption style={styles.specLabel}>Ring Gauge</Caption>
        <Body style={styles.specValue}>{product.ringGauge || 'Unknown'}</Body>
      </View>
      
      <View style={styles.specItem}>
        <Caption style={styles.specLabel}>Length</Caption>
        <Body style={styles.specValue}>
          {product.length ? `${product.length}"` : 'Unknown'}
        </Body>
      </View>
      
      <View style={styles.specItem}>
        <Caption style={styles.specLabel}>Wrapper</Caption>
        <Body style={styles.specValue}>{product.wrapper || 'Unknown'}</Body>
      </View>
      
      <View style={styles.specItem}>
        <Caption style={styles.specLabel}>Binder</Caption>
        <Body style={styles.specValue}>{product.binder || 'Unknown'}</Body>
      </View>
      
      <View style={styles.specItem}>
        <Caption style={styles.specLabel}>Filler</Caption>
        <Body style={styles.specValue}>{product.filler || 'Unknown'}</Body>
      </View>
    </View>
  );

  const renderBeerSpecs = () => (
    <View style={styles.specsGrid}>
      <View style={styles.specItem}>
        <Caption style={styles.specLabel}>Style</Caption>
        <Body style={styles.specValue}>{product.style || 'Unknown'}</Body>
      </View>
      
      <View style={styles.specItem}>
        <Caption style={styles.specLabel}>ABV</Caption>
        <Body style={styles.specValue}>
          {product.abv ? `${product.abv.toFixed(1)}%` : 'Unknown'}
        </Body>
      </View>
      
      <View style={styles.specItem}>
        <Caption style={styles.specLabel}>IBU</Caption>
        <Body style={styles.specValue}>
          {product.ibu ? `${product.ibu}` : 'Unknown'}
        </Body>
      </View>
      
      <View style={styles.specItem}>
        <Caption style={styles.specLabel}>Origin</Caption>
        <Body style={styles.specValue}>{product.origin || 'Unknown'}</Body>
      </View>
      
      <View style={styles.specItem}>
        <Caption style={styles.specLabel}>Brewery</Caption>
        <Body style={styles.specValue}>{product.brewery || 'Unknown'}</Body>
      </View>
      
      <View style={styles.specItem}>
        <Caption style={styles.specLabel}>Availability</Caption>
        <Body style={styles.specValue}>{product.availability || 'Unknown'}</Body>
      </View>
    </View>
  );

  const renderWineSpecs = () => (
    <View style={styles.specsGrid}>
      <View style={styles.specItem}>
        <Caption style={styles.specLabel}>Type</Caption>
        <Body style={styles.specValue}>{product.type || 'Unknown'}</Body>
      </View>
      
      <View style={styles.specItem}>
        <Caption style={styles.specLabel}>Vintage</Caption>
        <Body style={styles.specValue}>{product.vintage || 'NV'}</Body>
      </View>
      
      <View style={styles.specItem}>
        <Caption style={styles.specLabel}>ABV</Caption>
        <Body style={styles.specValue}>
          {product.alcoholContent ? `${product.alcoholContent.toFixed(1)}%` : 'Unknown'}
        </Body>
      </View>
      
      <View style={styles.specItem}>
        <Caption style={styles.specLabel}>Region</Caption>
        <Body style={styles.specValue}>{product.region || 'Unknown'}</Body>
      </View>
      
      <View style={styles.specItem}>
        <Caption style={styles.specLabel}>Country</Caption>
        <Body style={styles.specValue}>{product.country || 'Unknown'}</Body>
      </View>
      
      <View style={styles.specItem}>
        <Caption style={styles.specLabel}>Varietal</Caption>
        <Body style={styles.specValue}>{product.varietal || 'Unknown'}</Body>
      </View>
      
      <View style={styles.specItem}>
        <Caption style={styles.specLabel}>Winery</Caption>
        <Body style={styles.specValue}>{product.winery || 'Unknown'}</Body>
      </View>
    </View>
  );

  const renderFlavorNotes = () => {
    const flavorNotes = product.tags?.flavor_profile || [];
    if (flavorNotes.length === 0) return null;

    return (
      <View style={styles.flavorNotesSection}>
        <Body style={styles.flavorNotesTitle}>Flavor Profile</Body>
        <View style={styles.flavorNotesContainer}>
          {flavorNotes.map((note: string, index: number) => (
            <View key={index} style={styles.flavorNote}>
              <Caption style={styles.flavorNoteText}>{note}</Caption>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const styles = StyleSheet.create({
    container: {
      marginVertical: 16,
    },
    title: {
      color: theme.colors.alabaster,
      marginBottom: 16,
    },
    specsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    specItem: {
      width: '48%',
      marginBottom: 16,
    },
    specLabel: {
      color: theme.colors.alabaster,
      opacity: 0.7,
      fontSize: 12,
      marginBottom: 4,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    specValue: {
      color: theme.colors.alabaster,
      fontSize: 14,
      fontWeight: '500',
      textTransform: 'capitalize',
    },
    flavorNotesSection: {
      marginTop: 16,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: theme.colors.charcoal,
    },
    flavorNotesTitle: {
      color: theme.colors.alabaster,
      fontSize: 14,
      fontWeight: '600',
      marginBottom: 12,
    },
    flavorNotesContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    flavorNote: {
      backgroundColor: theme.colors.onyx,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.colors.goldLeaf,
    },
    flavorNoteText: {
      color: theme.colors.goldLeaf,
      fontSize: 12,
      fontWeight: '500',
      textTransform: 'capitalize',
    },
  });

  return (
    <Card style={styles.container}>
      <H2 style={styles.title}>Specifications</H2>
      
      {productType === 'cigar' && renderCigarSpecs()}
      {productType === 'beer' && renderBeerSpecs()}
      {productType === 'wine' && renderWineSpecs()}
      
      {renderFlavorNotes()}
    </Card>
  );
};
