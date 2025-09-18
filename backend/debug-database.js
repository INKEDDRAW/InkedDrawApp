require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function debugDatabase() {
  console.log('🔍 Debugging database connection and user lookup...');
  
  const supabaseUrl = 'https://gyhpbpfxollqcomxgrqb.supabase.co';
  const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5aHBicGZ4b2xscWNvbXhncnFiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjkwNjcxOCwiZXhwIjoyMDY4NDgyNzE4fQ.wL7x5lEY1crw1YHNpgoz02QEf7pS8NQy4SKeLyPC5x4';
  const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5aHBicGZ4b2xscWNvbXhncnFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5MDY3MTgsImV4cCI6MjA2ODQ4MjcxOH0.-Xy4lZOKjtS6Es6IU21HzJg_BoT-XcDejaFYZPHZd5E';
  
  const testUserId = 'b921c284-8132-4e2e-8151-870f91164d78';
  
  // Test 1: Service role access (should bypass RLS)
  console.log('\n1. Testing with service role key (bypasses RLS)...');
  const supabaseService = createClient(supabaseUrl, supabaseServiceKey);
  
  try {
    const { data, error } = await supabaseService
      .from('users')
      .select('*')
      .eq('id', testUserId)
      .single();
    
    if (error) {
      console.log('❌ Service role error:', error);
    } else {
      console.log('✅ Service role found user:', data);
    }
  } catch (error) {
    console.log('❌ Service role exception:', error.message);
  }
  
  // Test 2: Anonymous access (subject to RLS)
  console.log('\n2. Testing with anon key (subject to RLS)...');
  const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);
  
  try {
    const { data, error } = await supabaseAnon
      .from('users')
      .select('*')
      .eq('id', testUserId)
      .single();
    
    if (error) {
      console.log('❌ Anon access error:', error);
    } else {
      console.log('✅ Anon access found user:', data);
    }
  } catch (error) {
    console.log('❌ Anon access exception:', error.message);
  }
  
  // Test 3: Authenticated access (simulate JWT)
  console.log('\n3. Testing with authenticated user context...');
  
  // Get a JWT token first
  try {
    const tokenResponse = await fetch('http://localhost:3000/api/v1/auth/test-token');
    const tokenData = await tokenResponse.json();
    const jwt = tokenData.access_token;
    
    console.log('JWT token obtained:', jwt.substring(0, 30) + '...');
    
    // Create client with JWT
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${jwt}`
        }
      }
    });
    
    const { data, error } = await supabaseAuth
      .from('users')
      .select('*')
      .eq('id', testUserId)
      .single();
    
    if (error) {
      console.log('❌ Authenticated access error:', error);
    } else {
      console.log('✅ Authenticated access found user:', data);
    }
    
  } catch (error) {
    console.log('❌ Authenticated access exception:', error.message);
  }
  
  // Test 4: Check what the API endpoint is actually doing
  console.log('\n4. Testing the actual API endpoint...');
  try {
    const tokenResponse = await fetch('http://localhost:3000/api/v1/auth/test-token');
    const tokenData = await tokenResponse.json();
    const token = tokenData.access_token;
    
    const userResponse = await fetch('http://localhost:3000/api/v1/users', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    
    console.log('API response status:', userResponse.status);
    const responseText = await userResponse.text();
    console.log('API response body:', responseText);
    
  } catch (error) {
    console.log('❌ API test error:', error.message);
  }
}

debugDatabase();
