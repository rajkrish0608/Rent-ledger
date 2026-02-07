import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExportsService } from './exports.service';
import { ExportsController } from './exports.controller';
import { Export } from './entities/export.entity';
import { RentalsModule } from '../rentals/rentals.module';
import { IntegrityModule } from '../integrity/integrity.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Export]),
        RentalsModule,
        IntegrityModule,
    ],
    controllers: [ExportsController],
    providers: [ExportsService],
    exports: [ExportsService],
})
export class ExportsModule { }
