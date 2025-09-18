#!/bin/bash

# InkedDraw Google Vision AI Setup Script
# This script helps automate the local setup after you've created the Google Cloud project

set -e

echo "🚀 InkedDraw Google Vision AI Setup"
echo "=================================="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "backend" ]; then
    echo "❌ Error: Please run this script from the InkedDrawApp root directory"
    exit 1
fi

echo "📁 Creating backend config directory..."
mkdir -p backend/config

echo ""
echo "🔑 Google Cloud Service Account Key Setup"
echo "========================================="
echo ""
echo "Please follow these steps:"
echo ""
echo "1. Go to Google Cloud Console: https://console.cloud.google.com/"
echo "2. Create a new project (or select existing): 'InkedDraw Vision AI'"
echo "3. Enable the Cloud Vision API"
echo "4. Create a service account with 'Cloud Vision AI Service Agent' role"
echo "5. Download the JSON key file"
echo ""

# Check if key file already exists
if [ -f "backend/config/google-vision-key.json" ]; then
    echo "✅ Found existing Google Vision key file"
    read -p "Do you want to replace it? (y/N): " replace_key
    if [[ $replace_key =~ ^[Yy]$ ]]; then
        rm backend/config/google-vision-key.json
    else
        echo "📝 Using existing key file"
    fi
fi

# Prompt for key file if it doesn't exist
if [ ! -f "backend/config/google-vision-key.json" ]; then
    echo ""
    echo "📥 Please drag and drop your downloaded Google Cloud service account key file here:"
    echo "   (It should be named something like: inkeddraw-vision-ai-*.json)"
    echo ""
    read -p "Enter the full path to your key file: " key_file_path
    
    # Remove quotes if present
    key_file_path=$(echo "$key_file_path" | sed 's/^"//;s/"$//')
    
    if [ -f "$key_file_path" ]; then
        cp "$key_file_path" backend/config/google-vision-key.json
        echo "✅ Key file copied successfully"
    else
        echo "❌ Error: Key file not found at: $key_file_path"
        echo "Please make sure the file exists and try again"
        exit 1
    fi
fi

echo ""
echo "🔧 Configuring environment variables..."

# Get project ID from the key file
if command -v jq &> /dev/null; then
    PROJECT_ID=$(jq -r '.project_id' backend/config/google-vision-key.json)
    echo "📋 Detected Project ID: $PROJECT_ID"
else
    echo "⚠️  jq not found. Please enter your Google Cloud Project ID manually:"
    read -p "Project ID: " PROJECT_ID
fi

# Update .env file
if [ -f "backend/.env" ]; then
    echo "📝 Updating backend/.env file..."
    
    # Update or add Google Cloud configuration
    if grep -q "GOOGLE_CLOUD_PROJECT_ID" backend/.env; then
        sed -i.bak "s/GOOGLE_CLOUD_PROJECT_ID=.*/GOOGLE_CLOUD_PROJECT_ID=$PROJECT_ID/" backend/.env
    else
        echo "GOOGLE_CLOUD_PROJECT_ID=$PROJECT_ID" >> backend/.env
    fi
    
    if grep -q "GOOGLE_APPLICATION_CREDENTIALS" backend/.env; then
        sed -i.bak "s|GOOGLE_APPLICATION_CREDENTIALS=.*|GOOGLE_APPLICATION_CREDENTIALS=./config/google-vision-key.json|" backend/.env
    else
        echo "GOOGLE_APPLICATION_CREDENTIALS=./config/google-vision-key.json" >> backend/.env
    fi
    
    # Remove backup file
    rm -f backend/.env.bak
    
    echo "✅ Environment variables updated"
else
    echo "❌ Error: backend/.env file not found"
    exit 1
fi

echo ""
echo "🧪 Testing setup..."

# Check if Node.js dependencies are installed
if [ ! -d "backend/node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    cd backend && npm install && cd ..
fi

echo ""
echo "✅ Setup Complete!"
echo "=================="
echo ""
echo "🎯 Next Steps:"
echo "1. Start the backend server:"
echo "   cd backend && npm run start:dev"
echo ""
echo "2. Test the Vision API with a real image:"
echo "   curl -X POST http://localhost:3000/api/v1/scanner/identify-cigar \\"
echo "     -H \"Authorization: Bearer YOUR_JWT_TOKEN\" \\"
echo "     -F \"image=@path/to/cigar-image.jpg\""
echo ""
echo "3. Check the logs for 'Processing cigar identification with Google Vision AI...'"
echo ""
echo "📚 For detailed setup instructions, see: GOOGLE_CLOUD_SETUP_GUIDE.md"
echo ""
echo "🔒 Security Note: Your Google Cloud key is stored in backend/config/ and"
echo "   is already added to .gitignore to prevent accidental commits."
echo ""
