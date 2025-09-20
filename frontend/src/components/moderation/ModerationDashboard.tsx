/**
 * Moderation Dashboard Component
 * Dashboard for moderators to manage reports and queue items
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useModeration } from '../../hooks/useModeration';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';

interface StatCard {
  title: string;
  value: string | number;
  icon: string;
  color: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export const ModerationDashboard: React.FC = () => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { useStatisticsQuery, useReportsQuery, useQueueQuery } = useModeration();
  
  const [timeRange, setTimeRange] = useState('24h');
  const [refreshing, setRefreshing] = useState(false);

  // Queries
  const { data: statistics, refetch: refetchStats } = useStatisticsQuery(timeRange);
  const { data: reportsData, refetch: refetchReports } = useReportsQuery({
    status: 'pending',
    limit: 5,
  });
  const { data: queueData, refetch: refetchQueue } = useQueueQuery({
    status: 'pending',
    limit: 5,
  });

  // Check if user is moderator
  if (!user?.isModerator && !user?.isAdmin) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.accessDenied}>
          <Ionicons name="shield-outline" size={64} color={colors.textSecondary} />
          <Text style={[styles.accessDeniedText, { color: colors.text }]}>
            Access Denied
          </Text>
          <Text style={[styles.accessDeniedSubtext, { color: colors.textSecondary }]}>
            You don't have permission to access the moderation dashboard.
          </Text>
        </View>
      </View>
    );
  }

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refetchStats(),
        refetchReports(),
        refetchQueue(),
      ]);
    } finally {
      setRefreshing(false);
    }
  };

  const getStatCards = (): StatCard[] => {
    if (!statistics) return [];

    return [
      {
        title: 'Total Moderated',
        value: statistics.moderation.totalModerated || 0,
        icon: 'shield-checkmark-outline',
        color: colors.primary,
      },
      {
        title: 'Pending Reports',
        value: statistics.reports.pendingReports || 0,
        icon: 'flag-outline',
        color: colors.warning,
      },
      {
        title: 'Queue Items',
        value: statistics.queue.pendingItems || 0,
        icon: 'list-outline',
        color: colors.info,
      },
      {
        title: 'Avg Confidence',
        value: `${Math.round((statistics.moderation.avgConfidence || 0) * 100)}%`,
        icon: 'analytics-outline',
        color: colors.success,
      },
    ];
  };

  const timeRangeOptions = [
    { label: '24h', value: '24h' },
    { label: '7d', value: '7d' },
    { label: '30d', value: '30d' },
  ];

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      padding: 16,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 24,
    },
    title: {
      fontSize: 28,
      fontWeight: '700',
      color: colors.text,
    },
    timeRangeContainer: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 4,
    },
    timeRangeButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
    },
    timeRangeButtonActive: {
      backgroundColor: colors.primary,
    },
    timeRangeText: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.textSecondary,
    },
    timeRangeTextActive: {
      color: colors.surface,
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginHorizontal: -8,
      marginBottom: 24,
    },
    statCard: {
      width: '50%',
      paddingHorizontal: 8,
      marginBottom: 16,
    },
    statCardContent: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 20,
      alignItems: 'center',
    },
    statIcon: {
      marginBottom: 12,
    },
    statValue: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 4,
    },
    statTitle: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    section: {
      marginBottom: 24,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.text,
    },
    viewAllButton: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    viewAllText: {
      fontSize: 14,
      color: colors.primary,
      marginRight: 4,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.text,
      flex: 1,
    },
    priorityBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      marginLeft: 8,
    },
    priorityText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.surface,
    },
    cardContent: {
      marginBottom: 8,
    },
    cardText: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 4,
    },
    cardFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    timeAgo: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    actionButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
    },
    actionButtonText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.surface,
    },
    emptyState: {
      alignItems: 'center',
      padding: 32,
    },
    emptyStateIcon: {
      marginBottom: 16,
    },
    emptyStateText: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    accessDenied: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 32,
    },
    accessDeniedText: {
      fontSize: 24,
      fontWeight: '600',
      marginTop: 16,
      marginBottom: 8,
    },
    accessDeniedSubtext: {
      fontSize: 16,
      textAlign: 'center',
    },
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return colors.error;
      case 'high': return colors.warning;
      case 'medium': return colors.info;
      default: return colors.textSecondary;
    }
  };

  const renderStatCard = (stat: StatCard) => (
    <View key={stat.title} style={styles.statCard}>
      <View style={styles.statCardContent}>
        <Ionicons
          name={stat.icon as any}
          size={32}
          color={stat.color}
          style={styles.statIcon}
        />
        <Text style={styles.statValue}>{stat.value}</Text>
        <Text style={styles.statTitle}>{stat.title}</Text>
      </View>
    </View>
  );

  const renderReportCard = (report: any) => (
    <View key={report.id} style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {report.reportType.replace('_', ' ').toUpperCase()}
        </Text>
        <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(report.priority) }]}>
          <Text style={styles.priorityText}>{report.priority.toUpperCase()}</Text>
        </View>
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.cardText} numberOfLines={2}>
          {report.reason}
        </Text>
        <Text style={styles.cardText}>
          Reporter: {report.reporter?.name || 'Anonymous'}
        </Text>
      </View>
      <View style={styles.cardFooter}>
        <Text style={styles.timeAgo}>{report.timeAgo}</Text>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionButtonText}>Review</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderQueueCard = (item: any) => (
    <View key={item.id} style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {item.contentType.toUpperCase()} - {item.severity.toUpperCase()}
        </Text>
        <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.priority) }]}>
          <Text style={styles.priorityText}>{item.priority.toUpperCase()}</Text>
        </View>
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.cardText} numberOfLines={2}>
          {item.contentPreview || 'No preview available'}
        </Text>
        <Text style={styles.cardText}>
          User: {item.user?.name || 'Unknown'}
        </Text>
      </View>
      <View style={styles.cardFooter}>
        <Text style={styles.timeAgo}>{item.waitTime}</Text>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionButtonText}>Review</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          colors={[colors.primary]}
          tintColor={colors.primary}
        />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Moderation</Text>
        <View style={styles.timeRangeContainer}>
          {timeRangeOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.timeRangeButton,
                timeRange === option.value && styles.timeRangeButtonActive,
              ]}
              onPress={() => setTimeRange(option.value)}
            >
              <Text
                style={[
                  styles.timeRangeText,
                  timeRange === option.value && styles.timeRangeTextActive,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.statsGrid}>
        {getStatCards().map(renderStatCard)}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Reports</Text>
          <TouchableOpacity style={styles.viewAllButton}>
            <Text style={styles.viewAllText}>View All</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>
        
        {reportsData?.reports.length ? (
          reportsData.reports.map(renderReportCard)
        ) : (
          <View style={styles.emptyState}>
            <Ionicons
              name="checkmark-circle-outline"
              size={48}
              color={colors.textSecondary}
              style={styles.emptyStateIcon}
            />
            <Text style={styles.emptyStateText}>No pending reports</Text>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Review Queue</Text>
          <TouchableOpacity style={styles.viewAllButton}>
            <Text style={styles.viewAllText}>View All</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>
        
        {queueData?.items.length ? (
          queueData.items.map(renderQueueCard)
        ) : (
          <View style={styles.emptyState}>
            <Ionicons
              name="checkmark-circle-outline"
              size={48}
              color={colors.textSecondary}
              style={styles.emptyStateIcon}
            />
            <Text style={styles.emptyStateText}>No items in queue</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};
