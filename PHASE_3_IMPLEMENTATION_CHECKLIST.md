# Phase 3: Advanced Features - Implementation Checklist

## 📋 Overview
This checklist provides step-by-step implementation tasks for Phase 3 features.
Check off items as you complete them to track progress.

---

## 🎯 Feature 1: PDF Export Generation

### 1.1 Backend Setup & Dependencies
- [ ] Install PDF generation dependencies
  ```bash
  cd backend
  npm install pdfkit @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
  npm install --save-dev @types/pdfkit
  ```
- [ ] Install queue dependencies (if not already installed)
  ```bash
  npm install @nestjs/bullmq bullmq ioredis
  ```
- [ ] Configure BullMQ in `app.module.ts`
  ```typescript
  BullModule.forRoot({
    connection: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT) || 6379,
    },
  }),
  BullModule.registerQueue({ name: 'pdf-exports' }),
  ```

### 1.2 Backend: Export Entity
- [ ] Create export entity file: `backend/src/exports/entities/export.entity.ts`
  ```typescript
  @Entity('exports')
  export class Export {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Rental)
    @JoinColumn({ name: 'rental_id' })
    rental: Rental;

    @Column()
    rental_id: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'requested_by' })
    requester: User;

    @Column()
    requested_by: string;

    @Column({ default: 'PENDING' }) // PENDING, PROCESSING, COMPLETED, FAILED
    status: string;

    @Column({ nullable: true })
    s3_key: string;

    @Column({ nullable: true })
    download_url: string;

    @Column({ type: 'timestamp', nullable: true })
    expires_at: Date;

    @Column({ type: 'jsonb', nullable: true })
    metadata: Record<string, any>;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
  }
  ```

### 1.3 Backend: Export DTOs
- [ ] Create `backend/src/exports/dto/create-export.dto.ts`
  ```typescript
  export class CreateExportDto {
    @IsUUID()
    @IsNotEmpty()
    rental_id: string;

    @IsOptional()
    @IsObject()
    options?: {
      include_media?: boolean;
      include_all_events?: boolean;
      format?: 'pdf' | 'json';
    };
  }
  ```
- [ ] Create `backend/src/exports/dto/export-response.dto.ts`
  ```typescript
  export class ExportResponseDto {
    id: string;
    rental_id: string;
    status: string;
    download_url?: string;
    expires_at?: string;
    created_at: string;
  }
  ```

### 1.4 Backend: Export Service
- [ ] Create `backend/src/exports/exports.service.ts` with methods:
  - [ ] `requestExport(rental_id, user_id)` - Queue export job
  - [ ] `getExportStatus(export_id)` - Check export status
  - [ ] `getExportsByUser(user_id)` - List user's exports
  - [ ] `generateSignedDownloadUrl(export_id)` - Create S3 signed URL

- [ ] Implement export request method
  ```typescript
  async requestExport(createDto: CreateExportDto, userId: string): Promise<ExportResponseDto> {
    // Verify user has access to rental
    await this.rentalsService.verifyAccess(createDto.rental_id, userId);

    // Create export record
    const exportRecord = this.exportsRepo.create({
      rental_id: createDto.rental_id,
      requested_by: userId,
      status: 'PENDING',
      metadata: createDto.options || {},
    });

    const savedExport = await this.exportsRepo.save(exportRecord);

    // Queue PDF generation job
    await this.exportQueue.add('generate-pdf', {
      export_id: savedExport.id,
      rental_id: createDto.rental_id,
      options: createDto.options,
    });

    return this.mapToResponseDto(savedExport);
  }
  ```

### 1.5 Backend: PDF Generation Processor
- [ ] Create `backend/src/exports/exports.processor.ts`
- [ ] Implement queue processor class
  ```typescript
  @Processor('pdf-exports')
  export class ExportsProcessor extends WorkerHost {
    async process(job: Job): Promise<void> {
      const { export_id, rental_id, options } = job.data;
      
      try {
        // Update status to PROCESSING
        await this.updateExportStatus(export_id, 'PROCESSING');

        // Generate PDF
        const pdfBuffer = await this.generatePDF(rental_id, options);

        // Upload to S3
        const s3Key = await this.uploadToS3(export_id, pdfBuffer);

        // Generate signed URL (valid for 30 days)
        const downloadUrl = await this.generateSignedUrl(s3Key);

        // Update export record
        await this.updateExportComplete(export_id, s3Key, downloadUrl);

        // Send notification
        await this.notifyUser(export_id);
      } catch (error) {
        await this.updateExportStatus(export_id, 'FAILED');
        throw error;
      }
    }
  }
  ```

