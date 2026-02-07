import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RentalEvent } from './entities/rental-event.entity';
import { CreateEventDto } from './dto/create-event.dto';
import { EventResponseDto } from './dto/event-response.dto';
import { IntegrityService } from '../integrity/integrity.service';
import { RentalsService } from '../rentals/rentals.service';

@Injectable()
export class EventsService {
    constructor(
        @InjectRepository(RentalEvent)
        private eventsRepo: Repository<RentalEvent>,
        private integrityService: IntegrityService,
        private rentalsService: RentalsService,
    ) { }

    /**
     * Create a new event in the rental timeline (append-only)
     */
    async createEvent(createDto: CreateEventDto, actorId: string): Promise<EventResponseDto> {
        // Ensure rental_id is provided
        if (!createDto.rental_id) {
            throw new Error('rental_id is required');
        }

        // Verify user has access to this rental
        await this.rentalsService.verifyAccess(createDto.rental_id, actorId);

        // Get previous event hash for chain
        const previousHash = await this.integrityService.getLastEventHash(createDto.rental_id);
        const timestamp = new Date();

        // Generate current hash
        const currentHash = this.integrityService.generateEventHash(
            createDto.rental_id,
            createDto.event_type,
            createDto.event_data,
            timestamp,
            actorId,
            previousHash,
        );

        // Create event
        const event = this.eventsRepo.create({
            rental: { id: createDto.rental_id },
            event_type: createDto.event_type,
            event_data: createDto.event_data,
            actor: { id: actorId },
            actor_type: createDto.actor_type,
            timestamp,
            previous_event_hash: previousHash || undefined,
            current_event_hash: currentHash,
        });

        const savedEvent = await this.eventsRepo.save(event);

        return this.getEventById(savedEvent.id, actorId);
    }

    /**
     * Get event by ID
     */
    async getEventById(id: string, userId: string): Promise<EventResponseDto> {
        const event = await this.eventsRepo.findOne({
            where: { id },
            relations: ['rental', 'actor'],
        });

        if (!event) {
            throw new NotFoundException('Event not found');
        }

        // Verify access
        await this.rentalsService.verifyAccess(event.rental.id, userId);

        return {
            id: event.id,
            rental_id: event.rental.id,
            event_type: event.event_type,
            event_data: event.event_data,
            actor_id: event.actor.id,
            actor_name: event.actor.name,
            actor_type: event.actor_type,
            timestamp: event.timestamp.toISOString(),
            current_event_hash: event.current_event_hash,
            previous_event_hash: event.previous_event_hash,
            created_at: event.created_at.toISOString(),
        };
    }

    /**
     * Get all events for a rental (with pagination)
     */
    async getEventsByRental(
        rentalId: string,
        userId: string,
        page: number = 1,
        limit: number = 20,
    ): Promise<{ events: EventResponseDto[]; total: number; page: number; totalPages: number }> {
        // Verify access
        await this.rentalsService.verifyAccess(rentalId, userId);

        const [events, total] = await this.eventsRepo.findAndCount({
            where: { rental: { id: rentalId } },
            relations: ['actor'],
            order: { timestamp: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
        });

        return {
            events: events.map((event) => ({
                id: event.id,
                rental_id: rentalId,
                event_type: event.event_type,
                event_data: event.event_data,
                actor_id: event.actor.id,
                actor_name: event.actor.name,
                actor_type: event.actor_type,
                timestamp: event.timestamp.toISOString(),
                current_event_hash: event.current_event_hash,
                previous_event_hash: event.previous_event_hash,
                created_at: event.created_at.toISOString(),
            })),
            total,
            page,
            totalPages: Math.ceil(total / limit),
        };
    }
}
