import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RentalsController } from './rentals.controller';
import { RentalsService } from './rentals.service';
import { Rental } from './entities/rental.entity';
import { RentalParticipant } from './entities/rental-participant.entity';
import { User } from '../users/entities/user.entity';
import { IntegrityModule } from '../integrity/integrity.module';
import { EventsModule } from '../events/events.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Rental, RentalParticipant]),
        IntegrityModule,
        forwardRef(() => EventsModule),
        NotificationsModule,
    ],
    controllers: [RentalsController],
    providers: [RentalsService],
    exports: [RentalsService, NotificationsModule],
})
export class RentalsModule { }
