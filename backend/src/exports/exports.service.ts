import { Injectable, NotFoundException, BadRequestException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as PDFDocument from 'pdfkit';
import * as fs from 'fs';
import * as path from 'path';
import { Export } from './entities/export.entity';
import { RentalsService } from '../rentals/rentals.service';
import { IntegrityService } from '../integrity/integrity.service';
import { CreateExportDto } from './dto/create-export.dto';

@Injectable()
export class ExportsService implements OnModuleInit {
    private isS3Configured = false;
    private uploadDir = path.join(process.cwd(), 'uploads', 'exports');

    constructor(
        @InjectRepository(Export)
        private exportsRepo: Repository<Export>,
        private rentalsService: RentalsService,
        private integrityService: IntegrityService,
    ) { }

    async onModuleInit() {
        // Check for S3 config
        if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && process.env.AWS_BUCKET) {
            this.isS3Configured = true;
            console.log('S3 is configured for exports');
        } else {
            console.log('S3 is NOT configured. Using local storage for exports.');
            if (!fs.existsSync(this.uploadDir)) {
                fs.mkdirSync(this.uploadDir, { recursive: true });
            }
        }

        // Auto-create table if missing (Development helper)
        try {
            await this.exportsRepo.query(`
                CREATE TABLE IF NOT EXISTS "exports" (
                  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                  "rental_id" uuid NOT NULL,
                  "requested_by" uuid NOT NULL,
                  "status" character varying NOT NULL DEFAULT 'PENDING',
                  "s3_key" character varying,
                  "download_url" character varying,
                  "expires_at" TIMESTAMP,
                  "metadata" jsonb,
                  "error_message" text,
                  "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                  "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                  CONSTRAINT "PK_exports" PRIMARY KEY ("id")
                );
            `);
            console.log('Exports table ensured');
        } catch (e) {
            console.error('Failed to create exports table', e);
        }
    }

    /**
     * Trigger a new export for a rental
     */
    async createExport(createDto: CreateExportDto, userId: string): Promise<Export> {
        // 1. Verify access to rental
        try {
            await this.rentalsService.verifyAccess(createDto.rental_id, userId);
        } catch (e) {
            throw new BadRequestException('Invalid rental ID or access denied');
        }

        // 2. Create export record
        const exportRecord = this.exportsRepo.create({
            rental_id: createDto.rental_id,
            requested_by: userId,
            status: 'PENDING',
            metadata: {
                format: createDto.options?.format || 'pdf',
                include_events: createDto.options?.include_all_events ?? true,
            },
        });

        await this.exportsRepo.save(exportRecord);

        // 3. Start processing asynchronously (fire and forget)
        this.processExport(exportRecord.id, createDto.rental_id, userId).catch(err => {
            console.error(`Export processing failed for ${exportRecord.id}`, err);
            this.exportsRepo.update(exportRecord.id, {
                status: 'FAILED',
                error_message: err.message,
            });
        });

        return exportRecord;
    }

    /**
     * Get export status
     */
    async getExport(id: string, userId: string): Promise<Export> {
        const exportRecord = await this.exportsRepo.findOne({
            where: { id },
        });

        if (!exportRecord) {
            throw new NotFoundException('Export not found');
        }

        // Only allow requester to view
        if (exportRecord.requested_by !== userId) {
            throw new NotFoundException('Export not found');
        }

        return exportRecord;
    }

    /**
     * Get download URL manually (for local dev mostly)
     */
    async getDownloadUrl(id: string, userId: string): Promise<{ url: string }> {
        const exportRecord = await this.getExport(id, userId);

        if (exportRecord.status !== 'COMPLETED') {
            throw new BadRequestException('Export is not ready yet');
        }

        return { url: exportRecord.download_url };
    }

    /**
     * Process the export (Generate PDF -> Upload -> Update Record)
     */
    private async processExport(exportId: string, rentalId: string, userId: string) {
        try {
            // Update status to PROCESSING
            await this.exportsRepo.update(exportId, { status: 'PROCESSING' });

            // Fetch data
            const rental = await this.rentalsService.getRentalById(rentalId, userId);
            const integrity = await this.integrityService.verifyEventChain(rentalId);

            // Generate PDF
            const pdfBuffer = await this.generatePdf(rental, integrity);

            // Store PDF
            const filename = `rental_${rentalId}_${Date.now()}.pdf`;
            const uploadResult = await this.storeFile(filename, pdfBuffer);

            // Update record as COMPLETED
            await this.exportsRepo.update(exportId, {
                status: 'COMPLETED',
                s3_key: uploadResult.key,
                download_url: uploadResult.url,
                expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours expiry
            });

        } catch (err) {
            console.error(`Export processing error:`, err);
            await this.exportsRepo.update(exportId, {
                status: 'FAILED',
                error_message: err.message || 'Unknown error',
            });
        }
    }

    /**
     * Generate PDF binary buffer
     */
    private async generatePdf(rental: any, integrity: any): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            const doc = new PDFDocument({ margin: 50 });
            const buffers: Buffer[] = [];

            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => resolve(Buffer.concat(buffers)));
            doc.on('error', reject);

            // --- HEADER ---
            doc.fontSize(20).text('RentLedger - Rental History Report', { align: 'center' });
            doc.moveDown();
            doc.fontSize(10).text('Generated on: ' + new Date().toLocaleString(), { align: 'right' });
            doc.moveDown();

            // --- PROPERTY DETAILS ---
            doc.lineGap(5);
            doc.fontSize(14).text('Property Details', { underline: true });
            doc.fontSize(12).text(`Address: ${rental.property_address}`);
            if (rental.property_unit) {
                doc.text(`Unit: ${rental.property_unit}`);
            }
            doc.text(`Status: ${rental.status}`);
            doc.text(`Start Date: ${new Date(rental.start_date).toLocaleDateString()}`);
            if (rental.end_date) {
                doc.text(`End Date: ${new Date(rental.end_date).toLocaleDateString()}`);
            }
            doc.moveDown();

            // --- PARTICIPANTS ---
            doc.fontSize(14).text('Participants', { underline: true });
            rental.participants.forEach((p: any) => {
                doc.fontSize(12).text(`${p.role}: ${p.name} (${p.email})`);
                doc.fillColor('grey').fontSize(10).text(`   Joined: ${new Date(p.joined_at).toLocaleDateString()}`);
                doc.fillColor('black');
            });
            doc.moveDown();

            // --- INTEGRITY STATUS ---
            doc.fontSize(14).text('Integrity Status', { underline: true });
            const statusColor = integrity.valid ? 'green' : 'red';
            doc.fillColor(statusColor).fontSize(12).text(`Chain Status: ${integrity.valid ? 'VALID' : 'BROKEN'}`);
            doc.fillColor('black').text(`Total Events: ${integrity.events.length}`);
            doc.moveDown();

            // --- TIMELINE EVENTS ---
            doc.fontSize(14).text('Timeline Events', { underline: true });
            integrity.events.forEach((event: any, index: number) => {
                const date = new Date(event.timestamp).toLocaleString();
                doc.fontSize(12).text(`${index + 1}. [${event.type}] - ${date}`);
                doc.fontSize(10).text(`   Hash: ${event.hash}`);
                doc.text(`   Previous Hash: ${event.previous_hash}`);
                doc.text(`   Metadata: ${JSON.stringify(event.metadata)}`);
                doc.moveDown(0.5);
            });
            doc.moveDown();

            // --- SECTION 65B CERTIFICATE ---
            doc.addPage();
            doc.fontSize(16).text('Certificate Under Section 65B of The Indian Evidence Act, 1872', { align: 'center', underline: true });
            doc.moveDown();
            doc.fontSize(12).text('I hereby certify that the computer output containing the rental history and event logs generated by the RentLedger system satisfies the following conditions:');
            doc.moveDown();
            doc.list([
                'The computer output containing the information was produced by the computer during the period over which the computer was used regularly to store or process information for the purposes of any activities regularly carried on over that period by the person having lawful control over the use of the computer.',
                'During the said period, information of the kind contained in the electronic record or of the kind from which the information so contained is derived was regularly fed into the computer in the ordinary course of the said activities.',
                'Throughout the material part of the said period, the computer was operating properly or, if not, then in respect of any period in which it was not operating properly or was out of operation during that part of the period, was not such as to affect the electronic record or the accuracy of its contents.',
                'The information contained in the electronic record reproduces or is derived from such information fed into the computer in the ordinary course of the said activities.'
            ]);
            doc.moveDown();
            doc.text('This record is immutable and cryptographically verifiable on the RentLedger platform.');
            doc.moveDown(2);
            doc.text('Date: ' + new Date().toLocaleDateString());
            doc.text('System: RentLedger Core');
            doc.text('Signature: (Digitally Generated)');

            doc.end();
        });
    }

    /**
     * Store file (S3 or Local)
     */
    private async storeFile(filename: string, buffer: Buffer): Promise<{ key: string, url: string }> {
        if (this.isS3Configured) {
            // TODO: Implement actual S3 upload
            // const s3 = new S3Client({...});
            // await s3.send(new PutObjectCommand({...}));
            // const url = await getSignedUrl(...)
            // return { key: filename, url };
            throw new Error('S3 implementation pending');
        } else {
            // Local Storage
            const filePath = path.join(this.uploadDir, filename);
            fs.writeFileSync(filePath, buffer);

            // For local dev, we return a mock URL that the frontend can't really access directly 
            // unless we serve static files. 
            // In a real app, this would be a public URL or a signed URL.
            // For now, we'll return a relative path or a loopback URL that assumes the backend serves static files
            // or a controller endpoint streams it back based on ID.

            // Actually, best practice for local dev without static serving setup:
            // Return an endpoint URL that streams the file
            // E.g. http://localhost:3000/api/exports/:id/download/stream
            // But for now, let's just return a placeholder.
            // Wait, we need the frontend to download it.
            // I'll implement a 'stream' endpoint in the controller.

            return {
                key: filePath, // Local path as key
                url: `/api/exports/download-local/${filename}`, // Route we will create
            };
        }
    }

    /**
     * Helper to read local file for streaming
     */
    getFilePath(filename: string): string {
        return path.join(this.uploadDir, filename);
    }
}
