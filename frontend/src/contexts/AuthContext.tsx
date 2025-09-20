/**
 * Authentication Context
 * Provides authentication state and methods throughout the app
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase, auth } from '../lib/supabase';

interface Profile {
  id: string;
  userId: string;
  username: string;
  displayName: string;
  bio?: string;
  avatarUrl?: string;
  location?: string;
  websiteUrl?: string;
  preferredCigarStrength: string[];
  preferredBeerStyles: string[];
  preferredWineTypes: string[];
  profileVisibility: 'public' | 'friends' | 'private';
  showLocation: boolean;
  showRealName: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AuthContextType {
  // State
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  
  // Actions
  signUp: (email: string, password: string, username: string, displayName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state
  useEffect(() => {
    // Get initial session
    auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await loadProfile(session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error loading profile:', error);
        return;
      }

      if (data) {
        setProfile({
          id: data.id,
          userId: data.user_id,
          username: data.username,
          displayName: data.display_name,
          bio: data.bio,
          avatarUrl: data.avatar_url,
          location: data.location,
          websiteUrl: data.website_url,
          preferredCigarStrength: data.preferred_cigar_strength || [],
          preferredBeerStyles: data.preferred_beer_styles || [],
          preferredWineTypes: data.preferred_wine_types || [],
          profileVisibility: data.profile_visibility,
          showLocation: data.show_location,
          showRealName: data.show_real_name,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, username: string, displayName: string) => {
    try {
      setLoading(true);
      
      // Sign up with Supabase
      const { data, error } = await auth.signUp({ email, password });
      
      if (error) throw error;
      
      if (data.user) {
        // Create profile
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            user_id: data.user.id,
            username,
            display_name: displayName,
            profile_visibility: 'public',
          });
        
        if (profileError) throw profileError;
      }
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { error } = await auth.signIn(email, password);
      if (error) throw error;
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) throw new Error('No user logged in');
    
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('profiles')
        .update({
          username: updates.username,
          display_name: updates.displayName,
          bio: updates.bio,
          avatar_url: updates.avatarUrl,
          location: updates.location,
          website_url: updates.websiteUrl,
          preferred_cigar_strength: updates.preferredCigarStrength,
          preferred_beer_styles: updates.preferredBeerStyles,
          preferred_wine_types: updates.preferredWineTypes,
          profile_visibility: updates.profileVisibility,
          show_location: updates.showLocation,
          show_real_name: updates.showRealName,
        })
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      // Refresh profile
      await loadProfile(user.id);
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await loadProfile(user.id);
    }
  };

  const value: AuthContextType = {
    user,
    profile,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
    refreshProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
