/**
 * Category Tabs Component
 * Tab navigation for product categories
 */

import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { Body } from '../ui/Typography';

type ProductCategory = 'all' | 'cigars' | 'beers' | 'wines';

interface CategoryTabsProps {
  selectedCategory: ProductCategory;
  onCategoryChange: (category: ProductCategory) => void;
}

export const CategoryTabs: React.FC<CategoryTabsProps> = ({
  selectedCategory,
  onCategoryChange,
}) => {
  const theme = useTheme();

  const categories = [
    { key: 'all', label: 'All', icon: '🔍' },
    { key: 'cigars', label: 'Cigars', icon: '🚬' },
    { key: 'beers', label: 'Beers', icon: '🍺' },
    { key: 'wines', label: 'Wines', icon: '🍷' },
  ] as const;

  const styles = StyleSheet.create({
    container: {
      marginVertical: 16,
    },
    scrollContainer: {
      paddingHorizontal: 4,
    },
    tabsContainer: {
      flexDirection: 'row',
      gap: 8,
    },
    tab: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 24,
      backgroundColor: theme.colors.charcoal,
      borderWidth: 1,
      borderColor: theme.colors.charcoal,
    },
    activeTab: {
      backgroundColor: theme.colors.goldLeaf,
      borderColor: theme.colors.goldLeaf,
    },
    tabIcon: {
      fontSize: 16,
      marginRight: 6,
    },
    tabText: {
      color: theme.colors.alabaster,
      fontSize: 14,
      fontWeight: '500',
    },
    activeTabText: {
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
        <View style={styles.tabsContainer}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category.key}
              style={[
                styles.tab,
                selectedCategory === category.key && styles.activeTab,
              ]}
              onPress={() => onCategoryChange(category.key)}
            >
              <Body style={styles.tabIcon}>{category.icon}</Body>
              <Body style={[
                styles.tabText,
                selectedCategory === category.key && styles.activeTabText,
              ]}>
                {category.label}
              </Body>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};
