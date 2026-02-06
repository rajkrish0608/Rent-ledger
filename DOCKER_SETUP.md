# RentLedger - Docker Development Setup

## Quick Start

### 1. Start all services
```bash
docker-compose up -d
```

### 2. View logs
```bash
# All services
docker-compose logs -f

# Backend only
docker-compose logs -f backend

# Database only
docker-compose logs -f postgres
```

### 3. Stop all services
```bash
docker-compose down
```

### 4. Stop and remove volumes (clean slate)
```bash
docker-compose down -v
```

## Services

| Service | Port | Description |
|---------|------|-------------|
| Backend API | 3000 | NestJS REST API |
| PostgreSQL | 5432 | Database |
| Redis | 6379 | Cache & Job Queue |
| pgAdmin | 5050 | Database UI (optional) |

## Database Access

### Via pgAdmin (Web UI)
1. Start with tools profile: `docker-compose --profile tools up -d`
2. Open http://localhost:5050
3. Login: `admin@rentledger.local` / `admin`
4. Add server:
   - Host: `postgres`
   - Port: `5432`
   - Database: `rentledger_dev`
   - Username: `rentledger_admin`
   - Password: `dev_password`

### Via psql (CLI)
```bash
docker-compose exec postgres psql -U rentledger_admin -d rentledger_dev
```

## Backend Commands

### Run migrations
```bash
docker-compose exec backend npm run migration:run
```

### Generate migration
```bash
docker-compose exec backend npm run migration:generate -- src/migrations/MigrationName
```

### Access backend shell
```bash
docker-compose exec backend sh
```

### Install new package
```bash
docker-compose exec backend npm install package-name
```

## Development Workflow

1. **Start services**: `docker-compose up -d`
2. **Watch logs**: `docker-compose logs -f backend`
3. **Make code changes** - Hot reload is enabled
4. **Run migrations** when database schema changes
5. **Stop services**: `docker-compose down`

## Troubleshooting

### Backend won't start
```bash
# Rebuild backend image
docker-compose build backend
docker-compose up -d backend
```

### Database connection issues
```bash
# Check if postgres is healthy
docker-compose ps

# Restart postgres
docker-compose restart postgres
```

### Clear all data and restart
```bash
docker-compose down -v
docker-compose up -d
```

## Environment Variables

Edit `backend/.env` for local configuration. Changes require backend restart:
```bash
docker-compose restart backend
```
