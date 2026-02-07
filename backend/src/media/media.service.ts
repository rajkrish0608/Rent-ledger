import { Injectable, Logger } from '@nestjs/common';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class MediaService {
    private readonly logger = new Logger(MediaService.name);
    private s3Client: S3Client | null = null;
    private readonly bucket = process.env.AWS_BUCKET;
    // Adjust path for dist/ directory structure
    private readonly uploadDir = path.join(process.cwd(), 'uploads/media');

    constructor() {
        if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && this.bucket) {
            this.s3Client = new S3Client({
                region: process.env.AWS_REGION || 'us-east-1',
                credentials: {
                    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
                },
            });
            this.logger.log('S3 Client initialized');
        } else {
            this.logger.warn('S3 credentials missing. Using local storage.');
            if (!fs.existsSync(this.uploadDir)) {
                fs.mkdirSync(this.uploadDir, { recursive: true });
            }
        }
    }

    async getUploadUrl(key: string, contentType: string): Promise<string> {
        if (this.s3Client) {
            const command = new PutObjectCommand({
                Bucket: this.bucket,
                Key: key,
                ContentType: contentType,
            });
            return getSignedUrl(this.s3Client, command, { expiresIn: 300 });
        } else {
            // Return local upload URL suitable for PUT request
            // Ensure this matches your controller route
            // We use encodeURIComponent just in case
            return `http://localhost:3000/api/media/upload/local?key=${encodeURIComponent(key)}`;
        }
    }

    async getDownloadUrl(key: string): Promise<string> {
        if (this.s3Client) {
            const command = new GetObjectCommand({
                Bucket: this.bucket,
                Key: key,
            });
            return getSignedUrl(this.s3Client, command, { expiresIn: 3600 });
        } else {
            return `http://localhost:3000/api/media/download/local/${encodeURIComponent(key)}`;
        }
    }

    /**
     * Helper for local storage: Save stream to file
     */
    async saveLocalStream(key: string, stream: NodeJS.ReadableStream): Promise<void> {
        const filePath = path.join(this.uploadDir, key);
        const writeStream = fs.createWriteStream(filePath);

        return new Promise((resolve, reject) => {
            stream.pipe(writeStream);
            writeStream.on('finish', resolve);
            writeStream.on('error', reject);
        });
    }

    /** 
     * Helper for local storage: Read file stream
     */
    getLocalStream(key: string): fs.ReadStream {
        const filePath = path.join(this.uploadDir, key);
        if (!fs.existsSync(filePath)) {
            throw new Error('File not found');
        }
        return fs.createReadStream(filePath);
    }
}
