import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';

@Processor('notifications')
export class NotificationProcessor extends WorkerHost {
    private readonly logger = new Logger(NotificationProcessor.name);

    constructor(
        private readonly notificationsService: NotificationsService,
        @InjectRepository(User)
        private readonly usersRepo: Repository<User>,
    ) {
        super();
    }

    async process(job: Job<any, any, string>): Promise<any> {
        const { type, userId, ...data } = job.data;
        this.logger.log(`Processing notification job: ${job.id} for user ${userId}, type: ${type}`);

        const user = await this.usersRepo.findOne({ where: { id: userId } });
        if (!user) {
            this.logger.error(`User ${userId} not found, skipping notification`);
            return;
        }

        try {
            switch (type) {
                case 'RENTAL_INVITE':
                    await this.handleRentalInvite(user, data.rentalId);
                    break;
                case 'EXPORT_READY':
                    await this.handleExportReady(user, data.exportId, data.downloadUrl);
                    break;
                default:
                    this.logger.warn(`Unknown notification type: ${type}`);
            }
        } catch (e) {
            this.logger.error(`Failed to process notification ${job.id}`, e);
            throw e;
        }
    }

    private async handleRentalInvite(user: User, rentalId: string) {
        const subject = 'RentLedger - You have been invited to a rental';
        const text = `Hi ${user.name},\n\nYou have been invited to join a rental on RentLedger. Please log in to accept the invite.\n\nRental ID: ${rentalId}`;

        await this.notificationsService.sendEmail(user.email, subject, text);
        await this.notificationsService.sendPushNotification(
            user.id,
            'New Rental Invite',
            'You have been invited to a new rental timeline.'
        );
    }

    private async handleExportReady(user: User, exportId: string, downloadUrl: string) {
        const subject = 'RentLedger - Your export is ready';
        const text = `Hi ${user.name},\n\nYour requested export (ID: ${exportId}) is ready for download. You can access it here: ${downloadUrl}\n\nNote: This link expires in 24 hours.`;

        await this.notificationsService.sendEmail(user.email, subject, text);
        await this.notificationsService.sendPushNotification(
            user.id,
            'Export Ready',
            'Your rental history report is ready for download.'
        );
    }
}
