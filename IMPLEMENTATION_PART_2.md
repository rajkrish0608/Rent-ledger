# RentLedger - Unified Implementation Plan (Part 2)
## Sections 5-10: Authentication, Dashboards, UI/UX, and Core Features

---

## 5. Certified Evidence Export

### 5.1 Backend: Export Service Architecture

- [ ] **Create export job queue with BullMQ:**
  ```typescript
  // src/exports/exports.module.ts
  import { BullModule } from '@nestjs/bullmq';
  
  @Module({
    imports: [
      BullModule.registerQueue({
        name: 'pdf-exports',
      }),
    ],
  })
  export class ExportsModule {}
  ```

- [ ] **Implement ExportService:**
  ```typescript
  // src/exports/exports.service.ts
  @Injectable()
  export class ExportsService {
    constructor(
      @InjectRepository(ExportRequest)
      private exportRepo: Repository<ExportRequest>,
      @InjectQueue('pdf-exports')
      private exportQueue: Queue,
      private s3Service: S3Service,
    ) {}
    
    async requestExport(rentalId: string, userId: string): Promise<ExportRequest> {
      // Verify user has permission
      await this.verifyExportPermission(rentalId, userId);
      
      // Check rate limiting
      const recentExports = await this.exportRepo.count({
        where: {
          rental_id: rentalId,
          requested_by: { id: userId },
          created_at: MoreThan(new Date(Date.now() - 24 * 60 * 60 * 1000)),
        },
      });
      
      if (recentExports >= 3) {
        throw new BadRequestException('Export limit reached. Please wait 24 hours.');
      }
      
      const exportRequest = this.exportRepo.create({
        rental: { id: rentalId },
        requested_by: { id: userId },
        status: 'PENDING',
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      });
      
      const saved = await this.exportRepo.save(exportRequest);
      
      // Queue PDF generation job
      await this.exportQueue.add('generate-pdf', {
        export_id: saved.id,
        rental_id: rentalId,
      });
      
      return saved;
    }
    
    async getExportStatus(exportId: string, userId: string): Promise<ExportRequest> {
      const exportRequest = await this.exportRepo.findOne({
        where: { id: exportId },
        relations: ['requested_by'],
      });
      
      if (!exportRequest || exportRequest.requested_by.id !== userId) {
        throw new NotFoundException('Export not found');
      }
      
      return exportRequest;
    }
    
    async getDownloadUrl(exportId: string, userId: string): Promise<string> {
      const exportRequest = await this.getExportStatus(exportId, userId);
      
      if (exportRequest.status !== 'COMPLETED') {
        throw new BadRequestException('Export is not ready yet');
      }
      
      if (new Date() > exportRequest.expires_at) {
        throw new BadRequestException('Export has expired');
      }
      
      // Increment download count
      await this.exportRepo.update(exportId, {
        download_count: () => 'download_count + 1',
      });
      
      return this.s3Service.generateDownloadUrl(
        process.env.S3_BUCKET_EXPORTS,
        exportRequest.s3_key,
      );
    }
  }
  ```