- [ ] Implement PDF generation logic
  ```typescript
  private async generatePDF(rentalId: string, options: any): Promise<Buffer> {
    const PDFDocument = require('pdfkit');
    
    // Fetch rental data
    const rental = await this.rentalsRepo.findOne({
      where: { id: rentalId },
      relations: ['participants', 'participants.user'],
    });

    // Fetch all events
    const events = await this.eventsRepo.find({
      where: { rental: { id: rentalId } },
      relations: ['actor'],
      order: { timestamp: 'ASC' },
    });

    // Verify hash chain
    const verification = await this.integrityService.verifyEventChain(rentalId);

    // Create PDF
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
    });

    const chunks = [];
    doc.on('data', chunk => chunks.push(chunk));
    
    // Add content
    this.addPDFHeader(doc, rental);
    this.addSection65BStatement(doc);
    this.addRentalDetails(doc, rental);
    this.addParticipants(doc, rental.participants);
    this.addEventTimeline(doc, events);
    this.addIntegrityVerification(doc, verification);
    this.addHashChainDiagram(doc, events);
    this.addCertificate(doc, rental);
    
    doc.end();

    return new Promise((resolve) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
    });
  }
  ```

- [ ] Implement S3 upload logic
  ```typescript
  private async uploadToS3(exportId: string, pdfBuffer: Buffer): Promise<string> {
    const s3Client = new S3Client({ region: process.env.AWS_REGION });
    const key = `exports/${exportId}.pdf`;

    await s3Client.send(new PutObjectCommand({
      Bucket: process.env.AWS_S3_EXPORTS_BUCKET,
      Key: key,
      Body: pdfBuffer,
      ContentType: 'application/pdf',
      ServerSideEncryption: 'AES256',
    }));

    return key;
  }
  ```

- [ ] Implement signed URL generation
  ```typescript
  private async generateSignedUrl(s3Key: string): Promise<string> {
    const s3Client = new S3Client({ region: process.env.AWS_REGION });
    
    const command = new GetObjectCommand({
      Bucket: process.env.AWS_S3_EXPORTS_BUCKET,
      Key: s3Key,
    });

    // URL valid for 30 days
    return await getSignedUrl(s3Client, command, { expiresIn: 2592000 });
  }
  ```

### 1.6 Backend: Export Controller
- [ ] Create `backend/src/exports/exports.controller.ts`
  ```typescript
  @Controller('exports')
  @UseGuards(JwtAuthGuard)
  export class ExportsController {
    constructor(private readonly exportsService: ExportsService) {}

    @Post()
    async requestExport(
      @Body() createDto: CreateExportDto,
      @Request() req: any,
    ) {
      return this.exportsService.requestExport(createDto, req.user.id);
    }

    @Get()
    async getMyExports(@Request() req: any) {
      return this.exportsService.getExportsByUser(req.user.id);
    }

    @Get(':id')
    async getExport(@Param('id') id: string, @Request() req: any) {
      return this.exportsService.getExportById(id, req.user.id);
    }

    @Get(':id/download')
    async getDownloadUrl(@Param('id') id: string, @Request() req: any) {
      return this.exportsService.generateSignedDownloadUrl(id, req.user.id);
    }
  }
  ```

### 1.7 Backend: Export Module
- [ ] Create `backend/src/exports/exports.module.ts`
  ```typescript
  @Module({
    imports: [
      TypeOrmModule.forFeature([Export, Rental, RentalEvent]),
      BullModule.registerQueue({ name: 'pdf-exports' }),
      IntegrityModule,
      RentalsModule,
    ],
    controllers: [ExportsController],
    providers: [ExportsService, ExportsProcessor],
    exports: [ExportsService],
  })
  export class ExportsModule {}
  ```

- [ ] Add ExportsModule to `app.module.ts` imports

### 1.8 Backend: Database Migration
- [ ] Generate migration
  ```bash
  npm run typeorm migration:generate src/migrations/CreateExports
  ```
- [ ] Review migration file
- [ ] Run migration
  ```bash
  npm run migration:run
  ```

