#!/bin/bash

# Career AI SaaS - Deployment Script
# Usage: ./scripts/deploy.sh [environment]

set -e

ENVIRONMENT=${1:-production}
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "🚀 Deploying Career AI SaaS to $ENVIRONMENT..."

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed"
        exit 1
    fi
    
    log_info "Prerequisites OK ✓"
}

# Check environment file
check_env() {
    log_info "Checking environment configuration..."
    
    if [ ! -f "$PROJECT_DIR/docker/.env" ]; then
        log_warn ".env file not found, copying from example..."
        cp "$PROJECT_DIR/docker/.env.example" "$PROJECT_DIR/docker/.env"
        log_warn "Please update docker/.env with your actual values!"
        exit 1
    fi
    
    log_info "Environment configuration OK ✓"
}

# Pull latest changes (if using git)
pull_latest() {
    if [ -d "$PROJECT_DIR/.git" ]; then
        log_info "Pulling latest changes..."
        cd "$PROJECT_DIR"
        git pull origin main
    fi
}

# Build and deploy
deploy() {
    log_info "Building and deploying services..."
    
    cd "$PROJECT_DIR/docker"
    
    if [ "$ENVIRONMENT" == "production" ]; then
        docker-compose -f docker-compose.yml -f docker-compose.prod.yml pull
        docker-compose -f docker-compose.yml -f docker-compose.prod.yml build
        docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
    else
        docker-compose build
        docker-compose up -d
    fi
    
    log_info "Services deployed ✓"
}

# Health check
health_check() {
    log_info "Running health checks..."
    
    sleep 10
    
    # Check backend
    if curl -s http://localhost:5000/health > /dev/null; then
        log_info "Backend: ✓"
    else
        log_error "Backend: ✗"
    fi
    
    # Check ML service
    if curl -s http://localhost:8000/health > /dev/null; then
        log_info "ML Service: ✓"
    else
        log_error "ML Service: ✗"
    fi
    
    # Check frontend
    if curl -s http://localhost:3000 > /dev/null; then
        log_info "Frontend: ✓"
    else
        log_error "Frontend: ✗"
    fi
}

# Cleanup old images
cleanup() {
    log_info "Cleaning up old Docker images..."
    docker image prune -f
}

# Main
main() {
    echo ""
    echo "=========================================="
    echo "  Career AI SaaS Deployment"
    echo "  Environment: $ENVIRONMENT"
    echo "=========================================="
    echo ""
    
    check_prerequisites
    check_env
    # pull_latest  # Uncomment if using git
    deploy
    health_check
    cleanup
    
    echo ""
    log_info "🎉 Deployment complete!"
    echo ""
    echo "Services available at:"
    echo "  - Frontend:   http://localhost:3000"
    echo "  - Backend:    http://localhost:5000"
    echo "  - ML Service: http://localhost:8000"
    echo ""
}

main
