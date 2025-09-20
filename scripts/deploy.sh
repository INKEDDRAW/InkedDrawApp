#!/bin/bash

# Inked Draw Deployment Script
# Deploys the application to AWS App Runner

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-staging}
AWS_REGION=${AWS_REGION:-us-east-1}
APP_NAME="inked-draw"

echo -e "${BLUE}🚀 Starting deployment to ${ENVIRONMENT} environment${NC}"

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(staging|production)$ ]]; then
    echo -e "${RED}❌ Invalid environment. Use 'staging' or 'production'${NC}"
    exit 1
fi

# Check required tools
command -v aws >/dev/null 2>&1 || { echo -e "${RED}❌ AWS CLI is required but not installed${NC}"; exit 1; }
command -v docker >/dev/null 2>&1 || { echo -e "${RED}❌ Docker is required but not installed${NC}"; exit 1; }

# Check AWS credentials
aws sts get-caller-identity >/dev/null 2>&1 || { 
    echo -e "${RED}❌ AWS credentials not configured${NC}"
    exit 1
}

echo -e "${GREEN}✅ Prerequisites check passed${NC}"

# Get ECR repository URL
ECR_REPO=$(aws ecr describe-repositories --repository-names "${APP_NAME}-backend" --region $AWS_REGION --query 'repositories[0].repositoryUri' --output text 2>/dev/null || echo "")

if [ -z "$ECR_REPO" ]; then
    echo -e "${RED}❌ ECR repository not found. Please run terraform apply first${NC}"
    exit 1
fi

echo -e "${BLUE}📦 Building and pushing Docker image${NC}"

# Login to ECR
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_REPO

# Build Docker image
cd backend
docker build -t $ECR_REPO:latest .
docker build -t $ECR_REPO:$ENVIRONMENT .

# Push images
docker push $ECR_REPO:latest
docker push $ECR_REPO:$ENVIRONMENT

echo -e "${GREEN}✅ Docker image pushed successfully${NC}"

# Deploy to App Runner
echo -e "${BLUE}🚀 Deploying to App Runner${NC}"

# Check if App Runner service exists
SERVICE_ARN=$(aws apprunner list-services --region $AWS_REGION --query "ServiceSummaryList[?ServiceName=='${APP_NAME}-${ENVIRONMENT}'].ServiceArn" --output text)

if [ -z "$SERVICE_ARN" ]; then
    echo -e "${YELLOW}⚠️  App Runner service not found. Creating new service...${NC}"
    
    # Create new service
    aws apprunner create-service \
        --service-name "${APP_NAME}-${ENVIRONMENT}" \
        --source-configuration '{
            "ImageRepository": {
                "ImageIdentifier": "'$ECR_REPO:$ENVIRONMENT'",
                "ImageConfiguration": {
                    "Port": "3000"
                },
                "ImageRepositoryType": "ECR"
            },
            "AutoDeploymentsEnabled": false
        }' \
        --instance-configuration '{
            "Cpu": "0.25 vCPU",
            "Memory": "0.5 GB",
            "InstanceRoleArn": "'$(aws iam get-role --role-name ${APP_NAME}-apprunner-instance-role-${ENVIRONMENT} --query 'Role.Arn' --output text)'"
        }' \
        --region $AWS_REGION
else
    echo -e "${YELLOW}⚠️  Updating existing App Runner service...${NC}"
    
    # Update existing service
    aws apprunner update-service \
        --service-arn $SERVICE_ARN \
        --source-configuration '{
            "ImageRepository": {
                "ImageIdentifier": "'$ECR_REPO:$ENVIRONMENT'",
                "ImageConfiguration": {
                    "Port": "3000"
                },
                "ImageRepositoryType": "ECR"
            }
        }' \
        --region $AWS_REGION
fi

echo -e "${BLUE}⏳ Waiting for deployment to complete...${NC}"

# Wait for service to be running
while true; do
    STATUS=$(aws apprunner describe-service --service-arn $SERVICE_ARN --region $AWS_REGION --query 'Service.Status' --output text 2>/dev/null || echo "UNKNOWN")
    
    case $STATUS in
        "RUNNING")
            echo -e "${GREEN}✅ Service is running${NC}"
            break
            ;;
        "OPERATION_IN_PROGRESS")
            echo -e "${YELLOW}⏳ Deployment in progress...${NC}"
            sleep 30
            ;;
        "CREATE_FAILED"|"UPDATE_FAILED"|"DELETE_FAILED")
            echo -e "${RED}❌ Deployment failed with status: $STATUS${NC}"
            exit 1
            ;;
        *)
            echo -e "${YELLOW}⏳ Current status: $STATUS${NC}"
            sleep 30
            ;;
    esac
done

# Get service URL
SERVICE_URL=$(aws apprunner describe-service --service-arn $SERVICE_ARN --region $AWS_REGION --query 'Service.ServiceUrl' --output text)

echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo -e "${BLUE}🌐 Service URL: https://$SERVICE_URL${NC}"

# Health check
echo -e "${BLUE}🏥 Performing health check...${NC}"
sleep 10

if curl -f -s "https://$SERVICE_URL/health" > /dev/null; then
    echo -e "${GREEN}✅ Health check passed${NC}"
else
    echo -e "${RED}❌ Health check failed${NC}"
    exit 1
fi

echo -e "${GREEN}🚀 Deployment to ${ENVIRONMENT} completed successfully!${NC}"
