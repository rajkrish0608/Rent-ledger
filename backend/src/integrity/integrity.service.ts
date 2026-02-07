import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createHash } from 'crypto';
import { RentalEvent } from '../events/entities/rental-event.entity';

@Injectable()
export class IntegrityService {
    constructor(
        @InjectRepository(RentalEvent)
        private eventsRepo: Repository<RentalEvent>,
    ) { }

    /**
     * Generate SHA-256 hash for an event
     */
    generateEventHash(
        rentalId: string,
        eventType: string,
        eventData: any,
        timestamp: Date,
        actorId: string,
        previousHash: string | null,
    ): string {
        const payload = JSON.stringify({
            rental_id: rentalId,
            event_type: eventType,
            event_data: eventData,
            timestamp: timestamp.toISOString(),
            actor_id: actorId,
            previous_hash: previousHash,
        });

        return createHash('sha256').update(payload).digest('hex');
    }

    /**
     * Verify the integrity of the entire event chain for a rental
     */
    async verifyEventChain(rentalId: string): Promise<{ valid: boolean; errors: string[]; events: RentalEvent[] }> {
        const events = await this.eventsRepo.find({
            where: { rental: { id: rentalId } },
            order: { timestamp: 'ASC' },
            relations: ['actor'],
        });

        const errors: string[] = [];
        let previousHash: string | null = null;

        for (const event of events) {
            // Check if previous hash matches
            if (event.previous_event_hash !== previousHash) {
                errors.push(
                    `Event ${event.id}: Hash chain broken. Expected previous hash: ${previousHash}, got: ${event.previous_event_hash}`,
                );
            }

            // Recalculate hash and verify
            const expectedHash = this.generateEventHash(
                rentalId,
                event.event_type,
                event.event_data,
                event.timestamp,
                event.actor?.id,
                previousHash,
            );

            if (event.current_event_hash !== expectedHash) {
                errors.push(
                    `Event ${event.id}: Hash mismatch. Expected: ${expectedHash}, got: ${event.current_event_hash}`,
                );
            }

            previousHash = event.current_event_hash;
        }

        return {
            valid: errors.length === 0,
            errors,
            events,
        };
    }

    /**
     * Get the last event hash for a rental (for chaining new events)
     */
    async getLastEventHash(rentalId: string): Promise<string | null> {
        const lastEvent = await this.eventsRepo.findOne({
            where: { rental: { id: rentalId } },
            order: { timestamp: 'DESC' },
        });

        return lastEvent?.current_event_hash || null;
    }
}
