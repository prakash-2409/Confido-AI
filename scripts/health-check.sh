#!/bin/bash

# Career AI SaaS - Health Check Script
# Usage: ./scripts/health-check.sh

set -e

echo "🔍 Career AI SaaS - Health Check"
echo "================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

check_service() {
    local name=$1
    local url=$2
    local response
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null || echo "000")
    
    if [ "$response" == "200" ]; then
        echo -e "  ${GREEN}✓${NC} $name: UP (HTTP $response)"
        return 0
    else
        echo -e "  ${RED}✗${NC} $name: DOWN (HTTP $response)"
        return 1
    fi
}

check_container() {
    local name=$1
    local container=$2
    
    if docker ps --format '{{.Names}}' | grep -q "^${container}$"; then
        echo -e "  ${GREEN}✓${NC} $name container: Running"
        return 0
    else
        echo -e "  ${RED}✗${NC} $name container: Not running"
        return 1
    fi
}

# Check containers
echo "📦 Containers:"
check_container "MongoDB" "career-ai-mongodb"
check_container "ML Service" "career-ai-ml"
check_container "Backend" "career-ai-backend"
check_container "Frontend" "career-ai-frontend"
echo ""

# Check HTTP endpoints
echo "🌐 HTTP Endpoints:"
check_service "Backend API" "http://localhost:5000/health"
check_service "ML Service" "http://localhost:8000/health"
check_service "Frontend" "http://localhost:3000"
echo ""

# Check MongoDB connection
echo "🗄️  Database:"
if docker exec career-ai-mongodb mongosh --eval "db.adminCommand('ping')" --quiet 2>/dev/null | grep -q "ok"; then
    echo -e "  ${GREEN}✓${NC} MongoDB: Connected"
else
    echo -e "  ${RED}✗${NC} MongoDB: Not connected"
fi
echo ""

# Memory usage
echo "💾 Resource Usage:"
docker stats --no-stream --format "  {{.Name}}: {{.CPUPerc}} CPU, {{.MemUsage}}" 2>/dev/null | grep career-ai || echo "  Unable to get stats"
echo ""

echo "================================="
echo "Health check complete"
