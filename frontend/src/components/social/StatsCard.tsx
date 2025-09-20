/**
 * Stats Card Component
 * Displays statistics in a card format
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { H2, Body, Caption } from '../ui/Typography';
import { Card } from '../ui/Card';

interface StatItem {
  label: string;
  value: string | number;
  color?: string;
}

interface StatsCardProps {
  title: string;
  stats: StatItem[];
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  stats,
}) => {
  const theme = useTheme();

  const styles = StyleSheet.create({
    container: {
      marginHorizontal: 16,
      marginVertical: 8,
    },
    title: {
      color: theme.colors.alabaster,
      marginBottom: 16,
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    statItem: {
      width: '48%',
      alignItems: 'center',
      paddingVertical: 12,
      marginBottom: 8,
    },
    statValue: {
      color: theme.colors.alabaster,
      fontSize: 24,
      fontWeight: '600',
      marginBottom: 4,
    },
    statLabel: {
      color: theme.colors.alabaster,
      opacity: 0.7,
      fontSize: 14,
      textAlign: 'center',
    },
  });

  return (
    <Card style={styles.container}>
      <H2 style={styles.title}>{title}</H2>
      <View style={styles.statsGrid}>
        {stats.map((stat, index) => (
          <View key={index} style={styles.statItem}>
            <Body style={[
              styles.statValue,
              stat.color && { color: stat.color }
            ]}>
              {stat.value}
            </Body>
            <Caption style={styles.statLabel}>{stat.label}</Caption>
          </View>
        ))}
      </View>
    </Card>
  );
};
