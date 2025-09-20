/**
 * Filter Chips Component
 * Chip-based filters for price range and other options
 */

import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { Caption } from './Typography';

type PriceRange = 'all' | 'budget' | 'mid' | 'premium' | 'luxury';

interface FilterChipsProps {
  selectedPriceRange: PriceRange;
  onPriceRangeChange: (range: PriceRange) => void;
}

export const FilterChips: React.FC<FilterChipsProps> = ({
  selectedPriceRange,
  onPriceRangeChange,
}) => {
  const theme = useTheme();

  const priceRanges = [
    { key: 'all', label: 'All Prices', symbol: '' },
    { key: 'budget', label: 'Budget', symbol: '$' },
    { key: 'mid', label: 'Mid-Range', symbol: '$$' },
    { key: 'premium', label: 'Premium', symbol: '$$$' },
    { key: 'luxury', label: 'Luxury', symbol: '$$$$' },
  ] as const;

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    scrollContainer: {
      paddingRight: 8,
    },
    chipsContainer: {
      flexDirection: 'row',
      gap: 8,
    },
    chip: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      backgroundColor: theme.colors.charcoal,
      borderWidth: 1,
      borderColor: theme.colors.charcoal,
    },
    activeChip: {
      backgroundColor: theme.colors.goldLeaf,
      borderColor: theme.colors.goldLeaf,
    },
    chipText: {
      color: theme.colors.alabaster,
      fontSize: 12,
      fontWeight: '500',
    },
    activeChipText: {
      color: theme.colors.onyx,
      fontWeight: '600',
    },
  });

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        <View style={styles.chipsContainer}>
          {priceRanges.map((range) => (
            <TouchableOpacity
              key={range.key}
              style={[
                styles.chip,
                selectedPriceRange === range.key && styles.activeChip,
              ]}
              onPress={() => onPriceRangeChange(range.key)}
            >
              <Caption style={[
                styles.chipText,
                selectedPriceRange === range.key && styles.activeChipText,
              ]}>
                {range.symbol ? `${range.symbol} ${range.label}` : range.label}
              </Caption>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};
