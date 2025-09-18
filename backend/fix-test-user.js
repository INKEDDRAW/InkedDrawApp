async function fixTestUser() {
  console.log('🔧 Creating test user in application database...');
  
  try {
    // Create the user in the application's users table
    const response = await fetch('http://localhost:3000/api/v1/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        id: 'b921c284-8132-4e2e-8151-870f91164d78',
        email: 'test3@inkeddraw.com',
        name: 'Test User 3'
      })
    });
    
    console.log('Create user status:', response.status);
    
    if (response.ok) {
      const userData = await response.json();
      console.log('✅ User created in application database:', userData);
    } else {
      const errorText = await response.text();
      console.log('❌ Failed to create user:', errorText);
      
      // Maybe the user already exists, let's try to get the token and test
      console.log('\n🔄 Testing with existing setup...');
    }
    
    // Now test all endpoints with the JWT token
    console.log('\n🧪 Testing all API endpoints...');
    
    const tokenResponse = await fetch('http://localhost:3000/api/v1/auth/test-token');
    const tokenData = await tokenResponse.json();
    const token = tokenData.access_token;
    console.log('Token obtained:', token.substring(0, 30) + '...');
    
    // Test users endpoint
    console.log('\n1. Testing users endpoint...');
    const usersResponse = await fetch('http://localhost:3000/api/v1/users', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    console.log('Users status:', usersResponse.status);
    if (usersResponse.ok) {
      const data = await usersResponse.json();
      console.log('✅ Users working:', data);
    } else {
      const errorText = await usersResponse.text();
      console.log('❌ Users error:', errorText);
    }
    
    // Test collections endpoint
    console.log('\n2. Testing collections endpoint...');
    const collectionsResponse = await fetch('http://localhost:3000/api/v1/collections', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    console.log('Collections status:', collectionsResponse.status);
    if (collectionsResponse.ok) {
      const data = await collectionsResponse.json();
      console.log('✅ Collections working:', data);
    } else {
      const errorText = await collectionsResponse.text();
      console.log('❌ Collections error:', errorText);
    }
    
    // Test social feed endpoint
    console.log('\n3. Testing social feed endpoint...');
    const socialResponse = await fetch('http://localhost:3000/api/v1/social/feed', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    console.log('Social feed status:', socialResponse.status);
    if (socialResponse.ok) {
      const data = await socialResponse.json();
      console.log('✅ Social feed working:', data);
    } else {
      const errorText = await socialResponse.text();
      console.log('❌ Social feed error:', errorText);
    }
    
    // Test cigar identification endpoint
    console.log('\n4. Testing cigar identification endpoint...');
    const cigarResponse = await fetch('http://localhost:3000/api/v1/scanner/identify-cigar', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + token }
    });
    console.log('Cigar identification status:', cigarResponse.status);
    if (cigarResponse.ok) {
      const data = await cigarResponse.json();
      console.log('✅ Cigar identification working:', data);
    } else {
      const errorText = await cigarResponse.text();
      console.log('❌ Cigar identification error:', errorText);
    }
    
    console.log('\n🎉 API testing complete!');
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

fixTestUser();
