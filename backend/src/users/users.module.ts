import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';
import { PrivacyController } from './privacy.controller';
import { RentalParticipant } from '../rentals/entities/rental-participant.entity';
import { RentalEvent } from '../events/entities/rental-event.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([User, RentalParticipant, RentalEvent]),
    ],
    providers: [UsersService],
    controllers: [PrivacyController],
    exports: [UsersService],
})
export class UsersModule { }
