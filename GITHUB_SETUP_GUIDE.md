# 🔐 GitHub Repository Setup Guide

## Step 1: Add Repository Secrets

Go to: **GitHub → Settings → Secrets and variables → Actions → Secrets tab → New repository secret**

### Critical Secrets (Required)
```
SUPABASE_SERVICE_ROLE_KEY = your_supabase_service_role_key
JWT_SECRET = your_jwt_secret_key_here
DATABASE_URL = postgresql://postgres:[password]@db.xxx.supabase.co:5432/postgres
```

### External Service API Keys
```
VERIFF_API_KEY = your_veriff_api_key
VERIFF_SECRET_KEY = your_veriff_secret_key
AWS_ACCESS_KEY_ID = your_aws_access_key
AWS_SECRET_ACCESS_KEY = your_aws_secret_key
POSTHOG_API_KEY = your_posthog_api_key
POSTHOG_PERSONAL_API_KEY = your_posthog_personal_api_key
OPENAI_API_KEY = your_openai_api_key
HUGGING_FACE_API_KEY = your_hugging_face_api_key
```

### Deployment Secrets
```
APP_RUNNER_SERVICE_ARN = arn:aws:apprunner:region:account:service/your-service
S3_BUCKET_NAME = your-frontend-bucket-name
CLOUDFRONT_DISTRIBUTION_ID = your_cloudfront_distribution_id
SLACK_WEBHOOK_URL = https://hooks.slack.com/services/your/webhook/url
REDIS_URL = redis://your-redis-url:6379
```

### Application URLs
```
BACKEND_URL = https://your-backend-domain.com
FRONTEND_URL = https://your-frontend-domain.com
REACT_APP_API_URL = https://your-backend-domain.com/api/v1
```

## Step 2: Add Repository Variables

Go to: **GitHub → Settings → Secrets and variables → Actions → Variables tab → New repository variable**

### Public Configuration
```
SUPABASE_URL = https://gyhpbpfxollqcomxgrqb.supabase.co
SUPABASE_ANON_KEY = your_public_supabase_anon_key
POSTHOG_HOST = https://app.posthog.com
AWS_REGION = us-east-1
NODE_ENV = production
PORT = 3000
API_VERSION = v1
```

## Step 3: Get Your Supabase Keys

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `gyhpbpfxollqcomxgrqb`
3. Go to Settings → API
4. Copy:
   - **URL**: Use for `SUPABASE_URL` variable
   - **anon public**: Use for `SUPABASE_ANON_KEY` variable  
   - **service_role**: Use for `SUPABASE_SERVICE_ROLE_KEY` secret

## Step 4: Generate JWT Secret

Run this command to generate a secure JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## Step 5: Test the Setup

After adding secrets and variables:
1. Push a commit to trigger workflows
2. Check Actions tab for workflow status
3. Fix any failing workflows by adding missing secrets

## 🚨 Security Notes

- **Never commit .env files** to git
- **Service role key** has admin access - keep it secret
- **Anon key** is safe to expose publicly
- **Use different keys** for staging vs production

## 🎯 Priority Order

Start with these essential secrets first:
1. `SUPABASE_SERVICE_ROLE_KEY`
2. `JWT_SECRET` 
3. `SUPABASE_URL` (variable)
4. `SUPABASE_ANON_KEY` (variable)

Then add others as needed for specific features.