### 1.9 Frontend: Export Domain Entity
- [ ] Create `frontend/lib/domain/entities/export.dart`
  ```dart
  class Export {
    final String id;
    final String rentalId;
    final ExportStatus status;
    final String? downloadUrl;
    final DateTime? expiresAt;
    final DateTime createdAt;

    const Export({
      required this.id,
      required this.rentalId,
      required this.status,
      this.downloadUrl,
      this.expiresAt,
      required this.createdAt,
    });
  }

  enum ExportStatus {
    pending,
    processing,
    completed,
    failed;

    String get displayName {
      switch (this) {
        case ExportStatus.pending:
          return 'Pending';
        case ExportStatus.processing:
          return 'Processing';
        case ExportStatus.completed:
          return 'Completed';
        case ExportStatus.failed:
          return 'Failed';
      }
    }
  }
  ```

### 1.10 Frontend: Export Data Model
- [ ] Create `frontend/lib/data/models/export_model.dart`
  ```dart
  @JsonSerializable()
  class ExportModel {
    final String id;
    @JsonKey(name: 'rental_id')
    final String rentalId;
    final String status;
    @JsonKey(name: 'download_url')
    final String? downloadUrl;
    @JsonKey(name: 'expires_at')
    final String? expiresAt;
    @JsonKey(name: 'created_at')
    final String createdAt;

    ExportModel({
      required this.id,
      required this.rentalId,
      required this.status,
      this.downloadUrl,
      this.expiresAt,
      required this.createdAt,
    });

    factory ExportModel.fromJson(Map<String, dynamic> json) =>
        _$ExportModelFromJson(json);

    Export toEntity() {
      return Export(
        id: id,
        rentalId: rentalId,
        status: ExportStatus.values.firstWhere(
          (e) => e.name.toUpperCase() == status,
          orElse: () => ExportStatus.pending,
        ),
        downloadUrl: downloadUrl,
        expiresAt: expiresAt != null ? DateTime.parse(expiresAt!) : null,
        createdAt: DateTime.parse(createdAt),
      );
    }
  }
  ```

### 1.11 Frontend: Export Repository
- [ ] Update `frontend/lib/domain/repositories/rental_repository.dart`
  ```dart
  Future<Export> requestExport(String rentalId);
  Future<List<Export>> getMyExports();
  Future<Export> getExportById(String id);
  Future<String> getDownloadUrl(String exportId);
  ```

- [ ] Implement in `frontend/lib/data/repositories/rental_repository_impl.dart`
  ```dart
  @Override
  Future<Export> requestExport(String rentalId) async {
    try {
      final response = await dio.post(
        '/exports',
        data: {'rental_id': rentalId},
      );
      return ExportModel.fromJson(response.data).toEntity();
    } catch (e) {
      throw Exception('Failed to request export: $e');
    }
  }
  ```

### 1.12 Frontend: Export Request Screen
- [ ] Create `frontend/lib/presentation/screens/exports/export_request_screen.dart`
  ```dart
  class ExportRequestScreen extends ConsumerWidget {
    final String rentalId;

    @override
    Widget build(BuildContext context, WidgetRef ref) {
      return Scaffold(
        appBar: AppBar(title: Text('Request Evidence Export')),
        body: Padding(
          padding: EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Generate Court-Ready Evidence',
                style: Theme.of(context).textTheme.headlineSmall,
              ),
              SizedBox(height: 16),
              InfoCard(
                icon: Icons.verified_user,
                title: 'Section 65B Compliant',
                description: 'PDF includes hash chain verification certificate',
              ),
              InfoCard(
                icon: Icons.security,
                title: 'Tamper-Evident',
                description: 'All events cryptographically linked',
              ),
              Spacer(),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () => _requestExport(context, ref),
                  child: Text('Generate Export'),
                ),
              ),
            ],
          ),
        ),
      );
    }

    Future<void> _requestExport(BuildContext context, WidgetRef ref) async {
      try {
        final export = await ref
            .read(rentalRepositoryProvider)
            .requestExport(rentalId);
        
        // Navigate to export status screen
        context.go('/exports/${export.id}');
      } catch (e) {
        // Show error
      }
    }
  }
  ```

