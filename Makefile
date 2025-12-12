.PHONY: help install dev build start stop restart clean logs test lint migrate migrate-reset db-reset docker-build docker-up docker-down docker-logs docker-clean

# Variables
# OrbStack uses standard docker compose (no hyphen) - works with both
DOCKER_COMPOSE = docker compose
DOCKER_COMPOSE_PROD = docker compose -f docker-compose.prod.yml
BACKEND_DIR = backend
FRONTEND_DIR = frontend

# Colors for output
GREEN = \033[0;32m
YELLOW = \033[0;33m
RED = \033[0;31m
NC = \033[0m # No Color

help: ## Show this help message
	@echo "$(GREEN)Available commands:$(NC)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(YELLOW)%-20s$(NC) %s\n", $$1, $$2}'

# Development Commands
install: ## Install dependencies for both backend and frontend
	@echo "$(GREEN)Installing backend dependencies...$(NC)"
	cd $(BACKEND_DIR) && npm install
	@echo "$(GREEN)Installing frontend dependencies...$(NC)"
	cd $(FRONTEND_DIR) && npm install
	@echo "$(GREEN)Generating Prisma client...$(NC)"
	cd $(BACKEND_DIR) && npx prisma generate

dev: ## Start development servers (backend and frontend)
	@echo "$(GREEN)Starting development servers...$(NC)"
	@echo "$(YELLOW)Backend will run on http://localhost:30700$(NC)"
	@echo "$(YELLOW)Frontend will run on http://localhost:5173$(NC)"
	@echo "$(YELLOW)Press Ctrl+C to stop$(NC)"
	@trap 'kill 0' EXIT; \
	cd $(BACKEND_DIR) && npm run dev & \
	cd $(FRONTEND_DIR) && npm run dev & \
	wait

dev-backend: ## Start only backend development server
	@echo "$(GREEN)Starting backend development server...$(NC)"
	@echo "$(YELLOW)Backend will run on http://localhost:30700$(NC)"
	cd $(BACKEND_DIR) && npm run dev

dev-frontend: ## Start only frontend development server
	@echo "$(GREEN)Starting frontend development server...$(NC)"
	@echo "$(YELLOW)Frontend will run on http://localhost:5173$(NC)"
	cd $(FRONTEND_DIR) && npm run dev

# Build Commands
build: ## Build both backend and frontend for production
	@echo "$(GREEN)Building backend...$(NC)"
	cd $(BACKEND_DIR) && npm run build
	@echo "$(GREEN)Building frontend...$(NC)"
	cd $(FRONTEND_DIR) && npm run build
	@echo "$(GREEN)Build complete!$(NC)"

build-backend: ## Build only backend
	@echo "$(GREEN)Building backend...$(NC)"
	cd $(BACKEND_DIR) && npm run build

build-frontend: ## Build only frontend
	@echo "$(GREEN)Building frontend...$(NC)"
	cd $(FRONTEND_DIR) && npm run build

# Start Commands
start: ## Start production servers (requires build first)
	@echo "$(GREEN)Starting production servers...$(NC)"
	@echo "$(YELLOW)Backend will run on http://localhost:30700$(NC)"
	@trap 'kill 0' EXIT; \
	cd $(BACKEND_DIR) && npm start & \
	wait

start-backend: ## Start only backend production server
	@echo "$(GREEN)Starting backend production server...$(NC)"
	@echo "$(YELLOW)Backend will run on http://localhost:30700$(NC)"
	cd $(BACKEND_DIR) && npm start

# Database Commands
migrate: ## Run database migrations
	@echo "$(GREEN)Running database migrations...$(NC)"
	cd $(BACKEND_DIR) && npx prisma migrate dev

migrate-deploy: ## Deploy migrations (for production)
	@echo "$(GREEN)Deploying database migrations...$(NC)"
	cd $(BACKEND_DIR) && npx prisma migrate deploy

migrate-reset: ## Reset database (WARNING: This will delete all data)
	@echo "$(RED)WARNING: This will delete all data!$(NC)"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		cd $(BACKEND_DIR) && npx prisma migrate reset --force; \
	fi

db-reset: migrate-reset ## Alias for migrate-reset

db-studio: ## Open Prisma Studio to view/edit database
	@echo "$(GREEN)Opening Prisma Studio...$(NC)"
	cd $(BACKEND_DIR) && npx prisma studio

db-generate: ## Generate Prisma Client
	@echo "$(GREEN)Generating Prisma Client...$(NC)"
	cd $(BACKEND_DIR) && npx prisma generate

# Docker Commands
docker-build: ## Build Docker images
	@echo "$(GREEN)Building Docker images...$(NC)"
	$(DOCKER_COMPOSE) build

docker-up: ## Start Docker containers (development)
	@echo "$(GREEN)Starting Docker containers...$(NC)"
	$(DOCKER_COMPOSE) up -d
	@echo "$(GREEN)Containers started!$(NC)"
	@sleep 3
	@echo ""
	@echo "$(GREEN)=== Service URLs ===$(NC)"
	@echo "$(YELLOW)Backend: http://localhost:30700$(NC)"
	@if command -v orbctl >/dev/null 2>&1; then \
		FRONTEND_URL=$$(orbctl url dots-memory-frontend 2>/dev/null || echo ""); \
		if [ -n "$$FRONTEND_URL" ]; then \
			echo "$(GREEN)Frontend (OrbStack): $$FRONTEND_URL$(NC)"; \
			echo "$(YELLOW)Frontend (Local): http://localhost:80$(NC)"; \
			echo ""; \
			echo "$(GREEN)Updating backend FRONTEND_URL environment...$(NC)"; \
			$(DOCKER_COMPOSE) stop backend 2>/dev/null || true; \
			FRONTEND_URL=$$FRONTEND_URL $(DOCKER_COMPOSE) up -d backend 2>/dev/null || true; \
			echo "$(GREEN)Backend restarted with OrbStack frontend URL$(NC)"; \
		else \
			echo "$(YELLOW)Frontend: http://localhost:80$(NC)"; \
			echo "$(YELLOW)Note: OrbStack URL not available yet. Run 'make docker-urls' after containers are ready$(NC)"; \
		fi; \
	else \
		echo "$(YELLOW)Frontend: http://localhost:80$(NC)"; \
		echo "$(YELLOW)Note: Install OrbStack and 'orbctl' for automatic URL generation$(NC)"; \
	fi
	@echo ""
	@echo "$(GREEN)Run 'make docker-urls' to get/update OrbStack URLs$(NC)"
	@echo "$(GREEN)Run 'make docker-logs' to view logs$(NC)"

docker-urls: ## Get and display OrbStack URLs for services
	@if [ -f scripts/get-orbstack-url.sh ]; then \
		./scripts/get-orbstack-url.sh; \
	else \
		echo "$(GREEN)=== Service URLs ===$(NC)"; \
		if command -v orbctl >/dev/null 2>&1; then \
			echo "$(YELLOW)Backend: http://localhost:30700$(NC)"; \
			FRONTEND_URL=$$(orbctl url dots-memory-frontend 2>/dev/null || echo ""); \
			if [ -n "$$FRONTEND_URL" ]; then \
				echo "$(GREEN)Frontend (OrbStack): $$FRONTEND_URL$(NC)"; \
				echo "$(YELLOW)Frontend (Local): http://localhost:80$(NC)"; \
				echo ""; \
				echo "$(GREEN)Updating backend with OrbStack frontend URL...$(NC)"; \
				FRONTEND_URL=$$FRONTEND_URL $(DOCKER_COMPOSE) stop backend 2>/dev/null || true; \
				FRONTEND_URL=$$FRONTEND_URL $(DOCKER_COMPOSE) up -d backend 2>/dev/null || true; \
				echo "$(GREEN)✓ Backend updated with FRONTEND_URL=$$FRONTEND_URL$(NC)"; \
			else \
				echo "$(YELLOW)Frontend: http://localhost:80$(NC)"; \
				echo "$(RED)Could not get OrbStack URL. Make sure containers are running.$(NC)"; \
			fi; \
		else \
			echo "$(RED)OrbStack CLI (orbctl) not found.$(NC)"; \
			echo "$(YELLOW)Install OrbStack: https://orbstack.dev$(NC)"; \
			echo ""; \
			echo "$(YELLOW)Backend: http://localhost:30700$(NC)"; \
			echo "$(YELLOW)Frontend: http://localhost:80$(NC)"; \
		fi; \
	fi

docker-down: ## Stop Docker containers
	@echo "$(GREEN)Stopping Docker containers...$(NC)"
	$(DOCKER_COMPOSE) down

docker-logs: ## View Docker container logs
	$(DOCKER_COMPOSE) logs -f

docker-logs-backend: ## View backend container logs
	$(DOCKER_COMPOSE) logs -f backend

docker-logs-frontend: ## View frontend container logs
	$(DOCKER_COMPOSE) logs -f frontend

docker-restart: ## Restart Docker containers
	@echo "$(GREEN)Restarting Docker containers...$(NC)"
	$(DOCKER_COMPOSE) restart

docker-clean: ## Stop containers and remove volumes (WARNING: deletes data)
	@echo "$(RED)WARNING: This will delete all container data!$(NC)"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		$(DOCKER_COMPOSE) down -v; \
	fi

# Production Docker Commands
docker-build-prod: ## Build production Docker images
	@echo "$(GREEN)Building production Docker images...$(NC)"
	$(DOCKER_COMPOSE_PROD) build

docker-up-prod: ## Start production Docker containers
	@echo "$(GREEN)Starting production Docker containers...$(NC)"
	$(DOCKER_COMPOSE_PROD) up -d
	@echo "$(GREEN)Production containers started!$(NC)"

docker-down-prod: ## Stop production Docker containers
	@echo "$(GREEN)Stopping production Docker containers...$(NC)"
	$(DOCKER_COMPOSE_PROD) down

docker-logs-prod: ## View production Docker container logs
	$(DOCKER_COMPOSE_PROD) logs -f

docker-restart-prod: ## Restart production Docker containers
	@echo "$(GREEN)Restarting production Docker containers...$(NC)"
	$(DOCKER_COMPOSE_PROD) restart

# Utility Commands
test: ## Run tests
	@echo "$(GREEN)Running tests...$(NC)"
	cd $(BACKEND_DIR) && npm test

lint: ## Run linters
	@echo "$(GREEN)Linting backend...$(NC)"
	cd $(BACKEND_DIR) && npm run lint
	@echo "$(GREEN)Linting frontend...$(NC)"
	cd $(FRONTEND_DIR) && npm run lint

lint-fix: ## Fix linting issues
	@echo "$(GREEN)Fixing linting issues...$(NC)"
	cd $(BACKEND_DIR) && npm run lint -- --fix || true
	cd $(FRONTEND_DIR) && npm run lint -- --fix || true

clean: ## Clean build artifacts and node_modules
	@echo "$(GREEN)Cleaning build artifacts...$(NC)"
	rm -rf $(BACKEND_DIR)/dist $(BACKEND_DIR)/node_modules
	rm -rf $(FRONTEND_DIR)/dist $(FRONTEND_DIR)/node_modules
	@echo "$(GREEN)Clean complete!$(NC)"

clean-build: ## Clean only build artifacts (keep node_modules)
	@echo "$(GREEN)Cleaning build artifacts...$(NC)"
	rm -rf $(BACKEND_DIR)/dist
	rm -rf $(FRONTEND_DIR)/dist
	@echo "$(GREEN)Clean complete!$(NC)"

# Setup Commands
setup: install migrate db-generate ## Complete setup (install, migrate, generate)
	@echo "$(GREEN)Setup complete!$(NC)"
	@echo "$(YELLOW)Run 'make dev' to start development servers$(NC)"

setup-docker: docker-build docker-up ## Setup with Docker
	@echo "$(GREEN)Docker setup complete!$(NC)"
	@echo "$(YELLOW)Run 'make docker-logs' to view logs$(NC)"

# Health Check
health: ## Check health of services
	@echo "$(GREEN)Checking backend health...$(NC)"
	@if curl -sf http://localhost:30700/health > /dev/null 2>&1; then \
		echo "$(GREEN)✓ Backend is healthy (http://localhost:30700)$(NC)"; \
	else \
		echo "$(RED)✗ Backend is not responding on port 30700$(NC)"; \
		echo "$(YELLOW)  Make sure the backend is running: make dev-backend or make docker-up$(NC)"; \
	fi
	@echo "$(GREEN)Checking frontend...$(NC)"
	@if curl -sf http://localhost:80 > /dev/null 2>&1; then \
		echo "$(GREEN)✓ Frontend is running (http://localhost:80)$(NC)"; \
	else \
		echo "$(RED)✗ Frontend is not responding on port 80$(NC)"; \
		echo "$(YELLOW)  Make sure the frontend is running: make dev-frontend or make docker-up$(NC)"; \
	fi
	@echo "$(GREEN)Checking database...$(NC)"
	@if docker ps --format '{{.Names}}' | grep -q 'dots-memory-postgres'; then \
		if docker exec dots-memory-postgres pg_isready -U postgres > /dev/null 2>&1; then \
			echo "$(GREEN)✓ PostgreSQL is healthy$(NC)"; \
		else \
			echo "$(RED)✗ PostgreSQL container exists but is not ready$(NC)"; \
		fi; \
	else \
		echo "$(YELLOW)⚠ PostgreSQL container is not running$(NC)"; \
	fi
	@echo "$(GREEN)Checking Redis...$(NC)"
	@if docker ps --format '{{.Names}}' | grep -q 'dots-memory-redis'; then \
		if docker exec dots-memory-redis redis-cli ping > /dev/null 2>&1; then \
			echo "$(GREEN)✓ Redis is healthy$(NC)"; \
		else \
			echo "$(RED)✗ Redis container exists but is not ready$(NC)"; \
		fi; \
	else \
		echo "$(YELLOW)⚠ Redis container is not running$(NC)"; \
	fi

