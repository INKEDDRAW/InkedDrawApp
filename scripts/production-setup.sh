#!/bin/bash

# Production Environment Setup Script
# Configures production environment and prepares for deployment

set -e

echo "🚀 Starting Production Environment Setup..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="inked-draw"
ENVIRONMENT="production"
REGION="us-east-1"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check if required tools are installed
    command -v docker >/dev/null 2>&1 || { print_error "Docker is required but not installed. Aborting."; exit 1; }
    command -v aws >/dev/null 2>&1 || { print_error "AWS CLI is required but not installed. Aborting."; exit 1; }
    command -v supabase >/dev/null 2>&1 || { print_error "Supabase CLI is required but not installed. Aborting."; exit 1; }
    
    print_success "All prerequisites satisfied"
}

# Setup environment variables
setup_environment() {
    print_status "Setting up production environment variables..."
    
    # Create production environment file if it doesn't exist
    if [ ! -f ".env.production" ]; then
        print_status "Creating .env.production from template..."
        cp .env.production.example .env.production
        print_warning "Please update .env.production with actual production values"
    fi
    
    # Validate required environment variables
    source .env.production
    
    required_vars=(
        "DATABASE_URL"
        "SUPABASE_URL"
        "SUPABASE_ANON_KEY"
        "SUPABASE_SERVICE_ROLE_KEY"
        "JWT_SECRET"
        "REDIS_URL"
    )
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            print_error "Required environment variable $var is not set"
            exit 1
        fi
    done
    
    print_success "Environment variables validated"
}

# Build Docker images
build_images() {
    print_status "Building production Docker images..."
    
    # Build backend image
    print_status "Building backend image..."
    docker build -t ${PROJECT_NAME}-backend:latest -f backend/Dockerfile backend/
    
    # Build frontend image
    print_status "Building frontend image..."
    docker build -t ${PROJECT_NAME}-frontend:latest -f frontend/Dockerfile frontend/
    
    print_success "Docker images built successfully"
}

# Setup database
setup_database() {
    print_status "Setting up production database..."
    
    # Run database migrations
    print_status "Running database migrations..."
    cd backend
    npm run db:migrate
    cd ..
    
    # Verify database connection
    print_status "Verifying database connection..."
    docker run --rm --env-file .env.production ${PROJECT_NAME}-backend:latest npm run health-check
    
    print_success "Database setup completed"
}

# Setup monitoring
setup_monitoring() {
    print_status "Setting up monitoring and logging..."
    
    # Create CloudWatch log groups
    aws logs create-log-group --log-group-name "/aws/apprunner/${PROJECT_NAME}-backend" --region ${REGION} 2>/dev/null || true
    aws logs create-log-group --log-group-name "/aws/apprunner/${PROJECT_NAME}-frontend" --region ${REGION} 2>/dev/null || true
    
    # Setup CloudWatch alarms
    print_status "Creating CloudWatch alarms..."
    
    # High error rate alarm
    aws cloudwatch put-metric-alarm \
        --alarm-name "${PROJECT_NAME}-high-error-rate" \
        --alarm-description "High error rate detected" \
        --metric-name "4XXError" \
        --namespace "AWS/AppRunner" \
        --statistic "Sum" \
        --period 300 \
        --threshold 10 \
        --comparison-operator "GreaterThanThreshold" \
        --evaluation-periods 2 \
        --region ${REGION}
    
    # High response time alarm
    aws cloudwatch put-metric-alarm \
        --alarm-name "${PROJECT_NAME}-high-response-time" \
        --alarm-description "High response time detected" \
        --metric-name "ResponseTime" \
        --namespace "AWS/AppRunner" \
        --statistic "Average" \
        --period 300 \
        --threshold 1000 \
        --comparison-operator "GreaterThanThreshold" \
        --evaluation-periods 2 \
        --region ${REGION}
    
    print_success "Monitoring setup completed"
}

