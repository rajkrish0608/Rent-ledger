import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as sgMail from '@sendgrid/mail';
import * as admin from 'firebase-admin';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class NotificationsService implements OnModuleInit {
    private readonly logger = new Logger(NotificationsService.name);
    private isSendGridConfigured = false;
    private isFcmConfigured = false;

    constructor(
        private configService: ConfigService,
        @InjectRepository(User)
        private usersRepo: Repository<User>,
        @InjectQueue('notifications')
        private readonly notificationQueue: Queue,
    ) { }

    onModuleInit() {
        const apiKey = this.configService.get<string>('SENDGRID_API_KEY');
        if (apiKey) {
            sgMail.setApiKey(apiKey);
            this.isSendGridConfigured = true;
            this.logger.log('SendGrid configured');
        } else {
            this.logger.warn('SENDGRID_API_KEY not found. Emails will be logged to console.');
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
        if (this.isSendGridConfigured) {
            const msg = {
                to,
                from: this.configService.get<string>('SENDGRID_FROM_EMAIL', 'noreply@rentledger.io'),
                subject,
                text,
                html: html || text,
            };
            try {
                await sgMail.send(msg);
                this.logger.log(`Email sent to ${to}: ${subject}`);
            } catch (error) {
                this.logger.error(`Error sending email to ${to}`, error);
                if (error.response) {
                    this.logger.error(error.response.body);
                }
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
