import { Injectable, Logger } from '@nestjs/common';
import { createWorker } from 'tesseract.js';
import { MediaService } from '../media/media.service';

@Injectable()
export class OcrService {
    private readonly logger = new Logger(OcrService.name);

    constructor(private readonly mediaService: MediaService) { }

    async extractText(key: string): Promise<string> {
        this.logger.log(`Extracting text from media: ${key}`);
        const filePath = await this.mediaService.getFilePathOrUrl(key);

        let worker;
        try {
            worker = await createWorker('eng');
            const { data: { text } } = await worker.recognize(filePath);
            this.logger.log(`Text extracted successfully. Length: ${text.length}`);
            return text;
        } catch (error) {
            this.logger.error(`Failed to extract text from ${key}`, error.stack);
            throw error;
        } finally {
            if (worker) {
                await worker.terminate();
            }
        }
    }

    async processDocument(mediaId: string): Promise<void> {
        this.logger.log(`Processing document for OCR: ${mediaId}`);
        const media = await this.mediaService.getMediaFile(mediaId);

        if (!media) {
            this.logger.warn(`Media file not found: ${mediaId}`);
            return;
        }

        // Double check file type 
        // Logic to extract text 
        try {
            const text = await this.extractText(media.storage_path);

            await this.mediaService.updateMetadata(mediaId, {
                ...media.metadata,
                ocr_text: text,
                ocr_processed_at: new Date(),
            });

            this.logger.log(`OCR processing completed for: ${mediaId}`);
        } catch (e) {
            this.logger.error(`OCR processing failed for ${mediaId}`, e);
            // We could update metadata to status: FAILED 
            await this.mediaService.updateMetadata(mediaId, {
                ...media.metadata,
                ocr_status: 'FAILED',
                ocr_error: e.message,
            });
        }
    }
}
