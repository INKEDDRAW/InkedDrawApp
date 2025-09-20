/**
 * Database Migration Tests
 * Verify database schema integrity and migration success
 */

import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseService } from '../database/database.service';
import { DatabaseModule } from '../database/database.module';

describe('Database Migration Tests', () => {
  let databaseService: DatabaseService;
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [DatabaseModule],
    }).compile();

    databaseService = module.get<DatabaseService>(DatabaseService);
  });

  afterAll(async () => {
    await module.close();
  });

  describe('Core Tables', () => {
    it('should have users table with correct schema', async () => {
      const result = await databaseService.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = 'users' AND table_schema = 'public'
        ORDER BY ordinal_position
      `);

      const expectedColumns = [
        'id', 'email', 'password_hash', 'display_name', 'created_at', 'updated_at'
      ];

      const actualColumns = result.map(row => row.column_name);
      expectedColumns.forEach(col => {
        expect(actualColumns).toContain(col);
      });
    });

    it('should have profiles table with correct schema', async () => {
      const result = await databaseService.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'profiles' AND table_schema = 'public'
        ORDER BY ordinal_position
      `);

      const expectedColumns = [
        'id', 'user_id', 'username', 'display_name', 'bio', 'avatar_url', 'location'
      ];

      const actualColumns = result.map(row => row.column_name);
      expectedColumns.forEach(col => {
        expect(actualColumns).toContain(col);
      });
    });

    it('should have posts table with correct schema', async () => {
      const result = await databaseService.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'posts' AND table_schema = 'public'
        ORDER BY ordinal_position
      `);

      const expectedColumns = [
        'id', 'user_id', 'content', 'product_id', 'product_type', 'image_urls', 'tags'
      ];

      const actualColumns = result.map(row => row.column_name);
      expectedColumns.forEach(col => {
        expect(actualColumns).toContain(col);
      });
    });
  });

  describe('Product Catalog Tables', () => {
    it('should have cigars table with correct schema', async () => {
      const result = await databaseService.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'cigars' AND table_schema = 'public'
        ORDER BY ordinal_position
      `);

      const expectedColumns = [
        'id', 'name', 'brand', 'origin_country', 'wrapper_type', 'strength', 'size_name'
      ];

      const actualColumns = result.map(row => row.column_name);
      expectedColumns.forEach(col => {
        expect(actualColumns).toContain(col);
      });
    });

    it('should have beers table with correct schema', async () => {
      const result = await databaseService.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'beers' AND table_schema = 'public'
        ORDER BY ordinal_position
      `);

      const expectedColumns = [
        'id', 'name', 'brewery', 'style', 'abv', 'ibu', 'description'
      ];

      const actualColumns = result.map(row => row.column_name);
      expectedColumns.forEach(col => {
        expect(actualColumns).toContain(col);
      });
    });

    it('should have wines table with correct schema', async () => {
      const result = await databaseService.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'wines' AND table_schema = 'public'
        ORDER BY ordinal_position
      `);

      const expectedColumns = [
        'id', 'name', 'winery', 'region', 'vintage', 'varietal', 'wine_type'
      ];

      const actualColumns = result.map(row => row.column_name);
      expectedColumns.forEach(col => {
        expect(actualColumns).toContain(col);
      });
    });
  });

  describe('Vision & Location Tables', () => {
    it('should have smoke_shops table with correct schema', async () => {
      const result = await databaseService.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'smoke_shops' AND table_schema = 'public'
        ORDER BY ordinal_position
      `);

      const expectedColumns = [
        'id', 'name', 'address', 'city', 'state', 'latitude', 'longitude'
      ];

      const actualColumns = result.map(row => row.column_name);
      expectedColumns.forEach(col => {
        expect(actualColumns).toContain(col);
      });
    });

    it('should have shop_inventory table with correct schema', async () => {
      const result = await databaseService.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'shop_inventory' AND table_schema = 'public'
        ORDER BY ordinal_position
      `);

      const expectedColumns = [
        'id', 'shop_id', 'product_id', 'product_type', 'brand', 'name', 'in_stock'
      ];

      const actualColumns = result.map(row => row.column_name);
      expectedColumns.forEach(col => {
        expect(actualColumns).toContain(col);
      });
    });

    it('should have vision_analysis_results table with correct schema', async () => {
      const result = await databaseService.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'vision_analysis_results' AND table_schema = 'public'
        ORDER BY ordinal_position
      `);

      const expectedColumns = [
        'id', 'user_id', 'image_url', 'analysis_type', 'recognized_brand', 'recognition_confidence'
      ];

      const actualColumns = result.map(row => row.column_name);
      expectedColumns.forEach(col => {
        expect(actualColumns).toContain(col);
      });
    });
  });

  describe('Indexes and Constraints', () => {
    it('should have proper indexes on frequently queried columns', async () => {
      const indexes = await databaseService.query(`
        SELECT indexname, tablename, indexdef
        FROM pg_indexes
        WHERE schemaname = 'public'
        AND indexname NOT LIKE '%_pkey'
        ORDER BY tablename, indexname
      `);

      // Check for important indexes
      const indexNames = indexes.map(idx => idx.indexname);
      
      // Social features indexes
      expect(indexNames.some(name => name.includes('posts') && name.includes('user_id'))).toBe(true);
      expect(indexNames.some(name => name.includes('posts') && name.includes('created_at'))).toBe(true);
      
      // Location indexes
      expect(indexNames.some(name => name.includes('smoke_shops') && name.includes('location'))).toBe(true);
      
      // Product search indexes
      expect(indexNames.some(name => name.includes('cigars') && name.includes('brand'))).toBe(true);
    });

    it('should have proper foreign key constraints', async () => {
      const constraints = await databaseService.query(`
        SELECT
          tc.constraint_name,
          tc.table_name,
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_schema = 'public'
        ORDER BY tc.table_name, tc.constraint_name
      `);

      // Check for important foreign keys
      const fkRelations = constraints.map(fk => 
        `${fk.table_name}.${fk.column_name} -> ${fk.foreign_table_name}.${fk.foreign_column_name}`
      );

      expect(fkRelations).toContain('profiles.user_id -> users.id');
      expect(fkRelations).toContain('posts.user_id -> users.id');
      expect(fkRelations).toContain('shop_inventory.shop_id -> smoke_shops.id');
    });

    it('should have proper unique constraints', async () => {
      const constraints = await databaseService.query(`
        SELECT
          tc.constraint_name,
          tc.table_name,
          kcu.column_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        WHERE tc.constraint_type = 'UNIQUE'
          AND tc.table_schema = 'public'
        ORDER BY tc.table_name, tc.constraint_name
      `);

      const uniqueConstraints = constraints.map(uc => 
        `${uc.table_name}.${uc.column_name}`
      );

      expect(uniqueConstraints).toContain('users.email');
      expect(uniqueConstraints).toContain('profiles.username');
    });
  });

  describe('Row Level Security', () => {
    it('should have RLS enabled on sensitive tables', async () => {
      const rlsTables = await databaseService.query(`
        SELECT tablename, rowsecurity
        FROM pg_tables
        WHERE schemaname = 'public'
          AND rowsecurity = true
        ORDER BY tablename
      `);

      const rlsTableNames = rlsTables.map(table => table.tablename);

      // Check that RLS is enabled on important tables
      expect(rlsTableNames).toContain('posts');
      expect(rlsTableNames).toContain('profiles');
      expect(rlsTableNames).toContain('user_cigars');
      expect(rlsTableNames).toContain('vision_analysis_results');
    });

    it('should have proper RLS policies', async () => {
      const policies = await databaseService.query(`
        SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
        FROM pg_policies
        WHERE schemaname = 'public'
        ORDER BY tablename, policyname
      `);

      // Check that important policies exist
      const policyNames = policies.map(p => `${p.tablename}.${p.policyname}`);
      
      expect(policies.length).toBeGreaterThan(0);
      expect(policyNames.some(name => name.includes('posts'))).toBe(true);
      expect(policyNames.some(name => name.includes('profiles'))).toBe(true);
    });
  });

  describe('Data Integrity', () => {
    it('should have proper check constraints', async () => {
      const checkConstraints = await databaseService.query(`
        SELECT
          tc.constraint_name,
          tc.table_name,
          cc.check_clause
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.check_constraints AS cc
          ON tc.constraint_name = cc.constraint_name
        WHERE tc.constraint_type = 'CHECK'
          AND tc.table_schema = 'public'
        ORDER BY tc.table_name, tc.constraint_name
      `);

      // Check for important constraints
      const constraints = checkConstraints.map(cc => 
        `${cc.table_name}: ${cc.check_clause}`
      );

      // Should have strength constraints on cigars
      expect(constraints.some(c => 
        c.includes('cigars') && c.includes('strength')
      )).toBe(true);

      // Should have coordinate constraints on smoke_shops
      expect(constraints.some(c => 
        c.includes('smoke_shops') && (c.includes('latitude') || c.includes('longitude'))
      )).toBe(true);
    });

    it('should have proper default values', async () => {
      const defaults = await databaseService.query(`
        SELECT table_name, column_name, column_default
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND column_default IS NOT NULL
          AND column_default != ''
        ORDER BY table_name, column_name
      `);

      // Check for important defaults
      const defaultValues = defaults.map(d => 
        `${d.table_name}.${d.column_name}: ${d.column_default}`
      );

      // Should have UUID defaults
      expect(defaultValues.some(d => d.includes('uuid_generate_v4()'))).toBe(true);
      
      // Should have timestamp defaults
      expect(defaultValues.some(d => d.includes('now()'))).toBe(true);
    });
  });

  describe('Performance Optimization', () => {
    it('should have proper table statistics', async () => {
      const stats = await databaseService.query(`
        SELECT
          schemaname,
          tablename,
          n_tup_ins,
          n_tup_upd,
          n_tup_del,
          n_live_tup,
          n_dead_tup
        FROM pg_stat_user_tables
        WHERE schemaname = 'public'
        ORDER BY tablename
      `);

      expect(stats.length).toBeGreaterThan(0);
      
      // Tables should exist in statistics
      const tableNames = stats.map(s => s.tablename);
      expect(tableNames).toContain('users');
      expect(tableNames).toContain('posts');
      expect(tableNames).toContain('cigars');
    });

    it('should have reasonable table sizes', async () => {
      const sizes = await databaseService.query(`
        SELECT
          schemaname,
          tablename,
          pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
          pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
        FROM pg_tables
        WHERE schemaname = 'public'
        ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
      `);

      expect(sizes.length).toBeGreaterThan(0);
      
      // No table should be excessively large in test environment
      sizes.forEach(size => {
        expect(size.size_bytes).toBeLessThan(100 * 1024 * 1024); // 100MB limit
      });
    });
  });

  describe('Extensions and Functions', () => {
    it('should have required PostgreSQL extensions', async () => {
      const extensions = await databaseService.query(`
        SELECT extname, extversion
        FROM pg_extension
        ORDER BY extname
      `);

      const extensionNames = extensions.map(ext => ext.extname);
      
      // Should have UUID extension
      expect(extensionNames).toContain('uuid-ossp');
      
      // Should have PostGIS for location features
      expect(extensionNames).toContain('postgis');
    });

    it('should have required custom functions', async () => {
      const functions = await databaseService.query(`
        SELECT routine_name, routine_type
        FROM information_schema.routines
        WHERE routine_schema = 'public'
          AND routine_type = 'FUNCTION'
        ORDER BY routine_name
      `);

      const functionNames = functions.map(f => f.routine_name);
      
      // Should have update timestamp function
      expect(functionNames).toContain('update_updated_at_column');
    });
  });
});
