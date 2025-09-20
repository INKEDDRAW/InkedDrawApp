/**
 * Authentication Service
 * Handles user authentication, registration, and profile management
 */

import { Injectable, Logger, UnauthorizedException, ConflictException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { supabaseAdmin } from '../../supabase/config';
import { DatabaseService } from '../database/database.service';
import { SignUpDto, SignInDto, UpdateProfileDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly databaseService: DatabaseService,
  ) {}

  /**
   * Register a new user
   */
  async signUp(signUpDto: SignUpDto) {
    const { email, password, username, displayName } = signUpDto;

    try {
      // Check if username is already taken
      const existingProfile = await this.databaseService.client
        .from('profiles')
        .select('username')
        .eq('username', username)
        .single();

      if (existingProfile.data) {
        throw new ConflictException('Username is already taken');
      }

      // Create user in Supabase Auth
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Auto-confirm for development
      });

      if (authError) {
        this.logger.error('Supabase auth error:', authError);
        throw new ConflictException(authError.message);
      }

      if (!authData.user) {
        throw new ConflictException('Failed to create user');
      }

      // Create user record in our database
      const userData = {
        id: authData.user.id,
        email: authData.user.email!,
        subscription_tier: 'free' as const,
      };

      await this.databaseService.create('users', userData);

      // Create user profile
      const profileData = {
        user_id: authData.user.id,
        username,
        display_name: displayName,
        profile_visibility: 'public' as const,
      };

      const profile = await this.databaseService.create('profiles', profileData);

      // Generate JWT token
      const payload = { 
        sub: authData.user.id, 
        email: authData.user.email,
        username: profile.username,
      };
      const accessToken = this.jwtService.sign(payload);

      return {
        user: {
          id: authData.user.id,
          email: authData.user.email,
          username: profile.username,
          displayName: profile.display_name,
        },
        accessToken,
      };

    } catch (error) {
      this.logger.error('Sign up error:', error);
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new ConflictException('Failed to create account');
    }
  }

  /**
   * Sign in existing user
   */
  async signIn(signInDto: SignInDto) {
    const { email, password } = signInDto;

    try {
      // Authenticate with Supabase
      const { data: authData, error: authError } = await supabaseAdmin.auth.signInWithPassword({
        email,
        password,
      });

      if (authError || !authData.user) {
        throw new UnauthorizedException('Invalid credentials');
      }

      // Get user profile
      const profile = await this.databaseService.client
        .from('profiles')
        .select('*')
        .eq('user_id', authData.user.id)
        .single();

      if (profile.error || !profile.data) {
        throw new NotFoundException('User profile not found');
      }

      // Update last seen
      await this.databaseService.update('users', authData.user.id, {
        last_seen_at: new Date().toISOString(),
      });

      // Generate JWT token
      const payload = { 
        sub: authData.user.id, 
        email: authData.user.email,
        username: profile.data.username,
      };
      const accessToken = this.jwtService.sign(payload);

      return {
        user: {
          id: authData.user.id,
          email: authData.user.email,
          username: profile.data.username,
          displayName: profile.data.display_name,
          avatarUrl: profile.data.avatar_url,
          bio: profile.data.bio,
          subscriptionTier: (await this.databaseService.findById('users', authData.user.id)).subscription_tier,
        },
        accessToken,
      };

    } catch (error) {
      this.logger.error('Sign in error:', error);
      if (error instanceof UnauthorizedException || error instanceof NotFoundException) {
        throw error;
      }
      throw new UnauthorizedException('Authentication failed');
    }
  }

  /**
   * Get user profile by ID
   */
  async getProfile(userId: string) {
    try {
      const { data: profile, error } = await this.databaseService.client
        .from('profiles')
        .select(`
          *,
          users (
            email,
            subscription_tier,
            created_at,
            last_seen_at
          )
        `)
        .eq('user_id', userId)
        .single();

      if (error || !profile) {
        throw new NotFoundException('Profile not found');
      }

      return {
        id: profile.id,
        userId: profile.user_id,
        username: profile.username,
        displayName: profile.display_name,
        bio: profile.bio,
        avatarUrl: profile.avatar_url,
        location: profile.location,
        websiteUrl: profile.website_url,
        preferredCigarStrength: profile.preferred_cigar_strength,
        preferredBeerStyles: profile.preferred_beer_styles,
        preferredWineTypes: profile.preferred_wine_types,
        profileVisibility: profile.profile_visibility,
        showLocation: profile.show_location,
        showRealName: profile.show_real_name,
        createdAt: profile.created_at,
        updatedAt: profile.updated_at,
        user: profile.users,
      };

    } catch (error) {
      this.logger.error('Get profile error:', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new NotFoundException('Failed to fetch profile');
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto) {
    try {
      // Check if username is taken (if being updated)
      if (updateProfileDto.username) {
        const existingProfile = await this.databaseService.client
          .from('profiles')
          .select('user_id')
          .eq('username', updateProfileDto.username)
          .neq('user_id', userId)
          .single();

        if (existingProfile.data) {
          throw new ConflictException('Username is already taken');
        }
      }

      // Update profile
      const updatedProfile = await this.databaseService.client
        .from('profiles')
        .update({
          username: updateProfileDto.username,
          display_name: updateProfileDto.displayName,
          bio: updateProfileDto.bio,
          avatar_url: updateProfileDto.avatarUrl,
          location: updateProfileDto.location,
          website_url: updateProfileDto.websiteUrl,
          preferred_cigar_strength: updateProfileDto.preferredCigarStrength,
          preferred_beer_styles: updateProfileDto.preferredBeerStyles,
          preferred_wine_types: updateProfileDto.preferredWineTypes,
          profile_visibility: updateProfileDto.profileVisibility,
          show_location: updateProfileDto.showLocation,
          show_real_name: updateProfileDto.showRealName,
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (updatedProfile.error) {
        throw new ConflictException('Failed to update profile');
      }

      return this.getProfile(userId);

    } catch (error) {
      this.logger.error('Update profile error:', error);
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new ConflictException('Failed to update profile');
    }
  }

  /**
   * Validate JWT payload
   */
  async validateUser(payload: any) {
    const { sub: userId } = payload;
    
    try {
      const user = await this.databaseService.findById('users', userId);
      if (!user || !user.is_active) {
        return null;
      }

      return {
        id: user.id,
        email: user.email,
        subscriptionTier: user.subscription_tier,
      };
    } catch (error) {
      this.logger.error('Validate user error:', error);
      return null;
    }
  }

  /**
   * Sign out user (invalidate session)
   */
  async signOut(userId: string) {
    try {
      // Sign out from Supabase
      await supabaseAdmin.auth.admin.signOut(userId);
      
      // Update last seen
      await this.databaseService.update('users', userId, {
        last_seen_at: new Date().toISOString(),
      });

      return { message: 'Successfully signed out' };
    } catch (error) {
      this.logger.error('Sign out error:', error);
      throw new UnauthorizedException('Failed to sign out');
    }
  }
}
