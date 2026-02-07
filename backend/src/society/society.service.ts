import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Rental } from '../rentals/entities/rental.entity';
import { RentalEvent } from '../events/entities/rental-event.entity';

@Injectable()
export class SocietyService {
    constructor(
        @InjectRepository(Rental)
        private rentalsRepo: Repository<Rental>,
        @InjectRepository(User)
        private usersRepo: Repository<User>,
        @InjectRepository(RentalEvent)
        private eventsRepo: Repository<RentalEvent>,
    ) { }

    async getSocietyRentals(societyAdminId: string) {
        const admin = await this.usersRepo.findOne({
            where: { id: societyAdminId },
            relations: ['society'],
        });

        if (!admin?.society) {
            throw new NotFoundException('Society not found for admin');
        }

        return this.rentalsRepo.find({
            where: {
                property_address: Like(`%${admin.society.name}%`),
            },
            relations: ['participants', 'participants.user'], // To show tenants/landlords
            order: { created_at: 'DESC' },
        });
    }

    // Helper to verify admin access
    private async getAdminSociety(adminId: string) {
        const admin = await this.usersRepo.findOne({
            where: { id: adminId },
            relations: ['society']
        });
        if (!admin?.society) throw new ForbiddenException('Not a Society Admin');
        return admin.society;
    }

    /*
    async logMoveInOut(adminId: string, rentalId: string, type: string, notes?: string) {
        const society = await this.getAdminSociety(adminId);
        // Validate rental belongs to society
        const rental = await this.rentalsRepo.findOneBy({ id: rentalId });
        if (!rental || !rental.property_address.includes(society.name)) {
            throw new ForbiddenException('Rental not in your society');
        }
  
        // Create event... (omitted for brevity, requires complex event creation logic usually in integration service or events service)
        // For now, MVP focuses on READ operations.
    }
    */
}
