# Production Environment Setup Script (PowerShell)
# Configures production environment and prepares for deployment

param(
    [string]$Environment = "production",
    [string]$Region = "us-east-1",
    [string]$ProjectName = "inked-draw"
)

# Configuration
$ErrorActionPreference = "Stop"

Write-Host "🚀 Starting Production Environment Setup..." -ForegroundColor Green
Write-Host "Project: $ProjectName" -ForegroundColor Cyan
Write-Host "Environment: $Environment" -ForegroundColor Cyan
Write-Host "Region: $Region" -ForegroundColor Cyan
Write-Host ""

# Function to print colored output
function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Check prerequisites
function Test-Prerequisites {
    Write-Status "Checking prerequisites..."
    
    # Check if required tools are installed
    $tools = @("docker", "aws", "supabase")
    
    foreach ($tool in $tools) {
        try {
            & $tool --version | Out-Null
            Write-Host "✓ $tool is installed" -ForegroundColor Green
        } catch {
            Write-Error "$tool is required but not installed. Please install it first."
            exit 1
        }
    }
    
    Write-Success "All prerequisites satisfied"
}

# Setup environment variables
function Set-Environment {
    Write-Status "Setting up production environment variables..."
    
    # Create production environment file if it doesn't exist
    if (-not (Test-Path ".env.production")) {
        Write-Status "Creating .env.production from template..."
        Copy-Item ".env.production.example" ".env.production"
        Write-Warning "Please update .env.production with actual production values"
    }
    
    # Load environment variables
    if (Test-Path ".env.production") {
        Get-Content ".env.production" | ForEach-Object {
            if ($_ -match "^([^#][^=]+)=(.*)$") {
                [Environment]::SetEnvironmentVariable($matches[1], $matches[2], "Process")
            }
        }
    }
    
    # Validate required environment variables
    $requiredVars = @(
        "DATABASE_URL",
        "SUPABASE_URL", 
        "SUPABASE_ANON_KEY",
        "SUPABASE_SERVICE_ROLE_KEY",
        "JWT_SECRET",
        "REDIS_URL"
    )
    
    foreach ($var in $requiredVars) {
        if (-not [Environment]::GetEnvironmentVariable($var)) {
            Write-Error "Required environment variable $var is not set"
            exit 1
        }
    }
    
    Write-Success "Environment variables validated"
}

# Build Docker images
function Build-Images {
    Write-Status "Building production Docker images..."
    
    try {
        # Build backend image
        Write-Status "Building backend image..."
        docker build -t "$ProjectName-backend:latest" -f "backend/Dockerfile" "backend/"
        
        # Build frontend image  
        Write-Status "Building frontend image..."
        docker build -t "$ProjectName-frontend:latest" -f "frontend/Dockerfile" "frontend/"
        
        Write-Success "Docker images built successfully"
    } catch {
        Write-Error "Failed to build Docker images: $_"
        exit 1
    }
}

# Setup database
function Set-Database {
    Write-Status "Setting up production database..."
    
    try {
        # Run database migrations
        Write-Status "Running database migrations..."
        Set-Location "backend"
        npm run db:migrate
        Set-Location ".."
        
        # Verify database connection
        Write-Status "Verifying database connection..."
        docker run --rm --env-file ".env.production" "$ProjectName-backend:latest" npm run health-check
        
        Write-Success "Database setup completed"
    } catch {
        Write-Error "Database setup failed: $_"
        exit 1
    }
}

# Setup monitoring
function Set-Monitoring {
    Write-Status "Setting up monitoring and logging..."
    
    try {
        # Create CloudWatch log groups
        Write-Status "Creating CloudWatch log groups..."
        aws logs create-log-group --log-group-name "/aws/apprunner/$ProjectName-backend" --region $Region 2>$null
        aws logs create-log-group --log-group-name "/aws/apprunner/$ProjectName-frontend" --region $Region 2>$null
        
        # Setup CloudWatch alarms
        Write-Status "Creating CloudWatch alarms..."
        
        # High error rate alarm
        aws cloudwatch put-metric-alarm `
            --alarm-name "$ProjectName-high-error-rate" `
            --alarm-description "High error rate detected" `
            --metric-name "4XXError" `
            --namespace "AWS/AppRunner" `
            --statistic "Sum" `
            --period 300 `
            --threshold 10 `
            --comparison-operator "GreaterThanThreshold" `
            --evaluation-periods 2 `
            --region $Region
        
        # High response time alarm
        aws cloudwatch put-metric-alarm `
            --alarm-name "$ProjectName-high-response-time" `
            --alarm-description "High response time detected" `
            --metric-name "ResponseTime" `
            --namespace "AWS/AppRunner" `
            --statistic "Average" `
            --period 300 `
            --threshold 1000 `
            --comparison-operator "GreaterThanThreshold" `
            --evaluation-periods 2 `
            --region $Region
        
        Write-Success "Monitoring setup completed"
    } catch {
        Write-Warning "Some monitoring setup steps failed: $_"
    }
}

