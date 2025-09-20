# InkedDraw Local Development Setup Script
# Run this script to set up your local development environment

Write-Host "🥃 Setting up InkedDraw Local Development Environment" -ForegroundColor Green

# Check if .env files exist
$envFiles = @(
    @{Path = ".env"; Example = ".env.example"},
    @{Path = "backend/.env"; Example = "backend/.env.example"},
    @{Path = "frontend/.env"; Example = "frontend/.env.example"}
)

Write-Host "`n📋 Checking environment files..." -ForegroundColor Yellow

foreach ($env in $envFiles) {
    if (!(Test-Path $env.Path)) {
        Write-Host "Creating $($env.Path) from $($env.Example)..." -ForegroundColor Cyan
        Copy-Item $env.Example $env.Path
        Write-Host "✅ Created $($env.Path)" -ForegroundColor Green
        Write-Host "⚠️  Please edit $($env.Path) with your actual credentials" -ForegroundColor Yellow
    } else {
        Write-Host "✅ $($env.Path) already exists" -ForegroundColor Green
    }
}

Write-Host "`n🔧 Installing dependencies..." -ForegroundColor Yellow

# Install root dependencies
Write-Host "Installing root dependencies..." -ForegroundColor Cyan
npm install

# Install backend dependencies
Write-Host "Installing backend dependencies..." -ForegroundColor Cyan
Set-Location backend
npm install
Set-Location ..

# Install frontend dependencies
Write-Host "Installing frontend dependencies..." -ForegroundColor Cyan
Set-Location frontend
npm install
Set-Location ..

Write-Host "`n✅ Setup complete!" -ForegroundColor Green
Write-Host "`n📝 Next steps:" -ForegroundColor Yellow
Write-Host "1. Edit your .env files with actual credentials" -ForegroundColor White
Write-Host "2. Set up your Supabase project and get your keys" -ForegroundColor White
Write-Host "3. Run 'npm run dev:backend' to start the backend" -ForegroundColor White
Write-Host "4. Run 'npm run dev:frontend' to start the mobile app" -ForegroundColor White
Write-Host "`n🚀 Happy coding!" -ForegroundColor Green
