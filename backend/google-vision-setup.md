# Google Vision AI Setup Guide

## Prerequisites

1. **Google Cloud Account**: Create a Google Cloud account at [cloud.google.com](https://cloud.google.com)
2. **Google Cloud Project**: Create a new project or use an existing one
3. **Billing**: Enable billing for your project (Vision AI requires a billing account)

## Setup Steps

### 1. Enable Vision API

1. Go to the [Google Cloud Console](https://console.cloud.google.com)
2. Select your project
3. Navigate to **APIs & Services > Library**
4. Search for "Vision API" and click on "Cloud Vision API"
5. Click **Enable**

### 2. Create Service Account

1. Go to **IAM & Admin > Service Accounts**
2. Click **Create Service Account**
3. Enter details:
   - **Name**: `inkeddraw-vision-service`
   - **Description**: `Service account for InkedDraw Vision AI scanning`
4. Click **Create and Continue**
5. Grant roles:
   - Add **Cloud Vision AI Service Agent** role
   - Add **Storage Object Viewer** role (if storing images)
6. Click **Continue** and then **Done**

### 3. Generate Service Account Key

1. Find your newly created service account in the list
2. Click on the service account name
3. Go to the **Keys** tab
4. Click **Add Key > Create New Key**
5. Select **JSON** format
6. Click **Create**
7. The key file will download automatically

### 4. Configure Environment Variables

1. Move the downloaded JSON key file to a secure location in your project:
   ```bash
   mkdir -p backend/config
   mv ~/Downloads/your-service-account-key.json backend/config/google-vision-key.json
   ```

2. Update your `.env` file:
   ```env
   GOOGLE_CLOUD_PROJECT_ID=your-actual-project-id
   GOOGLE_APPLICATION_CREDENTIALS=./config/google-vision-key.json
   ```

### 5. Test the Integration

1. Start your backend server:
   ```bash
   cd backend
   npm run start:dev
   ```

2. Test the scanner endpoint using curl:
   ```bash
   curl -X POST http://localhost:3000/api/v1/scanner/identify-cigar \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -F "image=@path/to/test-image.jpg"
   ```

## Security Best Practices

### Production Deployment

1. **Never commit service account keys to version control**
2. **Use environment variables or secret management services**
3. **Rotate keys regularly**
4. **Use least privilege principle for IAM roles**

### AWS App Runner Deployment

For AWS App Runner, you can:

1. **Option 1**: Use AWS Secrets Manager
   ```bash
   # Store the service account key in AWS Secrets Manager
   aws secretsmanager create-secret \
     --name "inkeddraw/google-vision-key" \
     --secret-string file://config/google-vision-key.json
   ```

2. **Option 2**: Use environment variables
   - Convert the JSON key to base64
   - Store as environment variable
   - Decode in your application

### Environment Variable Setup

```env
# For local development
GOOGLE_APPLICATION_CREDENTIALS=./config/google-vision-key.json
GOOGLE_CLOUD_PROJECT_ID=your-project-id

# For production (using base64 encoded key)
GOOGLE_CLOUD_CREDENTIALS_BASE64=ewogICJ0eXBlIjogInNlcnZpY2VfYWNjb3VudCIsC...
GOOGLE_CLOUD_PROJECT_ID=your-project-id
```

## API Usage Limits and Pricing

### Free Tier
- **1,000 units per month** for text detection
- After free tier: **$1.50 per 1,000 units**

### Rate Limits
- **600 requests per minute** per project
- **10 requests per second** per project

### Optimization Tips
1. **Compress images** before sending to reduce costs
2. **Cache results** to avoid duplicate API calls
3. **Implement retry logic** for rate limit handling
4. **Monitor usage** in Google Cloud Console

## Troubleshooting

### Common Issues

1. **Authentication Error**
   ```
   Error: Could not load the default credentials
   ```
   **Solution**: Check that `GOOGLE_APPLICATION_CREDENTIALS` points to valid key file

2. **Permission Denied**
   ```
   Error: The caller does not have permission
   ```
   **Solution**: Ensure Vision API is enabled and service account has correct roles

3. **Quota Exceeded**
   ```
   Error: Quota exceeded for quota metric
   ```
   **Solution**: Check usage in Cloud Console and increase quotas if needed

### Debug Mode

Enable debug logging in your application:
```typescript
// In scanner.service.ts
this.logger.debug('Extracted texts:', extractedTexts);
```

## Testing Images

For best results, use images with:
- **Good lighting** and contrast
- **Clear text** on labels/bands
- **Minimal blur** or motion
- **Appropriate resolution** (not too small or too large)

Test with various cigar bands, wine labels, and beer labels to improve the text analysis patterns in the `analyzeProductText` method.