### 1.13 Frontend: Export Status Screen
- [ ] Create `frontend/lib/presentation/screens/exports/export_status_screen.dart`
  ```dart
  class ExportStatusScreen extends ConsumerStatefulWidget {
    final String exportId;

    @override
    ConsumerState<ExportStatusScreen> createState() => _ExportStatusScreenState();
  }

  class _ExportStatusScreenState extends ConsumerState<ExportStatusScreen> {
    Timer? _pollTimer;

    @override
    void initState() {
      super.initState();
      _startPolling();
    }

    void _startPolling() {
      _pollTimer = Timer.periodic(Duration(seconds: 3), (_) async {
        final export = await ref
            .read(rentalRepositoryProvider)
            .getExportById(widget.exportId);
        
        if (export.status == ExportStatus.completed ||
            export.status == ExportStatus.failed) {
          _pollTimer?.cancel();
        }
      });
    }

    @override
    Widget build(BuildContext context) {
      final exportAsync = ref.watch(exportProvider(widget.exportId));

      return exportAsync.when(
        data: (export) => Scaffold(
          appBar: AppBar(title: Text('Export Status')),
          body: Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                _buildStatusIcon(export.status),
                SizedBox(height: 24),
                Text(
                  export.status.displayName,
                  style: Theme.of(context).textTheme.headlineSmall,
                ),
                if (export.status == ExportStatus.completed) ...[
                  SizedBox(height: 32),
                  ElevatedButton.icon(
                    onPressed: () => _downloadPDF(export),
                    icon: Icon(Icons.download),
                    label: Text('Download PDF'),
                  ),
                  SizedBox(height: 8),
                  Text(
                    'Expires: ${_formatDate(export.expiresAt)}',
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                ],
              ],
            ),
          ),
        ),
        loading: () => Scaffold(body: Center(child: CircularProgressIndicator())),
        error: (err, stack) => Scaffold(body: Center(child: Text('Error: $err'))),
      );
    }

    Widget _buildStatusIcon(ExportStatus status) {
      switch (status) {
        case ExportStatus.pending:
        case ExportStatus.processing:
          return CircularProgressIndicator();
        case ExportStatus.completed:
          return Icon(Icons.check_circle, color: Colors.green, size: 64);
        case ExportStatus.failed:
          return Icon(Icons.error, color: Colors.red, size: 64);
      }
    }

    Future<void> _downloadPDF(Export export) async {
      final url = await ref
          .read(rentalRepositoryProvider)
          .getDownloadUrl(export.id);
      
      // Open URL in browser or download
      await launchUrl(Uri.parse(url));
    }
  }
  ```

### 1.14 Testing
- [ ] Test PDF generation locally
- [ ] Verify hash chain certificate in PDF
- [ ] Test S3 upload and signed URLs
- [ ] Test export request flow end-to-end
- [ ] Verify export expiration (30 days)
- [ ] Test error handling (failed generation)

---

## 🔔 Feature 2: Notification System

### 2.1 Backend Setup
- [ ] Install SendGrid SDK
  ```bash
  npm install @sendgrid/mail
  ```
- [ ] Configure SendGrid API key in `.env`
  ```
  SENDGRID_API_KEY=your_key_here
  SENDGRID_FROM_EMAIL=noreply@rentledger.app
  ```

### 2.2 Backend: Notification Entity
- [ ] Create `backend/src/notifications/entities/notification.entity.ts`
  ```typescript
  @Entity('notifications')
  export class Notification {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column()
    user_id: string;

    @Column()
    type: string; // RENTAL_INVITE, EXPORT_READY, EVENT_ADDED, etc.

    @Column()
    title: string;

    @Column({ type: 'text' })
    message: string;

    @Column({ type: 'jsonb', nullable: true })
    data: Record<string, any>;

    @Column({ default: false })
    read: boolean;

    @Column({ default: false })
    email_sent: boolean;

    @Column({ default: false })
    push_sent: boolean;

    @CreateDateColumn()
    created_at: Date;
  }
  ```

### 2.3 Backend: Notification Service
- [ ] Create `backend/src/notifications/notifications.service.ts`
- [ ] Implement email sending method
  ```typescript
  async sendEmail(to: string, subject: string, html: string): Promise<void> {
    await sgMail.send({
      to,
      from: process.env.SENDGRID_FROM_EMAIL,
      subject,
      html,
    });
  }
  ```
