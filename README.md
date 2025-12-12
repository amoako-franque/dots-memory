# Dots Memory - Collaborative Media Sharing Platform

A production-grade, full-stack platform for creating and sharing collaborative photo/video albums with QR code and NFC support.

## 📑 Table of Contents

- [📚 Documentation Navigation](#-documentation-navigation)
- [🚀 Quick Start](#-quick-start)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [Project Structure](#project-structure)
- [Security Features](#security-features)
- [Environment Variables](#environment-variables)
- [Docker Commands](#docker-commands)
- [Development Workflow](#development-workflow)
- [Troubleshooting](#troubleshooting)
- [Additional Resources](#additional-resources)
- [Support](#support)

## 📚 Documentation Navigation

**New to the project?** Start here:

- **[🚀 Quick Start](#-quick-start)** - Get up and running in minutes
- **[💻 Development Guide](./DEVELOPMENT.md)** - Complete guide for local development with Docker
- **[🚢 Deployment Guide](./DEPLOYMENT.md)** - Step-by-step production deployment instructions
- **[⚡ Docker Quick Reference](./DOCKER_QUICK_REFERENCE.md)** - Quick command cheat sheet

### Documentation Overview

| Document                                                     | Purpose                                                                 | Audience                      |
| ------------------------------------------------------------ | ----------------------------------------------------------------------- | ----------------------------- |
| **[DEVELOPMENT.md](./DEVELOPMENT.md)**                       | Local development setup, hot-reload, debugging, database management     | Developers                    |
| **[DEPLOYMENT.md](./DEPLOYMENT.md)**                         | Production deployment, environment setup, security, monitoring, backups | DevOps, System Administrators |
| **[DOCKER_QUICK_REFERENCE.md](./DOCKER_QUICK_REFERENCE.md)** | Quick command reference for common Docker operations                    | Everyone                      |

---

## 🚀 Quick Start

Choose your path based on what you want to do:

### For Local Development

**Option 1: Docker (Recommended)**
```bash
# Start development environment with hot-reload
docker compose -f docker-compose.dev.yml up
```
👉 See [DEVELOPMENT.md](./DEVELOPMENT.md) for complete development guide

**Option 2: Local Setup**
```bash
# Start database services
docker compose up -d postgres redis

# Backend
cd backend && npm install && npm run dev

# Frontend (new terminal)
cd frontend && npm install && npm run dev
```

### For Production Deployment

```bash
# 1. Configure environment variables
cp .env.example .env
# Edit .env with production values

# 2. Start production services
docker compose -f docker-compose.prod.yml up -d

# 3. Run database migrations
docker compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy
```
👉 See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete deployment guide

### Quick Commands

Need a quick command? Check [DOCKER_QUICK_REFERENCE.md](./DOCKER_QUICK_REFERENCE.md)

---

## Features

### Core Features

- **User Authentication** - JWT-based secure authentication with refresh tokens
- **Album Management** - Create, manage, and share photo/video albums
- **Media Upload** - Direct upload with presigned URLs, automatic thumbnail generation
- **QR Code & NFC** - Unique identifiers for easy album sharing
- **Privacy Controls** - Public, Private, and Unlisted album settings

### Production Features

- **Advanced Logging** - Winston logger with daily log rotation and structured logging
- **Error Handling** - Custom error classes with proper HTTP status codes
- **Request Tracking** - Correlation IDs for distributed tracing
- **Health Checks** - Comprehensive health endpoints for monitoring
- **Rate Limiting** - Built-in protection against abuse (100 req/15min, 5 login/hour)
- **Docker Support** - Multi-stage builds with health checks
- **Security** - Helmet, CORS, input validation, SQL injection protection

## Tech Stack

### Backend

- **Runtime**: Node.js 18+ with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL 15 with Prisma ORM
- **Cache**: Redis 7
- **Authentication**: JWT (jsonwebtoken)
- **Storage**: Local/S3-compatible (Cloudflare R2 ready)
- **Image Processing**: Sharp
- **Logging**: Winston with daily rotation
- **Security**: Helmet, CORS, express-rate-limit
- **Validation**: Zod schemas

### Frontend

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **HTTP Client**: Axios with interceptors
- **Routing**: React Router v6
- **Forms**: React Hook Form + Zod validation
- **Icons**: Lucide React

## Prerequisites

- **Node.js 18+** (for local development without Docker)
- **Docker & Docker Compose** (recommended, included with OrbStack)
- **OrbStack** (recommended for macOS development)
- **npm** or **yarn**

## Installation

### Clone the Repository

```bash
git clone <repository-url>
cd memory
```

### Choose Your Setup Method

**For Development:**
- **Docker (Recommended)**: See [DEVELOPMENT.md](./DEVELOPMENT.md) for complete Docker setup with hot-reload
- **Local Setup**: See [DEVELOPMENT.md](./DEVELOPMENT.md#local-setup) for manual installation

**For Production:**
- See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete production deployment guide

### Quick Setup Summary

**Development with Docker:**
```bash
docker compose -f docker-compose.dev.yml up
```
Access at:
- Frontend: http://localhost:3000
- Backend: http://localhost:30700

**Production with Docker:**
```bash
# Configure .env file first (see DEPLOYMENT.md)
docker compose -f docker-compose.prod.yml up -d
```

👉 **For detailed setup instructions, see [DEVELOPMENT.md](./DEVELOPMENT.md) or [DEPLOYMENT.md](./DEPLOYMENT.md)**

### Health Checks

```bash
# Basic health check
curl http://localhost:30700/health

# Detailed health check (includes DB, memory status)
curl http://localhost:30700/health/detailed

# Kubernetes-style probes
curl http://localhost:30700/ready  # Readiness probe
curl http://localhost:30700/live   # Liveness probe
```

## API Documentation

### Base URL

```
http://localhost:30700/api/v1
```

### Authentication Endpoints

#### Register

```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe"
}
```

#### Login

```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

#### Refresh Token

```http
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "your-refresh-token"
}
```

#### Logout

```http
POST /auth/logout
Authorization: Bearer {accessToken}
```

### User Endpoints

#### Get Profile

```http
GET /users/me
Authorization: Bearer {accessToken}
```

#### Update Profile

```http
PUT /users/me
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "firstName": "Updated",
  "lastName": "Name"
}
```

### Album Endpoints

#### Create Album

```http
POST /albums
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "name": "My Wedding Album",
  "description": "Beautiful memories",
  "settings": {
    "privacy": "PUBLIC",
    "allowVideos": true,
    "maxFileSizeMB": 100,
    "maxVideoLengthSec": 300,
    "requireContributorName": false,
    "enableReactions": true
  },
  "eventDate": "2024-06-15T14:00:00Z",
  "eventLocation": "Central Park, NYC"
}
```

#### List Albums

```http
GET /albums
Authorization: Bearer {accessToken}
```

#### Get Album

```http
GET /albums/{albumId}
Authorization: Bearer {accessToken}
```

#### Update Album

```http
PUT /albums/{albumId}
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "name": "Updated Album Name",
  "description": "Updated description"
}
```

#### Delete Album

```http
DELETE /albums/{albumId}
Authorization: Bearer {accessToken}
```

### Media Endpoints

#### Initiate Upload

```http
POST /media/initiate
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "albumId": "album-uuid",
  "fileName": "photo.jpg",
  "fileType": "image/jpeg",
  "fileSize": 1024000
}
```

#### Upload to Local Storage

```http
POST /media/upload/local
Authorization: Bearer {accessToken}
Content-Type: multipart/form-data

file: [binary]
mediaId: "media-uuid"
```

#### Confirm Upload

```http
POST /media/{mediaId}/confirm
Authorization: Bearer {accessToken}
```

## Testing

### Using Postman

1. Import the Postman collection: `Dots_Memory_API.postman_collection.json`
2. The collection includes automatic token management
3. Run requests in order: Register → Login → Create Album → Upload Media

### Using Shell Scripts

```bash
# Test user endpoints
./verify_user.sh

# Test album endpoints
./verify_album.sh
```

### Manual Testing

```bash
# Health check
curl http://localhost:30700/health

# Register
curl -X POST http://localhost:30700/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "firstName": "Test",
    "lastName": "User"
  }'

# Login
curl -X POST http://localhost:30700/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

## Project Structure

```
memory/
├── backend/
│   ├── src/                 # TypeScript source files
│   │   ├── config/          # Database, Cloudinary, S3 configuration
│   │   ├── controllers/     # Request handlers
│   │   ├── middleware/      # Auth, error handling, rate limiting
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic
│   │   ├── utils/           # Helpers (JWT, QR codes, logger, etc.)
│   │   ├── validators/      # Zod schemas
│   │   └── server.ts        # Entry point
│   ├── prisma/
│   │   └── schema.prisma    # Database schema
│   ├── Dockerfile           # Production Dockerfile
│   ├── Dockerfile.dev      # Development Dockerfile (hot-reload)
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── lib/             # API client
│   │   ├── pages/           # Route pages
│   │   ├── routes/          # Route configuration
│   │   ├── stores/          # Zustand stores
│   │   └── main.tsx         # Entry point
│   ├── Dockerfile           # Production Dockerfile
│   ├── Dockerfile.dev       # Development Dockerfile (Vite HMR)
│   └── package.json
├── docker-compose.dev.yml   # Development compose (hot-reload)
├── docker-compose.prod.yml   # Production compose (optimized)
├── docker-compose.yml       # Legacy compose (PostgreSQL & Redis only)
├── README.md                 # This file - main navigation hub
├── DEVELOPMENT.md            # Development guide
├── DEPLOYMENT.md             # Production deployment guide
└── DOCKER_QUICK_REFERENCE.md # Quick command reference
```

## Security Features

- **JWT Authentication** with access & refresh tokens
- **Password Hashing** using bcrypt
- **Rate Limiting** (100 req/15min global, 5 login attempts/hour)
- **Security Headers** via Helmet
- **CORS Protection**
- **Input Validation** with Zod schemas
- **SQL Injection Protection** via Prisma

## Rate Limits

- **Global**: 100 requests per 15 minutes per IP
- **Authentication**: 5 login attempts per hour per IP

## Environment Variables

### Backend (.env)

```env
PORT=30700
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/dots_memory?schema=public
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-jwt-secret
JWT_REFRESH_SECRET=your-refresh-secret
```

### Frontend (.env)

```env
VITE_API_URL=http://localhost:30700/api/v1
```

## Docker Commands

For quick Docker commands, see [DOCKER_QUICK_REFERENCE.md](./DOCKER_QUICK_REFERENCE.md)

Common commands:
- **Development**: `docker compose -f docker-compose.dev.yml up`
- **Production**: `docker compose -f docker-compose.prod.yml up -d`
- **View logs**: `docker compose -f docker-compose.dev.yml logs -f`
- **Stop services**: `docker compose -f docker-compose.dev.yml down`

👉 **See [DOCKER_QUICK_REFERENCE.md](./DOCKER_QUICK_REFERENCE.md) for complete command reference**

## Development Workflow

### Database Migrations

```bash
# Development
docker compose -f docker-compose.dev.yml exec backend npx prisma migrate dev

# Production
docker compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy

# View database (Prisma Studio)
docker compose -f docker-compose.dev.yml exec backend npx prisma studio
```

### Running Services

**With Docker (Recommended):**
- See [DEVELOPMENT.md](./DEVELOPMENT.md) for complete Docker workflow

**Local Development:**
- Backend: `cd backend && npm run dev`
- Frontend: `cd frontend && npm run dev`

👉 **For complete development guide, see [DEVELOPMENT.md](./DEVELOPMENT.md)**

## Database Schema

### Key Models

- **User** - Authentication and profile
- **Album** - Photo/video collections
- **Media** - Individual photos/videos
- **RefreshToken** - JWT refresh tokens
- **AlbumAnalytics** - Usage statistics

See `backend/prisma/schema.prisma` for complete schema.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Troubleshooting

### Common Issues

**Port conflicts, database connection issues, and other problems:**
- See [DEVELOPMENT.md](./DEVELOPMENT.md#troubleshooting) for development troubleshooting
- See [DEPLOYMENT.md](./DEPLOYMENT.md#troubleshooting) for production troubleshooting

### Quick Fixes

```bash
# Port already in use
lsof -ti :30700 | xargs kill -9

# Restart Docker services
docker compose -f docker-compose.dev.yml restart

# Reset everything (WARNING: deletes data)
docker compose -f docker-compose.dev.yml down -v
```

👉 **For detailed troubleshooting, see [DEVELOPMENT.md](./DEVELOPMENT.md#troubleshooting) or [DEPLOYMENT.md](./DEPLOYMENT.md#troubleshooting)**

## Additional Resources

- **[DEVELOPMENT.md](./DEVELOPMENT.md)** - Complete development guide with Docker, hot-reload, debugging
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Production deployment, security, monitoring, backups
- **[DOCKER_QUICK_REFERENCE.md](./DOCKER_QUICK_REFERENCE.md)** - Quick command cheat sheet
- **Postman Collection**: `Dots_Memory_API.postman_collection.json` - API testing collection

## Support

For issues and questions:
1. Check the relevant documentation (DEVELOPMENT.md or DEPLOYMENT.md)
2. Review the troubleshooting sections
3. Open an issue on GitHub

---

Built with ❤️ using Node.js, React, and PostgreSQL @armoako
