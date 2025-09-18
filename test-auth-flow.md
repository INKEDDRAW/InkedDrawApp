# Authentication Flow Testing Guide

## Prerequisites

Before testing the authentication flow, you need to set up a real Supabase project:

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Get your project URL and anon key from the project settings
3. Update the `.env` file in the backend directory:

```env
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
JWT_SECRET=your-super-secret-jwt-key-change-in-production
```

4. Create the users table in Supabase:

```sql
-- Create users table
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to read their own data
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

-- Create policy to allow users to update their own data
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);
```

## Testing Steps

### 1. Start the Backend Server

```bash
cd backend
npm run start:dev
```

Verify the server is running by visiting: http://localhost:3000/api/docs

### 2. Start the React Native App

```bash
# In the main directory
npm start
# Then press 'a' for Android or 'i' for iOS
```

### 3. Test Sign Up Flow

1. Open the app
2. Tap "LAUNCH PLATFORM" (Sign Up)
3. Fill in the form:
   - Name: Test User
   - Email: test@example.com
   - Password: password123
   - Confirm Password: password123
4. Tap "CREATE ACCOUNT"
5. Verify:
   - Loading state appears
   - User is automatically signed in
   - App navigates to the main TabNavigator
   - User data is stored securely in Keychain

### 4. Test Sign Out Flow

1. Go to Profile tab
2. Find and tap "Sign Out" button (if implemented)
3. Verify:
   - User is signed out
   - App returns to onboarding screen
   - Tokens are cleared from Keychain

### 5. Test Sign In Flow

1. From onboarding screen, tap "ACCESS ACCOUNT" (Sign In)
2. Enter credentials:
   - Email: test@example.com
   - Password: password123
3. Tap "SIGN IN"
4. Verify:
   - Loading state appears
   - User is signed in
   - App navigates to main TabNavigator

### 6. Test Persistent Session

1. Close the app completely
2. Reopen the app
3. Verify:
   - App shows loading state briefly
   - User remains signed in
   - App goes directly to TabNavigator (not onboarding)

### 7. Test Error Handling

#### Invalid Credentials
1. Try signing in with wrong password
2. Verify error message is displayed

#### Network Error
1. Turn off internet connection
2. Try signing up/in
3. Verify appropriate error message

#### Validation Errors
1. Try signing up with invalid email
2. Try signing up with password too short
3. Try signing up with mismatched passwords
4. Verify validation messages appear

## Expected Results

✅ **Sign Up**: Creates user account, stores tokens, navigates to main app
✅ **Sign In**: Authenticates user, stores tokens, navigates to main app  
✅ **Persistent Session**: User stays logged in between app sessions
✅ **Sign Out**: Clears tokens, returns to onboarding
✅ **Error Handling**: Shows appropriate error messages
✅ **Loading States**: Shows loading indicators during API calls
✅ **Token Security**: Tokens stored securely in device Keychain

## Troubleshooting

### Backend Issues
- Check if Supabase credentials are correct
- Verify the users table exists in Supabase
- Check backend logs for errors

### Frontend Issues
- Verify react-native-keychain is properly installed
- Check if API_BASE_URL in AuthService.js is correct
- Look for console errors in React Native debugger

### Network Issues
- Ensure backend is running on port 3000
- Check if CORS is properly configured
- Verify device/emulator can reach localhost

## Manual API Testing

You can also test the API endpoints directly:

### Sign Up
```bash
curl -X POST http://localhost:3000/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "Test User"
  }'
```

### Sign In
```bash
curl -X POST http://localhost:3000/api/v1/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### Test Protected Endpoint
```bash
curl -X GET http://localhost:3000/api/v1/users \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```
