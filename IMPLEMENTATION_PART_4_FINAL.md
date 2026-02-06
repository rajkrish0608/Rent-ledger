# RentLedger - Unified Implementation Plan (Part 4 - Final)
## Sections 11-15: OCR, Jobs, Infrastructure, Security, and Testing

---

## 11. OCR & Document Processing

### 11.1 Backend: Tesseract OCR Integration

- [ ] **Install Tesseract:**
  ```bash
  # Docker
  RUN apt-get update && apt-get install -y tesseract-ocr tesseract-ocr-eng tesseract-ocr-hin
  
  # Install Node.js wrapper
  npm install tesseract.js
  ```

- [ ] **Create OCR service:**
  ```typescript
  // src/ocr/ocr.service.ts
  import { createWorker } from 'tesseract.js';
  
  @Injectable()
  export class OcrService {
    async extractText(imagePath: string): Promise<string> {
      const worker = await createWorker('eng');
      
      try {
        const { data: { text } } = await worker.recognize(imagePath);
        return text;
      } finally {
        await worker.terminate();
      }
    }
    
    async processDocument(mediaId: string): Promise<void> {
      const media = await this.mediaRepo.findOne({ where: { id: mediaId } });
      
      if (!media || media.file_type !== 'PDF') {
        return;
      }
      
      // Download from S3
      const fileBuffer = await this.s3Service.getObject(
        process.env.S3_BUCKET_MEDIA,
        media.storage_path,
      );
      
      // Extract text
      const text = await this.extractText(fileBuffer);
      
      // Update metadata
      await this.mediaRepo.update(mediaId, {
        metadata: {
          ...media.metadata,
          ocr_text: text,
          ocr_processed_at: new Date(),
        },
      });
    }
  }
  ```

- [ ] **Create OCR job processor:**
  ```typescript
  @Processor('ocr-processing')
  export class OcrProcessor extends WorkerHost {
    async process(job: Job): Promise<void> {
      const { media_id } = job.data;
      await this.ocrService.processDocument(media_id);
    }
  }
  ```

- [ ] **Implement search functionality:**
  ```typescript
  @Get('rentals/:id/search')
  async searchTimeline(
    @Param('id') rentalId: string,
    @Query('q') query: string,
  ) {
    // Search through OCR text in media metadata
    const events = await this.eventsRepo
      .createQueryBuilder('event')
      .leftJoinAndSelect('event.media', 'media')
      .where('event.rental_id = :rentalId', { rentalId })
      .andWhere(
        `media.metadata->>'ocr_text' ILIKE :query`,
        { query: `%${query}%` },
      )
      .getMany();
    
    return events;
  }
  ```

---

## 12. Background Jobs & Notifications

### 12.1 Backend: BullMQ Queue Setup

- [ ] **Configure Redis and BullMQ:**
  ```typescript
  // app.module.ts
  import { BullModule } from '@nestjs/bullmq';
  
  @Module({
    imports: [
      BullModule.forRoot({
        connection: {
          host: process.env.REDIS_HOST,
          port: parseInt(process.env.REDIS_PORT),
          password: process.env.REDIS_PASSWORD,
        },
      }),
      BullModule.registerQueue(
        { name: 'pdf-exports' },
        { name: 'ocr-processing' },
        { name: 'notifications' },
        { name: 'media-compression' },
      ),
    ],
  })
  ```

### 12.2 Backend: Notification Service

- [ ] **Create notification service:**
  ```typescript
  // src/notifications/notifications.service.ts
  import * as sgMail from '@sendgrid/mail';
  
  @Injectable()
  export class NotificationsService {
    constructor(
      @InjectQueue('notifications')
      private notificationQueue: Queue,
    ) {
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    }
    
    async sendEmail(to: string, subject: string, html: string): Promise<void> {
      await sgMail.send({
        to,
        from: 'noreply@rentledger.app',
        subject,
        html,
      });
    }
    
    async queueRentalInvite(email: string, rentalId: string): Promise<void> {
      await this.notificationQueue.add('rental-invite', {
        email,
        rental_id: rentalId,
      });
    }
    
    async queueExportReady(userId: string, exportId: string): Promise<void> {
      await this.notificationQueue.add('export-ready', {
        user_id: userId,
        export_id: exportId,
      });
    }
  }
  ```

