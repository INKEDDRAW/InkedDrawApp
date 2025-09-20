#!/bin/bash

# Database Migration Runner
# Runs all Supabase migrations and verifies schema integrity

set -e

echo "🚀 Starting Database Migration Process..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Please install it first:"
    echo "   npm install -g supabase"
    exit 1
fi

# Check if we're in the correct directory
if [ ! -f "supabase/config.toml" ]; then
    echo "❌ supabase/config.toml not found. Please run from project root."
    exit 1
fi

echo "📋 Checking Supabase project status..."
supabase status

echo "🔄 Running database migrations..."
supabase db push

echo "🌱 Seeding database with initial data..."
if [ -f "supabase/seed.sql" ]; then
    supabase db reset --linked
else
    echo "⚠️  No seed.sql found, skipping seeding"
fi

echo "🔍 Verifying migration status..."
supabase migration list

echo "📊 Checking database schema..."
supabase db diff --schema public

echo "✅ Database migrations completed successfully!"

# Run database tests if available
if [ -f "backend/src/testing/database-migration.test.ts" ]; then
    echo "🧪 Running database migration tests..."
    cd backend
    npm run test -- --testPathPattern=database-migration.test.ts
    cd ..
fi

echo "🎉 All database operations completed successfully!"