- [ ] Implement notification creation
  ```typescript
  async createNotification(
    userId: string,
    type: string,
    title: string,
    message: string,
    data?: any,
  ): Promise<Notification> {
    const notification = this.notificationsRepo.create({
      user_id: userId,
      type,
      title,
      message,
      data,
    });

    const saved = await this.notificationsRepo.save(notification);

    // Queue email
    await this.notificationQueue.add('send-email', {
      notification_id: saved.id,
    });

    return saved;
  }
  ```

### 2.4 Backend: Email Templates
- [ ] Create `backend/src/notifications/templates/rental-invite.template.ts`
  ```typescript
  export const rentalInviteTemplate = (data: {
    recipientName: string;
    inviterName: string;
    propertyAddress: string;
    acceptLink: string;
  }) => `
    <!DOCTYPE html>
    <html>
      <body>
        <h1>You've been invited to a rental timeline</h1>
        <p>Hi ${data.recipientName},</p>
        <p>${data.inviterName} has invited you to join the rental timeline for:</p>
        <p><strong>${data.propertyAddress}</strong></p>
        <p>
          <a href="${data.acceptLink}" style="background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
            Accept Invitation
          </a>
        </p>
      </body>
    </html>
  `;
  ```

- [ ] Create `backend/src/notifications/templates/export-ready.template.ts`
  ```typescript
  export const exportReadyTemplate = (data: {
    recipientName: string;
    propertyAddress: string;
    downloadLink: string;
    expiresAt: string;
  }) => `
    <!DOCTYPE html>
    <html>
      <body>
        <h1>Your rental evidence export is ready</h1>
        <p>Hi ${data.recipientName},</p>
        <p>Your certified evidence export for ${data.propertyAddress} is ready for download.</p>
        <p>
          <a href="${data.downloadLink}">Download PDF</a>
        </p>
        <p><small>This link expires on ${data.expiresAt}</small></p>
      </body>
    </html>
  `;
  ```

### 2.5 Backend: Notification Processor
- [ ] Create `backend/src/notifications/notifications.processor.ts`
  ```typescript
  @Processor('notifications')
  export class NotificationsProcessor extends WorkerHost {
    async process(job: Job): Promise<void> {
      switch (job.name) {
        case 'send-email':
          await this.handleSendEmail(job.data);
          break;
        case 'send-push':
          await this.handleSendPush(job.data);
          break;
      }
    }

    private async handleSendEmail(data: { notification_id: string }): Promise<void> {
      const notification = await this.notificationsRepo.findOne({
        where: { id: data.notification_id },
        relations: ['user'],
      });

      const template = this.getEmailTemplate(notification.type, notification.data);
      
      await this.notificationsService.sendEmail(
        notification.user.email,
        notification.title,
        template,
      );

      await this.notificationsRepo.update(notification.id, {
        email_sent: true,
      });
    }
  }
  ```

### 2.6 Backend: Notification Controller
- [ ] Create `backend/src/notifications/notifications.controller.ts`
  ```typescript
  @Controller('notifications')
  @UseGuards(JwtAuthGuard)
  export class NotificationsController {
    @Get()
    async getMyNotifications(
      @Request() req: any,
      @Query('unread_only') unreadOnly?: boolean,
    ) {
      return this.notificationsService.getUserNotifications(
        req.user.id,
        unreadOnly === 'true',
      );
    }

    @Post(':id/read')
    async markAsRead(@Param('id') id: string, @Request() req: any) {
      return this.notificationsService.markAsRead(id, req.user.id);
    }

    @Post('read-all')
    async markAllAsRead(@Request() req: any) {
      return this.notificationsService.markAllAsRead(req.user.id);
    }
  }
  ```

### 2.7 Backend: Notification Module
- [ ] Create `backend/src/notifications/notifications.module.ts`
- [ ] Add NotificationsModule to app.module.ts
- [ ] Generate and run migration

### 2.8 Frontend: Push Notification Setup
- [ ] Add Firebase dependencies to `pubspec.yaml`
  ```yaml
  firebase_core: ^2.24.0
  firebase_messaging: ^14.7.0
  flutter_local_notifications: ^16.2.0
  ```
- [ ] Configure Firebase for Android (`google-services.json`)
- [ ] Configure Firebase for iOS (`GoogleService-Info.plist`)
- [ ] Initialize Firebase in `main.dart`

