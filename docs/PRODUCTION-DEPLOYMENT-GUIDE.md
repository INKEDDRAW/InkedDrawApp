# Production Deployment Guide

## Overview

This guide covers the complete production deployment setup for Inked Draw, including containerization, CI/CD pipeline, monitoring, and scaling strategies.

## Architecture

### Production Infrastructure
- **Frontend**: React application served by Nginx
- **Backend**: NestJS API running on AWS App Runner
- **Database**: Supabase PostgreSQL with real-time capabilities
- **Cache**: Redis for session management and caching
- **CDN**: CloudFront for static asset delivery
- **Monitoring**: Prometheus + Grafana for metrics and alerting
- **CI/CD**: GitHub Actions for automated deployment

### Container Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Nginx LB      │    │   Frontend      │    │   Backend       │
│   (Port 80/443) │────│   (Port 8080)   │────│   (Port 3000)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌─────────────────┐    ┌─────────────────┐
         │              │     Redis       │    │   Supabase      │
         └──────────────│   (Port 6379)   │    │   PostgreSQL    │
                        └─────────────────┘    └─────────────────┘
```

## Prerequisites

### Required Software
- Docker 20.10+
- Docker Compose 2.0+
- Node.js 18+
- AWS CLI 2.0+
- Git

### Required Accounts
- AWS Account (for App Runner, S3, CloudFront)
- Supabase Account (for database and auth)
- GitHub Account (for CI/CD)
- PostHog Account (for analytics)
- Domain registrar (for custom domain)

## Environment Configuration

### 1. Production Environment Variables

Copy `.env.production.example` to `.env.production` and configure:

```bash
# Core Configuration
NODE_ENV=production
PORT=3000
DOMAIN_NAME=yourdomain.com

# Database (Supabase)
DATABASE_URL=postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
SUPABASE_URL=https://[project-ref].supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Security
JWT_SECRET=your_super_secure_jwt_secret_minimum_32_characters
CORS_ORIGIN=https://yourdomain.com

# Redis
REDIS_URL=redis://redis:6379
REDIS_PASSWORD=your_secure_redis_password

# AI Services
GOOGLE_VISION_API_KEY=your_google_vision_api_key
AWS_REKOGNITION_ACCESS_KEY=your_aws_access_key
AWS_REKOGNITION_SECRET_KEY=your_aws_secret_key

# Analytics
POSTHOG_API_KEY=your_posthog_api_key
POSTHOG_HOST=https://app.posthog.com
```

### 2. GitHub Secrets Configuration

Configure the following secrets in your GitHub repository:

```bash
# AWS Configuration
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
AWS_REGION=us-east-1
APP_RUNNER_SERVICE_ARN=arn:aws:apprunner:region:account:service/name/id

# Database
DATABASE_URL=your_production_database_url
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Security
JWT_SECRET=your_jwt_secret

# Frontend Deployment
S3_BUCKET_NAME=your_s3_bucket_name
CLOUDFRONT_DISTRIBUTION_ID=your_cloudfront_distribution_id

# Monitoring
GRAFANA_PASSWORD=your_grafana_password
SLACK_WEBHOOK_URL=your_slack_webhook_url

# Application URLs
BACKEND_URL=https://your-backend-domain.com
FRONTEND_URL=https://your-frontend-domain.com
```

## Deployment Methods

### Method 1: Docker Compose (Recommended for VPS)

1. **Prepare Environment**
   ```bash
   # Clone repository
   git clone https://github.com/your-org/inked-draw.git
   cd inked-draw
   
   # Copy and configure environment
   cp .env.production.example .env.production
   # Edit .env.production with your values
   ```

2. **Deploy with Script**
   ```bash
   # Make script executable
   chmod +x scripts/deploy-prod.sh
   
   # Deploy
   ./scripts/deploy-prod.sh deploy
   ```

3. **Verify Deployment**
   ```bash
   # Check service status
   ./scripts/deploy-prod.sh status
   
   # View logs
   ./scripts/deploy-prod.sh logs
   
   # Health check
   ./scripts/deploy-prod.sh health-check
   ```

### Method 2: AWS App Runner (Recommended for Production)

1. **Setup AWS App Runner Service**
   ```bash
   # Create App Runner service
   aws apprunner create-service \
     --service-name inked-draw-backend \
     --source-configuration file://apprunner.yaml
   ```

2. **Deploy Frontend to S3 + CloudFront**
   ```bash
   # Build frontend
   cd frontend
   npm run build
   
   # Deploy to S3
   aws s3 sync dist/ s3://your-bucket-name --delete
   
   # Invalidate CloudFront
   aws cloudfront create-invalidation \
     --distribution-id YOUR_DISTRIBUTION_ID \
     --paths "/*"
   ```

3. **Configure CI/CD**
   - Push to main branch triggers automatic deployment
   - GitHub Actions handles testing, building, and deployment
   - Rollback capability included

### Method 3: Kubernetes (Advanced)

For high-scale deployments, Kubernetes manifests are available in the `k8s/` directory.

## SSL/TLS Configuration

### 1. Obtain SSL Certificate

```bash
# Using Let's Encrypt with Certbot
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# Copy certificates to nginx directory
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem nginx/ssl/key.pem
```

### 2. Configure Auto-Renewal

```bash
# Add to crontab
0 12 * * * /usr/bin/certbot renew --quiet && docker-compose -f docker-compose.prod.yml restart nginx
```

## Monitoring Setup

### 1. Prometheus Configuration

Prometheus is configured to scrape metrics from:
- Backend API (`/metrics` endpoint)
- Redis
- Nginx
- System metrics (via node-exporter)

### 2. Grafana Dashboards

Access Grafana at `http://your-domain:3001`:
- Default login: `admin` / `your_grafana_password`
- Pre-configured dashboards for application metrics
- Alert rules for critical issues

