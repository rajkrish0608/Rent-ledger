import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RentalsController } from './rentals.controller';
import { RentalsService } from './rentals.service';
import { Rental } from './entities/rental.entity';
import { RentalParticipant } from './entities/rental-participant.entity';
import { IntegrityModule } from '../integrity/integrity.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Rental, RentalParticipant]),
        IntegrityModule,
    ],
    controllers: [RentalsController],
    providers: [RentalsService],
    exports: [RentalsService],
})
export class RentalsModule { }
