/**
 * Performance Dashboard Component
 * Comprehensive performance monitoring interface
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { usePerformance, usePerformanceDashboard } from '../../hooks/usePerformance';
import { colors, typography, spacing } from '../../theme';

interface MetricCardProps {
  title: string;
  value: string;
  status: 'excellent' | 'good' | 'warning' | 'critical';
  trend?: 'up' | 'down' | 'stable';
  subtitle?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, status, trend, subtitle }) => {
  const getStatusColor = () => {
    switch (status) {
      case 'excellent': return colors.success;
      case 'good': return colors.primary;
      case 'warning': return colors.warning;
      case 'critical': return colors.error;
      default: return colors.textSecondary;
    }
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'up': return '↗️';
      case 'down': return '↘️';
      case 'stable': return '→';
      default: return '';
    }
  };

  return (
    <View style={[styles.metricCard, { borderLeftColor: getStatusColor() }]}>
      <View style={styles.metricHeader}>
        <Text style={styles.metricTitle}>{title}</Text>
        {trend && <Text style={styles.trendIcon}>{getTrendIcon()}</Text>}
      </View>
      <Text style={[styles.metricValue, { color: getStatusColor() }]}>{value}</Text>
      {subtitle && <Text style={styles.metricSubtitle}>{subtitle}</Text>}
    </View>
  );
};

interface AlertBadgeProps {
  count: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

const AlertBadge: React.FC<AlertBadgeProps> = ({ count, severity }) => {
  if (count === 0) return null;

  const getSeverityColor = () => {
    switch (severity) {
      case 'low': return colors.info;
      case 'medium': return colors.warning;
      case 'high': return colors.error;
      case 'critical': return colors.error;
      default: return colors.textSecondary;
    }
  };

  return (
    <View style={[styles.alertBadge, { backgroundColor: getSeverityColor() }]}>
      <Text style={styles.alertBadgeText}>{count}</Text>
    </View>
  );
};

export const PerformanceDashboard: React.FC = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'metrics' | 'optimization'>('overview');

  const {
    performanceSummary,
    cacheStats,
    optimizationHistory,
    recommendations,
    isLoadingSummary,
    performanceStatus,
    performanceScore,
    formatMetric,
    runOptimization,
    clearCache,
    optimizeCache,
    clearAlerts,
    isRunningOptimization,
    isClearingCache,
    isOptimizingCache,
    refetchSummary,
  } = usePerformance();

  const { dashboardData, isLoading: isDashboardLoading } = usePerformanceDashboard();

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetchSummary();
    setRefreshing(false);
  };

  const handleRunOptimization = () => {
    Alert.alert(
      'Run Optimization',
      'This will analyze and optimize system performance. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Run', 
          onPress: () => runOptimization(),
          style: 'default'
        },
      ]
    );
  };

  const handleClearCache = () => {
    Alert.alert(
      'Clear Cache',
      'This will clear all cached data. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear', 
          onPress: () => clearCache(),
          style: 'destructive'
        },
      ]
    );
  };

  const renderOverviewTab = () => {
    if (!performanceSummary) return null;

    const { current, trends } = performanceSummary;

    return (
      <View style={styles.tabContent}>
        {/* Performance Score */}
        <View style={styles.scoreContainer}>
          <Text style={styles.scoreLabel}>Performance Score</Text>
          <Text style={[styles.scoreValue, { color: getScoreColor(performanceScore) }]}>
            {performanceScore}
          </Text>
          <Text style={styles.scoreStatus}>{performanceStatus.toUpperCase()}</Text>
        </View>

        {/* Key Metrics */}
        <View style={styles.metricsGrid}>
          <MetricCard
            title="Response Time"
            value={formatMetric(current.responseTime, 'time')}
            status={current.responseTime < 500 ? 'excellent' : current.responseTime < 1000 ? 'good' : 'warning'}
            trend={trends.find(t => t.metric === 'responseTime')?.direction}
          />
          <MetricCard
            title="Error Rate"
            value={formatMetric(current.errorRate, 'percentage')}
            status={current.errorRate < 0.01 ? 'excellent' : current.errorRate < 0.05 ? 'good' : 'critical'}
            trend={trends.find(t => t.metric === 'errorRate')?.direction}
          />
          <MetricCard
            title="Cache Hit Rate"
            value={formatMetric(current.cacheHitRate, 'percentage')}
            status={current.cacheHitRate > 0.8 ? 'excellent' : current.cacheHitRate > 0.6 ? 'good' : 'warning'}
            trend={trends.find(t => t.metric === 'cacheHitRate')?.direction}
          />
          <MetricCard
            title="Memory Usage"
            value={formatMetric(current.memoryUsage, 'percentage')}
            status={current.memoryUsage < 0.7 ? 'excellent' : current.memoryUsage < 0.8 ? 'good' : 'warning'}
          />
        </View>

        {/* Alerts */}
        {performanceSummary.alerts > 0 && (
          <View style={styles.alertsSection}>
            <View style={styles.alertsHeader}>
              <Text style={styles.alertsTitle}>Active Alerts</Text>
              <AlertBadge count={performanceSummary.alerts} severity="high" />
            </View>
            <TouchableOpacity
              style={styles.clearAlertsButton}
              onPress={() => clearAlerts()}
            >
              <Text style={styles.clearAlertsText}>Clear Alerts</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Recommendations */}
        {recommendations && recommendations.length > 0 && (
          <View style={styles.recommendationsSection}>
            <Text style={styles.sectionTitle}>Recommendations</Text>
            {recommendations.slice(0, 3).map((recommendation, index) => (
              <View key={index} style={styles.recommendationItem}>
                <Text style={styles.recommendationText}>• {recommendation}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderMetricsTab = () => {
    if (!performanceSummary || !cacheStats) return null;

    const { current } = performanceSummary;

    return (
      <View style={styles.tabContent}>
        <Text style={styles.sectionTitle}>System Metrics</Text>
        <View style={styles.metricsGrid}>
          <MetricCard
            title="Throughput"
            value={formatMetric(current.throughput, 'rate')}
            status="good"
            subtitle="Requests per second"
          />
          <MetricCard
            title="CPU Usage"
            value={formatMetric(current.cpuUsage, 'percentage')}
            status={current.cpuUsage < 0.7 ? 'good' : 'warning'}
          />
          <MetricCard
            title="Active Connections"
            value={formatMetric(current.activeConnections, 'count')}
            status="good"
          />
          <MetricCard
            title="Queue Length"
            value={formatMetric(current.queueLength, 'count')}
            status={current.queueLength < 50 ? 'good' : 'warning'}
          />
        </View>

        <Text style={styles.sectionTitle}>Cache Statistics</Text>
        <View style={styles.metricsGrid}>
          <MetricCard
            title="Hit Rate"
            value={formatMetric(cacheStats.hitRate, 'percentage')}
            status={cacheStats.hitRate > 0.8 ? 'excellent' : 'good'}
          />
          <MetricCard
            title="Total Requests"
            value={formatMetric(cacheStats.totalRequests, 'count')}
            status="good"
          />
          <MetricCard
            title="Memory Usage"
            value={`${(cacheStats.memoryUsage / 1024 / 1024).toFixed(1)} MB`}
            status="good"
          />
          <MetricCard
            title="Key Count"
            value={formatMetric(cacheStats.keyCount, 'count')}
            status="good"
          />
        </View>
      </View>
    );
  };

  const renderOptimizationTab = () => {
    return (
      <View style={styles.tabContent}>
        {/* Optimization Actions */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Optimization Actions</Text>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.primaryButton]}
            onPress={handleRunOptimization}
            disabled={isRunningOptimization}
          >
            <Text style={styles.actionButtonText}>
              {isRunningOptimization ? 'Running...' : 'Run Full Optimization'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={() => optimizeCache()}
            disabled={isOptimizingCache}
          >
            <Text style={styles.actionButtonTextSecondary}>
              {isOptimizingCache ? 'Optimizing...' : 'Optimize Cache'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.dangerButton]}
            onPress={handleClearCache}
            disabled={isClearingCache}
          >
            <Text style={styles.actionButtonText}>
              {isClearingCache ? 'Clearing...' : 'Clear Cache'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Recent Optimizations */}
        {optimizationHistory && optimizationHistory.length > 0 && (
          <View style={styles.historySection}>
            <Text style={styles.sectionTitle}>Recent Optimizations</Text>
            {optimizationHistory.slice(0, 5).map((optimization, index) => (
              <View key={index} style={styles.historyItem}>
                <Text style={styles.historyStrategy}>{optimization.strategy}</Text>
                <Text style={styles.historyImpact}>{optimization.impact}</Text>
                <Text style={styles.historyTimestamp}>
                  {new Date(optimization.timestamp).toLocaleString()}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return colors.success;
    if (score >= 70) return colors.primary;
    if (score >= 50) return colors.warning;
    return colors.error;
  };

  if (isLoadingSummary || isDashboardLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading performance data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Performance Dashboard</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={handleRefresh}
            disabled={refreshing}
          >
            <Text style={styles.refreshButtonText}>
              {refreshing ? '⟳' : '↻'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        {(['overview', 'metrics', 'optimization'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, selectedTab === tab && styles.activeTab]}
            onPress={() => setSelectedTab(tab)}
          >
            <Text style={[styles.tabText, selectedTab === tab && styles.activeTabText]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {selectedTab === 'overview' && renderOverviewTab()}
        {selectedTab === 'metrics' && renderMetricsTab()}
        {selectedTab === 'optimization' && renderOptimizationTab()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    ...typography.h2,
    color: colors.text,
  },
  headerActions: {
    flexDirection: 'row',
  },
  refreshButton: {
    padding: spacing.sm,
  },
  refreshButtonText: {
    fontSize: 20,
    color: colors.primary,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  tabText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  activeTabText: {
    color: colors.primary,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  tabContent: {
    padding: spacing.md,
  },
  scoreContainer: {
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginBottom: spacing.md,
  },
  scoreLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  scoreValue: {
    ...typography.h1,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  scoreStatus: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.xs,
  },
  metricCard: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: spacing.md,
    margin: spacing.xs,
    borderLeftWidth: 4,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  metricTitle: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  trendIcon: {
    fontSize: 16,
  },
  metricValue: {
    ...typography.h3,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  metricSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  alertsSection: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: spacing.md,
    marginVertical: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.error,
  },
  alertsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  alertsTitle: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text,
  },
  alertBadge: {
    borderRadius: 12,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  alertBadgeText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: 'bold',
  },
  clearAlertsButton: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.error,
    borderRadius: 6,
  },
  clearAlertsText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: '600',
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.md,
    marginTop: spacing.lg,
  },
  recommendationsSection: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  recommendationItem: {
    marginBottom: spacing.sm,
  },
  recommendationText: {
    ...typography.body,
    color: colors.text,
    lineHeight: 20,
  },
  actionsSection: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  actionButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 8,
    marginBottom: spacing.sm,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: colors.primary,
  },
  secondaryButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  dangerButton: {
    backgroundColor: colors.error,
  },
  actionButtonText: {
    ...typography.body,
    color: colors.white,
    fontWeight: '600',
  },
  actionButtonTextSecondary: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
  },
  historySection: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: spacing.md,
  },
  historyItem: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: spacing.sm,
  },
  historyStrategy: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  historyImpact: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  historyTimestamp: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});
