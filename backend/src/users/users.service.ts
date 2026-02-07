import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { RentalParticipant } from '../rentals/entities/rental-participant.entity';
import { RentalEvent } from '../events/entities/rental-event.entity';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private usersRepo: Repository<User>,
        @InjectRepository(RentalParticipant)
        private participantsRepo: Repository<RentalParticipant>,
        @InjectRepository(RentalEvent)
        private eventsRepo: Repository<RentalEvent>,
    ) { }

    async findOne(id: string): Promise<User> {
        const user = await this.usersRepo.findOne({ where: { id } });
        if (!user) {
            throw new NotFoundException('User not found');
        }
        return user;
    }

    async exportUserData(userId: string): Promise<any> {
        const user = await this.findOne(userId);

        // Basic user info
        const data: {
            user: any;
            rentals: { rental_id: string; property: string; role: string; joined_at: Date }[];
            activities: { event_id: string; rental_id: string; type: string; timestamp: Date }[];
        } = {
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                phone: user.phone,
                role: user.role,
                created_at: user.created_at,
            },
            rentals: [],
            activities: [],
        };

        // Get rentals where user is a participant
        const participations = await this.participantsRepo.find({
            where: { user_id: userId },
            relations: ['rental'],
        });

        data.rentals = participations.map(p => ({
            rental_id: p.rental_id,
            property: p.rental.property_address,
            role: p.role,
            joined_at: p.joined_at,
        }));

        // Get activities (events) created by the user
        const events = await this.eventsRepo.find({
            where: { actor: { id: userId } },
            relations: ['rental'],
        });

        data.activities = events.map(e => ({
            event_id: e.id,
            rental_id: e.rental.id,
            type: e.event_type,
            timestamp: e.timestamp,
        }));

        return data;
    }

    async deleteUser(userId: string): Promise<void> {
        const user = await this.findOne(userId);

        // GDPR: Right to be forgotten
        // Instead of a hard delete which might break integrity hashes and rental history for others,
        // we "anonymize" the user data.

        user.name = 'Deleted User';
        user.email = `deleted_${userId.split('-')[0]}@rentledger.io`;
        user.phone = ''; // User entity might expect string or null
        user.fcm_token = '';
        user.password_hash = 'ANONYMIZED';

        await this.usersRepo.save(user);
    }
}
