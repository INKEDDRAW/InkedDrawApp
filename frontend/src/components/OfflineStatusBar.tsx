/**
 * Offline Status Bar Component
 * Shows connection status and sync information
 */

import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useOffline } from '../contexts/OfflineContext';
import { Body, Caption } from './ui/Typography';
import { useTheme } from '../theme/ThemeProvider';

interface OfflineStatusBarProps {
  showDetails?: boolean;
  onPress?: () => void;
}

export const OfflineStatusBar: React.FC<OfflineStatusBarProps> = ({
  showDetails = false,
  onPress,
}) => {
  const theme = useTheme();
  const {
    isOnline,
    isSyncing,
    pendingSyncItems,
    failedSyncItems,
    lastSyncTime,
    syncNow,
    databaseStats,
  } = useOffline();

  const getStatusColor = () => {
    if (!isOnline) return '#FF6B6B'; // Red for offline
    if (isSyncing) return '#4ECDC4'; // Teal for syncing
    if (pendingSyncItems > 0) return '#FFE66D'; // Yellow for pending
    if (failedSyncItems > 0) return '#FF8E53'; // Orange for errors
    return '#4ECDC4'; // Green for all good
  };

  const getStatusText = () => {
    if (!isOnline) return 'Offline';
    if (isSyncing) return 'Syncing...';
    if (pendingSyncItems > 0) return `${pendingSyncItems} pending`;
    if (failedSyncItems > 0) return `${failedSyncItems} failed`;
    return 'Online';
  };

  const getLastSyncText = () => {
    if (!lastSyncTime) return 'Never synced';
    
    const now = new Date();
    const diffMs = now.getTime() - lastSyncTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    
    if (diffMins < 1) return 'Just synced';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return lastSyncTime.toLocaleDateString();
  };

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else if (isOnline && !isSyncing) {
      syncNow();
    }
  };

  const styles = StyleSheet.create({
    container: {
      backgroundColor: theme.colors.charcoal,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.onyx,
    },
    statusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    statusLeft: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    statusIndicator: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginRight: 8,
      backgroundColor: getStatusColor(),
    },
    statusText: {
      color: theme.colors.alabaster,
      fontSize: 14,
      fontWeight: '500',
    },
    syncButton: {
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 4,
      backgroundColor: theme.colors.goldLeaf,
    },
    syncButtonText: {
      color: theme.colors.onyx,
      fontSize: 12,
      fontWeight: '600',
    },
    syncButtonDisabled: {
      backgroundColor: theme.colors.onyx,
    },
    syncButtonTextDisabled: {
      color: theme.colors.alabaster,
    },
    detailsRow: {
      marginTop: 8,
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    detailItem: {
      alignItems: 'center',
    },
    detailValue: {
      color: theme.colors.alabaster,
      fontSize: 16,
      fontWeight: '600',
    },
    detailLabel: {
      color: theme.colors.alabaster,
      fontSize: 11,
      opacity: 0.7,
      marginTop: 2,
    },
    lastSyncText: {
      color: theme.colors.alabaster,
      fontSize: 12,
      opacity: 0.7,
    },
  });

  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={handlePress}
      disabled={isSyncing}
      activeOpacity={0.7}
    >
      <View style={styles.statusRow}>
        <View style={styles.statusLeft}>
          <View style={styles.statusIndicator} />
          <Body style={styles.statusText}>{getStatusText()}</Body>
        </View>
        
        <View style={{ alignItems: 'flex-end' }}>
          {isOnline && !isSyncing && (
            <View style={[
              styles.syncButton,
              (pendingSyncItems === 0 && failedSyncItems === 0) && styles.syncButtonDisabled
            ]}>
              <Caption style={[
                styles.syncButtonText,
                (pendingSyncItems === 0 && failedSyncItems === 0) && styles.syncButtonTextDisabled
              ]}>
                Sync
              </Caption>
            </View>
          )}
          
          <Caption style={styles.lastSyncText}>
            {getLastSyncText()}
          </Caption>
        </View>
      </View>

      {showDetails && databaseStats && (
        <View style={styles.detailsRow}>
          <View style={styles.detailItem}>
            <Body style={styles.detailValue}>
              {databaseStats.totalRecords.toLocaleString()}
            </Body>
            <Caption style={styles.detailLabel}>Total Records</Caption>
          </View>
          
          <View style={styles.detailItem}>
            <Body style={styles.detailValue}>
              {databaseStats.tableStats.cigars || 0}
            </Body>
            <Caption style={styles.detailLabel}>Cigars</Caption>
          </View>
          
          <View style={styles.detailItem}>
            <Body style={styles.detailValue}>
              {databaseStats.tableStats.beers || 0}
            </Body>
            <Caption style={styles.detailLabel}>Beers</Caption>
          </View>
          
          <View style={styles.detailItem}>
            <Body style={styles.detailValue}>
              {databaseStats.tableStats.wines || 0}
            </Body>
            <Caption style={styles.detailLabel}>Wines</Caption>
          </View>
          
          <View style={styles.detailItem}>
            <Body style={styles.detailValue}>
              {databaseStats.tableStats.posts || 0}
            </Body>
            <Caption style={styles.detailLabel}>Posts</Caption>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
};

export default OfflineStatusBar;
