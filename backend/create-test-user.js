async function createTestUser() {
  console.log('🔧 Creating test user for API testing...');
  
  try {
    const response = await fetch('http://localhost:3000/api/v1/auth/test-signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'test3@inkeddraw.com',
        password: 'testpassword123',
        name: 'Test User 3'
      })
    });
    
    console.log('Test signup status:', response.status);
    const data = await response.json();
    console.log('Test signup response:', data);
    
    if (response.ok) {
      console.log('✅ Test user created successfully!');
      
      // Now test the endpoints again
      console.log('\n🔄 Testing endpoints with the new user...');
      
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
        console.log('✅ Users endpoint working:', userData);
      } else {
        const errorText = await usersResponse.text();
        console.log('❌ Users endpoint still failing:', errorText);
      }
      
      // Test collections endpoint
      const collectionsResponse = await fetch('http://localhost:3000/api/v1/collections', {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      console.log('Collections endpoint status:', collectionsResponse.status);
      
      if (collectionsResponse.ok) {
        const collectionsData = await collectionsResponse.json();
        console.log('✅ Collections endpoint working:', collectionsData);
      } else {
        const errorText = await collectionsResponse.text();
        console.log('❌ Collections endpoint still failing:', errorText);
      }
      
      // Test cigar identification endpoint
      const cigarResponse = await fetch('http://localhost:3000/api/v1/scanner/identify-cigar', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + token }
      });
      console.log('Cigar identification status:', cigarResponse.status);
      
      if (cigarResponse.ok) {
        const cigarData = await cigarResponse.json();
        console.log('✅ Cigar identification working:', cigarData);
      } else {
        const errorText = await cigarResponse.text();
        console.log('❌ Cigar identification response:', errorText);
      }
      
    } else {
      console.log('❌ Failed to create test user');
    }
  } catch (error) {
    console.log('❌ Error creating test user:', error.message);
  }
}

createTestUser();
