/**
 * Content Moderation Indicator Component
 * Shows moderation status and actions for content
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useModeration } from '../../hooks/useModeration';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { ReportModal } from './ReportModal';

interface ContentModerationIndicatorProps {
  contentId: string;
  contentType: 'post' | 'comment' | 'image' | 'profile' | 'message';
  contentUserId: string;
  contentUserName?: string;
  content?: string;
  imageUrls?: string[];
  showReportButton?: boolean;
  showModerationStatus?: boolean;
  onModerationChange?: (result: any) => void;
}

export const ContentModerationIndicator: React.FC<ContentModerationIndicatorProps> = ({
  contentId,
  contentType,
  contentUserId,
  contentUserName,
  content,
  imageUrls,
  showReportButton = true,
  showModerationStatus = false,
  onModerationChange,
}) => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { moderateContent, getModerationStatus, appealModeration, isLoading } = useModeration();
  
  const [moderationStatus, setModerationStatus] = useState<any>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [isAppealSubmitted, setIsAppealSubmitted] = useState(false);

  // Load moderation status on mount
  useEffect(() => {
    if (showModerationStatus) {
      loadModerationStatus();
    }
  }, [contentId, contentType, showModerationStatus]);

  const loadModerationStatus = async () => {
    try {
      const status = await getModerationStatus(contentId, contentType);
      setModerationStatus(status);
    } catch (error) {
      console.error('Error loading moderation status:', error);
    }
  };

  const handleModerateContent = async () => {
    try {
      const result = await moderateContent({
        contentId,
        contentType,
        content,
        imageUrls,
        userId: contentUserId,
      });

      setModerationStatus(result);
      onModerationChange?.(result);

      if (!result.isApproved) {
        Alert.alert(
          'Content Flagged',
          `This content has been flagged for review: ${result.reasons.join(', ')}`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to moderate content');
    }
  };

  const handleAppealModeration = () => {
    Alert.prompt(
      'Appeal Moderation Decision',
      'Please explain why you believe this decision should be reconsidered:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit Appeal',
          onPress: async (reason) => {
            if (reason && reason.trim()) {
              try {
                const success = await appealModeration({
                  contentId,
                  contentType,
                  reason: reason.trim(),
                });

                if (success) {
                  setIsAppealSubmitted(true);
                  Alert.alert(
                    'Appeal Submitted',
                    'Your appeal has been submitted and will be reviewed by our moderation team.',
                    [{ text: 'OK' }]
                  );
                } else {
                  Alert.alert('Error', 'Failed to submit appeal');
                }
              } catch (error) {
                Alert.alert('Error', 'Failed to submit appeal');
              }
            }
          },
        },
      ],
      'plain-text'
    );
  };

  const getModerationStatusColor = (status: any) => {
    if (!status) return colors.textSecondary;
    
    if (!status.is_approved) return colors.error;
    if (status.requires_human_review) return colors.warning;
    if (status.confidence < 0.7) return colors.warning;
    return colors.success;
  };

  const getModerationStatusText = (status: any) => {
    if (!status) return 'Not moderated';
    
    if (!status.is_approved) return 'Flagged';
    if (status.requires_human_review) return 'Under review';
    if (status.confidence < 0.7) return 'Low confidence';
    return 'Approved';
  };

  const getModerationStatusIcon = (status: any) => {
    if (!status) return 'help-circle-outline';
    
    if (!status.is_approved) return 'warning-outline';
    if (status.requires_human_review) return 'time-outline';
    if (status.confidence < 0.7) return 'alert-circle-outline';
    return 'checkmark-circle-outline';
  };

  const canAppeal = moderationStatus && 
                   !moderationStatus.is_approved && 
                   user?.id === contentUserId && 
                   !isAppealSubmitted;

  const canModerate = user?.isModerator || user?.isAdmin;

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 8,
    },
    statusContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    statusIcon: {
      marginRight: 8,
    },
    statusText: {
      fontSize: 14,
      fontWeight: '500',
    },
    confidenceText: {
      fontSize: 12,
      color: colors.textSecondary,
      marginLeft: 4,
    },
    actionsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
      borderWidth: 1,
    },
    reportButton: {
      borderColor: colors.error,
      backgroundColor: colors.error + '10',
    },
    moderateButton: {
      borderColor: colors.primary,
      backgroundColor: colors.primary + '10',
    },
    appealButton: {
      borderColor: colors.warning,
      backgroundColor: colors.warning + '10',
    },
    actionButtonText: {
      fontSize: 12,
      fontWeight: '600',
      marginLeft: 4,
    },
    reportButtonText: {
      color: colors.error,
    },
    moderateButtonText: {
      color: colors.primary,
    },
    appealButtonText: {
      color: colors.warning,
    },
    disabledButton: {
      opacity: 0.5,
    },
    flaggedContent: {
      backgroundColor: colors.error + '10',
      borderLeftWidth: 4,
      borderLeftColor: colors.error,
      padding: 12,
      borderRadius: 8,
      marginVertical: 8,
    },
    flaggedTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.error,
      marginBottom: 4,
    },
    flaggedText: {
      fontSize: 12,
      color: colors.textSecondary,
    },
  });

  // Don't show anything if no actions are available
  if (!showReportButton && !showModerationStatus && !canModerate) {
    return null;
  }

  return (
    <>
      <View style={styles.container}>
        {showModerationStatus && moderationStatus && (
          <View style={styles.statusContainer}>
            <Ionicons
              name={getModerationStatusIcon(moderationStatus) as any}
              size={16}
              color={getModerationStatusColor(moderationStatus)}
              style={styles.statusIcon}
            />
            <Text
              style={[
                styles.statusText,
                { color: getModerationStatusColor(moderationStatus) },
              ]}
            >
              {getModerationStatusText(moderationStatus)}
            </Text>
            {moderationStatus.confidence && (
              <Text style={styles.confidenceText}>
                ({Math.round(moderationStatus.confidence * 100)}%)
              </Text>
            )}
          </View>
        )}

        <View style={styles.actionsContainer}>
          {showReportButton && user?.id !== contentUserId && (
            <TouchableOpacity
              style={[styles.actionButton, styles.reportButton]}
              onPress={() => setShowReportModal(true)}
            >
              <Ionicons name="flag-outline" size={14} color={colors.error} />
              <Text style={[styles.actionButtonText, styles.reportButtonText]}>
                Report
              </Text>
            </TouchableOpacity>
          )}

          {canModerate && (
            <TouchableOpacity
              style={[
                styles.actionButton,
                styles.moderateButton,
                isLoading && styles.disabledButton,
              ]}
              onPress={handleModerateContent}
              disabled={isLoading}
            >
              <Ionicons name="shield-outline" size={14} color={colors.primary} />
              <Text style={[styles.actionButtonText, styles.moderateButtonText]}>
                {isLoading ? 'Moderating...' : 'Moderate'}
              </Text>
            </TouchableOpacity>
          )}

          {canAppeal && (
            <TouchableOpacity
              style={[styles.actionButton, styles.appealButton]}
              onPress={handleAppealModeration}
            >
              <Ionicons name="chatbubble-outline" size={14} color={colors.warning} />
              <Text style={[styles.actionButtonText, styles.appealButtonText]}>
                Appeal
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Show flagged content warning */}
      {moderationStatus && !moderationStatus.is_approved && (
        <View style={styles.flaggedContent}>
          <Text style={styles.flaggedTitle}>Content Flagged</Text>
          <Text style={styles.flaggedText}>
            This content has been flagged for: {moderationStatus.reasons?.join(', ') || 'policy violation'}
          </Text>
          {isAppealSubmitted && (
            <Text style={[styles.flaggedText, { marginTop: 4 }]}>
              Appeal submitted and under review.
            </Text>
          )}
        </View>
      )}

      <ReportModal
        visible={showReportModal}
        onClose={() => setShowReportModal(false)}
        reportedUserId={contentUserId}
        contentId={contentId}
        contentType={contentType}
        reportedUserName={contentUserName}
      />
    </>
  );
};
