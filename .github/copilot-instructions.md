# Copilot Instructions for Dots Memory

## Project Overview
**Dots Memory** is a production-grade, full-stack collaborative media sharing platform with JWT authentication, album management, media uploads, QR/NFC support, and subscription tiers (Free/Basic/Pro/Premium). Stack: Node.js + Express + PostgreSQL + Prisma + React + Vite.

---

## Architecture & Key Components

### Backend Structure (`backend/src/`)
- **Controllers** - HTTP request handlers (album, media, auth, subscription, etc.)
- **Services** - Business logic; each major feature has a dedicated service (AlbumService, MediaService, PaymentService)
- **Middleware** - Auth token handling, error handling, rate limiting, request logging, security headers, input sanitization
- **Routes** - Express route definitions mapped to controllers with middleware chains
- **Utils** - Cross-cutting concerns: custom error classes, JWT handling, logging (Winston), password utilities, validators
- **Config** - Database (Prisma), Redis, S3/Cloudinary setup

### Database Design
- **Prisma ORM** with PostgreSQL 15
- **Key Models**: User (with roles: FREE/PREMIUM/PRO/ADMIN), Album, Media, Subscription, AccessCode, SessionBlacklist
- **Enums**: UserRole, AlbumPrivacy, MediaType, SubscriptionTier, PaymentProvider (Stripe/Paystack)
- Schema enforces album ownership, soft deletes via status enums, access code encryption for private albums

### Frontend Structure (`frontend/src/`)
- **React 18 + TypeScript** with Vite build tool
- **State Management**: Redux Toolkit (auth slices) + Zustand (local state)
- **Styling**: Tailwind CSS (base color: `#FDF8F3`)
- **API Client**: Axios with interceptors for token auto-refresh and 401 handling
- **Forms**: React Hook Form + Zod validation (mirrors backend validators)
- **Routing**: React Router v6

---

## Critical Patterns & Conventions

### Error Handling
- **Custom Error Classes** in `backend/src/utils/errors.ts`:
  - `AppError` (base) → ValidationError, AuthenticationError, AuthorizationError, NotFoundError, QuotaExceededError, FileSizeError, ServiceUnavailableError, etc.
  - All have `statusCode`, `code` (string identifier), `isOperational` flag, and `context` object
  - Middleware catches errors and returns structured JSON with `{ success: false, error: { message, code, correlationId, details? } }`
- **Frontend**: Errors include correlation IDs for backend tracing; implement retry logic for 5xx

### Input Validation
- **Zod schemas** for all API endpoints in `backend/src/validators/`
- Errors return detailed array: `[{ path: string[], message, code, received, expected }]`
- **Frontend validators** mirror backend (e.g., createAlbumSchema, auth validators)
- **Sanitization**: DOMPurify on frontend, server-side sanitizeText() for XSS prevention

### Authentication & Authorization
- **JWT-based**: Access token (15min) in cookie `mem_acc_token`, refresh token (7d) in `mem_rf_token`
- **Token auto-refresh**: Middleware detects expiring tokens (within 1 min) and refreshes automatically
- **Frontend monitor**: `startTokenRefreshMonitor()` in App.tsx keeps auth state in sync
- **Protected routes**: Use `authenticate` middleware; always include `user?.userId` in logs for tracing
- **CORS whitelist**: Validated against `FRONTEND_URL` and localhost:5173 (configurable per env)

### Database Patterns
- **Prisma relations**: Always load related data explicitly (no auto-includes)
- **Soft deletes**: Use status enums (e.g., `AlbumStatus.DELETED`) not hard deletes
- **Migrations**: Run `make migrate` for dev, `npx prisma migrate deploy` for production
- **Access codes**: Hashed for validation, encrypted separately for owner viewing; both stored in DB
- **Session blacklist**: Table tracks revoked sessions by ID to prevent reuse

### Service Architecture
- Each service (AlbumService, MediaService, etc.) encapsulates domain logic
- Services throw custom errors; controllers map to HTTP responses
- Example: `AlbumService.createAlbum(userId, data)` validates via usage service, generates QR codes, handles encryption
- **Payment services** in `services/payment/` for Stripe/Paystack webhook handling

### Media Upload Flow
1. Controller requests presigned URL from storage service (S3/Cloudinary)
2. Frontend uploads directly to cloud storage
3. Webhook notifies backend when upload completes
4. Backend stores metadata in `Media` table, generates thumbnails via Sharp

---

## Critical Developer Workflows

### Setup & Installation
```bash
make install          # npm install both, generate Prisma client
make setup           # Full setup: install + migrate + generate
```

### Development
```bash
make dev             # Start backend (port 30700) + frontend (port 5173) concurrently
make dev-backend     # Backend only
make dev-frontend    # Frontend only
```

### Database
```bash
make migrate         # Create new migration interactively
make migrate-deploy  # Deploy migrations (production-safe)
make db-reset        # ⚠️ WARNING: Delete all data, reset migrations
make db-studio       # Open Prisma Studio GUI to inspect/edit data
```

### Docker (Development)
```bash
make docker-up       # Start PostgreSQL, Redis, backend, frontend (includes OrbStack URL detection)
make docker-logs     # Stream all logs; use docker-logs-backend, docker-logs-frontend for specific
make docker-down     # Stop all containers
make docker-clean    # ⚠️ WARNING: Remove volumes (data loss)
```

