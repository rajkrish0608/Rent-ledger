import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { NotificationsService } from './notifications.service';
import { NotificationProcessor } from './notifications.processor';
import { User } from '../users/entities/user.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([User]),
        BullModule.registerQueue({
            name: 'notifications',
        }),
    ],
    providers: [NotificationsService, NotificationProcessor],
    exports: [NotificationsService],
})
export class NotificationsModule { }
