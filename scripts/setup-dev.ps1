# Inked Draw Development Setup Script
# This script sets up the development environment for the Inked Draw project

Write-Host "🚀 Setting up Inked Draw development environment..." -ForegroundColor Green

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js is not installed. Please install Node.js 18+ and try again." -ForegroundColor Red
    exit 1
}

# Check if npm is installed
try {
    $npmVersion = npm --version
    Write-Host "✅ npm version: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ npm is not installed. Please install npm and try again." -ForegroundColor Red
    exit 1
}

# Install dependencies
Write-Host "📦 Installing root dependencies..." -ForegroundColor Yellow
npm install

Write-Host "📦 Installing frontend dependencies..." -ForegroundColor Yellow
cd frontend
npm install
cd ..

Write-Host "📦 Installing backend dependencies..." -ForegroundColor Yellow
cd backend
npm install
cd ..

# Copy environment files if they don't exist
if (!(Test-Path ".env")) {
    Write-Host "📄 Creating .env file from template..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
}

if (!(Test-Path "frontend/.env")) {
    Write-Host "📄 Creating frontend .env file from template..." -ForegroundColor Yellow
    Copy-Item "frontend/.env.example" "frontend/.env"
}

if (!(Test-Path "backend/.env")) {
    Write-Host "📄 Creating backend .env file from template..." -ForegroundColor Yellow
    Copy-Item "backend/.env.example" "backend/.env"
}

Write-Host "✅ Development environment setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Configure your .env files with actual values" -ForegroundColor White
Write-Host "2. Set up your Supabase project and update DATABASE_URL" -ForegroundColor White
Write-Host "3. Run 'npm run dev:backend' to start the backend" -ForegroundColor White
Write-Host "4. Run 'npm run dev:frontend' to start the frontend" -ForegroundColor White
Write-Host ""
Write-Host "Happy coding! 🎉" -ForegroundColor Green
