import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SocietyController } from './society.controller';
import { SocietyService } from './society.service';
import { Society } from './entities/society.entity';
import { User } from '../users/entities/user.entity';
import { Rental } from '../rentals/entities/rental.entity';
import { RentalEvent } from '../events/entities/rental-event.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Society, User, Rental, RentalEvent])],
    controllers: [SocietyController],
    providers: [SocietyService],
})
export class SocietyModule { }
