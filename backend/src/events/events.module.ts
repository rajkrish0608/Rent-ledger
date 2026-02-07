import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { RentalEvent } from './entities/rental-event.entity';
import { IntegrityModule } from '../integrity/integrity.module';
import { RentalsModule } from '../rentals/rentals.module';
import { ReputationModule } from '../reputation/reputation.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([RentalEvent]),
        IntegrityModule,
        RentalsModule,
        ReputationModule,
    ],
    controllers: [EventsController],
    providers: [EventsService],
    exports: [EventsService],
})
export class EventsModule { }
