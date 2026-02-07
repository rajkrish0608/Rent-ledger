import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExportsService } from './exports.service';
import { ExportsController } from './exports.controller';
import { Export } from './entities/export.entity';
import { RentalsModule } from '../rentals/rentals.module';
import { IntegrityModule } from '../integrity/integrity.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { BullModule } from '@nestjs/bullmq';
import { ExportsProcessor } from './exports.processor';

@Module({
    imports: [
        TypeOrmModule.forFeature([Export]),
        RentalsModule,
        IntegrityModule,
        NotificationsModule,
        BullModule.registerQueue({
            name: 'pdf-exports',
        }),
    ],
    controllers: [ExportsController],
    providers: [ExportsService, ExportsProcessor],
    exports: [ExportsService, BullModule],
})
export class ExportsModule { }