### Production Build & Deployment
```bash
make build           # Build both backend (dist/) and frontend (dist/)
make docker-build-prod  # Build production images
make docker-up-prod     # Start production containers
```

### Validation & Testing
```bash
make lint            # ESLint both backend and frontend
make lint-fix        # Auto-fix linting issues
make test            # Run Jest tests (backend)
```

### Health Checks
```bash
make health          # Check backend, frontend, PostgreSQL, Redis status
```

---

## Integration Points & External Dependencies

### Authentication
- **JWT (jsonwebtoken)**: Create, verify, refresh tokens
- **bcrypt**: Hash passwords; always compare with `bcrypt.compare()`
- **Session blacklist**: Check before processing authenticated requests

### Storage
- **S3-compatible** (AWS S3 or Cloudflare R2): Use presigned URLs for secure direct uploads
- **Cloudinary**: Alternative image CDN with auto-transforms
- **Local uploads** fallback in development

### Payment Processing
- **Stripe** & **Paystack**: Webhook handlers in `services/payment/`
- Update `SubscriptionStatus` and `User.role` after successful payment
- Validate webhook signatures; log all payment events

### Monitoring & Logging
- **Winston logger** with daily rotation (`logs/` directory)
- **Correlation IDs**: Generated per request, included in all logs and error responses
- **Request logger middleware**: Logs method, URL, status, duration, user ID
- **Structured logging**: Use context objects `logger.info/warn/error(message, { key: value })`

### Rate Limiting
- **Global**: 100 requests / 15 minutes per IP
- **Auth endpoints** (login): 5 attempts / hour
- **Album views**: Special limiter to prevent scraping
- Uses `express-rate-limit` with in-memory store (switch to Redis for production)

### Security Headers
- **Helmet.js**: Enabled by default; set CSP, X-Frame-Options, HSTS
- **CORS**: Configured per environment; validate against allowlist
- **Input sanitization**: DOMPurify on frontend, server-side text sanitization
- **SQL injection**: Prisma parameterized queries prevent attacks

### Email (if implemented)
- Currently unused but infrastructure ready via service structure

---

## Frontend-Specific Patterns

### Redux Store Structure
- Auth slice: login, register, logout, token refresh state
- Minimal Redux usage; prefer local Zustand for UI state
- Use `useAppSelector`, `useAppDispatch` hooks from `store/hooks.ts`

### API Communication
- All requests go through `frontend/src/lib/api.ts` (Axios instance)
- **Auto-retry 401s** with token refresh; queue requests while refreshing
- **Error handling**: Catch and display via `NotificationProvider`
- **Validation**: Run Zod validators before API calls for UX feedback

### Styling
- Tailwind CSS utilities; custom config in `tailwind.config.js`
- Base background color: `#FDF8F3` (off-white)
- Use `clsx` for conditional classes, `tailwind-merge` for safe overrides
- Component structure: prefer small, single-responsibility components

---

## Common Tasks & Examples

### Adding a New API Endpoint
1. Define Zod schema in `backend/src/validators/{feature}.validator.ts`
2. Create/update service in `backend/src/services/{feature}.service.ts`
3. Add controller method in `backend/src/controllers/{feature}.controller.ts`
4. Define route in `backend/src/routes/{feature}.routes.ts` (apply middleware)
5. Export route in `backend/src/server.ts`
6. Mirror validator in frontend, add API call in `frontend/src/lib/api.ts`

### Creating a Database Migration
```bash
# Edit schema.prisma, then:
make migrate
# Prisma prompts for migration name → creates SQL in prisma/migrations/
```

### Handling Errors
```typescript
// Backend: throw custom error
if (!user) throw new NotFoundError("User not found", "USER_NOT_FOUND");

// Frontend: catch and display
api.post('/albums').catch(err => {
  const code = err.response?.data?.error?.code;
  // Handle specific error codes with UI feedback
});
```

### Working with Access Codes
- Private albums auto-generate 8-char codes (AlphaNumeric: A-Z, 2-9, exclude confusing chars)
- Hash for DB validation (`hashAccessCode`)
- Encrypt separately for owner viewing (`encryptAccessCode/decryptAccessCode`)
- Both stored in `Album.accessCodeHash` and `Album.accessCodeEncrypted`

---

## Environment Variables

### Backend (.env)
```
PORT=30700
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
JWT_SECRET=... (min 32 chars in production)
JWT_REFRESH_SECRET=...
FRONTEND_URL=http://localhost:5173 (or production URL)
NODE_ENV=development
LOG_LEVEL=debug
STRIPE_SECRET_KEY=...
PAYSTACK_SECRET_KEY=...
CLOUDINARY_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET (if using Cloudinary)
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:30700/api/v1
```

---

## Testing & Debugging

- **Winston logs**: Check `backend/logs/` for structured logs with correlation IDs
- **Prisma Studio**: `make db-studio` to inspect database visually
- **Network tab**: Browser DevTools to verify API calls and token headers
- **Postman collection**: `Dots_Memory_API.postman_collection.json` included
- **Health endpoint**: GET `/health` on backend returns service status

---

## Notes for AI Agents

- Always validate input using Zod schemas before database operations
- Include correlation IDs in logs for request tracing
- Check album ownership before operations (ownerId === user.id)
- Handle soft deletes: filter by status, don't use hard DELETE
- Run `make lint` before committing code
- Document migration purposes in file names
- Test JWT auto-refresh logic when modifying auth middleware
- Respect rate limits; test with Artillery or k6 for load testing

