import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReputationService } from './reputation.service';
import { ReputationSignal } from './entities/reputation-signal.entity';

@Module({
    imports: [TypeOrmModule.forFeature([ReputationSignal])],
    providers: [ReputationService],
    exports: [ReputationService],
})
export class ReputationModule { }