### 2.9 Frontend: FCM Service
- [ ] Create `frontend/lib/core/services/fcm_service.dart`
  ```dart
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
      FirebaseMessaging.onMessage.listen(_handleForegroundMessage);

      // Handle background messages
      FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);
    }

    void _handleForegroundMessage(RemoteMessage message) {
      // Show local notification
      _showLocalNotification(message);
    }
  }

  @pragma('vm:entry-point')
  Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
    print('Background message: ${message.notification?.title}');
  }
  ```

### 2.10 Frontend: Notification Screen
- [ ] Create `frontend/lib/presentation/screens/notifications_screen.dart`
  ```dart
  class NotificationsScreen extends ConsumerWidget {
    @override
    Widget build(BuildContext context, WidgetRef ref) {
      final notificationsAsync = ref.watch(notificationsProvider);

      return Scaffold(
        appBar: AppBar(
          title: Text('Notifications'),
          actions: [
            IconButton(
              icon: Icon(Icons.done_all),
              onPressed: () => ref.read(notificationsProvider.notifier).markAllAsRead(),
            ),
          ],
        ),
        body: notificationsAsync.when(
          data: (notifications) => ListView.builder(
            itemCount: notifications.length,
            itemBuilder: (context, index) {
              final notification = notifications[index];
              return NotificationTile(notification: notification);
            },
          ),
          loading: () => Center(child: CircularProgressIndicator()),
          error: (err, stack) => Center(child: Text('Error: $err')),
        ),
      );
    }
  }
  ```

### 2.11 Testing
- [ ] Test email sending via SendGrid
- [ ] Test notification creation and queuing
- [ ] Test push notifications (foreground and background)
- [ ] Test notification list and mark as read
- [ ] Verify email templates render correctly

---

## 📊 Feature 3: Broker Dashboard

### 3.1 Backend: Dashboard Aggregation Queries
- [ ] Create `backend/src/dashboard/dashboard.service.ts`
- [ ] Implement `getBrokerStats(userId)` method
  ```typescript
  async getBrokerStats(userId: string): Promise<DashboardStats> {
    // Get total rentals
    const totalRentals = await this.rentalsRepo.count({
      where: {
        participants: {
          user_id: userId,
          role: 'BROKER',
        },
      },
    });

    // Get active rentals
    const activeRentals = await this.rentalsRepo.count({
      where: {
        participants: { user_id: userId, role: 'BROKER' },
        status: 'ACTIVE',
      },
    });

    // Get recent events (last 7 days)
    const recentEvents = await this.eventsRepo.count({
      where: {
        rental: {
          participants: { user_id: userId, role: 'BROKER' },
        },
        created_at: MoreThan(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)),
      },
    });

    return {
      total_rentals: totalRentals,
      active_rentals: activeRentals,
      recent_events: recentEvents,
    };
  }
  ```

### 3.2 Backend: Rental Analytics
- [ ] Implement `getRentalAnalytics(userId)` method
  ```typescript
  async getRentalAnalytics(userId: string): Promise<RentalAnalytics[]> {
    const rentals = await this.rentalsRepo
      .createQueryBuilder('rental')
      .leftJoinAndSelect('rental.participants', 'participant')
      .leftJoin('rental.events', 'event')
      .where('participant.user_id = :userId', { userId })
      .andWhere('participant.role = :role', { role: 'BROKER' })
      .select([
        'rental.id',
        'rental.property_address',
        'rental.status',
        'COUNT(event.id) as event_count',
      ])
      .groupBy('rental.id')
      .getRawMany();

    return rentals;
  }
  ```

### 3.3 Backend: Dashboard Controller
- [ ] Create `backend/src/dashboard/dashboard.controller.ts`
  ```typescript
  @Controller('dashboard')
  @UseGuards(JwtAuthGuard)
  export class DashboardController {
    @Get('broker/stats')
    async getBrokerStats(@Request() req: any) {
      return this.dashboardService.getBrokerStats(req.user.id);
    }

    @Get('broker/rentals')
    async getBrokerRentals(@Request() req: any) {
      return this.dashboardService.getRentalAnalytics(req.user.id);
    }

    @Get('broker/recent-activity')
    async getRecentActivity(@Request() req: any) {
      return this.dashboardService.getRecentActivity(req.user.id);
    }
  }
  ```

