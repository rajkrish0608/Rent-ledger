import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import * as admin from 'firebase-admin';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class NotificationsService implements OnModuleInit {
    private readonly logger = new Logger(NotificationsService.name);
    private resend: Resend;
    private isResendConfigured = false;
    private isFcmConfigured = false;

    constructor(
        private configService: ConfigService,
        @InjectRepository(User)
        private usersRepo: Repository<User>,
        @InjectQueue('notifications')
        private readonly notificationQueue: Queue,
    ) { }

    onModuleInit() {
        const apiKey = this.configService.get<string>('RESEND_API_KEY');
        if (apiKey) {
            this.resend = new Resend(apiKey);
            this.isResendConfigured = true;
            this.logger.log('Resend configured');
        } else {
            this.logger.warn('RESEND_API_KEY not found. Emails will be logged to console.');
        }

        const fcmPath = this.configService.get<string>('FIREBASE_CONFIG_PATH');
        if (fcmPath) {
            try {
                admin.initializeApp({
                    credential: admin.credential.cert(fcmPath),
                });
                this.isFcmConfigured = true;
                this.logger.log('Firebase Admin SDK initialized');
            } catch (e) {
                this.logger.error('Failed to initialize Firebase Admin SDK', e);
            }
        } else {
            this.logger.warn('FIREBASE_CONFIG_PATH not found. Push notifications disabled.');
        }
    }

    async notifyRentalInvite(rentalId: string, userId: string) {
        await this.notificationQueue.add('rental-invite', {
            rentalId,
            userId,
            type: 'RENTAL_INVITE',
        });
    }

    async notifyExportReady(exportId: string, userId: string, downloadUrl: string) {
        await this.notificationQueue.add('export-ready', {
            exportId,
            userId,
            downloadUrl,
            type: 'EXPORT_READY',
        });
    }

    async sendEmail(to: string, subject: string, text: string, html?: string) {
        if (this.isResendConfigured) {
            try {
                const data = await this.resend.emails.send({
                    from: this.configService.get<string>('EMAIL_FROM', 'onboarding@resend.dev'),
                    to,
                    subject,
                    text,
                    html: html || text,
                });
                this.logger.log(`Email sent to ${to}: ${subject} (ID: ${data.data?.id})`);
            } catch (error) {
                this.logger.error(`Error sending email to ${to}`, error);
            }
        } else {
            this.logger.log(`[STUB] Sending email to ${to}: ${subject}\nContent: ${text}`);
        }
    }

    async sendPushNotification(userId: string, title: string, body: string, data?: any) {
        if (!this.isFcmConfigured) {
            this.logger.log(`[STUB] Sending push to ${userId}: ${title} - ${body}`);
            return;
        }

        const user = await this.usersRepo.findOne({ where: { id: userId } });
        if (!user || !user.fcm_token) {
            this.logger.warn(`User ${userId} not found or has no FCM token`);
            return;
        }

        const message = {
            notification: { title, body },
            data: data || {},
            token: user.fcm_token,
        };

        try {
            await admin.messaging().send(message);
            this.logger.log(`Push notification sent to ${userId}`);
        } catch (error) {
            this.logger.error(`Error sending push notification to ${userId}`, error);
        }
    }
}
