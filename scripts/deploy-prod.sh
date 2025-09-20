#!/bin/bash

# Inked Draw Production Deployment Script
# Automated deployment with health checks and rollback

set -e

# Configuration
DOCKER_COMPOSE_FILE="docker-compose.prod.yml"
BACKUP_DIR="./backups"
LOG_FILE="./logs/deploy.log"
HEALTH_CHECK_TIMEOUT=300
ROLLBACK_TIMEOUT=60

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check if Docker is installed and running
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed"
        exit 1
    fi
    
    if ! docker info &> /dev/null; then
        error "Docker is not running"
        exit 1
    fi
    
    # Check if Docker Compose is installed
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose is not installed"
        exit 1
    fi
    
    # Check if environment file exists
    if [ ! -f .env.production ]; then
        error "Production environment file (.env.production) not found"
        exit 1
    fi
    
    # Create necessary directories
    mkdir -p "$BACKUP_DIR" logs
    
    success "Prerequisites check passed"
}

# Backup current deployment
backup_current_deployment() {
    log "Creating backup of current deployment..."
    
    BACKUP_TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    BACKUP_PATH="$BACKUP_DIR/backup_$BACKUP_TIMESTAMP"
    
    mkdir -p "$BACKUP_PATH"
    
    # Backup Docker images
    docker images --format "table {{.Repository}}:{{.Tag}}" | grep inked-draw > "$BACKUP_PATH/images.txt" || true
    
    # Backup volumes
    docker-compose -f "$DOCKER_COMPOSE_FILE" config --volumes > "$BACKUP_PATH/volumes.txt"
    
    # Backup environment
    cp .env.production "$BACKUP_PATH/"
    
    success "Backup created at $BACKUP_PATH"
    echo "$BACKUP_PATH" > .last_backup
}

# Health check function
health_check() {
    local service_url=$1
    local service_name=$2
    local timeout=${3:-30}
    
    log "Performing health check for $service_name..."
    
    local count=0
    while [ $count -lt $timeout ]; do
        if curl -f -s "$service_url/health" > /dev/null 2>&1; then
            success "$service_name health check passed"
            return 0
        fi
        
        sleep 5
        count=$((count + 5))
        log "Waiting for $service_name to be healthy... ($count/${timeout}s)"
    done
    
    error "$service_name health check failed after ${timeout}s"
    return 1
}

# Deploy services
deploy_services() {
    log "Starting deployment..."
    
    # Load production environment
    export $(cat .env.production | xargs)
    
    # Pull latest images
    log "Pulling latest Docker images..."
    docker-compose -f "$DOCKER_COMPOSE_FILE" pull
    
    # Build and start services
    log "Building and starting services..."
    docker-compose -f "$DOCKER_COMPOSE_FILE" up -d --build
    
    # Wait for services to start
    log "Waiting for services to start..."
    sleep 30
    
    # Health checks
    if ! health_check "http://localhost:3000" "Backend API" 60; then
        error "Backend health check failed"
        return 1
    fi
    
    if ! health_check "http://localhost:8080" "Frontend" 60; then
        error "Frontend health check failed"
        return 1
    fi
    
    # Check Redis
    if ! docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T redis redis-cli ping > /dev/null 2>&1; then
        error "Redis health check failed"
        return 1
    fi
    
    success "All services deployed and healthy"
    return 0
}

# Rollback function
rollback() {
    error "Deployment failed, initiating rollback..."
    
    if [ ! -f .last_backup ]; then
        error "No backup found for rollback"
        exit 1
    fi
    
    BACKUP_PATH=$(cat .last_backup)
    
    if [ ! -d "$BACKUP_PATH" ]; then
        error "Backup directory not found: $BACKUP_PATH"
        exit 1
    fi
    
    log "Rolling back to backup: $BACKUP_PATH"
    
    # Stop current services
    docker-compose -f "$DOCKER_COMPOSE_FILE" down
    
    # Restore environment
    cp "$BACKUP_PATH/.env.production" .
    
    # Restore and start services
    export $(cat .env.production | xargs)
    docker-compose -f "$DOCKER_COMPOSE_FILE" up -d
    
    # Wait and check health
    sleep 30
    
    if health_check "http://localhost:3000" "Backend API" 30 && \
       health_check "http://localhost:8080" "Frontend" 30; then
        success "Rollback completed successfully"
    else
        error "Rollback failed - manual intervention required"
        exit 1
    fi
}

# Cleanup old backups
cleanup_old_backups() {
    log "Cleaning up old backups..."
    
    # Keep only last 5 backups
    cd "$BACKUP_DIR"
    ls -t | tail -n +6 | xargs -r rm -rf
    cd - > /dev/null
    
    success "Old backups cleaned up"
}

# Main deployment process
main() {
    log "Starting Inked Draw production deployment"
    
    # Trap to handle rollback on failure
    trap 'rollback' ERR
    
    check_prerequisites
    backup_current_deployment
    
    if deploy_services; then
        success "Deployment completed successfully!"
        cleanup_old_backups
        
        # Display service status
        log "Service status:"
        docker-compose -f "$DOCKER_COMPOSE_FILE" ps
        
        # Display URLs
        log "Application URLs:"
        log "  Frontend: http://localhost:8080"
        log "  Backend API: http://localhost:3000"
        log "  Redis Commander: http://localhost:8081"
        log "  Prometheus: http://localhost:9090"
        log "  Grafana: http://localhost:3001"
        
    else
        error "Deployment failed"
        exit 1
    fi
}

# Script options
case "${1:-deploy}" in
    "deploy")
        main
        ;;
    "rollback")
        rollback
        ;;
    "health-check")
        health_check "http://localhost:3000" "Backend API" 10
        health_check "http://localhost:8080" "Frontend" 10
        ;;
    "logs")
        docker-compose -f "$DOCKER_COMPOSE_FILE" logs -f "${2:-}"
        ;;
    "status")
        docker-compose -f "$DOCKER_COMPOSE_FILE" ps
        ;;
    "stop")
        log "Stopping services..."
        docker-compose -f "$DOCKER_COMPOSE_FILE" down
        success "Services stopped"
        ;;
    *)
        echo "Usage: $0 {deploy|rollback|health-check|logs|status|stop}"
        echo ""
        echo "Commands:"
        echo "  deploy      - Deploy the application (default)"
        echo "  rollback    - Rollback to previous deployment"
        echo "  health-check - Check service health"
        echo "  logs [service] - View service logs"
        echo "  status      - Show service status"
        echo "  stop        - Stop all services"
        exit 1
        ;;
esac