### 3.4 Backend: Dashboard Module
- [ ] Create `backend/src/dashboard/dashboard.module.ts`
- [ ] Add DashboardModule to app.module.ts

### 3.5 Frontend: Dashboard Screen
- [ ] Create `frontend/lib/presentation/screens/dashboard/broker_dashboard_screen.dart`
  ```dart
  class BrokerDashboardScreen extends ConsumerWidget {
    @override
    Widget build(BuildContext context, WidgetRef ref) {
      final statsAsync = ref.watch(brokerStatsProvider);

      return Scaffold(
        appBar: AppBar(title: Text('Dashboard')),
        body: statsAsync.when(
          data: (stats) => SingleChildScrollView(
            padding: EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildStatsCards(stats),
                SizedBox(height: 24),
                _buildRecentActivity(),
                SizedBox(height: 24),
                _buildActiveRentals(),
              ],
            ),
          ),
          loading: () => Center(child: CircularProgressIndicator()),
          error: (err, stack) => Center(child: Text('Error: $err')),
        ),
      );
    }

    Widget _buildStatsCards(BrokerStats stats) {
      return Row(
        children: [
          Expanded(
            child: StatCard(
              title: 'Total Rentals',
              value: stats.totalRentals.toString(),
              icon: Icons.home,
              color: Colors.blue,
            ),
          ),
          SizedBox(width: 16),
          Expanded(
            child: StatCard(
              title: 'Active',
              value: stats.activeRentals.toString(),
              icon: Icons.check_circle,
              color: Colors.green,
            ),
          ),
          SizedBox(width: 16),
          Expanded(
            child: StatCard(
              title: 'Recent Events',
              value: stats.recentEvents.toString(),
              icon: Icons.event,
              color: Colors.orange,
            ),
          ),
        ],
      );
    }
  }
  ```

### 3.6 Testing
- [ ] Test dashboard stats calculation
- [ ] Test rental analytics aggregation
- [ ] Test dashboard UI rendering
- [ ] Verify real-time updates

---

## 🔍 Feature 4: OCR Processing

### 4.1 Backend Setup
- [ ] Install Tesseract OCR (system dependency)
  ```bash
  # macOS
  brew install tesseract

  # Ubuntu
  sudo apt-get install tesseract-ocr

  # Docker
  RUN apk add --no-cache tesseract-ocr tesseract-ocr-data-eng
  ```

- [ ] Install Node.js Tesseract wrapper
  ```bash
  npm install tesseract.js
  ```

### 4.2 Backend: OCR Service
- [ ] Create `backend/src/ocr/ocr.service.ts`
  ```typescript
  import Tesseract from 'tesseract.js';

  @Injectable()
  export class OcrService {
    async extractText(imageBuffer: Buffer): Promise<string> {
      const { data } = await Tesseract.recognize(imageBuffer, 'eng', {
        logger: (m) => console.log(m),
      });

      return data.text;
    }

    async processMediaOcr(mediaId: string): Promise<void> {
      const media = await this.mediaRepo.findOne({
        where: { id: mediaId },
      });

      if (media.media_type !== 'IMAGE') {
        return;
      }

      // Download from S3
      const imageBuffer = await this.downloadFromS3(media.s3_key);

      // Extract text
      const extractedText = await this.extractText(imageBuffer);

      // Update media record
      await this.mediaRepo.update(mediaId, {
        ocr_text: extractedText,
        ocr_processed: true,
      });
    }
  }
  ```

### 4.3 Backend: OCR Processor
- [ ] Create `backend/src/ocr/ocr.processor.ts`
  ```typescript
  @Processor('ocr-processing')
  export class OcrProcessor extends WorkerHost {
    async process(job: Job): Promise<void> {
      const { media_id } = job.data;
      await this.ocrService.processMediaOcr(media_id);
    }
  }
  ```

### 4.4 Backend: Add OCR to Media Upload
- [ ] Update `MediaService.uploadMedia()` to queue OCR job
  ```typescript
  // After S3 upload
  if (file.mimetype.startsWith('image/')) {
    await this.ocrQueue.add('extract-text', {
      media_id: savedMedia.id,
    });
  }
  ```

