/**
 * Authentication Test Script
 * Tests the authentication flow end-to-end
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AuthService } from './auth/auth.service';

async function testAuthentication() {
  console.log('🔐 Testing Authentication System...\n');

  try {
    // Create NestJS application
    const app = await NestFactory.createApplicationContext(AppModule);
    const authService = app.get(AuthService);

    // Test data
    const testUser = {
      email: 'test@inked-draw.com',
      password: 'TestPassword123!',
      username: 'test_user',
      displayName: 'Test User',
    };

    console.log('1. Testing user registration...');
    try {
      const signUpResult = await authService.signUp(testUser);
      console.log('✅ User registration successful');
      console.log('   User ID:', signUpResult.user.id);
      console.log('   Username:', signUpResult.user.username);
      console.log('   Access Token:', signUpResult.accessToken ? 'Generated' : 'Missing');
    } catch (error: any) {
      if (error.message.includes('already')) {
        console.log('⚠️  User already exists, continuing with sign in test...');
      } else {
        console.error('❌ Registration failed:', error.message);
        return;
      }
    }

    console.log('\n2. Testing user sign in...');
    try {
      const signInResult = await authService.signIn({
        email: testUser.email,
        password: testUser.password,
      });
      console.log('✅ User sign in successful');
      console.log('   User ID:', signInResult.user.id);
      console.log('   Username:', signInResult.user.username);
      console.log('   Display Name:', signInResult.user.displayName);
      console.log('   Access Token:', signInResult.accessToken ? 'Generated' : 'Missing');

      // Test profile retrieval
      console.log('\n3. Testing profile retrieval...');
      const profile = await authService.getProfile(signInResult.user.id);
      console.log('✅ Profile retrieval successful');
      console.log('   Profile ID:', profile.id);
      console.log('   Username:', profile.username);
      console.log('   Display Name:', profile.displayName);
      console.log('   Profile Visibility:', profile.profileVisibility);

      // Test profile update
      console.log('\n4. Testing profile update...');
      const updatedProfile = await authService.updateProfile(signInResult.user.id, {
        bio: 'Updated bio for testing',
        preferredCigarStrength: ['medium', 'full'],
        preferredBeerStyles: ['IPA', 'Stout'],
        preferredWineTypes: ['Cabernet Sauvignon', 'Chardonnay'],
      });
      console.log('✅ Profile update successful');
      console.log('   Bio:', updatedProfile.bio);
      console.log('   Cigar Preferences:', updatedProfile.preferredCigarStrength);
      console.log('   Beer Preferences:', updatedProfile.preferredBeerStyles);
      console.log('   Wine Preferences:', updatedProfile.preferredWineTypes);

    } catch (error: any) {
      console.error('❌ Sign in failed:', error.message);
    }

    console.log('\n🎉 Authentication system test completed!');
    await app.close();

  } catch (error) {
    console.error('💥 Test failed:', error);
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testAuthentication();
}

export { testAuthentication };