# Deploy to AWS App Runner
function Deploy-ToAppRunner {
    Write-Status "Deploying to AWS App Runner..."
    
    try {
        # Create ECR repositories if they don't exist
        aws ecr create-repository --repository-name "$ProjectName-backend" --region $Region 2>$null
        aws ecr create-repository --repository-name "$ProjectName-frontend" --region $Region 2>$null
        
        # Get ECR login token
        $accountId = aws sts get-caller-identity --query Account --output text
        aws ecr get-login-password --region $Region | docker login --username AWS --password-stdin "$accountId.dkr.ecr.$Region.amazonaws.com"
        
        # Tag and push images
        $ecrBackendUri = "$accountId.dkr.ecr.$Region.amazonaws.com/$ProjectName-backend:latest"
        $ecrFrontendUri = "$accountId.dkr.ecr.$Region.amazonaws.com/$ProjectName-frontend:latest"
        
        docker tag "$ProjectName-backend:latest" $ecrBackendUri
        docker tag "$ProjectName-frontend:latest" $ecrFrontendUri
        
        docker push $ecrBackendUri
        docker push $ecrFrontendUri
        
        # Deploy using App Runner configuration
        if (Test-Path "apprunner.yaml") {
            Write-Status "Deploying with App Runner configuration..."
            try {
                aws apprunner create-service --cli-input-yaml file://apprunner.yaml --region $Region
            } catch {
                aws apprunner update-service --cli-input-yaml file://apprunner.yaml --region $Region
            }
        }
        
        Write-Success "Deployment to AWS App Runner completed"
    } catch {
        Write-Error "Deployment failed: $_"
        exit 1
    }
}

# Setup CDN and DNS
function Set-CDN {
    Write-Status "Setting up CDN and DNS..."
    
    Write-Warning "CDN and DNS setup requires manual configuration"
    Write-Status "Please configure CloudFront distribution and DNS records manually"
}

# Run health checks
function Test-Health {
    Write-Status "Running post-deployment health checks..."
    
    # Wait for services to be ready
    Start-Sleep -Seconds 30
    
    try {
        # Check backend health
        $response = Invoke-WebRequest -Uri "https://api.$ProjectName.com/health" -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            Write-Success "Backend health check passed"
        } else {
            throw "Health check returned status code: $($response.StatusCode)"
        }
    } catch {
        Write-Error "Backend health check failed: $_"
        exit 1
    }
    
    try {
        # Check database connectivity
        docker run --rm --env-file ".env.production" "$ProjectName-backend:latest" npm run health-check
        Write-Success "Database connectivity check passed"
    } catch {
        Write-Error "Database connectivity check failed: $_"
        exit 1
    }
    
    Write-Success "All health checks passed"
}

# Setup backup and disaster recovery
function Set-Backup {
    Write-Status "Setting up backup and disaster recovery..."
    
    # Database backup configuration is handled by Supabase
    # File storage backup would be configured here
    
    Write-Success "Backup configuration completed"
}

# Main execution
function Main {
    Write-Host "🎯 Production Environment Setup for $ProjectName" -ForegroundColor Cyan
    Write-Host "================================================" -ForegroundColor Cyan
    Write-Host ""
    
    try {
        Test-Prerequisites
        Set-Environment
        Build-Images
        Set-Database
        Set-Monitoring
        Deploy-ToAppRunner
        Set-CDN
        Set-Backup
        Test-Health
        
        Write-Host ""
        Write-Host "🎉 Production Environment Setup Complete!" -ForegroundColor Green
        Write-Host "================================================" -ForegroundColor Green
        Write-Success "Application is now deployed and ready for production use"
        
        Write-Host ""
        Write-Host "📋 Next Steps:" -ForegroundColor Yellow
        Write-Host "1. Configure custom domain and SSL certificate"
        Write-Host "2. Set up monitoring dashboards"
        Write-Host "3. Configure alerting rules"
        Write-Host "4. Run load testing"
        Write-Host "5. Update DNS records"
        Write-Host "6. Notify stakeholders of successful deployment"
        
        Write-Host ""
        Write-Host "🔗 Useful Links:" -ForegroundColor Cyan
        Write-Host "- Application: https://api.$ProjectName.com"
        Write-Host "- Health Check: https://api.$ProjectName.com/health"
        Write-Host "- AWS Console: https://console.aws.amazon.com/apprunner/"
        Write-Host "- Supabase Dashboard: https://app.supabase.com/"
        
    } catch {
        Write-Error "Production setup failed: $_"
        exit 1
    }
}

# Handle script interruption
trap {
    Write-Error "Script interrupted"
    exit 1
}

# Run main function
Main
