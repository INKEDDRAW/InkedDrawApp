# CI/CD Pipeline Setup Guide

This document outlines the complete CI/CD pipeline setup for the Inked Draw application, including GitHub Actions workflows, AWS infrastructure, and deployment processes.

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   GitHub Repo   │───▶│  GitHub Actions  │───▶│   AWS App Runner │
│                 │    │                  │    │                 │
│ • Frontend      │    │ • Test & Build   │    │ • Backend API   │
│ • Backend       │    │ • Security Scan  │    │ • Auto Scaling  │
│ • Infrastructure│    │ • Deploy         │    │ • Health Checks │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │   Mobile Build   │
                       │                  │
                       │ • EAS Build      │
                       │ • App Stores     │
                       │ • OTA Updates    │
                       └──────────────────┘
```

## 🔄 Workflows

### 1. Main CI/CD Pipeline (`.github/workflows/ci-cd.yml`)

**Triggers:**
- Push to `main`, `master`, or `develop` branches
- Pull requests to `main`, `master`, or `develop` branches

**Jobs:**
- **test-backend**: Runs backend tests, linting, and Supabase connection tests
- **test-frontend**: Runs frontend tests, linting, and type checking
- **security-scan**: Performs vulnerability scanning with Trivy
- **build-backend**: Builds and pushes Docker images to ECR
- **build-frontend**: Builds frontend for production
- **deploy-staging**: Deploys to staging environment (develop branch)
- **deploy-production**: Deploys to production environment (main/master branch)

### 2. Mobile App Build (`.github/workflows/mobile-build.yml`)

**Triggers:**
- Push to `main`/`master` with frontend changes
- Manual workflow dispatch

**Jobs:**
- **build-android**: Builds Android APK/AAB using EAS
- **build-ios**: Builds iOS app using EAS
- **submit-stores**: Submits to Google Play Store and Apple App Store
- **update-ota**: Publishes over-the-air updates

### 3. Security & Maintenance (`.github/workflows/security-maintenance.yml`)

**Triggers:**
- Daily schedule (2 AM UTC)
- Manual workflow dispatch

**Jobs:**
- **dependency-audit**: Audits npm dependencies for vulnerabilities
- **codeql-analysis**: Performs static code analysis
- **dependency-update**: Creates PRs for dependency updates
- **docker-security-scan**: Scans Docker images for vulnerabilities
- **license-check**: Validates license compliance
- **performance-monitoring**: Monitors application performance

## 🔐 Required Secrets

Configure these secrets in your GitHub repository settings:

### AWS Configuration
```
AWS_ACCESS_KEY_ID          # AWS access key for deployments
AWS_SECRET_ACCESS_KEY      # AWS secret key for deployments
AWS_REGION                 # AWS region (default: us-east-1)
```

### Supabase Configuration
```
SUPABASE_URL              # Your Supabase project URL
SUPABASE_ANON_KEY         # Supabase anonymous key
SUPABASE_SERVICE_ROLE_KEY # Supabase service role key
```

### Authentication
```
JWT_SECRET                # JWT signing secret
```

### Mobile App Configuration
```
EXPO_TOKEN                # Expo authentication token
GOOGLE_SERVICE_ACCOUNT_KEY # Google Play Store service account
APPLE_ID                  # Apple Developer account ID
APPLE_APP_SPECIFIC_PASSWORD # Apple app-specific password
```

### Notifications
```
SLACK_WEBHOOK_URL         # Slack webhook for general notifications
SECURITY_SLACK_WEBHOOK_URL # Slack webhook for security alerts
```

## 🏗️ Infrastructure Setup

### Prerequisites

1. **AWS Account** with appropriate permissions
2. **Terraform** installed locally
3. **AWS CLI** configured with credentials

### Initial Setup

1. **Create S3 bucket for Terraform state:**
```bash
aws s3 mb s3://inked-draw-terraform-state
aws s3api put-bucket-versioning --bucket inked-draw-terraform-state --versioning-configuration Status=Enabled
```

2. **Create DynamoDB table for state locking:**
```bash
aws dynamodb create-table \
  --table-name inked-draw-terraform-locks \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5
