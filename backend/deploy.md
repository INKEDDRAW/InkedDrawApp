# InkedDraw Backend Deployment Guide

## AWS App Runner Deployment

### Prerequisites
1. AWS CLI installed and configured
2. Docker installed (for local testing)
3. GitHub repository with the backend code

### Step 1: Test Docker Build Locally
```bash
# Build the Docker image
docker build -t inkeddraw-backend .

# Test the container locally
docker run -p 3000:3000 --env-file .env inkeddraw-backend
```

### Step 2: Create AWS App Runner Service

#### Option A: Using AWS Console
1. Go to AWS App Runner console
2. Click "Create service"
3. Choose "Source code repository"
4. Connect your GitHub repository
5. Select the backend folder as the source directory
6. Use the `apprunner.yaml` configuration file
7. Set environment variables:
   - `SUPABASE_URL`: Your Supabase project URL
   - `SUPABASE_ANON_KEY`: Your Supabase anon key
   - `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key
   - `JWT_SECRET`: A secure random string
   - `NODE_ENV`: production

#### Option B: Using AWS CLI
```bash
# Create the service
aws apprunner create-service \
  --service-name inkeddraw-backend \
  --source-configuration '{
    "ImageRepository": {
      "ImageIdentifier": "public.ecr.aws/aws-containers/hello-app-runner:latest",
      "ImageConfiguration": {
        "Port": "3000"
      },
      "ImageRepositoryType": "ECR_PUBLIC"
    },
    "AutoDeploymentsEnabled": true
  }' \
  --instance-configuration '{
    "Cpu": "0.25 vCPU",
    "Memory": "0.5 GB"
  }'
```

### Step 3: Configure Environment Variables
Set the following environment variables in AWS App Runner:

```
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
JWT_SECRET=your-super-secret-jwt-key-for-production
NODE_ENV=production
PORT=3000
```

### Step 4: Verify Deployment
1. Check the App Runner service status
2. Test the health endpoint: `https://your-app-runner-url.amazonaws.com/api/v1/health`
3. Test the API documentation: `https://your-app-runner-url.amazonaws.com/api/docs`

### Step 5: Update Frontend Configuration
Update your React Native app to use the new backend URL:
```javascript
const API_BASE_URL = 'https://your-app-runner-url.amazonaws.com/api/v1';
```

## Monitoring and Maintenance

### Health Checks
- App Runner automatically monitors the `/api/v1/health` endpoint
- Configure CloudWatch alarms for additional monitoring

### Logs
- View logs in AWS App Runner console
- Set up CloudWatch log groups for persistent logging

### Scaling
- App Runner automatically scales based on traffic
- Configure min/max instances as needed

## Security Considerations

1. **Environment Variables**: Never commit sensitive data to the repository
2. **CORS**: Configure CORS properly for production
3. **Rate Limiting**: Implement rate limiting for API endpoints
4. **Authentication**: Ensure JWT secrets are secure and rotated regularly
5. **Database**: Use Supabase RLS (Row Level Security) policies

## Troubleshooting

### Common Issues
1. **Build Failures**: Check Node.js version compatibility
2. **Environment Variables**: Verify all required variables are set
3. **Database Connection**: Ensure Supabase credentials are correct
4. **Port Configuration**: App Runner expects the app to listen on the PORT environment variable

### Debug Commands
```bash
# Check service status
aws apprunner describe-service --service-arn <service-arn>

# View recent deployments
aws apprunner list-operations --service-arn <service-arn>
```
