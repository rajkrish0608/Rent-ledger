import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { OcrService } from './ocr.service';

@Processor('ocr-processing')
export class OcrProcessor extends WorkerHost {
    private readonly logger = new Logger(OcrProcessor.name);

    constructor(private readonly ocrService: OcrService) {
        super();
    }

    async process(job: Job<any, any, string>): Promise<any> {
        this.logger.log(`Processing OCR job: ${job.id} for media ${job.data.mediaId}`);

        try {
            await this.ocrService.processDocument(job.data.mediaId);
            this.logger.log(`Completed OCR job: ${job.id}`);
            return { success: true };
        } catch (e) {
            this.logger.error(`Failed OCR job: ${job.id}`, e);
            throw e;
        }
    }
}