### 3. Alert Configuration

Alerts are configured for:
- High error rates (>10% for 5 minutes)
- High response times (>1s 95th percentile)
- Service downtime
- High resource usage (CPU >80%, Memory >80%)
- Content moderation queue buildup

## Scaling Strategies

### Horizontal Scaling

1. **Backend Scaling**
   ```bash
   # Scale backend instances
   docker-compose -f docker-compose.prod.yml up -d --scale backend=3
   ```

2. **Load Balancer Configuration**
   - Nginx configured with upstream load balancing
   - Health checks ensure traffic only goes to healthy instances
   - Session affinity handled by Redis

### Vertical Scaling

1. **Resource Limits**
   ```yaml
   # In docker-compose.prod.yml
   deploy:
     resources:
       limits:
         cpus: '2.0'
         memory: 2G
   ```

2. **Database Scaling**
   - Supabase handles database scaling automatically
   - Consider read replicas for high-read workloads

## Performance Optimization

### 1. Caching Strategy

- **Redis**: Session storage, API response caching
- **CDN**: Static asset delivery via CloudFront
- **Browser Caching**: Optimized cache headers for static assets

### 2. Database Optimization

- **Connection Pooling**: Configured in backend
- **Query Optimization**: Indexes on frequently queried columns
- **Real-time Subscriptions**: Efficient Supabase real-time queries

### 3. Asset Optimization

- **Image Compression**: Automatic optimization in upload pipeline
- **Bundle Splitting**: Code splitting in frontend build
- **Gzip Compression**: Enabled in Nginx configuration

## Security Considerations

### 1. Network Security

- **HTTPS Only**: All traffic encrypted with TLS 1.2+
- **CORS Configuration**: Restricted to production domains
- **Rate Limiting**: API and authentication endpoints protected

### 2. Application Security

- **JWT Tokens**: Secure authentication with short expiry
- **Input Validation**: All inputs validated and sanitized
- **SQL Injection Protection**: Parameterized queries only
- **XSS Protection**: Content Security Policy headers

### 3. Infrastructure Security

- **Container Security**: Non-root users, minimal base images
- **Secret Management**: Environment variables, no hardcoded secrets
- **Regular Updates**: Automated security updates for base images

## Backup and Recovery

### 1. Database Backups

Supabase provides automatic backups:
- Point-in-time recovery up to 7 days
- Daily backups retained for 30 days
- Manual backup triggers available

### 2. Application Backups

```bash
# Backup application state
./scripts/deploy-prod.sh backup

# Restore from backup
./scripts/deploy-prod.sh restore backup_20231220_143022
```

### 3. Disaster Recovery

- **RTO**: 15 minutes (Recovery Time Objective)
- **RPO**: 1 hour (Recovery Point Objective)
- **Automated failover**: Health checks trigger container restart
- **Manual failover**: Documented procedures for major incidents

## Troubleshooting

### Common Issues

1. **Service Won't Start**
   ```bash
   # Check logs
   docker-compose -f docker-compose.prod.yml logs service-name
   
   # Check resource usage
   docker stats
   ```

2. **Database Connection Issues**
   ```bash
   # Test database connectivity
   docker-compose -f docker-compose.prod.yml exec backend npm run test:supabase
   ```

3. **High Memory Usage**
   ```bash
   # Check memory usage by service
   docker stats --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"
   ```

### Health Checks

All services include health checks:
- **Backend**: HTTP health endpoint
- **Frontend**: Nginx status check
- **Redis**: Redis ping command
- **Database**: Connection test

### Log Analysis

Centralized logging available:
```bash
# View all logs
docker-compose -f docker-compose.prod.yml logs -f

# View specific service logs
docker-compose -f docker-compose.prod.yml logs -f backend

# Search logs
docker-compose -f docker-compose.prod.yml logs | grep ERROR
```

## Maintenance

### Regular Tasks

1. **Weekly**
   - Review monitoring dashboards
   - Check error logs
   - Verify backup integrity

2. **Monthly**
   - Update dependencies
   - Review security alerts
   - Performance optimization review

3. **Quarterly**
   - Disaster recovery testing
   - Security audit
   - Capacity planning review

### Update Procedures

1. **Application Updates**
   ```bash
   # Pull latest changes
   git pull origin main
   
   # Deploy with rollback capability
   ./scripts/deploy-prod.sh deploy
   ```

2. **Security Updates**
   ```bash
   # Update base images
   docker-compose -f docker-compose.prod.yml pull
   
   # Rebuild and deploy
   ./scripts/deploy-prod.sh deploy
   ```

## Support and Monitoring

### Monitoring URLs

- **Application**: https://yourdomain.com
- **API Health**: https://api.yourdomain.com/health
- **Grafana**: https://yourdomain.com:3001
- **Prometheus**: https://yourdomain.com:9090

### Alert Channels

- **Slack**: Automated alerts for critical issues
- **Email**: Daily summary reports
- **PagerDuty**: 24/7 incident response (optional)

This production deployment guide ensures a robust, scalable, and maintainable deployment of Inked Draw with enterprise-grade reliability and security.
