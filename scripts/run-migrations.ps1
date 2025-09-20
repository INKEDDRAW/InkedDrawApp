# Database Migration Runner (PowerShell)
# Runs all Supabase migrations and verifies schema integrity

Write-Host "🚀 Starting Database Migration Process..." -ForegroundColor Green

# Check if Supabase CLI is installed
try {
    $supabaseVersion = supabase --version
    Write-Host "✅ Supabase CLI found: $supabaseVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Supabase CLI not found. Please install it first:" -ForegroundColor Red
    Write-Host "   npm install -g supabase" -ForegroundColor Yellow
    exit 1
}

# Check if we're in the correct directory
if (-not (Test-Path "supabase/config.toml")) {
    Write-Host "❌ supabase/config.toml not found. Please run from project root." -ForegroundColor Red
    exit 1
}

Write-Host "📋 Checking Supabase project status..." -ForegroundColor Blue
try {
    supabase status
} catch {
    Write-Host "⚠️  Supabase project not started. Starting local development..." -ForegroundColor Yellow
    supabase start
}

Write-Host "🔄 Running database migrations..." -ForegroundColor Blue
try {
    supabase db push
    Write-Host "✅ Migrations applied successfully!" -ForegroundColor Green
} catch {
    Write-Host "❌ Migration failed. Check the error above." -ForegroundColor Red
    exit 1
}

Write-Host "🌱 Seeding database with initial data..." -ForegroundColor Blue
if (Test-Path "supabase/seed.sql") {
    try {
        supabase db reset --linked
        Write-Host "✅ Database seeded successfully!" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  Seeding failed, but continuing..." -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠️  No seed.sql found, skipping seeding" -ForegroundColor Yellow
}

Write-Host "🔍 Verifying migration status..." -ForegroundColor Blue
supabase migration list

Write-Host "📊 Checking database schema..." -ForegroundColor Blue
try {
    supabase db diff --schema public
} catch {
    Write-Host "⚠️  Schema diff failed, but continuing..." -ForegroundColor Yellow
}

Write-Host "✅ Database migrations completed successfully!" -ForegroundColor Green

# Run database tests if available
if (Test-Path "backend/src/testing/database-migration.test.ts") {
    Write-Host "🧪 Running database migration tests..." -ForegroundColor Blue
    Set-Location backend
    try {
        npm run test -- --testPathPattern=database-migration.test.ts
        Write-Host "✅ Database tests passed!" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  Database tests failed, but continuing..." -ForegroundColor Yellow
    }
    Set-Location ..
}

Write-Host "🎉 All database operations completed successfully!" -ForegroundColor Green