```

3. **Deploy infrastructure:**
```bash
cd infrastructure
terraform init
terraform plan -var-file=environments/production.tfvars
terraform apply -var-file=environments/production.tfvars
```

### Infrastructure Components

- **ECR Repository**: Stores Docker images
- **App Runner Service**: Hosts the backend API
- **S3 Bucket**: File storage with encryption
- **ElastiCache Redis**: Session storage and job queues
- **VPC & Networking**: Secure network configuration
- **IAM Roles**: Least-privilege access policies

## 🚀 Deployment Process

### Automatic Deployments

1. **Staging**: Triggered by pushes to `develop` branch
2. **Production**: Triggered by pushes to `main`/`master` branch

### Manual Deployment

Use the deployment script for manual deployments:

```bash
# Deploy to staging
./scripts/deploy.sh staging

# Deploy to production
./scripts/deploy.sh production
```

### Mobile App Deployment

1. **Development Builds**: Automatic on code changes
2. **Production Builds**: Manual trigger via GitHub Actions
3. **Store Submission**: Automatic for production builds
4. **OTA Updates**: Automatic for JavaScript-only changes

## 🔍 Monitoring & Alerts

### Health Checks
- **Backend**: `/health` endpoint monitored by App Runner
- **Database**: Connection tests in CI pipeline
- **Redis**: Connectivity verification

### Security Monitoring
- **Daily vulnerability scans**
- **Dependency audit reports**
- **License compliance checks**
- **Docker image security scanning**

### Notifications
- **Slack alerts** for deployment status
- **Security team notifications** for critical issues
- **Automated PR creation** for dependency updates

## 🛠️ Development Workflow

### Branch Strategy
```
main/master     ──▶ Production deployments
develop         ──▶ Staging deployments
feature/*       ──▶ PR testing only
hotfix/*        ──▶ Direct to main for urgent fixes
```

### Pull Request Process
1. Create feature branch from `develop`
2. Implement changes with tests
3. Create PR to `develop`
4. Automated testing runs
5. Code review and approval
6. Merge to `develop` (triggers staging deployment)
7. Merge `develop` to `main` for production

### Testing Strategy
- **Unit Tests**: Run on every commit
- **Integration Tests**: Run on PR creation
- **E2E Tests**: Run before production deployment
- **Security Scans**: Run daily and on every build

## 🔧 Troubleshooting

### Common Issues

1. **Build Failures**
   - Check GitHub Actions logs
   - Verify all secrets are configured
   - Ensure dependencies are up to date

2. **Deployment Failures**
   - Check AWS App Runner logs
   - Verify IAM permissions
   - Check health check endpoint

3. **Mobile Build Issues**
   - Verify Expo configuration
   - Check EAS build logs
   - Ensure certificates are valid

### Debugging Commands

```bash
# Check App Runner service status
aws apprunner describe-service --service-arn <service-arn>

# View App Runner logs
aws logs describe-log-groups --log-group-name-prefix "/aws/apprunner"

# Test health endpoint
curl -f https://your-service-url/health

# Check ECR images
aws ecr list-images --repository-name inked-draw-backend
```

## 📊 Performance Optimization

### Backend Optimization
- **Docker multi-stage builds** for smaller images
- **Node.js production mode** with optimizations
- **Redis caching** for frequently accessed data
- **Auto-scaling** based on CPU/memory usage

### Frontend Optimization
- **Bundle size analysis** in CI pipeline
- **Tree shaking** for unused code elimination
- **Code splitting** for faster load times
- **OTA updates** for quick JavaScript fixes

## 🔄 Maintenance

### Regular Tasks
- **Weekly dependency updates** (automated)
- **Monthly security reviews**
- **Quarterly infrastructure audits**
- **Performance monitoring reviews**

### Backup Strategy
- **Database**: Automated Supabase backups
- **File Storage**: S3 versioning enabled
- **Infrastructure**: Terraform state in S3
- **Code**: Git repository with multiple remotes

This CI/CD pipeline provides a robust, secure, and scalable deployment process for the Inked Draw application, ensuring high availability and quick recovery from issues.