- [ ] **Create notification processor:**
  ```typescript
  @Processor('notifications')
  export class NotificationProcessor extends WorkerHost {
    async process(job: Job): Promise<void> {
      switch (job.name) {
        case 'rental-invite':
          await this.handleRentalInvite(job.data);
          break;
        case 'export-ready':
          await this.handleExportReady(job.data);
          break;
      }
    }
    
    private async handleRentalInvite(data: any): Promise<void> {
      const rental = await this.rentalsRepo.findOne({
        where: { id: data.rental_id },
      });
      
      await this.notificationsService.sendEmail(
        data.email,
        'You have been invited to a rental timeline',
        `<p>You have been invited to join the rental timeline for ${rental.property_address}</p>`,
      );
    }
    
    private async handleExportReady(data: any): Promise<void> {
      const user = await this.usersRepo.findOne({
        where: { id: data.user_id },
      });
      
      await this.notificationsService.sendEmail(
        user.email,
        'Your certified record export is ready',
        `<p>Your export is ready for download. It will expire in 30 days.</p>`,
      );
    }
  }
  ```

### 12.3 Flutter: Push Notifications

- [ ] **Configure Firebase Cloud Messaging:**
  ```dart
  // lib/core/services/fcm_service.dart
  class FcmService {
    final FirebaseMessaging _fcm = FirebaseMessaging.instance;
    
    Future<void> initialize() async {
      // Request permission
      await _fcm.requestPermission(
        alert: true,
        badge: true,
        sound: true,
      );
      
      // Get FCM token
      final token = await _fcm.getToken();
      print('FCM Token: $token');
      
      // Send token to backend
      // await apiClient.updateFcmToken(token);
      
      // Handle foreground messages
      FirebaseMessaging.onMessage.listen((message) {
        print('Foreground message: ${message.notification?.title}');
        // Show local notification
      });
      
      // Handle background messages
      FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);
    }
  }
  
  @pragma('vm:entry-point')
  Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
    print('Background message: ${message.notification?.title}');
  }
  ```

---

## 13. Infrastructure & DevOps

### 13.1 Docker Configuration

- [ ] **Create backend Dockerfile:**
  ```dockerfile
  # backend/Dockerfile
  FROM node:18-alpine AS builder
  
  WORKDIR /app
  
  COPY package*.json ./
  RUN npm ci
  
  COPY . .
  RUN npm run build
  
  FROM node:18-alpine
  
  # Install Tesseract
  RUN apk add --no-cache tesseract-ocr tesseract-ocr-data-eng
  
  WORKDIR /app
  
  COPY package*.json ./
  RUN npm ci --only=production
  
  COPY --from=builder /app/dist ./dist
  
  EXPOSE 3000
  
  CMD ["node", "dist/main.js"]
  ```

- [ ] **Create docker-compose for local development:**
  ```yaml
  # docker-compose.yml
  version: '3.8'
  
  services:
    postgres:
      image: postgres:15-alpine
      environment:
        POSTGRES_DB: rentledger_dev
        POSTGRES_USER: rentledger_admin
        POSTGRES_PASSWORD: dev_password
      ports:
        - "5432:5432"
      volumes:
        - postgres_data:/var/lib/postgresql/data
    
    redis:
      image: redis:7-alpine
      ports:
        - "6379:6379"
    
    backend:
      build: ./backend
      ports:
        - "3000:3000"
      environment:
        NODE_ENV: development
        DB_HOST: postgres
        DB_PORT: 5432
        REDIS_HOST: redis
        REDIS_PORT: 6379
      depends_on:
        - postgres
        - redis
      volumes:
        - ./backend:/app
        - /app/node_modules
  
  volumes:
    postgres_data:
  ```

### 13.2 AWS Infrastructure

