# Development Guide

This guide provides instructions for running the Dots Memory application in development mode with hot-reload using Docker and Docker Compose on OrbStack.

## Quick Start

### Prerequisites

1. **OrbStack** installed and running
2. **Docker** and **Docker Compose** (included with OrbStack)
3. **Node.js 18+** (optional, for local development without Docker)

### Start Development Environment

```bash
# Clone the repository (if not already done)
git clone <your-repository-url>
cd memory

# Start all services in development mode
docker compose -f docker-compose.dev.yml up
```

This will start:
- PostgreSQL database on port `5432`
- Redis cache on port `6379`
- Backend API with hot-reload on port `30700`
- Frontend with Vite dev server on port `3000`

### Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:30700
- **OrbStack Domains**:
  - Frontend: http://frontend.dots-memory.orb.local
  - Backend: http://backend.dots-memory.orb.local

## Development Workflow

### Starting Services

```bash
# Start in foreground (see logs)
docker compose -f docker-compose.dev.yml up

# Start in background
docker compose -f docker-compose.dev.yml up -d

# Start specific services
docker compose -f docker-compose.dev.yml up postgres redis
docker compose -f docker-compose.dev.yml up backend frontend
```

### Stopping Services

```bash
# Stop all services
docker compose -f docker-compose.dev.yml down

# Stop and remove volumes (clean slate)
docker compose -f docker-compose.dev.yml down -v
```

### Viewing Logs

```bash
# All services
docker compose -f docker-compose.dev.yml logs -f

# Specific service
docker compose -f docker-compose.dev.yml logs -f backend
docker compose -f docker-compose.dev.yml logs -f frontend

# Last 50 lines
docker compose -f docker-compose.dev.yml logs --tail=50 backend
```

### Rebuilding Services

```bash
# Rebuild all services
docker compose -f docker-compose.dev.yml build

# Rebuild specific service
docker compose -f docker-compose.dev.yml build backend

# Rebuild and restart
docker compose -f docker-compose.dev.yml up -d --build
```

## Hot Reload

Both backend and frontend support hot-reload:

### Backend Hot Reload

- Uses `ts-node-dev` for TypeScript hot-reload
- Changes to `.ts` files automatically restart the server
- Located in `backend/src/`

### Frontend Hot Reload

- Uses Vite's HMR (Hot Module Replacement)
- Changes to `.tsx`, `.ts`, `.css` files update instantly
- Located in `frontend/src/`

## Database Management

### Running Migrations

```bash
# Run migrations
docker compose -f docker-compose.dev.yml exec backend npx prisma migrate dev

# Generate Prisma Client
docker compose -f docker-compose.dev.yml exec backend npx prisma generate

# Open Prisma Studio
docker compose -f docker-compose.dev.yml exec backend npx prisma studio
```

### Accessing Database

```bash
# Connect to PostgreSQL
docker compose -f docker-compose.dev.yml exec postgres psql -U postgres -d dots_memory

# Connect to Redis
docker compose -f docker-compose.dev.yml exec redis redis-cli
```

### Resetting Database

```bash
# Reset database (WARNING: Deletes all data)
docker compose -f docker-compose.dev.yml down -v
docker compose -f docker-compose.dev.yml up -d postgres
# Wait for postgres to be ready, then run migrations
docker compose -f docker-compose.dev.yml exec backend npx prisma migrate dev
```

## Environment Variables

Create a `.env` file in the root directory for development:

```env
# Database (defaults work for dev)
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=dots_memory

# Redis (no password in dev)
REDIS_PASSWORD=

# JWT Secrets (use simple values for dev)
JWT_SECRET=dev-secret-change-in-production
JWT_REFRESH_SECRET=dev-refresh-secret-change-in-production

# Application URLs
FRONTEND_URL=http://localhost:3000
VITE_API_URL=http://localhost:30700/api/v1

# Logging
LOG_LEVEL=debug

# Add other variables as needed for your services
```

## Development Tips

### 1. Container Shell Access

```bash
# Backend container
docker compose -f docker-compose.dev.yml exec backend sh

# Frontend container
docker compose -f docker-compose.dev.yml exec frontend sh

# Database container
docker compose -f docker-compose.dev.yml exec postgres sh
```

