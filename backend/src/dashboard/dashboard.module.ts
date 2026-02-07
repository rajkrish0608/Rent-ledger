import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { Rental } from '../rentals/entities/rental.entity';
import { RentalEvent } from '../events/entities/rental-event.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Rental, RentalEvent])],
    controllers: [DashboardController],
    providers: [DashboardService],
})
export class DashboardModule { }