- [ ] **Create Terraform configuration:**
  ```hcl
  # infrastructure/main.tf
  provider "aws" {
    region = "ap-south-1"
  }
  
  # RDS PostgreSQL
  resource "aws_db_instance" "rentledger_db" {
    identifier           = "rentledger-production"
    engine              = "postgres"
    engine_version      = "15.3"
    instance_class      = "db.t3.micro"
    allocated_storage   = 20
    storage_encrypted   = true
    
    db_name  = "rentledger"
    username = var.db_username
    password = var.db_password
    
    backup_retention_period = 7
    skip_final_snapshot    = false
    
    vpc_security_group_ids = [aws_security_group.db.id]
  }
  
  # S3 Buckets
  resource "aws_s3_bucket" "media" {
    bucket = "rentledger-media-production"
    
    versioning {
      enabled = true
    }
    
    server_side_encryption_configuration {
      rule {
        apply_server_side_encryption_by_default {
          sse_algorithm = "AES256"
        }
      }
    }
  }
  
  resource "aws_s3_bucket" "exports" {
    bucket = "rentledger-exports-production"
    
    lifecycle_rule {
      enabled = true
      
      expiration {
        days = 30
      }
    }
  }
  
  # ElastiCache Redis
  resource "aws_elasticache_cluster" "redis" {
    cluster_id           = "rentledger-redis"
    engine              = "redis"
    node_type           = "cache.t3.micro"
    num_cache_nodes     = 1
    parameter_group_name = "default.redis7"
    port                = 6379
  }
  
  # ECS Cluster
  resource "aws_ecs_cluster" "main" {
    name = "rentledger-production"
  }
  
  # ECS Task Definition
  resource "aws_ecs_task_definition" "backend" {
    family                   = "rentledger-backend"
    network_mode            = "awsvpc"
    requires_compatibilities = ["FARGATE"]
    cpu                     = "512"
    memory                  = "1024"
    
    container_definitions = jsonencode([{
      name  = "backend"
      image = "${var.ecr_repository_url}:latest"
      
      portMappings = [{
        containerPort = 3000
        protocol      = "tcp"
      }]
      
      environment = [
        { name = "NODE_ENV", value = "production" },
        { name = "DB_HOST", value = aws_db_instance.rentledger_db.address },
        { name = "REDIS_HOST", value = aws_elasticache_cluster.redis.cache_nodes[0].address },
      ]
      
      secrets = [
        { name = "DB_PASSWORD", valueFrom = "${aws_secretsmanager_secret.db_password.arn}" },
        { name = "JWT_SECRET", valueFrom = "${aws_secretsmanager_secret.jwt_secret.arn}" },
      ]
      
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = "/ecs/rentledger-backend"
          "awslogs-region"        = "ap-south-1"
          "awslogs-stream-prefix" = "ecs"
        }
      }
    }])
  }
  ```

### 13.3 CI/CD Pipeline

- [ ] **Create GitHub Actions workflow:**
  ```yaml
  # .github/workflows/deploy.yml
  name: Deploy to Production
  
  on:
    push:
      branches: [main]
  
  jobs:
    test:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v3
        
        - name: Setup Node.js
          uses: actions/setup-node@v3
          with:
            node-version: '18'
        
        - name: Install dependencies
          run: cd backend && npm ci
        
        - name: Run tests
          run: cd backend && npm test
        
        - name: Run linter
          run: cd backend && npm run lint
    
    build-and-push:
      needs: test
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v3
        
        - name: Configure AWS credentials
          uses: aws-actions/configure-aws-credentials@v2
          with:
            aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
            aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
            aws-region: ap-south-1
        
        - name: Login to Amazon ECR
          id: login-ecr
          uses: aws-actions/amazon-ecr-login@v1
        
        - name: Build and push Docker image
          env:
            ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
            ECR_REPOSITORY: rentledger-backend
            IMAGE_TAG: ${{ github.sha }}
          run: |
            docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG ./backend
            docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
            docker tag $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG $ECR_REGISTRY/$ECR_REPOSITORY:latest
            docker push $ECR_REGISTRY/$ECR_REPOSITORY:latest
    
    deploy:
      needs: build-and-push
      runs-on: ubuntu-latest
      steps:
        - name: Deploy to ECS
          run: |
            aws ecs update-service \
              --cluster rentledger-production \
              --service rentledger-backend \
              --force-new-deployment
  ```

---

## 14. Security & Compliance

### 14.1 Security Hardening

- [ ] **Implement rate limiting:**
  ```typescript
  // src/common/guards/rate-limit.guard.ts
  import { ThrottlerGuard } from '@nestjs/throttler';
  
  @Injectable()
  export class CustomThrottlerGuard extends ThrottlerGuard {
    protected async getTracker(req: Record<string, any>): Promise<string> {
      return req.user?.id || req.ip;
    }
  }
  
  // app.module.ts
  ThrottlerModule.forRoot({
    ttl: 60,
    limit: 100, // 100 requests per minute
  }),
  ```

- [ ] **Add security headers:**
  ```typescript
  // main.ts
  import helmet from 'helmet';
  
  app.use(helmet());
  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS?.split(','),
    credentials: true,
  });
  ```

- [ ] **Implement input sanitization:**
  ```typescript
  // All DTOs use class-validator
  export class CreateRentalDto {
    @IsNotEmpty()
    @IsString()
    @MaxLength(500)
    @Matches(/^[a-zA-Z0-9\s,.-]+$/) // Prevent XSS
    property_address: string;
  }
  ```

### 14.2 Data Privacy & GDPR

