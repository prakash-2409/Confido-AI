.PHONY: help build up down logs clean restart dev prod health

# Default target
help:
	@echo "Career AI SaaS - DevOps Commands"
	@echo "================================="
	@echo ""
	@echo "Development:"
	@echo "  make dev          - Start development environment"
	@echo "  make build        - Build all Docker images"
	@echo "  make up           - Start all services (detached)"
	@echo "  make down         - Stop all services"
	@echo "  make restart      - Restart all services"
	@echo ""
	@echo "Production:"
	@echo "  make prod         - Start production environment"
	@echo "  make prod-down    - Stop production environment"
	@echo ""
	@echo "Logs:"
	@echo "  make logs         - View all logs"
	@echo "  make logs-backend - View backend logs"
	@echo "  make logs-frontend- View frontend logs"
	@echo "  make logs-ml      - View ML service logs"
	@echo "  make logs-db      - View MongoDB logs"
	@echo ""
	@echo "Utilities:"
	@echo "  make health       - Check services health"
	@echo "  make clean        - Remove containers and volumes"
	@echo "  make shell-backend- Shell into backend"
	@echo "  make shell-ml     - Shell into ML service"
	@echo "  make db-shell     - MongoDB shell"

# Development
dev:
	cd docker && docker-compose up --build

dev-detached:
	cd docker && docker-compose up --build -d

# Build images
build:
	cd docker && docker-compose build

# Start services (detached)
up:
	cd docker && docker-compose up -d

# Stop services
down:
	cd docker && docker-compose down

# Production
prod:
	cd docker && docker-compose -f docker-compose.yml -f docker-compose.prod.yml up --build -d

prod-down:
	cd docker && docker-compose -f docker-compose.yml -f docker-compose.prod.yml down

# View all logs
logs:
	cd docker && docker-compose logs -f

# Individual service logs
logs-backend:
	docker logs -f career-ai-backend

logs-frontend:
	docker logs -f career-ai-frontend

logs-ml:
	docker logs -f career-ai-ml

logs-db:
	docker logs -f career-ai-mongodb

# Restart services
restart:
	cd docker && docker-compose restart

# Clean everything
clean:
	cd docker && docker-compose down -v --rmi local
	docker system prune -f

# Shell access
shell-backend:
	docker exec -it career-ai-backend sh

shell-ml:
	docker exec -it career-ai-ml bash

shell-frontend:
	docker exec -it career-ai-frontend sh

db-shell:
	docker exec -it career-ai-mongodb mongosh

# Health check
health:
	@echo "🔍 Checking services health..."
	@echo ""
	@echo "Backend API:"
	@curl -s http://localhost:5000/health | python3 -m json.tool 2>/dev/null || echo "  ❌ Backend: DOWN"
	@echo ""
	@echo "ML Service:"
	@curl -s http://localhost:8000/health | python3 -m json.tool 2>/dev/null || echo "  ❌ ML Service: DOWN"
	@echo ""
	@echo "Frontend:"
	@curl -s -o /dev/null -w "  ✅ Frontend: UP (HTTP %{http_code})\n" http://localhost:3000 2>/dev/null || echo "  ❌ Frontend: DOWN"
	@echo ""
	@echo "MongoDB:"
	@docker exec career-ai-mongodb mongosh --eval "db.adminCommand('ping')" --quiet 2>/dev/null && echo "  ✅ MongoDB: UP" || echo "  ❌ MongoDB: DOWN"

# Install dependencies locally
install:
	cd backend && npm install
	cd frontend && npm install
	cd ml-service && pip install -r requirements.txt

# Run tests
test:
	cd backend && npm test
	cd frontend && npm test

# Backup database
backup-db:
	@mkdir -p backups
	docker exec career-ai-mongodb mongodump --out=/dump
	docker cp career-ai-mongodb:/dump ./backups/dump-$$(date +%Y%m%d-%H%M%S)
	@echo "✅ Database backed up to ./backups/"

# Restore database
restore-db:
	@echo "Usage: make restore-db BACKUP=backups/dump-YYYYMMDD-HHMMSS"
	@test -n "$(BACKUP)" || (echo "❌ BACKUP path required" && exit 1)
	docker cp $(BACKUP) career-ai-mongodb:/dump
	docker exec career-ai-mongodb mongorestore /dump
