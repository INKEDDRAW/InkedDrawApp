/**
 * Moderation Hook
 * React hook for content moderation and reporting functionality
 */

import { useState, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { useAnalytics } from '../contexts/AnalyticsContext';

interface ModerationResult {
  isApproved: boolean;
  confidence: number;
  flags: string[];
  reasons: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  requiresHumanReview: boolean;
  autoActions: string[];
  metadata?: any;
}

interface UserReport {
  id?: string;
  reportedUserId?: string;
  contentId?: string;
  contentType?: 'post' | 'comment' | 'profile' | 'message';
  reportType: 'spam' | 'harassment' | 'hate_speech' | 'violence' | 'inappropriate_content' | 'fake_account' | 'copyright' | 'other';
  reason: string;
  evidence?: string[];
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  status?: 'pending' | 'investigating' | 'resolved' | 'dismissed';
}

interface ModerationStatistics {
  moderation: {
    totalModerated: number;
    approvedCount: number;
    rejectedCount: number;
    humanReviewCount: number;
    avgConfidence: number;
    avgProcessingTime: number;
  };
  reports: {
    totalReports: number;
    pendingReports: number;
    resolvedReports: number;
    reportsByType: Record<string, number>;
  };
  queue: {
    totalItems: number;
    pendingItems: number;
    averageWaitTime: number;
  };
}

export const useModeration = () => {
  const { user, apiCall } = useAuth();
  const { track } = useAnalytics();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Moderate content
   */
  const moderateContentMutation = useMutation({
    mutationFn: async (params: {
      contentId: string;
      contentType: 'post' | 'comment' | 'image' | 'profile' | 'message';
      content?: string;
      imageUrls?: string[];
      userId: string;
    }) => {
      const response = await apiCall('/moderation/moderate', {
        method: 'POST',
        body: JSON.stringify(params),
      });
      return response.result as ModerationResult;
    },
    onSuccess: (result, variables) => {
      track('content_moderated', {
        content_type: variables.contentType,
        content_id: variables.contentId,
        is_approved: result.isApproved,
        confidence: result.confidence,
        severity: result.severity,
      });
    },
  });

  /**
   * Submit user report
   */
  const submitReportMutation = useMutation({
    mutationFn: async (report: Omit<UserReport, 'id'>) => {
      const response = await apiCall('/moderation/report', {
        method: 'POST',
        body: JSON.stringify(report),
      });
      return response.report as UserReport;
    },
    onSuccess: (report) => {
      track('report_submitted', {
        report_type: report.reportType,
        content_type: report.contentType,
        priority: report.priority,
      });
      
      // Invalidate reports query
      queryClient.invalidateQueries({ queryKey: ['moderation', 'reports'] });
    },
  });

  /**
   * Appeal moderation decision
   */
  const appealModerationMutation = useMutation({
    mutationFn: async (params: {
      contentId: string;
      contentType: string;
      reason: string;
    }) => {
      const response = await apiCall('/moderation/appeal', {
        method: 'POST',
        body: JSON.stringify(params),
      });
      return response.success;
    },
    onSuccess: (success, variables) => {
      if (success) {
        track('moderation_appeal_submitted', {
          content_id: variables.contentId,
          content_type: variables.contentType,
        });
      }
    },
  });

  /**
   * Get moderation status for content
   */
  const getModerationStatus = useCallback(async (contentId: string, contentType: string) => {
    try {
      const response = await apiCall(`/moderation/status/${contentId}/${contentType}`);
      return response.status;
    } catch (error) {
      console.error('Error getting moderation status:', error);
      return null;
    }
  }, [apiCall]);

  /**
   * Get reports for moderation review (moderators only)
   */
  const useReportsQuery = (filters: {
    status?: string;
    priority?: string;
    reportType?: string;
    limit?: number;
    offset?: number;
  } = {}) => {
    return useQuery({
      queryKey: ['moderation', 'reports', filters],
      queryFn: async () => {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined) {
            params.append(key, value.toString());
          }
        });

        const response = await apiCall(`/moderation/reports?${params.toString()}`);
        return {
          reports: response.reports as UserReport[],
          totalCount: response.totalCount as number,
        };
      },
      enabled: user?.isModerator || user?.isAdmin,
    });
  };

  /**
   * Resolve report (moderators only)
   */
  const resolveReportMutation = useMutation({
    mutationFn: async (params: {
      reportId: string;
      resolution: string;
      action?: 'dismiss' | 'warn_user' | 'suspend_user' | 'ban_user' | 'remove_content';
    }) => {
      const response = await apiCall(`/moderation/reports/${params.reportId}/resolve`, {
        method: 'PUT',
        body: JSON.stringify({
          resolution: params.resolution,
          action: params.action,
        }),
      });
      return response.success;
    },
    onSuccess: () => {
      // Invalidate reports query
      queryClient.invalidateQueries({ queryKey: ['moderation', 'reports'] });
    },
  });

  /**
   * Get moderation queue items (moderators only)
   */
  const useQueueQuery = (filters: {
    status?: string;
    priority?: string;
    severity?: string;
    assignedTo?: string;
    limit?: number;
    offset?: number;
  } = {}) => {
    return useQuery({
      queryKey: ['moderation', 'queue', filters],
      queryFn: async () => {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined) {
            params.append(key, value.toString());
          }
        });

        const response = await apiCall(`/moderation/queue?${params.toString()}`);
        return {
          items: response.items,
          totalCount: response.totalCount as number,
        };
      },
      enabled: user?.isModerator || user?.isAdmin,
    });
  };

  /**
   * Complete queue item review (moderators only)
   */
  const completeReviewMutation = useMutation({
    mutationFn: async (params: {
      queueItemId: string;
      decision: 'approved' | 'rejected' | 'escalated';
      reviewNotes?: string;
      escalationReason?: string;
    }) => {
      const response = await apiCall(`/moderation/queue/${params.queueItemId}/review`, {
        method: 'PUT',
        body: JSON.stringify({
          decision: params.decision,
          reviewNotes: params.reviewNotes,
          escalationReason: params.escalationReason,
        }),
      });
      return response.success;
    },
    onSuccess: () => {
      // Invalidate queue query
      queryClient.invalidateQueries({ queryKey: ['moderation', 'queue'] });
    },
  });

  /**
   * Get moderation statistics (moderators only)
   */
  const useStatisticsQuery = (timeRange: string = '24h') => {
    return useQuery({
      queryKey: ['moderation', 'statistics', timeRange],
      queryFn: async () => {
        const response = await apiCall(`/moderation/statistics?timeRange=${timeRange}`);
        return response.statistics as ModerationStatistics;
      },
      enabled: user?.isModerator || user?.isAdmin,
      refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    });
  };

  /**
   * Convenience functions
   */
  const moderateContent = useCallback(async (params: {
    contentId: string;
    contentType: 'post' | 'comment' | 'image' | 'profile' | 'message';
    content?: string;
    imageUrls?: string[];
    userId: string;
  }) => {
    setIsLoading(true);
    try {
      const result = await moderateContentMutation.mutateAsync(params);
      return result;
    } finally {
      setIsLoading(false);
    }
  }, [moderateContentMutation]);

  const submitReport = useCallback(async (report: Omit<UserReport, 'id'>) => {
    setIsLoading(true);
    try {
      const result = await submitReportMutation.mutateAsync(report);
      return result;
    } finally {
      setIsLoading(false);
    }
  }, [submitReportMutation]);

  const appealModeration = useCallback(async (params: {
    contentId: string;
    contentType: string;
    reason: string;
  }) => {
    setIsLoading(true);
    try {
      const success = await appealModerationMutation.mutateAsync(params);
      return success;
    } finally {
      setIsLoading(false);
    }
  }, [appealModerationMutation]);

  const resolveReport = useCallback(async (params: {
    reportId: string;
    resolution: string;
    action?: 'dismiss' | 'warn_user' | 'suspend_user' | 'ban_user' | 'remove_content';
  }) => {
    setIsLoading(true);
    try {
      const success = await resolveReportMutation.mutateAsync(params);
      return success;
    } finally {
      setIsLoading(false);
    }
  }, [resolveReportMutation]);

  const completeReview = useCallback(async (params: {
    queueItemId: string;
    decision: 'approved' | 'rejected' | 'escalated';
    reviewNotes?: string;
    escalationReason?: string;
  }) => {
    setIsLoading(true);
    try {
      const success = await completeReviewMutation.mutateAsync(params);
      return success;
    } finally {
      setIsLoading(false);
    }
  }, [completeReviewMutation]);

  return {
    // Mutations
    moderateContent,
    submitReport,
    appealModeration,
    resolveReport,
    completeReview,
    
    // Queries
    useReportsQuery,
    useQueueQuery,
    useStatisticsQuery,
    
    // Utilities
    getModerationStatus,
    
    // State
    isLoading: isLoading || 
               moderateContentMutation.isPending || 
               submitReportMutation.isPending || 
               appealModerationMutation.isPending ||
               resolveReportMutation.isPending ||
               completeReviewMutation.isPending,
    
    // Mutation states
    moderationError: moderateContentMutation.error,
    reportError: submitReportMutation.error,
    appealError: appealModerationMutation.error,
    resolveError: resolveReportMutation.error,
    reviewError: completeReviewMutation.error,
  };
};
