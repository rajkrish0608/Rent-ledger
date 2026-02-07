import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IntegrityService } from './integrity.service';
import { RentalEvent } from '../events/entities/rental-event.entity';

@Module({
    imports: [TypeOrmModule.forFeature([RentalEvent])],
    providers: [IntegrityService],
    exports: [IntegrityService],
})
export class IntegrityModule { }