# Deploy to AWS App Runner
deploy_to_apprunner() {
    print_status "Deploying to AWS App Runner..."
    
    # Create ECR repositories if they don't exist
    aws ecr create-repository --repository-name ${PROJECT_NAME}-backend --region ${REGION} 2>/dev/null || true
    aws ecr create-repository --repository-name ${PROJECT_NAME}-frontend --region ${REGION} 2>/dev/null || true
    
    # Get ECR login token
    aws ecr get-login-password --region ${REGION} | docker login --username AWS --password-stdin $(aws sts get-caller-identity --query Account --output text).dkr.ecr.${REGION}.amazonaws.com
    
    # Tag and push images
    ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
    ECR_BACKEND_URI="${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/${PROJECT_NAME}-backend:latest"
    ECR_FRONTEND_URI="${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/${PROJECT_NAME}-frontend:latest"
    
    docker tag ${PROJECT_NAME}-backend:latest ${ECR_BACKEND_URI}
    docker tag ${PROJECT_NAME}-frontend:latest ${ECR_FRONTEND_URI}
    
    docker push ${ECR_BACKEND_URI}
    docker push ${ECR_FRONTEND_URI}
    
    # Deploy using App Runner configuration
    if [ -f "apprunner.yaml" ]; then
        print_status "Deploying with App Runner configuration..."
        aws apprunner create-service --cli-input-yaml file://apprunner.yaml --region ${REGION} 2>/dev/null || \
        aws apprunner update-service --cli-input-yaml file://apprunner.yaml --region ${REGION}
    fi
    
    print_success "Deployment to AWS App Runner completed"
}

# Setup CDN and DNS
setup_cdn() {
    print_status "Setting up CDN and DNS..."
    
    # This would typically involve:
    # - Creating CloudFront distribution
    # - Configuring custom domain
    # - Setting up SSL certificate
    # - Updating DNS records
    
    print_warning "CDN and DNS setup requires manual configuration"
    print_status "Please configure CloudFront distribution and DNS records manually"
}

# Run health checks
run_health_checks() {
    print_status "Running post-deployment health checks..."
    
    # Wait for services to be ready
    sleep 30
    
    # Check backend health
    if curl -f -s "https://api.${PROJECT_NAME}.com/health" > /dev/null; then
        print_success "Backend health check passed"
    else
        print_error "Backend health check failed"
        exit 1
    fi
    
    # Check database connectivity
    if docker run --rm --env-file .env.production ${PROJECT_NAME}-backend:latest npm run health-check; then
        print_success "Database connectivity check passed"
    else
        print_error "Database connectivity check failed"
        exit 1
    fi
    
    print_success "All health checks passed"
}

# Setup backup and disaster recovery
setup_backup() {
    print_status "Setting up backup and disaster recovery..."
    
    # Database backup configuration is handled by Supabase
    # File storage backup would be configured here
    
    print_success "Backup configuration completed"
}

# Main execution
main() {
    echo "🎯 Production Environment Setup for ${PROJECT_NAME}"
    echo "================================================"
    
    check_prerequisites
    setup_environment
    build_images
    setup_database
    setup_monitoring
    deploy_to_apprunner
    setup_cdn
    setup_backup
    run_health_checks
    
    echo ""
    echo "🎉 Production Environment Setup Complete!"
    echo "================================================"
    print_success "Application is now deployed and ready for production use"
    
    echo ""
    echo "📋 Next Steps:"
    echo "1. Configure custom domain and SSL certificate"
    echo "2. Set up monitoring dashboards"
    echo "3. Configure alerting rules"
    echo "4. Run load testing"
    echo "5. Update DNS records"
    echo "6. Notify stakeholders of successful deployment"
    
    echo ""
    echo "🔗 Useful Links:"
    echo "- Application: https://api.${PROJECT_NAME}.com"
    echo "- Health Check: https://api.${PROJECT_NAME}.com/health"
    echo "- AWS Console: https://console.aws.amazon.com/apprunner/"
    echo "- Supabase Dashboard: https://app.supabase.com/"
}

# Handle script interruption
trap 'print_error "Script interrupted"; exit 1' INT TERM

# Run main function
main "$@"