- [ ] **Implement data deletion:**
  ```typescript
  @Delete('users/me')
  async deleteAccount(@CurrentUser() user: User) {
    // Anonymize user data
    await this.usersRepo.update(user.id, {
      email: `deleted_${user.id}@rentledger.app`,
      name: 'Deleted User',
      phone: null,
      password_hash: null,
    });
    
    // Keep rental events for legal compliance
    // But remove personal identifiers
    
    return { message: 'Account deleted successfully' };
  }
  ```

- [ ] **Create privacy policy endpoint:**
  ```typescript
  @Get('privacy/export')
  async exportUserData(@CurrentUser() user: User) {
    const rentals = await this.rentalsRepo.find({
      where: { participants: { user_id: user.id } },
    });
    
    const events = await this.eventsRepo.find({
      where: { actor: { id: user.id } },
    });
    
    return {
      user: {
        email: user.email,
        name: user.name,
        created_at: user.created_at,
      },
      rentals,
      events,
    };
  }
  ```

### 14.3 Compliance Documentation

- [ ] **Create Section 65B compliance statement:**
  ```markdown
  # Section 65B IT Act 2000 Compliance
  
  RentLedger is designed to generate evidence that complies with Section 65B
  of the Information Technology Act, 2000 (India).
  
  ## System Specifications
  - **Platform**: RentLedger Rental Timeline System
  - **Hash Algorithm**: SHA-256
  - **Storage**: AWS S3 with versioning enabled
  - **Database**: PostgreSQL with append-only event tables
  - **Audit Trail**: Complete audit logs for all write operations
  
  ## Certificate Statement
  Each exported PDF includes a certificate statement that:
  1. Identifies the computer system (RentLedger)
  2. Describes the hash chain methodology
  3. Confirms data integrity verification
  4. Provides system operator details
  ```

---

## 15. Testing & Quality Assurance

### 15.1 Backend Testing

- [ ] **Unit tests for services:**
  ```typescript
  // src/rentals/rentals.service.spec.ts
  describe('RentalsService', () => {
    let service: RentalsService;
    let rentalsRepo: Repository<Rental>;
    
    beforeEach(async () => {
      const module = await Test.createTestingModule({
        providers: [
          RentalsService,
          {
            provide: getRepositoryToken(Rental),
            useClass: Repository,
          },
        ],
      }).compile();
      
      service = module.get<RentalsService>(RentalsService);
      rentalsRepo = module.get(getRepositoryToken(Rental));
    });
    
    it('should create a rental', async () => {
      const dto = {
        property_address: '123 Main St',
        start_date: '2024-01-01',
      };
      
      jest.spyOn(rentalsRepo, 'create').mockReturnValue({} as Rental);
      jest.spyOn(rentalsRepo, 'save').mockResolvedValue({
        id: '123',
        ...dto,
      } as Rental);
      
      const result = await service.createRental(dto, 'user-id');
      
      expect(result).toBeDefined();
      expect(result.property_address).toBe(dto.property_address);
    });
  });
  ```

- [ ] **Integration tests for API:**
  ```typescript
  // test/rentals.e2e-spec.ts
  describe('Rentals API (e2e)', () => {
    let app: INestApplication;
    let authToken: string;
    
    beforeAll(async () => {
      const moduleFixture = await Test.createTestingModule({
        imports: [AppModule],
      }).compile();
      
      app = moduleFixture.createNestApplication();
      await app.init();
      
      // Login to get token
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'test@example.com', password: 'password' });
      
      authToken = loginResponse.body.access_token;
    });
    
    it('/rentals (POST)', () => {
      return request(app.getHttpServer())
        .post('/rentals')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          property_address: '123 Main St',
          start_date: '2024-01-01',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.id).toBeDefined();
          expect(res.body.property_address).toBe('123 Main St');
        });
    });
  });
  ```

- [ ] **Hash chain integrity tests:**
  ```typescript
  describe('IntegrityService', () => {
    it('should verify valid hash chain', async () => {
      const rentalId = 'test-rental';
      
      // Create events with proper hashing
      const event1 = await eventsService.createEvent({
        rental_id: rentalId,
        event_type: 'MOVE_IN',
        event_data: { description: 'First event' },
      }, 'user-id');
      
      const event2 = await eventsService.createEvent({
        rental_id: rentalId,
        event_type: 'RENT_PAID',
        event_data: { amount: 1000 },
      }, 'user-id');
      
      const result = await integrityService.verifyEventChain(rentalId);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
    
    it('should detect broken hash chain', async () => {
      // Manually break the chain
      await eventsRepo.update(eventId, {
        current_event_hash: 'invalid-hash',
      });
      
      const result = await integrityService.verifyEventChain(rentalId);
      
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
  ```

