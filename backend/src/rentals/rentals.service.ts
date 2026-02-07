import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Rental } from './entities/rental.entity';
import { RentalParticipant } from './entities/rental-participant.entity';
import { CreateRentalDto } from './dto/create-rental.dto';
import { RentalResponseDto, ParticipantResponseDto } from './dto/rental-response.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class RentalsService {
    constructor(
        @InjectRepository(Rental)
        private rentalsRepo: Repository<Rental>,
        @InjectRepository(RentalParticipant)
        private participantsRepo: Repository<RentalParticipant>,
        private notificationsService: NotificationsService,
    ) { }

    /**
     * Create a new rental timeline
     */
    async createRental(createDto: CreateRentalDto, creatorId: string): Promise<RentalResponseDto> {
        // Create rental
        const rental = this.rentalsRepo.create({
            property_address: createDto.property_address,
            property_unit: createDto.property_unit,
            start_date: new Date(createDto.start_date),
            creator: { id: creatorId },
            status: 'ACTIVE',
        });

        const savedRental = await this.rentalsRepo.save(rental);

        // Add creator as participant (default role: BROKER)
        await this.addParticipant(savedRental.id, creatorId, 'BROKER');

        // Add other participants if provided
        if (createDto.participants) {
            for (const p of createDto.participants) {
                await this.addParticipant(savedRental.id, p.user_id, p.role);
            }
        }

        return this.getRentalById(savedRental.id, creatorId);
    }

    /**
     * Get rental by ID (with access verification)
     */
    async getRentalById(id: string, userId: string): Promise<RentalResponseDto> {
        // Verify user has access
        await this.verifyAccess(id, userId);

        const rental = await this.rentalsRepo.findOne({
            where: { id },
            relations: ['creator'],
        });

        if (!rental) {
            throw new NotFoundException('Rental not found');
        }

        // Get participants
        const participants = await this.participantsRepo.find({
            where: { rental_id: id },
            relations: ['user'],
        });

        return {
            id: rental.id,
            property_address: rental.property_address,
            property_unit: rental.property_unit,
            start_date: new Date(rental.start_date).toISOString(),
            end_date: rental.end_date ? new Date(rental.end_date).toISOString() : undefined,
            status: rental.status,
            participants: participants.map((p) => ({
                id: p.id,
                user_id: p.user_id,
                name: p.user.name,
                email: p.user.email,
                role: p.role,
                joined_at: new Date(p.joined_at).toISOString(),
                left_at: p.left_at ? new Date(p.left_at).toISOString() : undefined,
            })),
            created_at: new Date(rental.created_at).toISOString(),
            updated_at: new Date(rental.updated_at).toISOString(),
        };
    }

    /**
     * Get all rentals for a user
     */
    async getRentalsByUser(userId: string): Promise<RentalResponseDto[]> {
        const participants = await this.participantsRepo.find({
            where: { user_id: userId, left_at: IsNull() },
            relations: ['rental', 'rental.creator'],
        });

        const rentals: RentalResponseDto[] = [];

        for (const participant of participants) {
            const rental = participant.rental;
            const allParticipants = await this.participantsRepo.find({
                where: { rental_id: rental.id },
                relations: ['user'],
            });

            rentals.push({
                id: rental.id,
                property_address: rental.property_address,
                property_unit: rental.property_unit,
                start_date: new Date(rental.start_date).toISOString(),
                end_date: rental.end_date ? new Date(rental.end_date).toISOString() : undefined,
                status: rental.status,
                participants: allParticipants.map((p) => ({
                    id: p.id,
                    user_id: p.user_id,
                    name: p.user.name,
                    email: p.user.email,
                    role: p.role,
                    joined_at: new Date(p.joined_at).toISOString(),
                    left_at: p.left_at ? new Date(p.left_at).toISOString() : undefined,
                })),
                created_at: new Date(rental.created_at).toISOString(),
                updated_at: new Date(rental.updated_at).toISOString(),
            });
        }

        return rentals;
    }

    /**
     * Add a participant to a rental
     */
    async addParticipant(rentalId: string, userId: string, role: string): Promise<void> {
        const participant = this.participantsRepo.create({
            rental_id: rentalId,
            user_id: userId,
            role,
        });

        await this.participantsRepo.save(participant);

        // Notify user about the invite
        // (We might want to skip this for the creator who is added automatically as BRK)
        try {
            await this.notificationsService.notifyRentalInvite(rentalId, userId);
        } catch (e) {
            console.error('Failed to queue invite notification', e);
        }
    }

    /**
     * Close a rental
     */
    async closeRental(rentalId: string, userId: string): Promise<RentalResponseDto> {
        await this.verifyAccess(rentalId, userId);

        await this.rentalsRepo.update(rentalId, {
            status: 'CLOSED',
            end_date: new Date(),
        });

        return this.getRentalById(rentalId, userId);
    }

    /**
     * Verify user has access to a rental
     */
    async verifyAccess(rentalId: string, userId: string): Promise<void> {
        const participant = await this.participantsRepo.findOne({
            where: { rental_id: rentalId, user_id: userId, left_at: IsNull() },
        });

        if (!participant) {
            throw new ForbiddenException('You do not have access to this rental');
        }
    }
}
