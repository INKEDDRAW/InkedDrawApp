import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { SupabaseService } from '../supabase/supabase.service';
import { UsersService, User } from '../users/users.service';

export interface SignUpDto {
  email: string;
  password: string;
  name?: string;
}

export interface SignInDto {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: Omit<User, 'password'>;
  access_token: string;
  refresh_token: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async signUp(signUpDto: SignUpDto): Promise<AuthResponse> {
    const { email, password, name } = signUpDto;

    try {
      // Use the same approach as the working test method
      const authResult = await this.supabaseService.signUp(email, password, { name });

      if (!authResult.user) {
        throw new Error('No user returned from Supabase');
      }

      // Wait for trigger to create user profile
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Get the user profile that was created by the trigger
      const user = await this.usersService.findOne(authResult.user.id);
      if (!user) {
        throw new Error('User profile was not created');
      }

      // Generate JWT tokens
      const payload = { sub: authResult.user.id, email: authResult.user.email };
      const access_token = this.jwtService.sign(payload);
      const refresh_token = this.jwtService.sign(payload, { expiresIn: '30d' });

      return {
        user,
        access_token,
        refresh_token,
      };
    } catch (error) {
      throw new Error(`Failed to create user: ${error.message}`);
    }
  }

  async signIn(signInDto: SignInDto): Promise<AuthResponse> {
    const { email, password } = signInDto;

    try {
      // Sign in with Supabase Auth
      const authResult = await this.supabaseService.signIn(
        email,
        password
      );

      if (!authResult.user) {
        throw new UnauthorizedException('Invalid credentials');
      }

      // Get user from our users table using Supabase user ID
      const user = await this.usersService.findOne(authResult.user.id);
      if (!user) {
        throw new UnauthorizedException('User profile not found');
      }

      // Generate JWT tokens using Supabase user ID
      const payload = { sub: authResult.user.id, email: authResult.user.email };
      const access_token = this.jwtService.sign(payload);
      const refresh_token = this.jwtService.sign(payload, { expiresIn: '30d' });

      return {
        user,
        access_token,
        refresh_token,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid credentials');
    }
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    try {
      const authResult = await this.supabaseService.signIn(email, password);

      if (!authResult.user) {
        return null;
      }

      const user = await this.usersService.findByEmail(email);
      return user;
    } catch (error) {
      return null;
    }
  }

  async validateJwtPayload(payload: any): Promise<User> {
    const user = await this.usersService.findOne(payload.sub);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return user;
  }

  async testSupabaseConnection(): Promise<any> {
    try {
      // Test basic Supabase connection by querying the users table
      const client = this.supabaseService.getClient();
      const { data, error } = await client.from('users').select('count').limit(1);

      if (error) {
        throw new Error(`Supabase connection error: ${error.message}`);
      }

      return { connected: true, data };
    } catch (error) {
      throw new Error(`Failed to connect to Supabase: ${error.message}`);
    }
  }

  async testDirectSignup(email: string, password: string, name?: string): Promise<any> {
    try {
      console.log('Testing direct signup with:', { email, name });

      // Test direct Supabase auth signup
      const authResult = await this.supabaseService.signUp(email, password, { name });
      console.log('Auth result:', authResult);

      if (!authResult.user) {
        throw new Error('No user returned from Supabase');
      }

      return {
        success: true,
        user: authResult.user,
        session: authResult.session
      };
    } catch (error) {
      console.error('Direct signup error:', error);
      throw error;
    }
  }

  async generateTestToken(): Promise<string> {
    const testUserId = 'b921c284-8132-4e2e-8151-870f91164d78';
    const testEmail = 'test3@inkeddraw.com';

    // Check if test user exists in application database, create if not
    try {
      await this.usersService.findOne(testUserId);
    } catch (error) {
      // User doesn't exist, create them
      console.log('Creating test user in application database...');
      try {
        await this.usersService.create({
          id: testUserId,
          email: testEmail,
          name: 'Test User 3'
        });
        console.log('✅ Test user created successfully');
      } catch (createError) {
        console.log('⚠️ Could not create test user:', createError.message);
      }
    }

    // Create a test user payload for Vision API testing
    const testPayload = {
      sub: testUserId,
      email: testEmail
    };

    return this.jwtService.sign(testPayload, { expiresIn: '1h' });
  }
}
