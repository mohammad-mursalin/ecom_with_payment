# E-Commerce Platform

A full-stack e-commerce application with a Spring Boot backend and React frontend, containerized with Docker for both development and production environments.

## Tech Stack

### Backend
- Java 21 / Spring Boot 3.5.14
- Spring Security with JWT authentication
- Spring Data JPA / Hibernate
- PostgreSQL 16
- Redis 7 (caching + rate limiting with Bucket4j)
- Stripe SDK (INR currency)
- WebSocket support (chat)
- Maven

### Frontend
- React 18 + Vite
- nginx (production reverse proxy)
- Axios for API calls
- Stripe.js for payments

### Infrastructure
- Docker & Docker Compose
- Multi-stage builds for optimized images
- Separate dev/prod configurations

## Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- Java 21 (for local backend dev)
- Node.js 18+ (for local frontend dev)
- Git

## Project Structure

```
ecom-project/
├── backend/
│   └── ecom/                      # Spring Boot backend
│       ├── src/
│       │   ├── main/
│       │   │   ├── java/...
│       │   │   └── resources/
│       │   └── test/...
│       ├── Dockerfile
│       └── pom.xml
├── frontend/
│   └── ecom-frontend-5-main/      # React + Vite frontend
│       ├── src/
│       ├── nginx.conf
│       ├── Dockerfile
│       └── package.json
├── docker-compose.dev.yml         # Development environment
├── docker-compose.yml             # Production environment
└── .env.example                   # Environment variables template
```

## Quick Start

### 1. Clone the repository

```bash
git clone <repo-url>
cd ecom-project
```

### 2. Copy environment file

```bash
cp .env.example .env
```

Edit `.env` if you need to override default credentials.

### 3. Start Development Environment

```bash
docker compose -f docker-compose.dev.yml up -d --build
```

This starts:
- PostgreSQL on `localhost:5432`
- Redis on `localhost:6379`
- Backend API on `http://localhost:8080`
- Frontend dev server on `http://localhost:5173`

### 4. Stop Development Environment

```bash
docker compose -f docker-compose.dev.yml down
```

### 5. Start Production Environment

```bash
docker compose up -d --build
```

This starts the full stack with nginx on `http://localhost`.

### 6. Stop Production Environment

```bash
docker compose down
```

## URLs

| Environment | Frontend | Backend API |
|-------------|----------|-------------|
| Development | http://localhost:5173 | http://localhost:8080/api |
| Production | http://localhost | http://localhost/api |

> In production, the backend is not directly exposed. All API requests go through nginx at `/api` and WebSocket at `/api/ws`.

## API Endpoints

### Authentication
- `POST /api/auth/register` — Register a new user
- `POST /api/auth/login` — Login and get JWT token
- `POST /api/auth/refresh` — Refresh access token

### Products
- `GET /api/products` — Get all products with filtering
- `GET /api/products/{id}` — Get product by ID
- `GET /api/categories` — Get all categories
- `GET /api/brands` — Get all brands

### Chat
- `POST /api/chat` — Send a chat message
- `GET /api/chat/messages` — Get chat messages
- `POST /api/chat/messages/feedback` — Submit message feedback

### Orders & Payments
- `POST /api/orders` — Create an order
- `POST /api/payments/create-intent` — Create Stripe payment intent
- `POST /api/payments/confirm` — Confirm payment

### Knowledge Base
- `GET /api/kb/articles` — Get KB articles

## Rate Limiting

Rate limits are enforced per endpoint and IP address (or authenticated user ID):

| Endpoint | Limit |
|----------|-------|
| `POST /api/auth/login` | 5 requests / minute |
| `POST /api/auth/register` | 3 requests / minute |
| `POST /api/chat` | 15 requests / minute |
| `POST /api/chat/messages/feedback` | 10 requests / minute |

Rate limit buckets are stored in Redis and survive container restarts.

## Caching

Product listings are cached in Redis for 2 minutes using Spring Cache abstraction. Cache is invalidated on any product mutation (create, update, delete, etc.).

## Useful Commands

```bash
# View backend logs
docker compose -f docker-compose.dev.yml logs -f backend

# View frontend logs
docker compose -f docker-compose.dev.yml logs -f frontend

# View Redis keys
docker compose -f docker-compose.dev.yml exec redis redis-cli KEYS "*"

# Check rate limit bucket TTL
docker compose -f docker-compose.dev.yml exec redis redis-cli TTL "ratelimit:/api/auth/login:<ip>"

# Flush all Redis data
docker compose -f docker-compose.dev.yml exec redis redis-cli FLUSHALL

# Restart a specific service
docker compose -f docker-compose.dev.yml restart backend

# Rebuild backend only
docker compose -f docker-compose.dev.yml build backend
```

## Environment Variables

See `.env.example` for available configuration options. Key variables:

- `SPRING_DATASOURCE_URL` — PostgreSQL JDBC URL
- `SPRING_DATASOURCE_USERNAME` — Database username
- `SPRING_DATASOURCE_PASSWORD` — Database password
- `SPRING_DATA_REDIS_HOST` — Redis host
- `SPRING_DATA_REDIS_PORT` — Redis port
- `VITE_API_BASE_URL` — Frontend API base URL
- `VITE_STRIPE_PUBLISHABLE_KEY` — Stripe publishable key

## Database

The application uses PostgreSQL with Hibernate/JPA. Schema is auto-created on startup (`ddl-auto=update`). Initial seed data is loaded only when tables are empty.

## Redis

Redis is used for:
- Application caching (product listings)
- Rate limiting state (Bucket4j)
- Future session storage

## Troubleshooting

### Backend won't start
```bash
docker compose -f docker-compose.dev.yml logs backend
```

### Port already in use
Stop any existing containers or change ports in `docker-compose.dev.yml`:
```bash
docker compose -f docker-compose.dev.yml down
```

### Frontend shows stale data
Clear the browser cache or do a hard refresh (`Ctrl+Shift+R`).

### Rate limit issues
Check Redis keys to verify buckets are being created:
```bash
docker compose -f docker-compose.dev.yml exec redis redis-cli KEYS "ratelimit:*"
```
