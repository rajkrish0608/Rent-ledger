# RentLedger

<div align="center">

**The System of Record for Rentals**

[![Flutter](https://img.shields.io/badge/Flutter-3.38.9-02569B?logo=flutter)](https://flutter.dev)
[![NestJS](https://img.shields.io/badge/NestJS-10.0-E0234E?logo=nestjs)](https://nestjs.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?logo=postgresql)](https://postgresql.org)
[![License](https://img.shields.io/badge/License-Proprietary-red.svg)](LICENSE)

*Enterprise-grade rental infrastructure platform with cryptographic integrity and legal compliance*

[Features](#-features) • [Architecture](#-architecture) • [Quick Start](#-quick-start) • [Documentation](#-documentation)

</div>

---

## 📋 Overview

RentLedger is a **trust-first rental infrastructure platform** that creates verifiable, tamper-evident rental timelines for tenants, landlords, brokers, and housing societies. Built for institutional use with banks, courts, fintechs, and government institutions.

### Core Principles

- 🔒 **Immutable by Design** - Append-only event logs with database-level enforcement
- 🔗 **Hash Chain Integrity** - SHA-256 cryptographic verification for tamper-evidence
- ⚖️ **Legal Compliance** - Section 65B IT Act 2000 (India) compliant certified exports
- 🏛️ **Institutional Grade** - Designed for 10+ year data retention and court admissibility
- 🌐 **Cross-Platform** - Single codebase for Android, iOS, and Web

---

## ✨ Features

### 🏠 Rental Timeline Engine
- Immutable event tracking (move-in, rent payments, maintenance, disputes)
- Multi-party participation (tenant, landlord, broker, society)
- Chronological timeline with full audit trail

### 🔐 Evidence Integrity Layer
- SHA-256 hash chain linking all events
- Cryptographic verification of timeline integrity
- Tamper-evident storage with append-only enforcement

### 📸 Media & Evidence Capture
- Photo, video, and document uploads
- Versioned S3 storage with immutable objects
- Metadata preservation for legal admissibility

### 📄 Certified Evidence Export
- Court-ready PDF generation with Section 65B compliance
- Complete rental history with hash verification
- System operator identification and digital signatures

### 👥 Multi-Role Access Control
- **Tenants** - Document rental history, raise disputes
- **Landlords** - Track properties, verify payments
- **Brokers** - Manage multiple rentals, analytics dashboard
- **Housing Societies** - Building-wide oversight, move-in/out tracking
- **Internal Admins** - Platform management, compliance monitoring

---

## 🏗️ Architecture

### Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | Flutter (Dart) | Cross-platform mobile & web apps |
| **State Management** | Riverpod | Reactive, compile-time safe state |
| **Navigation** | go_router | Type-safe routing with guards |
| **HTTP Client** | Dio | API communication with interceptors |
| **Backend** | NestJS (TypeScript) | REST API with modular architecture |
| **Database** | PostgreSQL 15 | ACID compliance, JSONB support |
| **Cache/Queue** | Redis + BullMQ | Background jobs, session management |
| **Storage** | AWS S3 | Versioned, immutable media storage |
| **Infrastructure** | Docker + AWS | Containerized deployment (ECS, RDS) |

### Clean Architecture (Frontend)

```
lib/
├── core/           # Theme, constants, utilities
├── data/           # API clients, repositories, models
├── domain/         # Business logic, entities, use cases
└── presentation/   # UI screens, widgets, state providers
```

### Database Schema

```sql
users           # User accounts with RBAC
rentals         # Rental properties
rental_events   # APPEND-ONLY timeline with hash chain
media_files     # S3-backed evidence storage
audit_logs      # APPEND-ONLY system audit trail
export_requests # PDF export tracking
```

**Key Constraint:** Database triggers prevent UPDATE/DELETE on `rental_events` and `audit_logs`.

---

## 🚀 Quick Start

### Prerequisites

- Docker Desktop
- Flutter SDK 3.0+
- Git

### 1. Clone Repository

```bash
git clone https://github.com/yourusername/rentledger.git
cd rentledger
```

### 2. Start Backend Services

```bash
# Start PostgreSQL, Redis, and NestJS API
docker-compose up -d

# View logs
docker-compose logs -f backend

# Backend API available at http://localhost:3000/api
```

### 3. Run Flutter App

**Web:**
```bash
cd frontend
flutter pub get
flutter run -d chrome
```

**iOS Simulator:**
```bash
flutter run -d "iPhone 16e"
```

**Android Emulator:**
```bash
flutter run
```

---

## 📚 Documentation

- [**MASTER_INDEX.md**](MASTER_INDEX.md) - Complete implementation guide
- [**DOCKER_SETUP.md**](DOCKER_SETUP.md) - Docker commands and troubleshooting
- [**UNIFIED_IMPLEMENTATION_PLAN.md**](UNIFIED_IMPLEMENTATION_PLAN.md) - Technical specification (Part 1)
- [**IMPLEMENTATION_PART_2.md**](IMPLEMENTATION_PART_2.md) - Exports & Authentication
- [**IMPLEMENTATION_PART_3.md**](IMPLEMENTATION_PART_3.md) - Dashboards & UI/UX
- [**IMPLEMENTATION_PART_4_FINAL.md**](IMPLEMENTATION_PART_4_FINAL.md) - OCR, Jobs, Infrastructure

---

## 🗄️ Database Migrations

```bash
# Run migrations
docker-compose exec backend npm run migration:run

# Generate new migration
docker-compose exec backend npm run migration:generate -- src/migrations/MigrationName

# Revert last migration
docker-compose exec backend npm run migration:revert
```

---

## 🔒 Security & Compliance

### Data Integrity
- ✅ Append-only event logs (database-enforced)
- ✅ SHA-256 hash chain for cryptographic verification
- ✅ Full audit logging of all write operations
- ✅ No silent edits or deletions

### Legal Compliance
- ✅ Section 65B IT Act 2000 (India) - Electronic evidence admissibility
- ✅ GDPR - Data export and right to be forgotten
- ✅ Court-safe microcopy and certified exports
- ✅ System operator identification in all exports

### Authentication & Authorization
- ✅ JWT with refresh token rotation
- ✅ Role-Based Access Control (RBAC)
- ✅ Secure token storage (flutter_secure_storage)
- ✅ Password hashing (bcrypt)

---

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm test
```
*Validated services: Rentals, Events, Exports, Dashboard, Auth logic.*

### Frontend Tests
```bash
cd frontend
flutter test
```
*Validated logic: AuthProvider, RentalProvider, State Transitions.*

---

## 🚢 Deployment

### Infrastructure as Code
The platform uses **Terraform** for AWS infrastructure management.
- **Compute**: ECS Fargate
- **Database**: RDS PostgreSQL
- **Cache**: ElastiCache Redis
- **Storage**: S3 + Bucket Lifecycle Policies

### CI/CD
**GitHub Actions** pipeline is configured in `.github/workflows/deploy.yml` for automated ECR builds and ECS deployments.

---

## 🎨 Design Philosophy

**Institutional, Calm, Premium**

- Neutral color palette (Deep Navy, Slate Gray, Professional Blue)
- Inter font family for clarity and professionalism
- Flat cards with 1px borders, subtle 8px radius
- No animations for trust-critical actions
- Court-safe microcopy designed for legal review

---

## 📊 Project Status

**Current Phase: COMPLETE ✅**

- ✅ Docker Optimized Production Build
- ✅ NestJS Backend with Cryptographic Integrity
- ✅ PostgreSQL Database with Append-Only Enforcement
- ✅ Flutter App with Clean Architecture
- ✅ JWT Auth & Role-Based Access Control
- ✅ Rental Timeline Engine & Verification
- ✅ Media & OCR Infrastructure
- ✅ Background Jobs (BullMQ + Redis)
- ✅ Security Hardening (Helmet, Rate Limiting)
- ✅ GDPR & Legal Compliance (Section 65B Certificate)
- ✅ Automated Test Suite (Backend & Frontend)

**Progress: 100% of planned foundation phase**

---

## 🤝 Contributing

This is a proprietary project. Contributions are limited to authorized team members.

### Development Workflow

1. Create feature branch from `main`
2. Make changes following Clean Architecture principles
3. Write tests (target 80%+ coverage)
4. Submit PR with detailed description
5. Ensure CI/CD pipeline passes
6. Request code review from 2+ team members

---

## 📝 License

**Proprietary License** - All rights reserved.

This software is the property of RentLedger and is protected by copyright law. Unauthorized copying, distribution, or use is strictly prohibited.

---

## 👥 Team

Built by a team of Principal Software Architects and Staff Product Engineers with 20+ years of experience in enterprise, audit-safe, legally compliant platforms.

---

## 📞 Support

For technical support or inquiries:
- **Email:** support@rentledger.com
- **Documentation:** [docs.rentledger.com](https://docs.rentledger.com)
- **Status Page:** [status.rentledger.com](https://status.rentledger.com)

---

<div align="center">

**RentLedger** - Trust-first rental infrastructure for the modern world

Made with ❤️ for institutional integrity

</div>
