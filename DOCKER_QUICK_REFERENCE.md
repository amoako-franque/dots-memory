# Docker Quick Reference

Quick commands for common Docker operations.

## Development

```bash
# Start development environment
docker compose -f docker-compose.dev.yml up

# Start in background
docker compose -f docker-compose.dev.yml up -d

# Stop services
docker compose -f docker-compose.dev.yml down

# View logs
docker compose -f docker-compose.dev.yml logs -f

# Rebuild services
docker compose -f docker-compose.dev.yml build

# Restart a service
docker compose -f docker-compose.dev.yml restart backend
```

## Production

```bash
# Start production environment
docker compose -f docker-compose.prod.yml up -d

# Stop services
docker compose -f docker-compose.prod.yml down

# View logs
docker compose -f docker-compose.prod.yml logs -f

# Rebuild and restart
docker compose -f docker-compose.prod.yml up -d --build

# Run migrations
docker compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy
```

## Common Operations

```bash
# View running containers
docker ps

# View all containers (including stopped)
docker ps -a

# View container logs
docker logs <container-name>

# Execute command in container
docker exec -it <container-name> sh

# View resource usage
docker stats

# Clean up unused resources
docker system prune -a
```

## Service URLs

### Development
- Frontend: http://localhost:3000
- Backend: http://localhost:30700
- PostgreSQL: localhost:5432
- Redis: localhost:6379

### Production
- Frontend: http://localhost (port 80)
- Backend: http://localhost:30700

### OrbStack Domains (Development)
- Frontend: http://frontend.dots-memory.orb.local
- Backend: http://backend.dots-memory.orb.local

### OrbStack Domains (Production)
- Frontend: http://dots-memory.orb.local
- Backend: http://api.dots-memory.orb.local