### 4.5 Backend: Search Endpoint
- [ ] Add search endpoint to MediaController
  ```typescript
  @Get('search')
  async searchMedia(
    @Query('q') query: string,
    @Request() req: any,
  ) {
    return this.mediaService.searchByOcrText(query, req.user.id);
  }
  ```

### 4.6 Frontend: OCR Text Display
- [ ] Update media detail screen to show extracted text
  ```dart
  if (media.ocrText != null) {
    Card(
      child: Padding(
        padding: EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Extracted Text', style: TextStyle(fontWeight: FontWeight.bold)),
            SizedBox(height: 8),
            Text(media.ocrText!),
          ],
        ),
      ),
    );
  }
  ```

### 4.7 Testing
- [ ] Test OCR extraction accuracy
- [ ] Test OCR processing queue
- [ ] Test search functionality
- [ ] Verify OCR text display in UI

---

## 🏘️ Feature 5: Society Dashboard

### 5.1 Backend: Society Entity
- [ ] Create `backend/src/societies/entities/society.entity.ts`
  ```typescript
  @Entity('societies')
  export class Society {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column()
    address: string;

    @OneToMany(() => User, user => user.society)
    members: User[];

    @OneToMany(() => Rental, rental => rental.society)
    rentals: Rental[];

    @CreateDateColumn()
    created_at: Date;
  }
  ```

### 5.2 Backend: Society Service
- [ ] Create `backend/src/societies/societies.service.ts`
- [ ] Implement society dashboard methods
  ```typescript
  async getSocietyDashboard(societyId: string): Promise<SocietyDashboard> {
    const rentals = await this.rentalsRepo.find({
      where: { society_id: societyId },
      relations: ['participants'],
    });

    const totalRentals = rentals.length;
    const activeRentals = rentals.filter(r => r.status === 'ACTIVE').length;

    return {
      total_rentals: totalRentals,
      active_rentals: activeRentals,
      rentals: rentals.map(this.mapToDto),
    };
  }
  ```

### 5.3 Backend: Society Controller
- [ ] Create `backend/src/societies/societies.controller.ts`
  ```typescript
  @Controller('societies')
  @UseGuards(JwtAuthGuard)
  export class SocietiesController {
    @Get(':id/dashboard')
    async getDashboard(@Param('id') id: string, @Request() req: any) {
      // Verify user is society admin
      return this.societiesService.getSocietyDashboard(id);
    }

    @Get(':id/rentals')
    async getSocietyRentals(@Param('id') id: string) {
      return this.societiesService.getSocietyRentals(id);
    }
  }
  ```

### 5.4 Frontend: Society Dashboard Screen
- [ ] Create `frontend/lib/presentation/screens/dashboard/society_dashboard_screen.dart`
  ```dart
  class SocietyDashboardScreen extends ConsumerWidget {
    final String societyId;

    @override
    Widget build(BuildContext context, WidgetRef ref) {
      final dashboardAsync = ref.watch(societyDashboardProvider(societyId));

      return Scaffold(
        appBar: AppBar(title: Text('Society Dashboard')),
        body: dashboardAsync.when(
          data: (dashboard) => SingleChildScrollView(
            padding: EdgeInsets.all(16),
            child: Column(
              children: [
                _buildStats(dashboard.stats),
                SizedBox(height: 24),
                _buildRentalDirectory(dashboard.rentals),
              ],
            ),
          ),
          loading: () => Center(child: CircularProgressIndicator()),
          error: (err, stack) => Center(child: Text('Error: $err')),
        ),
      );
    }
  }
  ```

### 5.5 Testing
- [ ] Test society dashboard stats
- [ ] Test rental directory listing
- [ ] Test society admin permissions
- [ ] Verify UI renders correctly

---

## ✅ Final Checklist

### Documentation
- [ ] Update API documentation (Swagger)
- [ ] Document PDF export format
- [ ] Document notification types
- [ ] Create user guide for exports

### Testing
- [ ] Run all unit tests
- [ ] Run integration tests
- [ ] Test all features end-to-end
- [ ] Performance testing (PDF generation)

### Deployment
- [ ] Deploy to staging
- [ ] Run UAT
- [ ] Deploy to production
- [ ] Monitor logs and metrics

---

**Total Phase 3 Tasks:** 150+
**Estimated Timeline:** 4 weeks with 3-4 developers
**Current Progress:** 0/150 (0%)

Start with PDF Export Generation for maximum impact!