### 15.2 Flutter Testing

- [ ] **Widget tests:**
  ```dart
  // test/widgets/event_card_test.dart
  void main() {
    testWidgets('EventCard displays event information', (tester) async {
      final event = RentalEvent(
        id: '1',
        rentalId: 'rental-1',
        eventType: EventType.moveIn,
        eventData: {'description': 'Test event'},
        actorName: 'John Doe',
        actorType: ActorType.tenant,
        timestamp: DateTime.now(),
        currentEventHash: 'hash123',
      );
      
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: EventCard(event: event),
          ),
        ),
      );
      
      expect(find.text('Move-in condition documented'), findsOneWidget);
      expect(find.text('John Doe'), findsOneWidget);
      expect(find.text('Test event'), findsOneWidget);
    });
  });
  ```

- [ ] **Integration tests:**
  ```dart
  // integration_test/login_flow_test.dart
  void main() {
    IntegrationTestWidgetsFlutterBinding.ensureInitialized();
    
    testWidgets('Complete login flow', (tester) async {
      app.main();
      await tester.pumpAndSettle();
      
      // Enter credentials
      await tester.enterText(
        find.byType(TextField).first,
        'test@example.com',
      );
      await tester.enterText(
        find.byType(TextField).last,
        'password',
      );
      
      // Tap login button
      await tester.tap(find.text('Sign In'));
      await tester.pumpAndSettle();
      
      // Verify navigation to dashboard
      expect(find.text('Dashboard'), findsOneWidget);
    });
  }
  ```

### 15.3 User Acceptance Testing

- [ ] **Create UAT test plan:**
  ```markdown
  # User Acceptance Testing Plan
  
  ## Test Scenarios
  
  ### Tenant Flow
  1. Sign up as tenant
  2. Join rental timeline via invite
  3. Upload move-in photos
  4. Add rent payment event
  5. Request evidence export
  6. Download PDF
  
  ### Broker Flow
  1. Sign up as broker
  2. Create new rental
  3. Invite tenant and landlord
  4. Monitor timeline
  5. Flag dispute
  6. Export evidence
  
  ### Society Flow
  1. Sign up as society admin
  2. View all society rentals
  3. Log move-in event
  4. Request access to rental
  
  ## Success Criteria
  - All flows complete without errors
  - UI is intuitive and clear
  - Export PDFs are court-ready
  - Hash verification works correctly
  ```

---

## 🎯 Implementation Checklist Summary

### Phase 1: Foundation (Weeks 1-2)
- [ ] Set up monorepo structure
- [ ] Initialize NestJS backend
- [ ] Initialize Flutter app with Clean Architecture
- [ ] Configure PostgreSQL with migrations
- [ ] Set up AWS S3 buckets
- [ ] Configure Redis and BullMQ

### Phase 2: Core Features (Weeks 3-6)
- [ ] Implement rental timeline engine
- [ ] Build hash chain integrity system
- [ ] Create media upload/download flow
- [ ] Implement authentication & RBAC
- [ ] Build timeline UI (mobile + web)

### Phase 3: Advanced Features (Weeks 7-10)
- [ ] Implement PDF export generation
- [ ] Build broker dashboard
- [ ] Build society dashboard
- [ ] Implement OCR processing
- [ ] Set up notification system

### Phase 4: Polish & Deploy (Weeks 11-12)
- [ ] Complete UI/UX refinement
- [ ] Write comprehensive tests
- [ ] Set up CI/CD pipeline
- [ ] Deploy to AWS
- [ ] Conduct UAT
- [ ] Launch MVP

---

## 📚 Additional Resources

### Documentation to Create
- [ ] API documentation (Swagger/OpenAPI)
- [ ] Architecture decision records (ADRs)
- [ ] Database schema documentation
- [ ] Deployment runbook
- [ ] Incident response playbook

### Monitoring & Observability
- [ ] Set up Sentry for error tracking
- [ ] Configure CloudWatch dashboards
- [ ] Create alerts for critical metrics
- [ ] Set up log aggregation

---

**Total Estimated Timeline:** 12 weeks for MVP with 3-4 developers  
**Tech Stack:** Flutter + NestJS + PostgreSQL + AWS  
**Target:** Production-ready, audit-safe, legally compliant rental infrastructure

---

*This completes the unified implementation plan covering all 15 sections with integrated frontend and backend implementation details.*
