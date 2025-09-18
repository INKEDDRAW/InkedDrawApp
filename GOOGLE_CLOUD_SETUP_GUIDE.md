# Google Cloud Vision AI Setup for InkedDraw

## 🎯 Overview
This guide will help you set up Google Cloud Vision AI for real cigar, wine, and beer identification in the InkedDraw app. The backend code is already implemented - we just need to configure the credentials.

## 📋 Prerequisites
- Google account
- Credit card (for Google Cloud - free tier available)
- Access to InkedDraw backend code

## 🚀 Step-by-Step Setup

### Step 1: Create Google Cloud Project

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/
   - Sign in with your Google account

2. **Create New Project**
   - Click "Select a project" dropdown at the top
   - Click "New Project"
   - Enter project details:
     - **Project Name**: `InkedDraw Vision AI`
     - **Project ID**: `inkeddraw-vision-ai` (or similar - must be globally unique)
   - Click "Create"

3. **Wait for Project Creation**
   - This usually takes 30-60 seconds
   - You'll see a notification when it's ready

### Step 2: Enable Vision API

1. **Navigate to APIs & Services**
   - In the left sidebar, click "APIs & Services" > "Library"
   - Or use this direct link: https://console.cloud.google.com/apis/library

2. **Search for Vision API**
   - In the search bar, type "Cloud Vision API"
   - Click on "Cloud Vision API" from the results

3. **Enable the API**
   - Click the "Enable" button
   - Wait for it to be enabled (usually 1-2 minutes)

### Step 3: Create Service Account

1. **Go to IAM & Admin**
   - Left sidebar: "IAM & Admin" > "Service Accounts"
   - Or direct link: https://console.cloud.google.com/iam-admin/serviceaccounts

2. **Create Service Account**
   - Click "Create Service Account"
   - Fill in details:
     - **Service account name**: `inkeddraw-vision-service`
     - **Service account ID**: `inkeddraw-vision-service` (auto-filled)
     - **Description**: `Service account for InkedDraw Vision AI scanning`
   - Click "Create and Continue"

3. **Grant Roles**
   - In "Grant this service account access to project" section:
   - Click "Select a role" dropdown
   - Search for and add: **"Cloud Vision AI Service Agent"**
   - Click "Continue"
   - Click "Done"

### Step 4: Generate Service Account Key

1. **Find Your Service Account**
   - In the Service Accounts list, find `inkeddraw-vision-service`
   - Click on the service account name

2. **Create Key**
   - Go to the "Keys" tab
   - Click "Add Key" > "Create New Key"
   - Select "JSON" format
   - Click "Create"

3. **Download Key File**
   - The JSON key file will download automatically
   - **IMPORTANT**: Keep this file secure - it's like a password!

### Step 5: Configure Backend Environment

1. **Create Config Directory**
   ```bash
   # In your InkedDrawApp/backend directory
   mkdir -p config
   ```

2. **Move Key File**
   ```bash
   # Move the downloaded key file to your backend config directory
   # Replace 'your-downloaded-key.json' with the actual filename
   mv ~/Downloads/inkeddraw-vision-ai-*.json backend/config/google-vision-key.json
   ```

3. **Update .env File**
   - Open `InkedDrawApp/backend/.env`
   - Update these lines:
   ```env
   GOOGLE_CLOUD_PROJECT_ID=inkeddraw-vision-ai
   GOOGLE_APPLICATION_CREDENTIALS=./config/google-vision-key.json
   ```

### Step 6: Test the Setup

1. **Start Backend Server**
   ```bash
   cd InkedDrawApp/backend
   npm run start:dev
   ```

2. **Test API Endpoint**
   - The server should start without Vision API errors
   - Check logs for any authentication issues
   - Test with a real image upload to `/api/v1/scanner/identify-cigar`

## 🔒 Security Best Practices

### For Development
- ✅ Keep `google-vision-key.json` in `backend/config/` directory
- ✅ Add `config/` to `.gitignore` to prevent committing credentials
- ✅ Never share or commit the service account key

### For Production
- Use environment variables instead of key files
- Consider using Google Cloud's Application Default Credentials
- Rotate keys regularly
- Use least privilege principle

## 💰 Pricing Information

### Free Tier (Monthly)
- **1,000 units** of text detection per month
- Perfect for development and initial testing

### Paid Tier
- **$1.50 per 1,000 units** after free tier
- For a typical scanning app, this is very cost-effective

### Rate Limits
- **600 requests per minute** per project
- **10 requests per second** per project

## 🧪 Testing Your Setup

Once configured, you can test with curl:

```bash
# Test cigar identification
curl -X POST http://localhost:3000/api/v1/scanner/identify-cigar \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "image=@path/to/cigar-image.jpg"
```

## 🚨 Troubleshooting

### Common Issues

1. **"Application Default Credentials not found"**
   - Make sure `GOOGLE_APPLICATION_CREDENTIALS` points to the correct key file
   - Check that the key file exists and is readable

2. **"Permission denied"**
   - Verify the service account has "Cloud Vision AI Service Agent" role
   - Check that the Vision API is enabled for your project

3. **"Project not found"**
   - Verify `GOOGLE_CLOUD_PROJECT_ID` matches your actual project ID
   - Check that you're using the project ID, not the project name

## ✅ Success Indicators

You'll know it's working when:
- ✅ Backend starts without Vision API errors
- ✅ Scanner endpoints return real text detection results
- ✅ Logs show "Processing cigar identification with Google Vision AI..."
- ✅ Frontend receives actual scan results instead of mock data

## 🎯 Next Steps

After setup is complete:
1. Test with various cigar band images
2. Implement cigar database matching logic
3. Tune confidence scoring
4. Add fallback strategies for unrecognized products

---

**Need Help?** Check the troubleshooting section or review the Google Cloud Vision API documentation at: https://cloud.google.com/vision/docs
