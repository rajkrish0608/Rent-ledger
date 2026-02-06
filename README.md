# RentLedger

Enterprise-grade rental infrastructure platform with Flutter + NestJS + PostgreSQL

## Project Structure

```
rentledger/
├── backend/              # NestJS REST API
├── frontend/             # Flutter app (mobile + web)
├── infrastructure/       # Terraform/CloudFormation
├── shared/              # Shared types/constants
├── docker-compose.yml   # Local development environment
└── DOCKER_SETUP.md      # Docker setup guide
```

## Quick Start (Docker)

### Prerequisites
- Docker Desktop installed
- Git

### Start Development Environment

```bash
# Clone and navigate
cd "/Users/rajkrish0608/PROJECT DETAILS/RentLedger"

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f backend

# Backend API will be available at:
# http://localhost:3000/api
```

### Stop Environment

```bash
docker-compose down
```

See [DOCKER_SETUP.md](./DOCKER_SETUP.md) for detailed Docker commands.

## Tech Stack

### Frontend
- **Flutter** (Dart) - Mobile (Android, iOS) + Web
- **Riverpod** - State management
- **go_router** - Navigation
- **Dio** - HTTP client
- **Clean Architecture** - Domain/Data/Presentation layers

### Backend
- **NestJS** (TypeScript) - REST API framework
- **PostgreSQL** - ACID-compliant database
- **TypeORM** - Database ORM
- **Redis + BullMQ** - Job queues
- **JWT** - Authentication
- **AWS S3** - Media storage

### Infrastructure
- **Docker** - Containerization
- **AWS** - Cloud hosting (RDS, ECS, S3, ElastiCache)
- **Terraform** - Infrastructure as Code
- **GitHub Actions** - CI/CD

## Core Features

- ✅ **Rental Timeline Engine** - Immutable event tracking
- ✅ **Hash Chain Integrity** - SHA-256 cryptographic verification
- ✅ **Media Capture** - Photos, videos, documents
- ✅ **Certified Exports** - Court-ready PDF generation
- ✅ **Multi-Role Access** - Tenant, Landlord, Broker, Society
- ✅ **Section 65B Compliance** - IT Act 2000 (India)

## Development

### Backend Development

```bash
# Access backend container
docker-compose exec backend sh

# Run migrations
npm run migration:run

# Generate migration
npm run migration:generate -- src/migrations/MigrationName

# Run tests
npm test
```

### Frontend Development

```bash
cd frontend

# Install dependencies
flutter pub get

# Run on web
flutter run -d chrome

# Run on mobile
flutter run
```

## Documentation

- [Implementation Plan](./MASTER_INDEX.md) - Complete technical specification
- [Docker Setup](./DOCKER_SETUP.md) - Docker commands and troubleshooting
- [Task Breakdown](./brain/task.md) - Development tasks

## License

Proprietary - RentLedger Platform
