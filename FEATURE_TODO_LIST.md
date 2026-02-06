# RentLedger - Complete Feature To-Do List

> **Version:** MVP v1.0 (Flutter Edition)  
> **Last Updated:** February 6, 2026  
> **Tech Stack:** Flutter (Mobile + Web) + NestJS + PostgreSQL + AWS  
> **Purpose:** Comprehensive feature breakdown with actionable implementation steps

---

## 📋 Table of Contents
1. [Foundation & Setup](#1-foundation--setup)
2. [Core System - Rental Timeline Engine](#2-core-system---rental-timeline-engine)
3. [Media & Evidence Capture](#3-media--evidence-capture)
4. [Evidence Integrity Layer](#4-evidence-integrity-layer)
5. [Certified Evidence Export](#5-certified-evidence-export)
6. [Authentication & Authorization](#6-authentication--authorization)
7. [Broker Dashboard](#7-broker-dashboard)
8. [Housing Society Dashboard](#8-housing-society-dashboard)
9. [UI/UX Implementation](#9-uiux-implementation)
10. [Rental Reputation Graph (Phase 1)](#10-rental-reputation-graph-phase-1)
11. [OCR & Document Processing](#11-ocr--document-processing)
12. [Background Jobs & Notifications](#12-background-jobs--notifications)
13. [Infrastructure & DevOps](#13-infrastructure--devops)
14. [Security & Compliance](#14-security--compliance)
15. [Testing & Quality Assurance](#15-testing--quality-assurance)

---

## 1. Foundation & Setup

### 1.1 Project Initialization
- [ ] **Step 1.1.1:** Create monorepo structure
  - Initialize Git repository
  - Set up workspace/package management (npm workspaces or Yarn workspaces)
  - Create folder structure: `/backend`, `/mobile`, `/web`, `/shared`

- [ ] **Step 1.1.2:** Configure TypeScript
  - Install TypeScript globally
  - Create shared `tsconfig.json` base configuration
  - Set up strict type checking rules
  - Configure path aliases

- [ ] **Step 1.1.3:** Set up linting and formatting
  - Install ESLint with TypeScript support
  - Configure Prettier
  - Set up pre-commit hooks with Husky
  - Add lint-staged for automated checks

### 1.2 Backend Foundation (NestJS)
- [ ] **Step 1.2.1:** Initialize NestJS application
  - Create new NestJS project in `/backend`
  - Install core dependencies (NestJS, TypeORM, PostgreSQL)
  - Configure environment variables with `.env` template
  - Set up config module for environment management

- [ ] **Step 1.2.2:** Database setup
  - Install PostgreSQL locally or configure Docker container
  - Create initial database schema
  - Configure TypeORM with PostgreSQL
  - Set up migration system
  - Create initial migration for core tables

- [ ] **Step 1.2.3:** Create base module structure
  - Create `auth` module
  - Create `users` module
  - Create `rentals` module
  - Create `events` module
  - Create `media` module
  - Create `exports` module

### 1.3 Flutter App Foundation (Mobile + Web)
- [ ] **Step 1.3.1:** Initialize Flutter project
  - Create new Flutter project with `flutter create rentledger`
  - Lock Flutter version to stable channel in project
  - Set up folder structure following Clean Architecture:
    - `/lib/core` - Shared utilities, constants, theme
    - `/lib/data` - API clients, repositories, models
    - `/lib/domain` - Business logic, entities, use cases
    - `/lib/presentation` - UI screens, widgets, state management
  - Configure `pubspec.yaml` with initial dependencies

- [ ] **Step 1.3.2:** Set up Clean Architecture layers
  - Create `core` folder:
    - `/core/constants/` - API endpoints, app constants
    - `/core/theme/` - App theme, colors, typography
    - `/core/utils/` - Helper functions, validators
    - `/core/errors/` - Error handling, exceptions
  - Create `data` folder:
    - `/data/models/` - JSON serializable data models
    - `/data/repositories/` - Repository implementations
    - `/data/datasources/` - Remote (API) and local (cache) data sources
  - Create `domain` folder:
    - `/domain/entities/` - Pure Dart business entities
    - `/domain/repositories/` - Repository interfaces
    - `/domain/usecases/` - Business logic use cases
  - Create `presentation` folder:
    - `/presentation/screens/` - App screens
    - `/presentation/widgets/` - Reusable widgets
    - `/presentation/providers/` - State management (Riverpod)

- [ ] **Step 1.3.3:** Configure essential packages
  - Install **Riverpod** (`flutter_riverpod`) for state management
  - Install **go_router** for navigation with route guards
  - Install **dio** for HTTP client with interceptors
  - Install **freezed** + **json_serializable** for immutable models
  - Install **flutter_secure_storage** for JWT storage
  - Install **intl** for date formatting and localization

- [ ] **Step 1.3.4:** Set up navigation structure
  - Create `go_router` configuration with role-aware guards
  - Define routes:
    - Auth routes: `/login`, `/signup`, `/verify`
    - Tenant routes: `/timeline`, `/add-event`, `/documents`, `/account`
    - Broker routes: `/dashboard`, `/rentals`, `/exports`
    - Society routes: `/society-dashboard`, `/society-rentals`
  - Implement navigation guards based on user role
  - Create route transition animations (minimal, trust-focused)

- [ ] **Step 1.3.5:** Configure build targets
  - Enable web support: `flutter config --enable-web`
  - Configure Android build settings (`android/app/build.gradle`)
  - Configure iOS build settings (`ios/Runner/Info.plist`)
  - Set up web renderer (CanvasKit for consistency)
  - Create separate build flavors for dev/staging/production

---

## 2. Core System - Rental Timeline Engine

### 2.1 Database Schema Design
- [ ] **Step 2.1.1:** Create `rentals` table
  - Fields: `id` (UUID), `property_address`, `property_unit`, `start_date`, `end_date`, `status`, `created_at`, `updated_at`
  - Add indexes on `id`, `status`, `created_at`
  - Create migration

- [ ] **Step 2.1.2:** Create `rental_events` table (append-only)
  - Fields: `id` (UUID), `rental_id`, `event_type`, `event_data` (JSONB), `actor_id`, `actor_type`, `timestamp`, `previous_event_hash`, `current_event_hash`, `created_at`
  - Add indexes on `rental_id`, `timestamp`, `event_type`
  - Ensure no update/delete constraints (append-only)
  - Create migration

- [ ] **Step 2.1.3:** Create `rental_participants` table
  - Fields: `id` (UUID), `rental_id`, `user_id`, `role` (tenant/landlord/broker), `joined_at`, `left_at`
  - Create junction table relationships
  - Create migration

- [ ] **Step 2.1.4:** Create event type enum
  - Define event types: `MOVE_IN`, `MOVE_OUT`, `RENT_PAID`, `RENT_DELAYED`, `REPAIR_REQUEST`, `REPAIR_COMPLETED`, `NOTICE_ISSUED`, `COMPLAINT`, `INSPECTION`
  - Add to database as enum or check constraint

### 2.2 Backend API Development
- [ ] **Step 2.2.1:** Implement Rental entity and DTOs
  - Create `Rental` entity with TypeORM
  - Create DTOs: `CreateRentalDto`, `RentalResponseDto`, `UpdateRentalStatusDto`
  - Add validation decorators

- [ ] **Step 2.2.2:** Implement RentalEvent entity and DTOs
  - Create `RentalEvent` entity (append-only, no update/delete methods)
  - Create DTOs: `CreateEventDto`, `EventResponseDto`, `EventFilterDto`
  - Add validation for event types and required fields

- [ ] **Step 2.2.3:** Implement RentalsService
  - `createRental()` - Initialize new rental timeline
  - `getRentalById()` - Fetch rental details
  - `getRentalsByUser()` - Fetch user's rentals with filters
  - `addParticipant()` - Add tenant/landlord/broker to rental
  - `removeParticipant()` - Mark participant as left
  - `closeRental()` - Mark rental as completed

- [ ] **Step 2.2.4:** Implement EventsService
  - `createEvent()` - Add new event to timeline (append-only)
  - `getEventsByRental()` - Fetch timeline events with pagination
  - `getEventById()` - Fetch single event details
  - `validateEventPermissions()` - Check if user can create event type
  - Implement hash chaining logic (see Evidence Integrity section)

- [ ] **Step 2.2.5:** Create REST API endpoints
  - `POST /api/rentals` - Create rental
  - `GET /api/rentals/:id` - Get rental
  - `GET /api/rentals` - List user's rentals
  - `POST /api/rentals/:id/participants` - Add participant
  - `POST /api/rentals/:id/events` - Create event
  - `GET /api/rentals/:id/events` - List events (with pagination)
  - `PATCH /api/rentals/:id/close` - Close rental

- [ ] **Step 2.2.6:** Implement permissions middleware
  - Verify user is participant of rental
  - Check role-based event creation permissions
  - Validate event type restrictions per role

### 2.3 Flutter App - Timeline Features (Mobile + Web)
- [ ] **Step 2.3.1:** Create Timeline Screen Widget
  - Implement `TimelineScreen` in `/presentation/screens/timeline/`
  - Vertical timeline using `ListView.builder` (chronological, left-aligned)
  - Create `EventCard` widget with:
    - Event type icon (minimal, grayscale)
    - Timestamp display (human-readable + UTC on tap)
    - Actor attribution display
    - Media thumbnail indicator
    - Hash verification badge (small, quiet)
  - Implement pull-to-refresh with `RefreshIndicator`
  - Infinite scroll with pagination using `ScrollController`
  - Use `AsyncValue` from Riverpod for loading/error/data states

- [ ] **Step 2.3.2:** Create Add Event Screen
  - Implement `AddEventScreen` with form validation
  - Event type selector using `DropdownButton` or custom selector
  - Description input with `TextField` (multiline)
  - Media attachment picker:
    - Use `image_picker` for photos/videos
    - Use `file_picker` for documents
    - Show thumbnail previews
  - Actor assignment (automatic based on current user)
  - Submit button with loading state (disabled during upload)
  - Form validation with error messages
  - Success navigation back to timeline

- [ ] **Step 2.3.3:** Create Rental Details Screen
  - Implement `RentalDetailsScreen`
  - Property information card (flat design, 1px border)
  - Participants list with role badges
  - Rental status badge (Active/Closed)
  - Quick action buttons: "Add Event", "View Documents"
  - Timeline preview (last 5 events) with "View All" link
  - Responsive layout (mobile vs web)

- [ ] **Step 2.3.4:** Implement rental creation flow
  - Create multi-step wizard using `PageView` or stepper
  - Step 1: Property address input with validation
  - Step 2: Start date picker using `showDatePicker`
  - Step 3: Invite participants (email/phone input)
  - Step 4: Create initial "MOVE_IN" event prompt
  - Review step with all entered data
  - Success confirmation with navigation to timeline

- [ ] **Step 2.3.5:** Create "My Rentals" list screen
  - Implement `MyRentalsScreen`
  - Active rentals section (expanded by default)
  - Past rentals section (collapsible `ExpansionTile`)
  - Search/filter functionality in app bar
  - `RentalCard` widget showing:
    - Property address
    - Status badge
    - Participant count
    - Last event date
  - Empty state when no rentals

### 2.4 Flutter Web - Dashboard Features (Broker/Society)
- [ ] **Step 2.4.1:** Create Rentals List Page (Web Layout)
  - Implement `RentalsListScreen` with responsive design
  - Use `DataTable` for desktop view with sortable columns
  - Filters: status dropdown, date range picker, property search
  - "Create Rental" floating action button
  - Quick actions menu per rental row
  - Pagination controls at bottom
  - Switch to mobile list view on small screens

- [ ] **Step 2.4.2:** Create Rental Detail Page (Web Layout)
  - Two-column layout for web:
    - Left panel: Property info & participants (fixed width)
    - Right panel: Timeline view (scrollable)
  - Inline event creation form at top of timeline
  - Export evidence button in top app bar
  - Dispute flag indicator
  - Responsive: single column on mobile

- [ ] **Step 2.4.3:** Implement rental creation wizard (Web)
  - Multi-step form with progress indicator
  - Step 1: Property details form
  - Step 2: Add participants with invite inputs
  - Step 3: Set start date & rental terms
  - Step 4: Create initial move-in event
  - Review and confirm page
  - Cancel and Back navigation

---

## 3. Media & Evidence Capture

### 3.1 Object Storage Setup
- [ ] **Step 3.1.1:** Configure S3/Cloud Storage
  - Create AWS S3 bucket (or GCP/Azure equivalent)
  - Enable versioning
  - Configure CORS for upload from mobile/web
  - Set up IAM policies with least privilege
  - Enable object lifecycle policies

- [ ] **Step 3.1.2:** Implement signed URL generation
  - Create service for generating presigned upload URLs
  - Set expiration time (15 minutes)
  - Implement security headers
  - Add file size and type validation

### 3.2 Backend - Media Service
- [ ] **Step 3.2.1:** Create Media entity and schema
  - Table: `media_files`
  - Fields: `id`, `rental_id`, `event_id`, `file_type`, `file_name`, `file_size`, `storage_path`, `storage_provider`, `metadata` (JSONB), `uploaded_by`, `uploaded_at`, `sha256_hash`
  - Create migration

- [ ] **Step 3.2.2:** Implement MediaService
  - `generateUploadUrl()` - Create presigned URL for upload
  - `confirmUpload()` - Verify upload completion and save metadata
  - `getMediaFile()` - Generate download URL
  - `getMediaByEvent()` - Fetch all media for an event
  - `calculateFileHash()` - Compute SHA-256 hash
  - `extractMetadata()` - Capture EXIF data (timestamp, device, location if available)

- [ ] **Step 3.2.3:** Create media upload endpoints
  - `POST /api/media/upload-url` - Get presigned URL
  - `POST /api/media/confirm` - Confirm upload completion
  - `GET /api/media/:id` - Get media download URL
  - `GET /api/events/:id/media` - List event media

- [ ] **Step 3.2.4:** Implement file validation
  - Allowed types: JPEG, PNG, PDF, MP4, MOV
  - Max file size: 50MB for images, 500MB for videos
  - Virus scanning (ClamAV or cloud provider API)
  - Metadata preservation validation

- [ ] **Step 3.2.5:** Implement compression service
  - Image compression (preserve EXIF)
  - Video transcoding (optional, future)
  - Generate thumbnails for images/videos
  - Store original + compressed versions

### 3.3 Flutter App - Media Capture (Mobile + Web)
- [ ] **Step 3.3.1:** Implement camera integration (Mobile)
  - Install `camera` package for native camera access
  - Request camera permissions using `permission_handler`
  - Create `CameraScreen` widget
  - Capture photo with full EXIF metadata preservation
  - Display permission denial dialog with settings link
  - Handle permission states gracefully

- [ ] **Step 3.3.2:** Implement media picker
  - Install `image_picker` for photos and videos
  - Install `file_picker` for documents (PDF)
  - Create `MediaPickerService` in `/data/services/`
  - Photo library access with thumbnail preview
  - Video library access (max 500MB)
  - Document picker (PDF only)
  - Multi-select support (up to 10 files)
  - Platform-specific implementations (mobile vs web)

- [ ] **Step 3.3.3:** Create media upload widget
  - Create `MediaUploadWidget` component
  - Progress indicator using `LinearProgressIndicator`
  - Retry on failure with exponential backoff
  - Queue multiple uploads (sequential processing)
  - Thumbnail preview before upload
  - Cancel upload option (dispose upload stream)
  - Error handling with user-friendly messages

- [ ] **Step 3.3.4:** Implement media viewer
  - Install `photo_view` for image viewer with pinch-to-zoom
  - Install `video_player` for video playback
  - Install `flutter_pdfview` or `syncfusion_flutter_pdfviewer` for PDF
  - Create `MediaViewerScreen` with type detection
  - Download to device option (mobile)
  - Share functionality using `share_plus`
  - Full-screen mode support

### 3.4 Flutter Web - Media Management
- [ ] **Step 3.4.1:** Create file upload component (Web)
  - Install `desktop_drop` for drag-and-drop on web
  - Create `FileUploadZone` widget
  - File type icon display
  - Upload progress bar with percentage
  - Batch upload support
  - File size validation before upload

- [ ] **Step 3.4.2:** Create media gallery view
  - Grid layout using `GridView.builder`
  - Responsive columns (2-6 based on screen width)
  - Lightbox for full-screen view using `photo_view`
  - Filter by event/date with dropdown
  - Download all media as ZIP (web only, backend-generated)

---

## 4. Evidence Integrity Layer

### 4.1 Hash Chain Implementation
- [ ] **Step 4.1.1:** Design hash chain algorithm
  - Each event hashes: `previous_event_hash + current_event_data + timestamp`
  - Use SHA-256
  - First event in timeline uses genesis hash (rental ID based)
  - Document algorithm specification

- [ ] **Step 4.1.2:** Implement IntegrityService
  - `generateEventHash()` - Create hash for new event
  - `verifyEventChain()` - Validate entire rental timeline
  - `getChainProof()` - Generate merkle-like proof for specific event
  - `detectTampering()` - Check for broken chain links

- [ ] **Step 4.1.3:** Add hash generation to event creation
  - Modify `EventsService.createEvent()` to generate hash
  - Fetch previous event hash
  - Calculate current hash
  - Store both `previous_event_hash` and `current_event_hash`

- [ ] **Step 4.1.4:** Create integrity verification endpoint
  - `GET /api/rentals/:id/verify` - Run full chain verification
  - Return verification report with chain status
  - Flag any broken links

### 4.2 Audit Logging
- [ ] **Step 4.2.1:** Create audit log schema
  - Table: `audit_logs`
  - Fields: `id`, `user_id`, `action`, `resource_type`, `resource_id`, `ip_address`, `user_agent`, `timestamp`, `request_payload`, `response_status`
  - Append-only table (no updates/deletes)
  - Create migration

- [ ] **Step 4.2.2:** Implement AuditService
  - `logAction()` - Record all write operations
  - `logAuthEvent()` - Record login/logout
  - `logExport()` - Record evidence export
  - `getAuditTrail()` - Fetch logs for resource

- [ ] **Step 4.2.3:** Create audit middleware
  - Intercept all POST/PUT/PATCH/DELETE requests
  - Extract relevant data
  - Call AuditService asynchronously
  - Don't block request on audit logging

- [ ] **Step 4.2.4:** Create admin audit viewer
  - Web dashboard page for internal admins
  - Filter by user, action, resource, date
  - Export audit logs as CSV

### 4.3 Immutability Enforcement
- [ ] **Step 4.3.1:** Database constraints
  - Remove UPDATE/DELETE permissions on `rental_events` table
  - Add trigger to prevent modifications (PostgreSQL)
  - Test immutability at database level

- [ ] **Step 4.3.2:** Application-level safeguards
  - Remove update/delete methods from EventsService
  - Add code comments warning against modification
  - Create correction flow: new event with type "CORRECTION" references old event

- [ ] **Step 4.3.3:** Implement correction mechanism
  - New event type: `EVENT_CORRECTION`
  - References original event ID
  - Stores correction reason
  - Original event remains in chain

---

## 5. Certified Evidence Export

### 5.1 Export Service Development
- [ ] **Step 5.1.1:** Design export bundle structure
  - PDF document with sections:
    1. Cover page (RentLedger branding)
    2. Export metadata (timestamp, rental ID, requested by)
    3. Property & participant information
    4. Complete timeline (chronological)
    5. Event details with media references
    6. Hash verification page
    7. Legal disclaimer footer
  - Document specification

- [ ] **Step 5.1.2:** Implement ExportService
  - `generateExport()` - Create full export bundle
  - `renderTimelinePDF()` - Use Puppeteer/PDFKit to generate PDF
  - `embedMediaReferences()` - Include media hashes and thumbnails
  - `addVerificationPage()` - Include hash chain proof
  - `signExport()` - Add digital signature (Phase 2)

- [ ] **Step 5.1.3:** Create HTML template for PDF generation
  - Professional, court-ready design
  - Neutral colors (grayscale)
  - Clear typography (serif font for body)
  - Structured sections with page breaks
  - Footer with "Generated by RentLedger" + timestamp

- [ ] **Step 5.1.4:** Implement Section 65B compliance (India)
  - Add certificate statement in export
  - Include system operator details
  - Add hash verification methodology
  - Consult legal expert for exact wording

- [ ] **Step 5.1.5:** Create export endpoints
  - `POST /api/rentals/:id/export` - Request export (async)
  - `GET /api/exports/:id` - Check export status
  - `GET /api/exports/:id/download` - Download completed export
  - Store exports in S3 with expiration (30 days)

### 5.2 Background Job Processing
- [ ] **Step 5.2.1:** Set up BullMQ with Redis
  - Install BullMQ and Redis
  - Configure Redis connection
  - Create queue for PDF generation
  - Set up worker process

- [ ] **Step 5.2.2:** Implement export job
  - Job processor: `ExportJobProcessor`
  - Fetch rental data
  - Call `ExportService.generateExport()`
  - Upload PDF to S3
  - Update export record status
  - Send notification on completion

- [ ] **Step 5.2.3:** Add job monitoring
  - Expose queue metrics endpoint
  - Create admin dashboard for job status
  - Implement retry logic on failures
  - Add alerting for stuck jobs

### 5.3 Access Control for Exports
- [ ] **Step 5.3.1:** Implement export permissions
  - Tenants: Paid feature (check subscription)
  - Brokers: Included in broker plan
  - Society: Included in society plan
  - Landlords: Limited export (only their properties)

- [ ] **Step 5.3.2:** Create export history tracking
  - Table: `export_requests`
  - Fields: `id`, `rental_id`, `requested_by`, `status`, `completed_at`, `download_count`, `expires_at`
  - Track download counts
  - Enforce expiration

- [ ] **Step 5.3.3:** Implement rate limiting
  - Max 10 exports per tenant per month
  - No limit for brokers/societies (within reason)
  - Add cooldown period (24h between same rental exports)

### 5.4 UI Implementation
- [ ] **Step 5.4.1:** Mobile app - Export screen
  - "Request Export" button on rental detail
  - Subscription gate for free users
  - Progress indicator during generation
  - Download link when ready
  - Push notification on completion

- [ ] **Step 5.4.2:** Web dashboard - Export page
  - Export history table
  - Status indicators (pending, processing, ready, expired)
  - Download button
  - Re-request export option

---

## 6. Authentication & Authorization

### 6.1 Authentication Setup
- [ ] **Step 6.1.1:** Choose auth provider for MVP
  - Evaluate: Auth0 vs Clerk vs Firebase Auth
  - Set up account and application
  - Configure allowed callback URLs
  - Set up social login providers (Google, optional)

- [ ] **Step 6.1.2:** Backend auth integration
  - Install auth SDK
  - Create auth middleware for JWT validation
  - Implement user creation on first login
  - Store user profile in PostgreSQL

- [ ] **Step 6.1.3:** Create Users entity and schema
  - Table: `users`
  - Fields: `id` (UUID), `auth_provider_id`, `email`, `phone`, `name`, `role`, `created_at`, `updated_at`, `last_login`
  - Create migration

- [ ] **Step 6.1.4:** Implement JWT refresh token flow
  - Store refresh tokens in database or Redis
  - Create endpoint: `POST /api/auth/refresh`
  - Implement token rotation
  - Add token blacklist for logout

### 6.2 Role-Based Access Control (RBAC)
- [ ] **Step 6.2.1:** Define roles enum
  - `TENANT`, `LANDLORD`, `BROKER`, `SOCIETY_ADMIN`, `INTERNAL_ADMIN`
  - Store in database or code enum

- [ ] **Step 6.2.2:** Create permissions matrix
  - Document: who can create/read/update/delete what
  - Examples:
    - Tenant can create events, view own rentals
    - Broker can create rentals, view assigned rentals, export evidence
    - Society can view all rentals in their society, limited event creation
  - Store in code or database

- [ ] **Step 6.2.3:** Implement RBAC middleware
  - `@Roles()` decorator for NestJS controllers
  - Check user role against required roles
  - Return 403 Forbidden if unauthorized

- [ ] **Step 6.2.4:** Implement resource-level permissions
  - Verify user has access to specific rental
  - Check participant relationship
  - Validate action based on role + rental relationship

### 6.3 Flutter App - Auth Flow (Mobile + Web)
- [ ] **Step 6.3.1:** Create auth screens
  - Implement `WelcomeScreen` (splash/onboarding)
  - Implement `LoginScreen` with:
    - Email/password input fields
    - Form validation
    - Social login buttons (Google OAuth - optional)
    - "Forgot Password" link
  - Implement `SignUpScreen` with role selection
  - Implement `PhoneVerificationScreen` (if using phone auth)
    - OTP input widget
    - Resend OTP functionality
  - Implement `ProfileSetupScreen` for first-time users

- [ ] **Step 6.3.2:** Implement auth state management with Riverpod
  - Create `AuthNotifier` extending `StateNotifier<AuthState>`
  - Create `authProvider` for global auth state
  - Store JWT in `flutter_secure_storage`:
    - Write token on login
    - Read token on app start
    - Delete token on logout
  - Implement auto-refresh token logic:
    - Check token expiry
    - Refresh before expiration
    - Handle refresh failures
  - Create `authStateStreamProvider` to reactively update UI

- [ ] **Step 6.3.3:** Implement route guards with go_router
  - Create `redirect` logic in `GoRouter` configuration
  - Check auth state before rendering protected routes
  - Redirect to `/login` if unauthenticated
  - Redirect to appropriate dashboard based on role
  - Show loading screen during auth state check
  - Implement deep link handling with auth check

- [ ] **Step 6.3.4:** Configure Dio interceptors for JWT
  - Create `AuthInterceptor` for Dio
  - Automatically add `Authorization: Bearer <token>` header
  - Handle 401 responses:
    - Attempt token refresh
    - Retry failed request with new token
    - Logout if refresh fails
  - Queue requests during token refresh

---

## 7. Broker Dashboard

### 7.1 Dashboard Home
- [ ] **Step 7.1.1:** Create dashboard layout
  - Top navbar with logo, user menu, notifications
  - Left sidebar with navigation links
  - Main content area
  - Responsive design (mobile-friendly)

- [ ] **Step 7.1.2:** Implement dashboard overview page
  - Stats cards: Active rentals, Pending move-outs, Disputes this month
  - Recent activity feed
  - Quick actions: "Create Rental", "View All Rentals"

### 7.2 Rentals Management
- [ ] **Step 7.2.1:** Create rentals list page
  - Table with columns: Property, Tenant, Status, Start Date, Actions
  - Filters: Status (Active/Closed), Date range
  - Search by property address or tenant name
  - Pagination (50 per page)

- [ ] **Step 7.2.2:** Implement rental creation wizard
  - Step 1: Property details (address, unit number)
  - Step 2: Add tenant (invite by email/phone)
  - Step 3: Add landlord (optional)
  - Step 4: Set start date
  - Step 5: Review and create
  - Success confirmation with link to rental timeline

- [ ] **Step 7.2.3:** Create rental detail page
  - Property information panel
  - Participants panel (tenant, landlord, broker)
  - Timeline view (same as mobile app)
  - Add event inline form
  - Export evidence button
  - Close rental button

### 7.3 Dispute Management
- [ ] **Step 7.3.1:** Implement dispute flagging
  - Add "Flag as Dispute" button on rental detail
  - Dispute reasons dropdown
  - Add notes field
  - Tag rental with dispute status

- [ ] **Step 7.3.2:** Create disputes list page
  - Filter rentals by dispute flag
  - Show dispute reason and notes
  - Link to rental timeline
  - Mark dispute as resolved

### 7.4 Evidence Export Management
- [ ] **Step 7.4.1:** Create exports list page
  - Table: Rental, Requested Date, Status, Download
  - Filter by status, date
  - Download button (when ready)

- [ ] **Step 7.4.2:** Integrate export request
  - Button on rental detail page
  - Confirmation modal
  - Show estimated time (2-5 minutes)
  - Redirect to exports page

---

## 8. Housing Society Dashboard

### 8.1 Dashboard Home
- [ ] **Step 8.1.1:** Create society dashboard layout
  - Similar to broker dashboard
  - Society-specific branding area
  - Different navigation items

- [ ] **Step 8.1.2:** Implement overview page
  - Stats: Total rentals in society, Active rentals, Recent move-ins/outs
  - Recent activity feed (all society rentals)
  - Rentals by building/floor visualization

### 8.2 Society Rentals View
- [ ] **Step 8.2.1:** Create all rentals list
  - Table with: Unit, Tenant, Status, Start Date
  - Filter by building, floor, status
  - Search by unit number or tenant name
  - Permission-based access (only society rentals)

- [ ] **Step 8.2.2:** Implement move-in/move-out logging
  - Society admin can create `MOVE_IN` and `MOVE_OUT` events
  - Form with: Unit, Tenant name, Date
  - Optional: Upload move-in checklist

### 8.3 Dispute Access
- [ ] **Step 8.3.1:** Implement permissioned dispute view
  - Society can view disputes if:
    - Tenant or landlord has granted permission
    - Or dispute involves society (e.g., damage to common area)
  - Show limited timeline (only relevant events)

- [ ] **Step 8.3.2:** Create permission request flow
  - Society can request access to rental timeline
  - Notification sent to tenant/landlord
  - Approve/deny buttons
  - Access granted for limited time (30 days)

---

## 9. UI/UX Implementation

### 9.1 Design System Foundation
- [ ] **Step 9.1.1:** Create color system
  - Primary palette: Off-white (#F8F9FB), Charcoal (#0F172A), Slate (#CBD5E1)
  - Accent: Deep indigo (#1E3A8A) - use sparingly
  - Define CSS variables or theme object
  - No gradients, no neon, no playful colors

- [ ] **Step 9.1.2:** Typography setup
  - Install Inter font (or IBM Plex Sans)
  - Define font sizes: Body 15-16px, Headings with subtle weight
  - Set generous line height (1.6-1.8)
  - Create typography utility classes

- [ ] **Step 9.1.3:** Spacing system
  - 8pt spacing system
  - Define spacing scale: 4px, 8px, 16px, 24px, 32px, 48px, 64px
  - Create spacing utilities

- [ ] **Step 9.1.4:** Component styling principles
  - Flat cards with 1px border, 6-8px border radius
  - No heavy shadows (use subtle borders)
  - Maintain strong vertical rhythm
  - Max content width for readability

### 9.2 Flutter App UI Components
- [ ] **Step 9.2.1:** Create Timeline widget
  - Vertical, left-aligned timeline using custom `CustomPaint` or package
  - Chronological ordering (newest first configurable)
  - `EventCard` widget design:
    - Container with BoxDecoration (1px border, 6-8px radius)
    - Event type icon (minimal, grayscale) using `Icon` or custom SVG
    - Timestamp display:
      - Human-readable format with `intl` package
      - Show UTC on long-press or tap
    - Actor name and role badge
    - Description text (expandable if too long)
    - Media thumbnail using `CachedNetworkImage`
    - Hash verification badge (Icon with Tooltip, small, quiet)
  - Separator between events (subtle divider)

- [ ] **Step 9.2.2:** Create EventCard widget
  - Flat design with `BoxDecoration`:
    - Border: `Border.all(color: Colors.grey[300], width: 1)`
    - Border radius: `BorderRadius.circular(6-8)`
  - Event type color coding (very subtle, border accent)
  - Expandable for full details using `ExpansionTile` or custom
  - No edit button (immutable UI)
  - Tap to view full event details in modal

- [ ] **Step 9.2.3:** Create MediaThumbnail widget
  - Small preview image (80x80 or 100x100)
  - Badge overlay for file type (PDF icon, video play icon)
  - Tap to open `MediaViewerScreen`
  - Rounded corners matching design system
  - Loading shimmer while image loads

- [ ] **Step 9.2.4:** Create bottom navigation (Mobile)
  - Use `BottomNavigationBar` or custom widget
  - 4 tabs with icons + labels:
    - Timeline (home icon)
    - Add Event (plus icon)
    - Documents (folder icon)
    - Account (profile icon)
  - Minimal, grayscale icons
  - No badges or notification dots (calm interface)
  - Smooth tab switching

- [ ] **Step 9.2.5:** Create theme configuration
  - Define `ThemeData` in `/lib/core/theme/app_theme.dart`:
    - Primary color: Deep indigo (#1E3A8A)
    - Background: Off-white (#F8F9FB)
    - Surface: White
    - On-surface text: Charcoal (#0F172A)
    - Divider: Slate (#CBD5E1)
  - Typography using `TextTheme`:
    - Font family: Inter (via Google Fonts)
    - Body text: 15-16px
    - Headings: Medium weight
    - Line height: 1.6-1.8
  - Component themes:
    - `ElevatedButtonThemeData` - solid, dark, minimal elevation
    - `OutlinedButtonThemeData` - subtle border
    - `CardTheme` - flat with 1px border
    - `InputDecorationTheme` - clean, minimal

### 9.3 Flutter Web UI Components (Dashboard)
- [ ] **Step 9.3.1:** Create Sidebar widget (Web)
  - Fixed left sidebar using `Drawer` or custom `Container`
  - Width: 240-280px
  - Navigation items:
    - List of `ListTile` with icons
    - Active state styling (subtle background highlight)
    - Ripple effect on hover
  - User profile section at bottom
  - Responsive: hamburger menu on mobile

- [ ] **Step 9.3.2:** Create DataTable component (Web)
  - Use Flutter's `DataTable` widget
  - Customize styling to match design system:
    - Header row: medium weight text
    - Sortable columns with arrow indicators
    - Row hover state (subtle background change)
    - Alternating row colors (very subtle)
  - Pagination controls:
    - `PaginatedDataTable` or custom pagination
    - Page numbers and next/prev buttons
  - Loading state with shimmer placeholders

- [ ] **Step 9.3.3:** Create Card component
  - Use `Card` widget with custom styling
  - `BoxDecoration` with 1px border instead of elevation shadow
  - Header, body, footer sections using `Column`
  - Responsive padding (16-24px)
  - Optional: dividers between sections

- [ ] **Step 9.3.4:** Create Button components
  - Primary button:
    - `ElevatedButton` with dark background (#1E3A8A)
    - White text, medium weight
    - Minimal elevation (0-2dp)
    - Disabled state (grayed out)
  - Secondary button:
    - `OutlinedButton` with 1px border
    - Primary color text
  - Destructive button:
    - Red text color
    - Show confirmation dialog before action
  - Loading state:
    - Replace button content with `CircularProgressIndicator`
    - Disable button interaction

### 9.4 Empty States & Microcopy
- [ ] **Step 9.4.1:** Design empty states
  - No rentals: "Create your first rental timeline"
  - No events: "Start by documenting the move-in condition"
  - No media: "Attach photos or documents to this event"
  - Calm, neutral tone
  - Single call-to-action

- [ ] **Step 9.4.2:** Write microcopy
  - Use precise, non-emotional language
  - Examples:
    - "Attach record" (not "Upload proof")
    - "Event added to timeline" (not "Dispute logged")
    - "Certified record export" (not "Legal evidence")
  - Review all button labels, form labels, error messages

### 9.5 Action Design
- [ ] **Step 9.5.1:** Implement confirmation modals
  - For irreversible actions: export, close rental, flag dispute
  - Modal design:
    - Clear heading
    - Explanation of action
    - Confirmation checkbox (optional)
    - Cancel + Confirm buttons

- [ ] **Step 9.5.2:** Create loading states
  - Spinner for async actions
  - Progress bars for uploads
  - Skeleton screens for data loading
  - Calm, non-intrusive

---

## 10. Rental Reputation Graph (Phase 1)

### 10.1 Data Collection
- [ ] **Step 10.1.1:** Create reputation signals schema
  - Table: `reputation_signals`
  - Fields: `id`, `user_id`, `rental_id`, `signal_type`, `signal_value`, `timestamp`
  - Signal types: `RENT_PAID_ON_TIME`, `RENT_DELAYED`, `DISPUTE_RAISED`, `DISPUTE_RESOLVED`, `EVENT_CREATED`
  - NO public scores in MVP

- [ ] **Step 10.1.2:** Implement signal capture
  - Automatically log signals on event creation
  - Examples:
    - `RENT_PAID` event → `RENT_PAID_ON_TIME` signal
    - Dispute flagged → `DISPUTE_RAISED` signal
    - Dispute resolved → `DISPUTE_RESOLVED` signal

- [ ] **Step 10.1.3:** Store behavioral metadata
  - Payment consistency: Count on-time vs delayed payments
  - Dispute frequency: Count disputes per rental
  - Resolution rate: Count resolved vs unresolved disputes
  - Store in JSONB field or separate summary table

### 10.2 Internal Analysis Only (No Public Scores)
- [ ] **Step 10.2.1:** Create admin analytics dashboard
  - Internal use only (not exposed to users)
  - View user reputation signals
  - Aggregated statistics: avg payment delay, dispute rate
  - Use for product insights, not user-facing features

- [ ] **Step 10.2.2:** Document future reputation model
  - Design scoring algorithm (for Phase 2)
  - Define weighting factors
  - Privacy and consent considerations
  - Legal review required before public launch

---

## 11. OCR & Document Processing

### 11.1 OCR Service Setup
- [ ] **Step 11.1.1:** Install Tesseract OCR
  - Set up Tesseract on backend server
  - Install language packs (English, Hindi)
  - Configure Docker image with Tesseract

- [ ] **Step 11.1.2:** Implement OCRService
  - `extractText()` - Extract text from image/PDF
  - `indexDocument()` - Create searchable index of extracted text
  - Store OCR result in `media_files.metadata` JSONB field

- [ ] **Step 11.1.3:** Create OCR job processor
  - Queue OCR jobs for uploaded documents
  - Process asynchronously (don't block upload)
  - Store results in database
  - Update media file status

### 11.2 Document Indexing
- [ ] **Step 11.2.1:** Implement search functionality
  - Create endpoint: `GET /api/rentals/:id/search?q=<query>`
  - Search through OCR-extracted text
  - Return matching events with highlighted snippets

- [ ] **Step 11.2.2:** Add document classification (optional)
  - Classify documents: Lease agreement, Repair bill, Notice, Other
  - Use simple keyword-based classification (no AI in MVP)
  - Store classification in metadata

---

## 12. Background Jobs & Notifications

### 12.1 Queue System
- [ ] **Step 12.1.1:** Set up Redis
  - Install Redis locally or via Docker
  - Configure connection in backend
  - Set up health check endpoint

- [ ] **Step 12.1.2:** Implement BullMQ queues
  - Create queues:
    - `pdf-export` - Evidence export generation
    - `ocr-processing` - Document OCR
    - `notifications` - Email/SMS sending
    - `media-compression` - Image/video compression

- [ ] **Step 12.1.3:** Create job processors
  - Implement workers for each queue
  - Add error handling and retries (3 attempts)
  - Log job failures to Sentry

### 12.2 Notification Service
- [ ] **Step 12.2.1:** Email setup
  - Choose provider: SendGrid or Amazon SES
  - Create email templates:
    - Rental invitation
    - Event created (digest)
    - Export ready
    - Dispute flagged
  - HTML + plain text versions

- [ ] **Step 12.2.2:** Implement EmailService
  - `sendRentalInvite()`
  - `sendEventNotification()`
  - `sendExportReady()`
  - Queue emails (don't send synchronously)

- [ ] **Step 12.2.3:** SMS setup (optional for MVP)
  - Choose provider: Twilio or local aggregator
  - Implement SMSService for critical notifications
  - OTP for phone verification

- [ ] **Step 12.2.4:** Push notifications (mobile)
  - Set up Firebase Cloud Messaging
  - Store device tokens in database
  - Implement PushService
  - Notifications:
    - New event added to your rental
    - Export ready for download
    - Rental invitation

### 12.3 Notification Preferences
- [ ] **Step 12.3.1:** Create notification settings schema
  - Table: `notification_preferences`
  - Fields: `user_id`, `email_enabled`, `sms_enabled`, `push_enabled`, `event_digest`, `immediate_notifications`

- [ ] **Step 12.3.2:** Implement settings UI
  - Mobile app: Settings screen with toggles
  - Web dashboard: Account settings page
  - Update preferences endpoint

---

## 13. Infrastructure & DevOps

### 13.1 Containerization
- [ ] **Step 13.1.1:** Create Dockerfile for backend
  - Multi-stage build for optimization
  - Include Node.js, Tesseract
  - Health check endpoint
  - Non-root user for security

- [ ] **Step 13.1.2:** Create docker-compose for local development
  - Services: backend, postgres, redis
  - Volume mounts for code hot-reloading
  - Environment variable configuration

### 13.2 Cloud Infrastructure (AWS)
- [ ] **Step 13.2.1:** Set up AWS account and IAM
  - Create AWS account (or use existing)
  - Set up IAM users with least privilege
  - Create service accounts for backend

- [ ] **Step 13.2.2:** Set up RDS PostgreSQL
  - Create RDS instance (t3.micro for MVP)
  - Configure security groups
  - Enable automated backups
  - Set up connection from backend

- [ ] **Step 13.2.3:** Set up S3 buckets
  - Bucket for media uploads (versioning enabled)
  - Bucket for PDF exports (lifecycle policy: 30 days)
  - Configure CORS and bucket policies

- [ ] **Step 13.2.4:** Set up EC2/ECS for backend
  - Choose EC2 (simpler) or ECS (container orchestration)
  - Configure auto-scaling (later)
  - Set up load balancer
  - Configure security groups

- [ ] **Step 13.2.5:** Set up CloudWatch
  - Enable logs from backend
  - Create alarms: High CPU, High memory, Error rate
  - Set up log retention policy

- [ ] **Step 13.2.6:** Set up ElastiCache for Redis
  - Create Redis cluster
  - Configure for BullMQ queues
  - Set up connection from backend

### 13.3 CI/CD Pipeline
- [ ] **Step 13.3.1:** Set up GitHub Actions
  - Create workflow for backend:
    - Lint and type check
    - Run unit tests
    - Build Docker image
    - Push to registry (Docker Hub or ECR)
    - Deploy to staging

- [ ] **Step 13.3.2:** Implement automated testing
  - Unit tests for services
  - Integration tests for API endpoints
  - Aim for 70%+ coverage on critical paths

- [ ] **Step 13.3.3:** Set up staging environment
  - Separate RDS instance
  - Separate S3 buckets
  - Deploy on every merge to `develop` branch

- [ ] **Step 13.3.4:** Set up production deployment
  - Manual approval step in GitHub Actions
  - Deploy to production on merge to `main`
  - Blue-green deployment strategy (future)

### 13.4 Domain & SSL
- [ ] **Step 13.4.1:** Register domain
  - Choose domain name (e.g., rentledger.app)
  - Configure DNS with Route 53 or Cloudflare

- [ ] **Step 13.4.2:** Set up SSL certificates
  - Use AWS Certificate Manager (free)
  - Configure HTTPS on load balancer
  - Redirect HTTP to HTTPS

---

## 14. Security & Compliance

### 14.1 Security Hardening
- [ ] **Step 14.1.1:** Implement HTTPS everywhere
  - Force HTTPS on all endpoints
  - HSTS headers
  - Secure cookie flags

- [ ] **Step 14.1.2:** Implement rate limiting
  - Use rate-limiter middleware
  - Limits:
    - Auth endpoints: 5 req/min per IP
    - API endpoints: 100 req/min per user
    - Upload endpoints: 10 req/min per user

- [ ] **Step 14.1.3:** Input validation and sanitization
  - Use class-validator on all DTOs
  - Sanitize user inputs to prevent XSS
  - Parameterized queries to prevent SQL injection

- [ ] **Step 14.1.4:** Implement CORS properly
  - Allow only frontend domains
  - Restrict methods to necessary ones
  - No wildcard origins in production

- [ ] **Step 14.1.5:** Secrets management
  - Use AWS Secrets Manager or environment variables
  - Never commit secrets to Git
  - Rotate API keys and tokens regularly

- [ ] **Step 14.1.6:** Encryption at rest and in transit
  - Enable RDS encryption
  - Enable S3 encryption
  - Use TLS 1.2+ for all connections

### 14.2 Data Privacy & Compliance
- [ ] **Step 14.2.1:** Implement data retention policies
  - Define retention periods:
    - Active rental data: Indefinite
    - Closed rental data: 7 years (legal requirement)
    - Export PDFs: 30 days
    - Audit logs: 2 years

- [ ] **Step 14.2.2:** Implement user data deletion
  - Create endpoint: `DELETE /api/users/me`
  - Hard delete personal data (GDPR right to be forgotten)
  - Keep anonymized rental events (legal requirements)

- [ ] **Step 14.2.3:** India data residency
  - Ensure AWS region is in India (ap-south-1)
  - Document data flow and storage locations
  - Compliance with IT Act 2000

- [ ] **Step 14.2.4:** Create privacy policy and terms
  - Draft privacy policy (consult lawyer)
  - Draft terms of service
  - Add consent checkboxes during sign-up

### 14.3 Monitoring & Incident Response
- [ ] **Step 14.3.1:** Set up Sentry for error tracking
  - Install Sentry SDK on backend and frontend
  - Configure error reporting
  - Set up alerts for critical errors

- [ ] **Step 14.3.2:** Set up uptime monitoring
  - Use service like Pingdom or UptimeRobot
  - Monitor API health endpoint
  - Alert on downtime

- [ ] **Step 14.3.3:** Create incident response plan
  - Document steps for security breach
  - Contact list (team, legal, infrastructure)
  - Communication templates for users

---

## 15. Testing & Quality Assurance

### 15.1 Backend Testing
- [ ] **Step 15.1.1:** Set up testing framework
  - Install Jest and Supertest
  - Configure test database
  - Create test utilities and mocks

- [ ] **Step 15.1.2:** Write unit tests
  - Test all service methods
  - Focus on: EventsService, IntegrityService, ExportService
  - Aim for 70%+ coverage

- [ ] **Step 15.1.3:** Write integration tests
  - Test API endpoints end-to-end
  - Test auth flows
  - Test rental creation and event logging flows

- [ ] **Step 15.1.4:** Write hash chain tests
  - Test hash generation
  - Test chain verification
  - Test tampering detection

### 15.2 Flutter Testing
- [ ] **Step 15.2.1:** Set up testing framework
  - Flutter comes with built-in test framework
  - Install `flutter_test` (included by default)
  - Install `mockito` + `build_runner` for mocking
  - Install `integration_test` for E2E tests
  - Configure test folder structure:
    - `/test/unit/` - Unit tests
    - `/test/widget/` - Widget tests
    - `/integration_test/` - Integration tests

- [ ] **Step 15.2.2:** Write unit tests
  - Test domain layer use cases
  - Test data layer repositories and models
  - Test utility functions and validators
  - Mock external dependencies (API clients, storage)
  - Aim for 70%+ coverage on business logic

- [ ] **Step 15.2.3:** Write widget tests
  - Test UI components in isolation:
    - `EventCard` widget
    - `Timeline` widget
    - Form validation widgets
  - Test user interactions (taps, scrolls, inputs)
  - Test state changes and UI updates
  - Use `WidgetTester` for pumping widgets

- [ ] **Step 15.2.4:** Write integration tests
  - Test complete user flows:
    - Login → Create rental → Add event → View timeline
    - Upload media → View in timeline → Download
    - Request export → Download PDF
  - Run on real devices/simulators
  - Test on Android, iOS, and Web
  - Use `flutter driver` for automation

### 15.3 Security Testing
- [ ] **Step 15.3.1:** Run OWASP ZAP scan
  - Scan API endpoints for vulnerabilities
  - Fix identified issues

- [ ] **Step 15.3.2:** Penetration testing
  - Hire security professional (optional for MVP)
  - Or use automated tools like Burp Suite

### 15.4 User Acceptance Testing (UAT)
- [ ] **Step 15.4.1:** Create test scenarios
  - Tenant journey: Sign up → Join rental → Add events → Export evidence
  - Broker journey: Sign up → Create rental → Invite tenant → Monitor timeline
  - Society journey: Sign up → View society rentals → Log move-in

- [ ] **Step 15.4.2:** Conduct UAT with real users
  - Recruit 5-10 beta users
  - Observe them using the app
  - Collect feedback
  - Fix critical UX issues

---

## 🎯 MVP Launch Checklist

### Pre-Launch
- [ ] All critical features implemented and tested on Android, iOS, and Web
- [ ] Security audit completed
- [ ] Privacy policy and terms published
- [ ] Domain and SSL configured
- [ ] Production infrastructure ready (AWS)
- [ ] Monitoring and alerting set up (Sentry, CloudWatch)
- [ ] Backup and disaster recovery plan in place
- [ ] Beta testing completed on all platforms with feedback incorporated
- [ ] App store listings prepared (Google Play, Apple App Store)
- [ ] Web app optimized and deployed

### Launch Day
- [ ] Deploy backend to production
- [ ] Deploy web app to production
- [ ] Submit mobile apps to stores (or release via TestFlight/Internal Testing)
- [ ] Monitor error rates and performance
- [ ] Announce to early users
- [ ] Support team ready for questions

### Post-Launch (Week 1)
- [ ] Monitor user onboarding flow on all platforms
- [ ] Fix critical bugs immediately
- [ ] Collect user feedback
- [ ] Iterate on UX issues
- [ ] Monitor web vs mobile adoption

---

## 📊 Success Metrics to Track

### Product Metrics
- Timeline completion rate (% of rentals with >5 events)
- Evidence export usage (exports per month)
- Monthly active rentals
- Dispute resolution completion rate
- Platform distribution (iOS vs Android vs Web)

### Business Metrics
- User sign-ups (tenant, broker, society)
- Conversion to paid plans
- Broker retention rate
- Society renewal rate
- Revenue per active rental

### Technical Metrics
- API response time (p95 < 500ms)
- Error rate (< 0.1%)
- Uptime (99.9% target)
- Hash verification success rate (100% target)
- App performance (60fps target on mobile)
- Web performance (Lighthouse score >90)

---

## 🛠️ Tech Stack Summary

### Frontend: Flutter (Dart)
| Component | Technology | Purpose |
|-----------|-----------|----------|
| Framework | **Flutter** (Stable channel) | Single codebase for Android, iOS, Web |
| Architecture | **Clean Architecture** | Separation of concerns, testability |
| State Management | **Riverpod** | Compile-time safe, reactive state |
| Navigation | **go_router** | Role-aware route guards, deep linking |
| HTTP Client | **Dio** | REST API calls with interceptors |
| Storage | **flutter_secure_storage** | Secure JWT storage |
| Models | **Freezed + json_serializable** | Immutable data classes |
| UI Framework | **Material 3** (customized) | Institutional design system |
| Typography | **Inter** (Google Fonts) | Clean, professional font |
| Media | `image_picker`, `file_picker`, `camera` | Photo/video/document capture |
| Viewers | `photo_view`, `video_player`, `flutter_pdfview` | Media viewing |

### Backend: NestJS (TypeScript)
| Component | Technology | Purpose |
|-----------|-----------|----------|
| Framework | **NestJS** | Structured, enterprise-ready Node.js |
| Language | **TypeScript** | Type safety and better tooling |
| Database ORM | **TypeORM** | PostgreSQL integration |
| Validation | **class-validator** | DTO validation |
| Authentication | **JWT + Refresh Tokens** | Stateless auth with rotation |

### Database & Storage
| Component | Technology | Purpose |
|-----------|-----------|----------|
| Primary DB | **PostgreSQL** | ACID compliance, relational data |
| Object Storage | **AWS S3** | Immutable media storage with versioning |
| Cache/Queue | **Redis + BullMQ** | Background jobs (PDF exports, OCR) |

### Infrastructure & DevOps
| Component | Technology | Purpose |
|-----------|-----------|----------|
| Cloud Provider | **AWS** | Production infrastructure |
| Database | **AWS RDS** (PostgreSQL) | Managed database |
| Object Storage | **AWS S3** | Media and PDF exports |
| Compute | **AWS EC2 / ECS** | Backend hosting |
| Cache | **AWS ElastiCache** (Redis) | BullMQ queues |
| Monitoring | **CloudWatch + Sentry** | Logs and error tracking |
| CI/CD | **GitHub Actions** | Automated testing and deployment |
| Containerization | **Docker** | Consistent environments |

### Security & Compliance
| Component | Technology | Purpose |
|-----------|-----------|----------|
| Encryption | **TLS 1.2+, AES-256** | Data in transit and at rest |
| Hashing | **SHA-256** | Event integrity verification |
| Auth Provider | **Custom JWT** (or Auth0/Firebase for MVP) | User authentication |
| Data Residency | **AWS ap-south-1** (India) | Compliance with local laws |
| Section 65B | **PDF exports with certification** | Indian legal compliance |

### External Services
| Component | Technology | Purpose |
|-----------|-----------|----------|
| Email | **SendGrid / Amazon SES** | Transactional emails |
| SMS | **Twilio** (or local provider) | OTP and notifications |
| Push Notifications | **Firebase Cloud Messaging** | Mobile push notifications |
| OCR | **Tesseract** (open-source) | Document text extraction |
| PDF Generation | **Puppeteer / PDFKit** | Evidence export bundles |

---

## 📝 Notes

### Out of Scope for MVP
- ❌ Rent payments / wallets
- ❌ In-app chat
- ❌ AI damage detection
- ❌ Automated legal filing
- ❌ Public reputation scores
- ❌ Blockchain marketing features

### Principles
- **Trust over speed** - Every action must be trustworthy
- **Neutral platform** - No judgment or arbitration
- **Immutable records** - No silent editing or deletion
- **Court-ready exports** - Legal compliance from day one
- **Calm, institutional UI** - Trust through design
- **Single codebase** - Flutter enables iOS, Android, Web from one code
- **Clean architecture** - Business logic independent of framework

### Why Flutter?
1. **Single codebase** - Deploy to Android, iOS, and Web simultaneously
2. **Predictable rendering** - Consistent UI across platforms (critical for legal evidence)
3. **Performance** - 60fps on low-end Android devices (important for India market)
4. **Long-term backing** - Google's commitment to Flutter
5. **Clean Architecture** - Enforces separation of trust logic from UI
6. **Compile-time safety** - Dart's type system prevents many runtime errors

---

**Last Updated:** February 6, 2026  
**Total Features:** 200+ actionable steps  
**Estimated Timeline:** 3-6 months for MVP with 3-4 developers  
**Tech Stack:** Flutter + NestJS + PostgreSQL + AWS  
**Target Markets:** India first, then global expansion
