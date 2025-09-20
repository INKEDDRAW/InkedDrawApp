/**
 * Age Verification Context
 * Manages age verification state and processes
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';

interface VerificationStatus {
  isVerified: boolean;
  status: 'pending' | 'approved' | 'rejected' | 'expired' | null;
  verificationId?: string;
  sessionId?: string;
  age?: number;
  verifiedAt?: string;
  expiresAt?: string;
  canStartVerification: boolean;
  attemptsRemaining: number;
  documentType?: string;
  nationality?: string;
}

interface VerificationHistory {
  id: string;
  sessionId: string;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  verificationMethod: 'veriff' | 'manual';
  age?: number;
  verifiedAt?: string;
  createdAt: string;
  attempts: number;
}

interface StartVerificationResponse {
  verificationId: string;
  sessionId: string;
  verificationUrl: string;
  status: string;
  expiresAt: string;
  attemptsRemaining: number;
}

interface AgeVerificationContextType {
  // State
  verificationStatus: VerificationStatus | null;
  verificationHistory: VerificationHistory[];
  loading: boolean;
  
  // Actions
  startVerification: (callbackUrl?: string) => Promise<StartVerificationResponse>;
  refreshStatus: () => Promise<void>;
  loadHistory: () => Promise<void>;
  checkVerificationRequired: () => boolean;
}

const AgeVerificationContext = createContext<AgeVerificationContextType | undefined>(undefined);

interface AgeVerificationProviderProps {
  children: ReactNode;
}

export const AgeVerificationProvider: React.FC<AgeVerificationProviderProps> = ({ children }) => {
  const { user, session } = useAuth();
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus | null>(null);
  const [verificationHistory, setVerificationHistory] = useState<VerificationHistory[]>([]);
  const [loading, setLoading] = useState(false);

  // Load verification status when user changes
  useEffect(() => {
    if (user && session) {
      refreshStatus();
    } else {
      setVerificationStatus(null);
      setVerificationHistory([]);
    }
  }, [user, session]);

  const refreshStatus = async () => {
    if (!session?.access_token) return;

    try {
      setLoading(true);
      
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/age-verification/status`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch verification status');
      }

      const status = await response.json();
      setVerificationStatus(status);
    } catch (error) {
      console.error('Error fetching verification status:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    if (!session?.access_token) return;

    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/age-verification/history`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch verification history');
      }

      const history = await response.json();
      setVerificationHistory(history);
    } catch (error) {
      console.error('Error fetching verification history:', error);
    }
  };

  const startVerification = async (callbackUrl?: string): Promise<StartVerificationResponse> => {
    if (!session?.access_token) {
      throw new Error('User not authenticated');
    }

    try {
      setLoading(true);
      
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/age-verification/start`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          callbackUrl,
          language: 'en',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to start verification');
      }

      const result = await response.json();
      
      // Refresh status after starting verification
      await refreshStatus();
      
      return result;
    } catch (error) {
      console.error('Error starting verification:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const checkVerificationRequired = (): boolean => {
    // Age verification is required for accessing alcohol and tobacco content
    return true; // Always required for this app
  };

  const value: AgeVerificationContextType = {
    verificationStatus,
    verificationHistory,
    loading,
    startVerification,
    refreshStatus,
    loadHistory,
    checkVerificationRequired,
  };

  return (
    <AgeVerificationContext.Provider value={value}>
      {children}
    </AgeVerificationContext.Provider>
  );
};

export const useAgeVerification = (): AgeVerificationContextType => {
  const context = useContext(AgeVerificationContext);
  if (context === undefined) {
    throw new Error('useAgeVerification must be used within an AgeVerificationProvider');
  }
  return context;
};
