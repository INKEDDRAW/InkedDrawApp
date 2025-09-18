async function debugToken() {
  console.log('🔍 Debugging token generation...');
  
  // First, let's see what happens when we call the token endpoint multiple times
  for (let i = 1; i <= 3; i++) {
    console.log(`\n--- Attempt ${i} ---`);
    try {
      const response = await fetch('http://localhost:3000/api/v1/auth/test-token');
      const data = await response.json();
      console.log(`Token generated: ${data.access_token.substring(0, 30)}...`);
      
      // Immediately test if user exists
      const userResponse = await fetch('http://localhost:3000/api/v1/users', {
        headers: { 'Authorization': 'Bearer ' + data.access_token }
      });
      console.log(`User lookup status: ${userResponse.status}`);
      
      if (!userResponse.ok) {
        const errorText = await userResponse.text();
        console.log(`Error: ${errorText}`);
      }
      
    } catch (error) {
      console.log(`Error in attempt ${i}:`, error.message);
    }
  }
  
  console.log('\n🔍 Let\'s also check what the server logs show...');
  console.log('Check the server terminal for any console.log messages about user creation.');
}

debugToken();
