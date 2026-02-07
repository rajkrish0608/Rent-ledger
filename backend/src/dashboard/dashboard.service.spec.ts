import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DashboardService } from './dashboard.service';
import { Rental } from '../rentals/entities/rental.entity';
import { RentalEvent } from '../events/entities/rental-event.entity';

describe('DashboardService', () => {
    let service: DashboardService;

    const mockQueryBuilder = {
        innerJoin: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(5), // Default count
        getMany: jest.fn().mockResolvedValue([]), // Default list
    };

    const mockRepo = {
        createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    };

    beforeEach(async () => {
        const testModule: TestingModule = await Test.createTestingModule({
            providers: [
                DashboardService,
                {
                    provide: getRepositoryToken(Rental),
                    useValue: mockRepo,
                },
                {
                    provide: getRepositoryToken(RentalEvent),
                    useValue: mockRepo,
                },
            ],
        }).compile();

        service = testModule.get<DashboardService>(DashboardService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('getBrokerStats', () => {
        it('should return aggregated stats', async () => {
            const brokerId = 'broker-123';

            // Setup specific return values if needed
            // For now, relies on default mocks returning 5 and []

            const result = await service.getBrokerStats(brokerId);

            expect(result).toEqual({
                active_rentals: 5,
                closed_rentals: 5,
                pending_move_outs: 5,
                recent_activity: [],
            });

            expect(mockRepo.createQueryBuilder).toHaveBeenCalledTimes(4); // 3 counts + 1 list
        });
    });
});
