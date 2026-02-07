import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReputationSignal } from './entities/reputation-signal.entity';

@Injectable()
export class ReputationService {
    constructor(
        @InjectRepository(ReputationSignal)
        private signalRepo: Repository<ReputationSignal>,
    ) { }

    async captureSignal(userId: string, rentalId: string, signalType: string, signalValue: any) {
        const signal = this.signalRepo.create({
            user: { id: userId },
            rental: { id: rentalId },
            signal_type: signalType,
            signal_value: signalValue,
        });

        await this.signalRepo.save(signal);
    }

    async getUserSignals(userId: string) {
        return this.signalRepo.find({
            where: { user: { id: userId } },
            order: { timestamp: 'DESC' },
        });
    }
}
