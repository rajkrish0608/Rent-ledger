import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { ExportsService } from './exports.service';
import { NotificationsService } from '../notifications/notifications.service';

@Processor('pdf-exports')
export class ExportsProcessor extends WorkerHost {
    private readonly logger = new Logger(ExportsProcessor.name);

    constructor(
        private readonly exportsService: ExportsService,
        private readonly notificationsService: NotificationsService,
    ) {
        super();
    }

    async process(job: Job<any, any, string>): Promise<any> {
        const { exportId, rentalId, userId } = job.data;
        this.logger.log(`Processing Export job: ${job.id} for export ${exportId}`);

        try {
            await this.exportsService.processExport(exportId, rentalId, userId);

            // Get the updated export record to have the download URL
            const exportRecord = await this.exportsService.getExport(exportId, userId);

            // Trigger notification
            await this.notificationsService.notifyExportReady(
                exportId,
                userId,
                exportRecord.download_url
            );

            this.logger.log(`Completed Export job: ${job.id} and queued notification`);
            return { success: true };
        } catch (e) {
            this.logger.error(`Failed Export job: ${job.id}`, e);
            throw e;
        }
    }
}
