import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Rental } from '../rentals/entities/rental.entity';
import { RentalEvent } from '../events/entities/rental-event.entity';

@Injectable()
export class DashboardService {
    constructor(
        @InjectRepository(Rental)
        private rentalsRepo: Repository<Rental>,
        @InjectRepository(RentalEvent)
        private eventsRepo: Repository<RentalEvent>,
    ) { }

    async getBrokerStats(brokerId: string) {
        // 1. Active Rentals
        const activeRentals = await this.rentalsRepo.createQueryBuilder('rental')
            .innerJoin('rental.participants', 'participant')
            .where('participant.user.id = :brokerId', { brokerId })
            .andWhere('participant.role = :role', { role: 'BROKER' })
            .andWhere('rental.status = :status', { status: 'ACTIVE' })
            .getCount();

        // 2. Closed Rentals
        const closedRentals = await this.rentalsRepo.createQueryBuilder('rental')
            .innerJoin('rental.participants', 'participant')
            .where('participant.user.id = :brokerId', { brokerId })
            .andWhere('participant.role = :role', { role: 'BROKER' })
            .andWhere('rental.status = :status', { status: 'CLOSED' })
            .getCount();

        // 3. Pending Move-Outs (Active rentals with end_date strictly past)
        // "Overdue" or "Pending Move Out" where status is ACTIVE but date passed.
        const pendingMoveOuts = await this.rentalsRepo.createQueryBuilder('rental')
            .innerJoin('rental.participants', 'participant')
            .where('participant.user.id = :brokerId', { brokerId })
            .andWhere('participant.role = :role', { role: 'BROKER' })
            .andWhere('rental.status = :status', { status: 'ACTIVE' })
            .andWhere('rental.end_date < :now', { now: new Date() })
            .getCount();

        // 4. Recent Activity
        // Events on rentals managed by this broker
        const recentActivity = await this.eventsRepo.createQueryBuilder('event')
            .leftJoinAndSelect('event.rental', 'rental')
            .leftJoinAndSelect('event.actor', 'actor')
            .innerJoin('rental.participants', 'participant')
            .where('participant.user.id = :brokerId', { brokerId })
            .andWhere('participant.role = :role', { role: 'BROKER' })
            .orderBy('event.timestamp', 'DESC')
            .take(10)
            .getMany();

        return {
            active_rentals: activeRentals,
            closed_rentals: closedRentals,
            pending_move_outs: pendingMoveOuts,
            recent_activity: recentActivity,
        };
    }

    async getDisputeRentals(brokerId: string) {
        // Find rentals managed by broker that have had a dispute flagged
        // We assume 'DISPUTE_FLAGGED' is event type or similar.
        // Or check if MOST RECENT event is dispute? Or ANY event is dispute?
        // Let's assume ANY dispute event flags the rental.
        // But maybe we only care about ACTIVE disputes?
        // Start simple: Rentals with ANY dispute event.
        // Better: Rentals whose status is 'DISPUTE'? No, status is ACTIVE/CLOSED.
        // If we assume disputes are critical events.

        return this.rentalsRepo.createQueryBuilder('rental')
            .innerJoinAndSelect('rental.participants', 'participant')
            .innerJoin('rental.events', 'event')
            .where('participant.user.id = :brokerId', { brokerId })
            .andWhere('participant.role = :role', { role: 'BROKER' })
            .andWhere('event.event_type = :type', { type: 'DISPUTE_FLAGGED' })
            .getMany();
    }
}