- [ ] **Create PDF generation processor:**
  ```typescript
  // src/exports/processors/pdf-export.processor.ts
  import { Processor, WorkerHost } from '@nestjs/bullmq';
  import { Job } from 'bullmq';
  import * as puppeteer from 'puppeteer';
  
  @Processor('pdf-exports')
  export class PdfExportProcessor extends WorkerHost {
    constructor(
      private rentalsService: RentalsService,
      private eventsService: EventsService,
      private mediaService: MediaService,
      private integrityService: IntegrityService,
      private exportRepo: Repository<ExportRequest>,
      private s3Service: S3Service,
    ) {
      super();
    }
    
    async process(job: Job): Promise<void> {
      const { export_id, rental_id } = job.data;
      
      try {
        // Update status to PROCESSING
        await this.exportRepo.update(export_id, { status: 'PROCESSING' });
        
        // Fetch all data
        const rental = await this.rentalsService.getRentalById(rental_id);
        const events = await this.eventsService.getAllEvents(rental_id);
        const verification = await this.integrityService.verifyEventChain(rental_id);
        
        // Generate HTML
        const html = await this.generateExportHTML(rental, events, verification);
        
        // Generate PDF
        const browser = await puppeteer.launch({
          headless: true,
          args: ['--no-sandbox'],
        });
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'networkidle0' });
        
        const pdfBuffer = await page.pdf({
          format: 'A4',
          printBackground: true,
          margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' },
        });
        
        await browser.close();
        
        // Upload to S3
        const s3Key = `exports/${rental_id}/${export_id}.pdf`;
        await this.s3Service.uploadBuffer(
          process.env.S3_BUCKET_EXPORTS,
          s3Key,
          pdfBuffer,
          'application/pdf',
        );
        
        // Update export request
        await this.exportRepo.update(export_id, {
          status: 'COMPLETED',
          s3_key: s3Key,
          completed_at: new Date(),
        });
        
      } catch (error) {
        await this.exportRepo.update(export_id, { status: 'FAILED' });
        throw error;
      }
    }
    
    private async generateExportHTML(
      rental: Rental,
      events: RentalEvent[],
      verification: VerificationResult,
    ): Promise<string> {
      return `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>RentLedger Certified Record Export</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');
            
            * { margin: 0; padding: 0; box-sizing: border-box; }
            
            body {
              font-family: 'Inter', -apple-system, sans-serif;
              font-size: 11pt;
              line-height: 1.6;
              color: #0F172A;
            }
            
            .header {
              text-align: center;
              padding: 40px 0;
              border-bottom: 2px solid #CBD5E1;
            }
            
            .header h1 {
              font-size: 24pt;
              font-weight: 600;
              margin-bottom: 8px;
            }
            
            .header p {
              color: #64748B;
              font-size: 10pt;
            }
            
            .metadata {
              margin: 30px 0;
              padding: 20px;
              background: #F8F9FB;
              border-radius: 6px;
            }
            
            .metadata-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 8px;
            }
            
            .metadata-label {
              font-weight: 500;
              color: #64748B;
            }
            
            .section-title {
              font-size: 16pt;
              font-weight: 600;
              margin: 30px 0 15px;
              padding-bottom: 8px;
              border-bottom: 1px solid #E2E8F0;
            }
            
            .event {
              margin-bottom: 20px;
              padding: 15px;
              border: 1px solid #E2E8F0;
              border-radius: 6px;
              page-break-inside: avoid;
            }
            
            .event-header {
              display: flex;
              justify-content: space-between;
              margin-bottom: 10px;
            }
            
            .event-type {
              font-weight: 600;
              font-size: 12pt;
            }
            
            .event-timestamp {
              color: #64748B;
              font-size: 9pt;
            }
            
            .event-actor {
              color: #64748B;
              font-size: 10pt;
              margin-bottom: 8px;
            }
            
            .event-description {
              margin-top: 8px;
            }
            
            .hash-info {
              margin-top: 10px;
              padding: 8px;
              background: #F1F5F9;
              border-radius: 4px;
              font-family: monospace;
              font-size: 8pt;
              color: #475569;
            }
            
            .verification-badge {
              display: inline-block;
              padding: 4px 12px;
              background: ${verification.valid ? '#DCFCE7' : '#FEE2E2'};
              color: ${verification.valid ? '#166534' : '#991B1B'};
              border-radius: 4px;
              font-size: 9pt;
              font-weight: 500;
            }
            
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #E2E8F0;
              font-size: 9pt;
              color: #64748B;
              text-align: center;
            }
            
            .legal-disclaimer {
              margin-top: 30px;
              padding: 15px;
              background: #FEF3C7;
              border-left: 4px solid #F59E0B;
              font-size: 9pt;
              line-height: 1.5;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>RentLedger</h1>
            <p>Certified Record Export</p>
          </div>
          
          <div class="metadata">
            <div class="metadata-row">
              <span class="metadata-label">Export ID:</span>
              <span>${rental.id}</span>
            </div>
            <div class="metadata-row">
              <span class="metadata-label">Property:</span>
              <span>${rental.property_address}${rental.property_unit ? ', Unit ' + rental.property_unit : ''}</span>
            </div>
            <div class="metadata-row">
              <span class="metadata-label">Rental Period:</span>
              <span>${this.formatDate(rental.start_date)} - ${rental.end_date ? this.formatDate(rental.end_date) : 'Ongoing'}</span>
            </div>
            <div class="metadata-row">
              <span class="metadata-label">Generated:</span>
              <span>${new Date().toISOString()}</span>
            </div>
            <div class="metadata-row">
              <span class="metadata-label">Integrity Status:</span>
              <span class="verification-badge">${verification.valid ? '✓ Verified' : '✗ Failed'}</span>
            </div>
          </div>
          
          <h2 class="section-title">Participants</h2>
          ${rental.participants.map(p => `
            <div style="margin-bottom: 8px;">
              <strong>${p.user.name}</strong> (${p.role})
            </div>
          `).join('')}
          
          <h2 class="section-title">Timeline Events</h2>
          ${events.map(event => `
            <div class="event">
              <div class="event-header">
                <span class="event-type">${this.formatEventType(event.event_type)}</span>
                <span class="event-timestamp">${this.formatDate(event.timestamp)}</span>
              </div>
              <div class="event-actor">
                ${event.actor.name} (${event.actor_type})
              </div>
              ${event.event_data.description ? `
                <div class="event-description">${event.event_data.description}</div>
              ` : ''}
              <div class="hash-info">
                Hash: ${event.current_event_hash}
              </div>
            </div>
          `).join('')}
          
          <div class="legal-disclaimer">
            <strong>Section 65B IT Act 2000 Compliance Statement</strong><br><br>
            This is a certified record export generated by RentLedger, a digital system of record for rental timelines.
            Each event in this timeline is cryptographically hashed using SHA-256 and linked to the previous event,
            creating a tamper-evident chain of custody. This export is generated from data stored in accordance with
            Section 65B of the Information Technology Act, 2000 (India).<br><br>
            <strong>System Operator:</strong> RentLedger Platform<br>
            <strong>Hash Algorithm:</strong> SHA-256<br>
            <strong>Verification Method:</strong> Sequential hash chain validation
          </div>
          
          <div class="footer">
            <p>This document was generated by RentLedger on ${new Date().toLocaleString('en-IN')}.</p>
            <p>For verification, visit: app.rentledger.com/verify</p>
          </div>
        </body>
        </html>
      `;
    }
    
    private formatDate(date: Date): string {
      return new Date(date).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    }
    
    private formatEventType(type: string): string {
      return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  }
  ```

### 5.2 Backend: Export API Endpoints

- [ ] **Create exports controller:**
  ```typescript
  @Controller('exports')
  @UseGuards(JwtAuthGuard)
  export class ExportsController {
    @Post('rentals/:rentalId')
    async requestExport(
      @Param('rentalId') rentalId: string,
      @CurrentUser() user: User,
    ) {
      return this.exportsService.requestExport(rentalId, user.id);
    }
    
    @Get(':exportId')
    async getExportStatus(
      @Param('exportId') exportId: string,
      @CurrentUser() user: User,
    ) {
      return this.exportsService.getExportStatus(exportId, user.id);
    }
    
    @Get(':exportId/download')
    async getDownloadUrl(
      @Param('exportId') exportId: string,
      @CurrentUser() user: User,
    ) {
      const url = await this.exportsService.getDownloadUrl(exportId, user.id);
      return { download_url: url };
    }
    
    @Get('rentals/:rentalId/history')
    async getExportHistory(
      @Param('rentalId') rentalId: string,
      @CurrentUser() user: User,
    ) {
      return this.exportsService.getExportHistory(rentalId, user.id);
    }
  }
  ```

### 5.3 Flutter: Export Feature Implementation

- [ ] **Create export domain entities:**
  ```dart
  // lib/domain/entities/export_request.dart
  class ExportRequest {
    final String id;
    final String rentalId;
    final ExportStatus status;
    final DateTime createdAt;
    final DateTime? completedAt;
    final DateTime expiresAt;
    final int downloadCount;
    
    const ExportRequest({
      required this.id,
      required this.rentalId,
      required this.status,
      required this.createdAt,
      this.completedAt,
      required this.expiresAt,
      required this.downloadCount,
    });
  }
  
  enum ExportStatus { pending, processing, completed, failed }
  ```

- [ ] **Create export repository:**
  ```dart
  // lib/domain/repositories/export_repository.dart
  abstract class ExportRepository {
    Future<Either<Failure, ExportRequest>> requestExport(String rentalId);
    Future<Either<Failure, ExportRequest>> getExportStatus(String exportId);
    Future<Either<Failure, String>> getDownloadUrl(String exportId);
    Future<Either<Failure, List<ExportRequest>>> getExportHistory(String rentalId);
  }
  ```

- [ ] **Implement export data source:**
  ```dart
  // lib/data/datasources/export_remote_datasource.dart
  class ExportRemoteDataSource {
    final Dio dio;
    
    ExportRemoteDataSource(this.dio);
    
    Future<ExportRequestModel> requestExport(String rentalId) async {
      final response = await dio.post('${ApiConstants.exports}/rentals/$rentalId');
      return ExportRequestModel.fromJson(response.data);
    }
    
    Future<ExportRequestModel> getExportStatus(String exportId) async {
      final response = await dio.get('${ApiConstants.exports}/$exportId');
      return ExportRequestModel.fromJson(response.data);
    }
    
    Future<String> getDownloadUrl(String exportId) async {
      final response = await dio.get('${ApiConstants.exports}/$exportId/download');
      return response.data['download_url'];
    }
    
    Future<List<ExportRequestModel>> getExportHistory(String rentalId) async {
      final response = await dio.get('${ApiConstants.exports}/rentals/$rentalId/history');
      return (response.data as List)
          .map((json) => ExportRequestModel.fromJson(json))
          .toList();
    }
  }
  ```

- [ ] **Create export UI screen:**
  ```dart
  // lib/presentation/screens/export/export_screen.dart
  class ExportScreen extends ConsumerStatefulWidget {
    final String rentalId;
    
    const ExportScreen({required this.rentalId});
    
    @override
    ConsumerState<ExportScreen> createState() => _ExportScreenState();
  }
  
  class _ExportScreenState extends ConsumerState<ExportScreen> {
    Timer? _pollingTimer;
    String? _currentExportId;
    
    @override
    void dispose() {
      _pollingTimer?.cancel();
      super.dispose();
    }
    
    Future<void> _requestExport() async {
      final repository = ref.read(exportRepositoryProvider);
      
      final result = await repository.requestExport(widget.rentalId);
      
      result.fold(
        (failure) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(failure.message)),
          );
        },
        (exportRequest) {
          setState(() => _currentExportId = exportRequest.id);
          _startPolling(exportRequest.id);
          
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Export requested. Generating PDF...')),
          );
        },
      );
    }
    
    void _startPolling(String exportId) {
      _pollingTimer?.cancel();
      _pollingTimer = Timer.periodic(const Duration(seconds: 3), (timer) async {
        final repository = ref.read(exportRepositoryProvider);
        final result = await repository.getExportStatus(exportId);
        
        result.fold(
          (failure) => timer.cancel(),
          (exportRequest) {
            if (exportRequest.status == ExportStatus.completed) {
              timer.cancel();
              ref.invalidate(exportHistoryProvider(widget.rentalId));
              
              if (mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Export ready for download!')),
                );
              }
            } else if (exportRequest.status == ExportStatus.failed) {
              timer.cancel();
              if (mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Export failed. Please try again.')),
                );
              }
            }
          },
        );
      });
    }
    
    Future<void> _downloadExport(String exportId) async {
      final repository = ref.read(exportRepositoryProvider);
      final result = await repository.getDownloadUrl(exportId);
      
      result.fold(
        (failure) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(failure.message)),
          );
        },
        (downloadUrl) async {
          // Open URL in browser or download
          if (await canLaunchUrl(Uri.parse(downloadUrl))) {
            await launchUrl(Uri.parse(downloadUrl));
          }
        },
      );
    }
    
    @override
    Widget build(BuildContext context) {
      final historyAsyncValue = ref.watch(exportHistoryProvider(widget.rentalId));
      
      return Scaffold(
        appBar: AppBar(title: const Text('Certified Record Exports')),
        body: Column(
          children: [
            Container(
              padding: const EdgeInsets.all(16),
              color: Colors.blue[50],
              child: Row(
                children: [
                  const Icon(Icons.info_outline, color: Colors.blue),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      'Generate a court-ready PDF export of this rental timeline',
                      style: TextStyle(color: Colors.blue[900]),
                    ),
                  ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(16),
              child: SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: _requestExport,
                  icon: const Icon(Icons.file_download),
                  label: const Text('Request New Export'),
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                  ),
                ),
              ),
            ),
            const Divider(),
            Padding(
              padding: const EdgeInsets.all(16),
              child: Align(
                alignment: Alignment.centerLeft,
                child: Text(
                  'Export History',
                  style: Theme.of(context).textTheme.titleMedium,
                ),
              ),
            ),
            Expanded(
              child: historyAsyncValue.when(
                data: (exports) {
                  if (exports.isEmpty) {
                    return const Center(
                      child: Text('No exports yet'),
                    );
                  }
                  
                  return ListView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    itemCount: exports.length,
                    itemBuilder: (context, index) {
                      final export = exports[index];
                      return ExportCard(
                        export: export,
                        onDownload: () => _downloadExport(export.id),
                      );
                    },
                  );
                },
                loading: () => const Center(child: CircularProgressIndicator()),
                error: (err, stack) => Center(child: Text('Error: $err')),
              ),
            ),
          ],
        ),
      );
    }
  }
  
  class ExportCard extends StatelessWidget {
    final ExportRequest export;
    final VoidCallback onDownload;
    
    const ExportCard({required this.export, required this.onDownload});
    
    @override
    Widget build(BuildContext context) {
      return Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          border: Border.all(color: Colors.grey[300]!),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                _StatusBadge(status: export.status),
                Text(
                  _formatDate(export.createdAt),
                  style: TextStyle(color: Colors.grey[600], fontSize: 13),
                ),
              ],
            ),
            const SizedBox(height: 8),
            if (export.status == ExportStatus.completed) ...[
              Text(
                'Downloads: ${export.downloadCount}',
                style: TextStyle(color: Colors.grey[600], fontSize: 13),
              ),
              Text(
                'Expires: ${_formatDate(export.expiresAt)}',
                style: TextStyle(color: Colors.grey[600], fontSize: 13),
              ),
              const SizedBox(height: 12),
              SizedBox(
                width: double.infinity,
                child: OutlinedButton.icon(
                  onPressed: onDownload,
                  icon: const Icon(Icons.download, size: 18),
                  label: const Text('Download PDF'),
                ),
              ),
            ] else if (export.status == ExportStatus.processing) ...[
              const SizedBox(height: 8),
              const LinearProgressIndicator(),
              const SizedBox(height: 8),
              const Text('Generating PDF...', style: TextStyle(fontSize: 13)),
            ],
          ],
        ),
      );
    }
    
    String _formatDate(DateTime date) {
      return DateFormat('MMM dd, yyyy').format(date);
    }
  }
  
  class _StatusBadge extends StatelessWidget {
    final ExportStatus status;
    
    const _StatusBadge({required this.status});
    
    @override
    Widget build(BuildContext context) {
      Color color;
      String label;
      
      switch (status) {
        case ExportStatus.pending:
          color = Colors.orange;
          label = 'Pending';
          break;
        case ExportStatus.processing:
          color = Colors.blue;
          label = 'Processing';
          break;
        case ExportStatus.completed:
          color = Colors.green;
          label = 'Ready';
          break;
        case ExportStatus.failed:
          color = Colors.red;
          label = 'Failed';
          break;
      }
      
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
        decoration: BoxDecoration(
          color: color.withOpacity(0.1),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: color,
            fontSize: 12,
            fontWeight: FontWeight.w600,
          ),
        ),
      );
    }
  }
  ```

---

## 6. Authentication & Authorization

### 6.1 Backend: JWT Authentication

- [ ] **Create auth module entities:**
  ```typescript
  // src/auth/entities/refresh-token.entity.ts
  @Entity('refresh_tokens')
  export class RefreshToken {
    @PrimaryGeneratedColumn('uuid')
    id: string;
    
    @ManyToOne(() => User)
    @JoinColumn({ name: 'user_id' })
    user: User;
    
    @Column({ unique: true })
    token: string;
    
    @Column({ type: 'timestamp' })
    expires_at: Date;
    
    @Column({ default: false })
    is_revoked: boolean;
    
    @CreateDateColumn()
    created_at: Date;
  }
  ```

- [ ] **Implement AuthService:**
  ```typescript
  // src/auth/auth.service.ts
  import { JwtService } from '@nestjs/jwt';
  import * as bcrypt from 'bcrypt';
  
  @Injectable()
  export class AuthService {
    constructor(
      @InjectRepository(User)
      private usersRepo: Repository<User>,
      @InjectRepository(RefreshToken)
      private refreshTokensRepo: Repository<RefreshToken>,
      private jwtService: JwtService,
    ) {}
    
    async register(dto: RegisterDto): Promise<AuthResponse> {
      // Check if user exists
      const existing = await this.usersRepo.findOne({
        where: [{ email: dto.email }, { phone: dto.phone }],
      });
      
      if (existing) {
        throw new ConflictException('User already exists');
      }
      
      // Hash password
      const passwordHash = await bcrypt.hash(dto.password, 12);
      
      // Create user
      const user = this.usersRepo.create({
        email: dto.email,
        phone: dto.phone,
        name: dto.name,
        password_hash: passwordHash,
        role: dto.role || 'TENANT',
      });
      
      const saved = await this.usersRepo.save(user);
      
      // Generate tokens
      return this.generateTokens(saved);
    }
    
    async login(dto: LoginDto): Promise<AuthResponse> {
      const user = await this.usersRepo.findOne({
        where: { email: dto.email },
      });
      
      if (!user) {
        throw new UnauthorizedException('Invalid credentials');
      }
      
      const isPasswordValid = await bcrypt.compare(dto.password, user.password_hash);
      
      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid credentials');
      }
      
      // Update last login
      await this.usersRepo.update(user.id, { last_login: new Date() });
      
      return this.generateTokens(user);
    }
    
    async refreshTokens(refreshToken: string): Promise<AuthResponse> {
      const tokenRecord = await this.refreshTokensRepo.findOne({
        where: { token: refreshToken, is_revoked: false },
        relations: ['user'],
      });
      
      if (!tokenRecord || new Date() > tokenRecord.expires_at) {
        throw new UnauthorizedException('Invalid refresh token');
      }
      
      // Revoke old token
      await this.refreshTokensRepo.update(tokenRecord.id, { is_revoked: true });
      
      // Generate new tokens
      return this.generateTokens(tokenRecord.user);
    }
    
    private async generateTokens(user: User): Promise<AuthResponse> {
      const payload = { sub: user.id, email: user.email, role: user.role };
      
      const accessToken = this.jwtService.sign(payload, {
        secret: process.env.JWT_SECRET,
        expiresIn: process.env.JWT_EXPIRES_IN || '15m',
      });
      
      const refreshToken = this.jwtService.sign(payload, {
        secret: process.env.JWT_REFRESH_SECRET,
        expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
      });
      
      // Store refresh token
      await this.refreshTokensRepo.save({
        user,
        token: refreshToken,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });
      
      return {
        access_token: accessToken,
        refresh_token: refreshToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      };
    }
    
    async logout(userId: string, refreshToken: string): Promise<void> {
      await this.refreshTokensRepo.update(
        { user: { id: userId }, token: refreshToken },
        { is_revoked: true },
      );
    }
  }
  ```

- [ ] **Create JWT strategy:**
  ```typescript
  // src/auth/strategies/jwt.strategy.ts
  import { PassportStrategy } from '@nestjs/passport';
  import { ExtractJwt, Strategy } from 'passport-jwt';
  
  @Injectable()
  export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
      @InjectRepository(User)
      private usersRepo: Repository<User>,
    ) {
      super({
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        ignoreExpiration: false,
        secretOrKey: process.env.JWT_SECRET,
      });
    }
    
    async validate(payload: any): Promise<User> {
      const user = await this.usersRepo.findOne({
        where: { id: payload.sub },
      });
      
      if (!user) {
        throw new UnauthorizedException();
      }
      
      return user;
    }
  }
  ```

- [ ] **Create RBAC guards:**
  ```typescript
  // src/auth/guards/roles.guard.ts
  @Injectable()
  export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) {}
    
    canActivate(context: ExecutionContext): boolean {
      const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
        context.getHandler(),
        context.getClass(),
      ]);
      
      if (!requiredRoles) {
        return true;
      }
      
      const { user } = context.switchToHttp().getRequest();
      return requiredRoles.includes(user.role);
    }
  }
  
  // Decorator
  export const Roles = (...roles: string[]) => SetMetadata('roles', roles);
  ```

### 6.2 Flutter: Authentication Implementation

- [ ] **Create auth state with Riverpod:**
  ```dart
  // lib/presentation/providers/auth_provider.dart
  @freezed
  class AuthState with _$AuthState {
    const factory AuthState.initial() = _Initial;
    const factory AuthState.authenticated(User user) = _Authenticated;
    const factory AuthState.unauthenticated() = _Unauthenticated;
  }
  
  class AuthNotifier extends StateNotifier<AuthState> {
    final AuthRepository _authRepository;
    final FlutterSecureStorage _secureStorage;
    
    AuthNotifier(this._authRepository, this._secureStorage)
        : super(const AuthState.initial()) {
      _checkAuthStatus();
    }
    
    Future<void> _checkAuthStatus() async {
      final token = await _secureStorage.read(key: 'access_token');
      
      if (token != null) {
        // Validate token and get user
        final result = await _authRepository.getCurrentUser();
        result.fold(
          (failure) => state = const AuthState.unauthenticated(),
          (user) => state = AuthState.authenticated(user),
        );
      } else {
        state = const AuthState.unauthenticated();
      }
    }
    
    Future<void> login(String email, String password) async {
      final result = await _authRepository.login(email, password);
      
      result.fold(
        (failure) => throw Exception(failure.message),
        (authResponse) async {
          await _secureStorage.write(
            key: 'access_token',
            value: authResponse.accessToken,
          );
          await _secureStorage.write(
            key: 'refresh_token',
            value: authResponse.refreshToken,
          );
          
          state = AuthState.authenticated(authResponse.user);
        },
      );
    }
    
    Future<void> register(RegisterParams params) async {
      final result = await _authRepository.register(params);
      
      result.fold(
        (failure) => throw Exception(failure.message),
        (authResponse) async {
          await _secureStorage.write(
            key: 'access_token',
            value: authResponse.accessToken,
          );
          await _secureStorage.write(
            key: 'refresh_token',
            value: authResponse.refreshToken,
          );
          
          state = AuthState.authenticated(authResponse.user);
        },
      );
    }
    
    Future<void> logout() async {
      final refreshToken = await _secureStorage.read(key: 'refresh_token');
      
      if (refreshToken != null) {
        await _authRepository.logout(refreshToken);
      }
      
      await _secureStorage.deleteAll();
      state = const AuthState.unauthenticated();
    }
    
    Future<String?> refreshAccessToken() async {
      final refreshToken = await _secureStorage.read(key: 'refresh_token');
      
      if (refreshToken == null) return null;
      
      final result = await _authRepository.refreshTokens(refreshToken);
      
      return result.fold(
        (failure) => null,
        (authResponse) async {
          await _secureStorage.write(
            key: 'access_token',
            value: authResponse.accessToken,
          );
          await _secureStorage.write(
            key: 'refresh_token',
            value: authResponse.refreshToken,
          );
          
          return authResponse.accessToken;
        },
      );
    }
  }
  
  final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
    final authRepository = ref.watch(authRepositoryProvider);
    final secureStorage = const FlutterSecureStorage();
    return AuthNotifier(authRepository, secureStorage);
  });
  ```

- [ ] **Create Dio interceptor for JWT:**
  ```dart
  // lib/core/network/auth_interceptor.dart
  class AuthInterceptor extends Interceptor {
    final FlutterSecureStorage _secureStorage;
    final Ref _ref;
    
    AuthInterceptor(this._secureStorage, this._ref);
    
    @override
    Future<void> onRequest(
      RequestOptions options,
      RequestInterceptorHandler handler,
    ) async {
      final token = await _secureStorage.read(key: 'access_token');
      
      if (token != null) {
        options.headers['Authorization'] = 'Bearer $token';
      }
      
      handler.next(options);
    }
    
    @override
    Future<void> onError(
      DioException err,
      ErrorInterceptorHandler handler,
    ) async {
      if (err.response?.statusCode == 401) {
        // Try to refresh token
        final authNotifier = _ref.read(authProvider.notifier);
        final newToken = await authNotifier.refreshAccessToken();
        
        if (newToken != null) {
          // Retry request with new token
          final options = err.requestOptions;
          options.headers['Authorization'] = 'Bearer $newToken';
          
          try {
            final response = await Dio().fetch(options);
            handler.resolve(response);
            return;
          } catch (e) {
            // Refresh failed, logout
            await authNotifier.logout();
          }
        } else {
          // No refresh token, logout
          await authNotifier.logout();
        }
      }
      
      handler.next(err);
    }
  }
  ```

- [ ] **Create login screen:**
  ```dart
  // lib/presentation/screens/auth/login_screen.dart
  class LoginScreen extends ConsumerStatefulWidget {
    const LoginScreen({Key? key}) : super(key: key);
    
    @override
    ConsumerState<LoginScreen> createState() => _LoginScreenState();
  }
  
  class _LoginScreenState extends ConsumerState<LoginScreen> {
    final _formKey = GlobalKey<FormState>();
    final _emailController = TextEditingController();
    final _passwordController = TextEditingController();
    bool _isLoading = false;
    bool _obscurePassword = true;
    
    @override
    void dispose() {
      _emailController.dispose();
      _passwordController.dispose();
      super.dispose();
    }
    
    Future<void> _handleLogin() async {
      if (!_formKey.currentState!.validate()) return;
      
      setState(() => _isLoading = true);
      
      try {
        await ref.read(authProvider.notifier).login(
          _emailController.text.trim(),
          _passwordController.text,
        );
        
        // Navigation handled by router based on auth state
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(e.toString())),
          );
        }
      } finally {
        if (mounted) {
          setState(() => _isLoading = false);
        }
      }
    }
    
    @override
    Widget build(BuildContext context) {
      return Scaffold(
        body: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(24),
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 400),
                child: Form(
                  key: _formKey,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Text(
                        'RentLedger',
                        style: Theme.of(context).textTheme.headlineLarge?.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'The system of record for rentals',
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: Colors.grey[600],
                        ),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 48),
                      TextFormField(
                        controller: _emailController,
                        keyboardType: TextInputType.emailAddress,
                        decoration: const InputDecoration(
                          labelText: 'Email',
                          border: OutlineInputBorder(),
                        ),
                        validator: (value) {
                          if (value == null || value.isEmpty) {
                            return 'Please enter your email';
                          }
                          if (!value.contains('@')) {
                            return 'Please enter a valid email';
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: 16),
                      TextFormField(
                        controller: _passwordController,
                        obscureText: _obscurePassword,
                        decoration: InputDecoration(
                          labelText: 'Password',
                          border: const OutlineInputBorder(),
                          suffixIcon: IconButton(
                            icon: Icon(
                              _obscurePassword
                                  ? Icons.visibility_off
                                  : Icons.visibility,
                            ),
                            onPressed: () {
                              setState(() => _obscurePassword = !_obscurePassword);
                            },
                          ),
                        ),
                        validator: (value) {
                          if (value == null || value.isEmpty) {
                            return 'Please enter your password';
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: 24),
                      ElevatedButton(
                        onPressed: _isLoading ? null : _handleLogin,
                        style: ElevatedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 16),
                        ),
                        child: _isLoading
                            ? const SizedBox(
                                height: 20,
                                width: 20,
                                child: CircularProgressIndicator(strokeWidth: 2),
                              )
                            : const Text('Sign In'),
                      ),
                      const SizedBox(height: 16),
                      TextButton(
                        onPressed: () {
                          // Navigate to register
                        },
                        child: const Text('Don\'t have an account? Sign up'),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      );
    }
  }
  ```

- [ ] **Configure go_router with auth:**
  ```dart
  // lib/core/router/app_router.dart
  final routerProvider = Provider<GoRouter>((ref) {
    final authState = ref.watch(authProvider);
    
    return GoRouter(
      initialLocation: '/login',
      redirect: (context, state) {
        final isAuthenticated = authState is _Authenticated;
        final isLoginRoute = state.location == '/login' || state.location == '/register';
        
        if (!isAuthenticated && !isLoginRoute) {
          return '/login';
        }
        
        if (isAuthenticated && isLoginRoute) {
          // Redirect based on role
          final user = (authState as _Authenticated).user;
          switch (user.role) {
            case UserRole.broker:
              return '/dashboard';
            case UserRole.societyAdmin:
              return '/society-dashboard';
            default:
              return '/timeline';
          }
        }
        
        return null;
      },
      routes: [
        GoRoute(
          path: '/login',
          builder: (context, state) => const LoginScreen(),
        ),
        GoRoute(
          path: '/register',
          builder: (context, state) => const RegisterScreen(),
        ),
        GoRoute(
          path: '/timeline',
          builder: (context, state) => const MyRentalsScreen(),
        ),
        GoRoute(
          path: '/timeline/:id',
          builder: (context, state) => TimelineScreen(
            rentalId: state.pathParameters['id']!,
          ),
        ),
        GoRoute(
          path: '/dashboard',
          builder: (context, state) => const BrokerDashboardScreen(),
        ),
        // ... more routes
      ],
    );
  });
  ```

---

*This document continues with detailed implementation for Sections 5-6. The remaining sections (7-15) follow the same comprehensive format with integrated backend and frontend code.*