### 2. Installing New Dependencies

```bash
# Backend
docker compose -f docker-compose.dev.yml exec backend npm install <package>

# Or edit package.json and rebuild
docker compose -f docker-compose.dev.yml build backend

# Frontend
docker compose -f docker-compose.dev.yml exec frontend npm install <package>
```

### 3. Running Tests

```bash
# Backend tests
docker compose -f docker-compose.dev.yml exec backend npm test

# Frontend tests (if configured)
docker compose -f docker-compose.dev.yml exec frontend npm test
```

### 4. Code Formatting and Linting

```bash
# Backend linting
docker compose -f docker-compose.dev.yml exec backend npm run lint

# Frontend linting
docker compose -f docker-compose.dev.yml exec frontend npm run lint
```

### 5. Debugging

#### Backend Debugging

```bash
# View backend logs
docker compose -f docker-compose.dev.yml logs -f backend

# Check if backend is running
curl http://localhost:30700/health
```

#### Frontend Debugging

- Open browser DevTools (F12)
- Check Network tab for API calls
- Check Console for errors
- Vite HMR status shown in terminal

### 6. Port Conflicts

If ports are already in use:

```bash
# Check what's using the port
lsof -i :30700
lsof -i :3000
lsof -i :5432

# Change ports in docker-compose.dev.yml if needed
```

## File Structure

```
memory/
├── backend/
│   ├── src/              # TypeScript source files
│   ├── dist/             # Compiled JavaScript (generated)
│   ├── prisma/           # Database schema and migrations
│   ├── uploads/          # User uploads
│   ├── logs/             # Application logs
│   ├── Dockerfile        # Production Dockerfile
│   └── Dockerfile.dev    # Development Dockerfile
├── frontend/
│   ├── src/              # React source files
│   ├── dist/             # Built files (generated)
│   ├── Dockerfile        # Production Dockerfile
│   └── Dockerfile.dev    # Development Dockerfile
├── docker-compose.dev.yml    # Development compose file
└── docker-compose.prod.yml   # Production compose file
```

## Troubleshooting

### Services Won't Start

```bash
# Check logs
docker compose -f docker-compose.dev.yml logs

# Check if ports are available
lsof -i :30700
lsof -i :3000

# Restart services
docker compose -f docker-compose.dev.yml restart
```

### Hot Reload Not Working

```bash
# Rebuild containers
docker compose -f docker-compose.dev.yml up -d --build

# Check volume mounts
docker compose -f docker-compose.dev.yml config
```

### Database Connection Issues

```bash
# Check if postgres is running
docker compose -f docker-compose.dev.yml ps postgres

# Check postgres logs
docker compose -f docker-compose.dev.yml logs postgres

# Test connection
docker compose -f docker-compose.dev.yml exec backend node -e "console.log(process.env.DATABASE_URL)"
```

### Permission Issues

```bash
# Fix uploads directory
sudo chown -R $USER:$USER backend/uploads

# Fix logs directory
sudo chown -R $USER:$USER backend/logs
```

### Clear Everything and Start Fresh

```bash
# Stop and remove everything
docker compose -f docker-compose.dev.yml down -v

# Remove images (optional)
docker compose -f docker-compose.dev.yml down --rmi all

# Start fresh
docker compose -f docker-compose.dev.yml up --build
```

## VS Code Integration

### Recommended Extensions

- Docker
- Remote - Containers
- Prisma

### Debugging in VS Code

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "attach",
      "name": "Attach to Backend",
      "address": "localhost",
      "port": 9229,
      "localRoot": "${workspaceFolder}/backend",
      "remoteRoot": "/app",
      "protocol": "inspector"
    }
  ]
}
```

## Performance Tips

1. **Use Named Volumes for node_modules**: Already configured in docker-compose.dev.yml
2. **Exclude node_modules from File Watching**: Use `.dockerignore`
3. **Use OrbStack's Fast File Sharing**: Already optimized for macOS
4. **Monitor Resource Usage**: `docker stats`

## Next Steps

- Read [DEPLOYMENT.md](./DEPLOYMENT.md) for production deployment
- Check API documentation
- Review code style guidelines
- Join team communication channels

---

**Happy Coding! 🚀**

