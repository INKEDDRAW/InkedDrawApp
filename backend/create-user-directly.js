// This script will create the test user directly in the database
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function createUserDirectly() {
  console.log('🔧 Creating test user directly in Supabase...');

  // Initialize Supabase client with service role key for admin operations
  const supabaseUrl = 'https://gyhpbpfxollqcomxgrqb.supabase.co';
  const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5aHBicGZ4b2xscWNvbXhncnFiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjkwNjcxOCwiZXhwIjoyMDY4NDgyNzE4fQ.wL7x5lEY1crw1YHNpgoz02QEf7pS8NQy4SKeLyPC5x4';
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  const testUser = {
    id: 'b921c284-8132-4e2e-8151-870f91164d78',
    email: 'test3@inkeddraw.com',
    name: 'Test User 3',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  try {
    // First, check if user already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('*')
      .eq('id', testUser.id)
      .single();
    
    if (existingUser) {
      console.log('✅ User already exists:', existingUser);
      return existingUser;
    }
    
    // User doesn't exist, create them
    console.log('Creating user with data:', testUser);
    
    const { data, error } = await supabase
      .from('users')
      .insert([testUser])
      .select();
    
    if (error) {
      console.log('❌ Error creating user:', error);
      return null;
    }
    
    console.log('✅ User created successfully:', data[0]);
    
    // Now test the API endpoints
    console.log('\n🧪 Testing API endpoints with the new user...');
    
    const tokenResponse = await fetch('http://localhost:3000/api/v1/auth/test-token');
    const tokenData = await tokenResponse.json();
    const token = tokenData.access_token;
    
    // Test users endpoint
    const usersResponse = await fetch('http://localhost:3000/api/v1/users', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    
    console.log('Users endpoint status:', usersResponse.status);
    if (usersResponse.ok) {
      const userData = await usersResponse.json();
      console.log('✅ Users endpoint now working:', userData);
    } else {
      const errorText = await usersResponse.text();
      console.log('❌ Users endpoint still failing:', errorText);
    }
    
    return data[0];
    
  } catch (error) {
    console.log('❌ Unexpected error:', error.message);
    return null;
  }
}

createUserDirectly();
