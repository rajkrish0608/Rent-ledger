import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EventsService } from './events.service';
import { RentalEvent } from './entities/rental-event.entity';
import { EventType } from './dto/create-event.dto';
import { IntegrityService } from '../integrity/integrity.service';
import { RentalsService } from '../rentals/rentals.service';
import { ReputationService } from '../reputation/reputation.service';
import { NotFoundException } from '@nestjs/common';

const mockEvent = {
    id: 'event-1',
    rental: { id: 'rental-1' },
    event_type: EventType.RENT_PAID,
    event_data: { amount: 1000 },
    actor: { id: 'user-1', name: 'John Doe' },
    actor_type: 'TENANT',
    timestamp: new Date(),
    current_event_hash: 'hash-1',
    previous_event_hash: 'prev-hash-1',
    created_at: new Date(),
};

describe('EventsService', () => {
    let service: EventsService;
    let eventsRepo: any;
    let integrityService: any;
    let rentalsService: any;
    let reputationService: any;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                EventsService,
                {
                    provide: getRepositoryToken(RentalEvent),
                    useValue: {
                        create: jest.fn().mockImplementation((dto) => ({ ...dto, id: 'event-1', timestamp: new Date(), created_at: new Date() })),
                        save: jest.fn().mockImplementation((event) => Promise.resolve(event)),
                        findOne: jest.fn(),
                        findAndCount: jest.fn(),
                        createQueryBuilder: jest.fn(),
                    },
                },
                {
                    provide: IntegrityService,
                    useValue: {
                        getLastEventHash: jest.fn().mockResolvedValue('prev-hash-1'),
                        generateEventHash: jest.fn().mockReturnValue('hash-1'),
                    },
                },
                {
                    provide: RentalsService,
                    useValue: {
                        verifyAccess: jest.fn().mockResolvedValue(undefined),
                    },
                },
                {
                    provide: ReputationService,
                    useValue: {
                        captureSignal: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<EventsService>(EventsService);
        eventsRepo = module.get(getRepositoryToken(RentalEvent));
        integrityService = module.get(IntegrityService);
        rentalsService = module.get(RentalsService);
        reputationService = module.get(ReputationService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('createEvent', () => {
        it('should create an event with hash chaining', async () => {
            const createDto = {
                rental_id: 'rental-1',
                event_type: EventType.RENT_PAID,
                event_data: { amount: 1000 },
                actor_type: 'TENANT',
            };

            // Mock findOne for getEventById which is called inside createEvent return
            eventsRepo.findOne.mockResolvedValue(mockEvent);

            const result = await service.createEvent(createDto, 'user-1');

            expect(rentalsService.verifyAccess).toHaveBeenCalled();
            expect(integrityService.getLastEventHash).toHaveBeenCalledWith('rental-1');
            expect(integrityService.generateEventHash).toHaveBeenCalled();
            expect(eventsRepo.save).toHaveBeenCalled();
            expect(reputationService.captureSignal).toHaveBeenCalled();
            expect(result.current_event_hash).toEqual('hash-1');
        });
    });

    describe('getEventsByRental', () => {
        it('should return paginated events', async () => {
            eventsRepo.findAndCount.mockResolvedValue([[mockEvent], 1]);

            const result = await service.getEventsByRental('rental-1', 'user-1');

            expect(rentalsService.verifyAccess).toHaveBeenCalled();
            expect(result.events).toHaveLength(1);
            expect(result.total).toEqual(1);
        });
    });
});
