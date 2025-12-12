# Production Deployment Guide

This guide provides step-by-step instructions for deploying the Dots Memory application to production using Docker and Docker Compose on OrbStack.

## Prerequisites

1. **OrbStack** installed and running on your macOS system
2. **Docker** and **Docker Compose** (included with OrbStack)
3. **Git** for cloning the repository
4. **Domain name** (optional, for production URLs)
5. **SSL Certificate** (optional, for HTTPS)

## Table of Contents

1. [Initial Setup](#initial-setup)
2. [Environment Configuration](#environment-configuration)
3. [Database Setup](#database-setup)
4. [Building and Starting Services](#building-and-starting-services)
5. [Running Database Migrations](#running-database-migrations)
6. [Verifying Deployment](#verifying-deployment)
7. [Monitoring and Maintenance](#monitoring-and-maintenance)
8. [Troubleshooting](#troubleshooting)
9. [Security Best Practices](#security-best-practices)
10. [Backup and Recovery](#backup-and-recovery)

---

## Initial Setup

### Step 1: Clone the Repository

```bash
git clone <your-repository-url>
cd memory
```

### Step 2: Verify Docker and Docker Compose

```bash
# Check Docker version
docker --version

# Check Docker Compose version
docker compose version

# Verify OrbStack is running
docker info
```

### Step 3: Create Environment File

Create a `.env` file in the root directory with all required environment variables:

```bash
cp .env.example .env  # If you have an example file
# Or create manually
nano .env
```

---

## Environment Configuration

### Required Environment Variables

Create a `.env` file in the project root with the following variables:

```env
# Database Configuration
DB_USER=your_db_user
DB_PASSWORD=your_secure_db_password
DB_NAME=dots_memory

# Redis Configuration
REDIS_PASSWORD=your_secure_redis_password

# JWT Secrets (Generate strong random strings)
JWT_SECRET=your_jwt_secret_min_32_chars
JWT_REFRESH_SECRET=your_jwt_refresh_secret_min_32_chars

# Application URLs
FRONTEND_URL=https://yourdomain.com
VITE_API_URL=https://api.yourdomain.com/api/v1

# Logging
LOG_LEVEL=info

# Email Configuration (SMTP)
SMTP_HOST=smtp.your-provider.com
SMTP_PORT=587
SMTP_SECURE=true
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password
SMTP_FROM=noreply@yourdomain.com

# Cloudinary (if using)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# AWS S3 (if using)
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your_bucket_name

# Payment Providers
PAYSTACK_SECRET_KEY=your_paystack_secret
STRIPE_SECRET_KEY=your_stripe_secret
```

### Generate Secure Secrets

```bash
# Generate JWT secrets
openssl rand -base64 32  # For JWT_SECRET
openssl rand -base64 32  # For JWT_REFRESH_SECRET

# Generate database password
openssl rand -base64 24  # For DB_PASSWORD

# Generate Redis password
openssl rand -base64 24  # For REDIS_PASSWORD
```

### Secure the .env File

```bash
# Set proper permissions
chmod 600 .env

# Add to .gitignore (if not already)
echo ".env" >> .gitignore
```

---

## Database Setup

### Step 1: Start Database Services Only

First, start PostgreSQL and Redis to ensure they're healthy before starting the application:

```bash
docker compose -f docker-compose.prod.yml up -d postgres redis
```

### Step 2: Wait for Services to be Healthy

```bash
# Check service status
docker compose -f docker-compose.prod.yml ps

# Check logs
docker compose -f docker-compose.prod.yml logs postgres
docker compose -f docker-compose.prod.yml logs redis
```

### Step 3: Verify Database Connection

```bash
# Connect to PostgreSQL
docker compose -f docker-compose.prod.yml exec postgres psql -U postgres -d dots_memory

# Test Redis connection
docker compose -f docker-compose.prod.yml exec redis redis-cli -a $REDIS_PASSWORD ping
```

---

## Building and Starting Services

### Step 1: Build Production Images

```bash
# Build all services
docker compose -f docker-compose.prod.yml build

# Or build specific service
docker compose -f docker-compose.prod.yml build backend
docker compose -f docker-compose.prod.yml build frontend
```

### Step 2: Start All Services

```bash
# Start in detached mode
docker compose -f docker-compose.prod.yml up -d

# Or start specific services
docker compose -f docker-compose.prod.yml up -d backend frontend
```

### Step 3: View Service Status

```bash
# List all running containers
docker compose -f docker-compose.prod.yml ps

# View logs
docker compose -f docker-compose.prod.yml logs -f

# View logs for specific service
docker compose -f docker-compose.prod.yml logs -f backend
docker compose -f docker-compose.prod.yml logs -f frontend
```

---

## Running Database Migrations

### Step 1: Run Prisma Migrations

```bash
# Execute migrations inside the backend container
docker compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy

# Or if you need to generate Prisma Client
docker compose -f docker-compose.prod.yml exec backend npx prisma generate
```

### Step 2: Seed Initial Data (if needed)

```bash
# Run seed script (if available)
docker compose -f docker-compose.prod.yml exec backend npm run seed

# Or manually seed subscription plans
docker compose -f docker-compose.prod.yml exec backend node dist/utils/seed-plans.js
```

---

## Verifying Deployment

### Step 1: Check Health Endpoints

```bash
# Backend health check
curl http://localhost:30700/health

# Frontend health check
curl http://localhost/health
```

### Step 2: Test API Endpoints

```bash
# Test public endpoint
curl http://localhost:30700/api/v1/health

# Test with authentication (if needed)
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:30700/api/v1/users/me
```

### Step 3: Access Frontend

Open your browser and navigate to:
- Local: `http://localhost`
- OrbStack domain: `http://dots-memory.orb.local` (if configured)

### Step 4: Verify OrbStack Domains

OrbStack automatically creates local domains. Check:
- Backend: `http://api.dots-memory.orb.local`
- Frontend: `http://dots-memory.orb.local`

---

## Monitoring and Maintenance

### Viewing Logs

```bash
# All services
docker compose -f docker-compose.prod.yml logs -f

# Specific service
docker compose -f docker-compose.prod.yml logs -f backend
docker compose -f docker-compose.prod.yml logs -f frontend

# Last 100 lines
docker compose -f docker-compose.prod.yml logs --tail=100 backend

# Since specific time
docker compose -f docker-compose.prod.yml logs --since 30m backend
```

### Resource Monitoring

```bash
# Container resource usage
docker stats

# Specific container
docker stats dots-memory-backend-prod
docker stats dots-memory-frontend-prod
```

### Service Health Checks

```bash
# Check service health
docker compose -f docker-compose.prod.yml ps

# Inspect container
docker inspect dots-memory-backend-prod
```

### Updating Services

```bash
# Pull latest code
git pull origin main

# Rebuild and restart services
docker compose -f docker-compose.prod.yml up -d --build

# Or restart specific service
docker compose -f docker-compose.prod.yml up -d --build backend
```

### Rolling Updates

```bash
# 1. Build new image
docker compose -f docker-compose.prod.yml build backend

# 2. Stop old container
docker compose -f docker-compose.prod.yml stop backend

# 3. Start new container
docker compose -f docker-compose.prod.yml up -d backend

# 4. Verify health
docker compose -f docker-compose.prod.yml ps backend
```

---

## Troubleshooting

### Common Issues

#### 1. Services Won't Start

```bash
# Check logs
docker compose -f docker-compose.prod.yml logs

# Check container status
docker compose -f docker-compose.prod.yml ps -a

# Restart services
docker compose -f docker-compose.prod.yml restart
```

#### 2. Database Connection Issues

```bash
# Verify database is running
docker compose -f docker-compose.prod.yml ps postgres

# Check database logs
docker compose -f docker-compose.prod.yml logs postgres

# Test connection
docker compose -f docker-compose.prod.yml exec postgres psql -U postgres -c "SELECT 1"
```

#### 3. Port Conflicts

```bash
# Check if ports are in use
lsof -i :30700
lsof -i :80
lsof -i :5432

# Change ports in docker-compose.prod.yml if needed
```

#### 4. Permission Issues

```bash
# Fix uploads directory permissions
docker compose -f docker-compose.prod.yml exec backend chown -R nodejs:nodejs /app/uploads

# Fix logs directory permissions
docker compose -f docker-compose.prod.yml exec backend chown -R nodejs:nodejs /app/logs
```

#### 5. Out of Memory

```bash
# Check memory usage
docker stats

# Increase memory limits in docker-compose.prod.yml
# Or restart OrbStack to free memory
```

### Debugging Commands

```bash
# Enter container shell
docker compose -f docker-compose.prod.yml exec backend sh
docker compose -f docker-compose.prod.yml exec frontend sh

# Check environment variables
docker compose -f docker-compose.prod.yml exec backend env

# Check network connectivity
docker compose -f docker-compose.prod.yml exec backend ping postgres
docker compose -f docker-compose.prod.yml exec backend ping redis
```

---

## Security Best Practices

### 1. Environment Variables

- Never commit `.env` files to version control
- Use strong, randomly generated secrets
- Rotate secrets regularly
- Use different secrets for development and production

### 2. Network Security

- Don't expose database ports publicly (already configured)
- Use internal Docker networks for service communication
- Implement rate limiting (already configured in backend)
- Use HTTPS in production

### 3. Container Security

- Run containers as non-root users (already configured)
- Keep base images updated
- Scan images for vulnerabilities
- Use minimal base images (Alpine Linux)

### 4. Database Security

- Use strong passwords
- Enable SSL/TLS for database connections
- Regular backups
- Limit database access

### 5. Application Security

- Enable CORS properly
- Use Helmet.js (already configured)
- Validate and sanitize all inputs
- Implement proper authentication and authorization

### 6. Monitoring and Logging

- Monitor application logs
- Set up alerts for errors
- Monitor resource usage
- Regular security audits

---

## Backup and Recovery

### Database Backup

```bash
# Create backup
docker compose -f docker-compose.prod.yml exec postgres pg_dump -U postgres dots_memory > backup_$(date +%Y%m%d_%H%M%S).sql

# Or using docker exec directly
docker exec dots-memory-postgres-prod pg_dump -U postgres dots_memory > backup.sql
```

### Restore Database

```bash
# Restore from backup
docker compose -f docker-compose.prod.yml exec -T postgres psql -U postgres dots_memory < backup.sql

# Or using docker exec
docker exec -i dots-memory-postgres-prod psql -U postgres dots_memory < backup.sql
```

### Volume Backup

```bash
# Backup volumes
docker run --rm -v dots-memory-postgres-data:/data -v $(pwd):/backup alpine tar czf /backup/postgres_backup.tar.gz /data
docker run --rm -v dots-memory-backend-uploads:/data -v $(pwd):/backup alpine tar czf /backup/uploads_backup.tar.gz /data
```

### Automated Backup Script

Create a `backup.sh` script:

```bash
#!/bin/bash
BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Database backup
docker compose -f docker-compose.prod.yml exec -T postgres pg_dump -U postgres dots_memory > $BACKUP_DIR/db_$DATE.sql

# Uploads backup
docker run --rm -v dots-memory-backend-uploads:/data -v $(pwd)/$BACKUP_DIR:/backup alpine tar czf /backup/uploads_$DATE.tar.gz /data

echo "Backup completed: $DATE"
```

Make it executable:
```bash
chmod +x backup.sh
```

---

## Production Checklist

Before going live, ensure:

- [ ] All environment variables are set correctly
- [ ] Strong passwords and secrets are generated
- [ ] Database migrations are run
- [ ] Health checks are passing
- [ ] SSL/TLS certificates are configured (if using HTTPS)
- [ ] Domain names are configured
- [ ] Backup strategy is in place
- [ ] Monitoring and logging are set up
- [ ] Security headers are configured
- [ ] Rate limiting is enabled
- [ ] CORS is properly configured
- [ ] Error handling is tested
- [ ] Performance is optimized
- [ ] Documentation is updated

---

## Quick Reference Commands

```bash
# Start services
docker compose -f docker-compose.prod.yml up -d

# Stop services
docker compose -f docker-compose.prod.yml down

# Restart services
docker compose -f docker-compose.prod.yml restart

# View logs
docker compose -f docker-compose.prod.yml logs -f

# Rebuild services
docker compose -f docker-compose.prod.yml up -d --build

# Remove everything (including volumes)
docker compose -f docker-compose.prod.yml down -v

# Scale services (if needed)
docker compose -f docker-compose.prod.yml up -d --scale backend=2
```

---

## Support

For issues or questions:
1. Check the logs: `docker compose -f docker-compose.prod.yml logs`
2. Review this guide's troubleshooting section
3. Check OrbStack documentation
4. Review Docker Compose documentation

---

**Last Updated:** December 2024
**Maintained by:** DevOps Team

