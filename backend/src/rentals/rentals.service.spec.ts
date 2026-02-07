import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RentalsService } from './rentals.service';
import { Rental } from './entities/rental.entity';
import { RentalParticipant } from './entities/rental-participant.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

const mockRental = {
    id: 'rental-1',
    property_address: '123 Main St',
    property_unit: '4B',
    start_date: new Date(),
    creator: { id: 'user-1' },
    status: 'ACTIVE',
    created_at: new Date(),
    updated_at: new Date(),
};

const mockParticipant = {
    id: 'part-1',
    rental_id: 'rental-1',
    user_id: 'user-1',
    user: { id: 'user-1', name: 'John Doe', email: 'john@example.com' },
    role: 'BROKER',
    joined_at: new Date(),
};

describe('RentalsService', () => {
    let service: RentalsService;
    let rentalsRepo: any;
    let participantsRepo: any;
    let notificationsService: any;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                RentalsService,
                {
                    provide: getRepositoryToken(Rental),
                    useValue: {
                        create: jest.fn().mockImplementation((dto) => dto),
                        save: jest.fn().mockResolvedValue(mockRental),
                        findOne: jest.fn(),
                        update: jest.fn(),
                    },
                },
                {
                    provide: getRepositoryToken(RentalParticipant),
                    useValue: {
                        create: jest.fn().mockImplementation((dto) => dto),
                        save: jest.fn().mockResolvedValue(mockParticipant),
                        find: jest.fn(),
                        findOne: jest.fn(),
                    },
                },
                {
                    provide: NotificationsService,
                    useValue: {
                        notifyRentalInvite: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<RentalsService>(RentalsService);
        rentalsRepo = module.get(getRepositoryToken(Rental));
        participantsRepo = module.get(getRepositoryToken(RentalParticipant));
        notificationsService = module.get(NotificationsService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('createRental', () => {
        it('should create and return a rental', async () => {
            const createDto = {
                property_address: '123 Main St',
                property_unit: '4B',
                start_date: new Date().toISOString(),
            };

            // Mock verifyAccess inside getRentalById
            participantsRepo.findOne.mockResolvedValue(mockParticipant);
            // Mock findOne for the rental in getRentalById
            rentalsRepo.findOne.mockResolvedValue(mockRental);
            // Mock find for participants in getRentalById
            participantsRepo.find.mockResolvedValue([mockParticipant]);

            const result = await service.createRental(createDto, 'user-1');

            expect(rentalsRepo.create).toHaveBeenCalled();
            expect(rentalsRepo.save).toHaveBeenCalled();
            expect(notificationsService.notifyRentalInvite).toHaveBeenCalled();
            expect(result.property_address).toEqual('123 Main St');
        });
    });

    describe('getRentalById', () => {
        it('should return a rental if user has access', async () => {
            participantsRepo.findOne.mockResolvedValue(mockParticipant);
            rentalsRepo.findOne.mockResolvedValue(mockRental);
            participantsRepo.find.mockResolvedValue([mockParticipant]);

            const result = await service.getRentalById('rental-1', 'user-1');
            expect(result.id).toEqual('rental-1');
        });

        it('should throw ForbiddenException if user has no access', async () => {
            participantsRepo.findOne.mockResolvedValue(null);
            await expect(service.getRentalById('rental-1', 'user-2')).rejects.toThrow(ForbiddenException);
        });
    });

    describe('closeRental', () => {
        it('should update rental status to CLOSED', async () => {
            participantsRepo.findOne.mockResolvedValue(mockParticipant);
            rentalsRepo.findOne.mockResolvedValue({ ...mockRental, status: 'CLOSED' });
            participantsRepo.find.mockResolvedValue([mockParticipant]);

            const result = await service.closeRental('rental-1', 'user-1');
            expect(rentalsRepo.update).toHaveBeenCalledWith('rental-1', expect.objectContaining({ status: 'CLOSED' }));
        });
    });
});
