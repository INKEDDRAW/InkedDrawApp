#!/bin/bash

# Inked Draw Development Setup Script
# This script sets up the development environment for the Inked Draw project

echo "🚀 Setting up Inked Draw development environment..."

# Check if Node.js is installed
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo "✅ Node.js version: $NODE_VERSION"
else
    echo "❌ Node.js is not installed. Please install Node.js 18+ and try again."
    exit 1
fi

# Check if npm is installed
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    echo "✅ npm version: $NPM_VERSION"
else
    echo "❌ npm is not installed. Please install npm and try again."
    exit 1
fi

# Install dependencies
echo "📦 Installing root dependencies..."
npm install

echo "📦 Installing frontend dependencies..."
cd frontend
npm install
cd ..

echo "📦 Installing backend dependencies..."
cd backend
npm install
cd ..

# Copy environment files if they don't exist
if [ ! -f ".env" ]; then
    echo "📄 Creating .env file from template..."
    cp .env.example .env
fi

if [ ! -f "frontend/.env" ]; then
    echo "📄 Creating frontend .env file from template..."
    cp frontend/.env.example frontend/.env
fi

if [ ! -f "backend/.env" ]; then
    echo "📄 Creating backend .env file from template..."
    cp backend/.env.example backend/.env
fi

echo "✅ Development environment setup complete!"
echo ""
echo "Next steps:"
echo "1. Configure your .env files with actual values"
echo "2. Set up your Supabase project and update DATABASE_URL"
echo "3. Run 'npm run dev:backend' to start the backend"
echo "4. Run 'npm run dev:frontend' to start the frontend"
echo ""
echo "Happy coding! 🎉"
