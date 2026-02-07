import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeOrmConfig } from './config/typeorm.config';
import { AuthModule } from './auth/auth.module';
import { IntegrityModule } from './integrity/integrity.module';
import { RentalsModule } from './rentals/rentals.module';
import { EventsModule } from './events/events.module';
import { ExportsModule } from './exports/exports.module';
import { MediaModule } from './media/media.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { OcrModule } from './ocr/ocr.module';
import { NotificationsModule } from './notifications/notifications.module';
import { HealthModule } from './health/health.module';
import { BullModule } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: '.env',
        }),
        TypeOrmModule.forRootAsync({
            useFactory: () => ({
                ...typeOrmConfig,
                entities: [],
                autoLoadEntities: true,
            }),
        }),
        AuthModule,
        IntegrityModule,
        RentalsModule,
        EventsModule,
        ExportsModule,
        MediaModule,
        DashboardModule,
        OcrModule,
        NotificationsModule,
        HealthModule,
        BullModule.forRootAsync({
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
                connection: {
                    host: config.get('REDIS_HOST', 'localhost'),
                    port: config.get('REDIS_PORT', 6379),
                    password: config.get('REDIS_PASSWORD'),
                },
            }),
        }),
    ],
    controllers: [],
    providers: [],
})
export class AppModule { }
