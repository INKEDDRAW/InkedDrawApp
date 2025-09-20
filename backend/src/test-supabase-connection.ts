/**
 * Supabase Connection Test
 * Verifies database connectivity and schema setup
 */

import { supabase, supabaseAdmin } from '../supabase/config';

async function testSupabaseConnection() {
  console.log('🔍 Testing Supabase connection...\n');

  try {
    // Test 1: Basic connection
    console.log('1. Testing basic connection...');
    const { data, error } = await supabase
      .from('cigars')
      .select('count(*)')
      .limit(1);
    
    if (error) {
      console.error('❌ Connection failed:', error.message);
      return;
    }
    console.log('✅ Basic connection successful');

    // Test 2: Check new tables exist
    console.log('\n2. Checking new tables...');
    const tables = ['beers', 'wines', 'user_cigars', 'user_beers', 'user_wines'];
    
    for (const table of tables) {
      const { data: tableData, error: tableError } = await supabase
        .from(table)
        .select('count(*)')
        .limit(1);
      
      if (tableError) {
        console.error(`❌ Table ${table} not accessible:`, tableError.message);
      } else {
        console.log(`✅ Table ${table} exists and accessible`);
      }
    }

    // Test 3: Test admin connection
    console.log('\n3. Testing admin connection...');
    const { data: adminData, error: adminError } = await supabaseAdmin
      .from('cigars')
      .select('count(*)')
      .limit(1);
    
    if (adminError) {
      console.error('❌ Admin connection failed:', adminError.message);
    } else {
      console.log('✅ Admin connection successful');
    }

    // Test 4: Check vector extension
    console.log('\n4. Checking pgvector extension...');
    const { data: vectorData, error: vectorError } = await supabaseAdmin
      .rpc('sql', { 
        query: "SELECT extname FROM pg_extension WHERE extname = 'vector';" 
      });
    
    if (vectorError) {
      console.error('❌ Vector extension check failed:', vectorError.message);
    } else if (vectorData && vectorData.length > 0) {
      console.log('✅ pgvector extension is installed');
    } else {
      console.log('⚠️  pgvector extension not found');
    }

    console.log('\n🎉 Supabase setup verification complete!');
    
  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testSupabaseConnection();
}

export { testSupabaseConnection };
