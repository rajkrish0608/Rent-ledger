import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ExportsService } from './exports.service';
import { Export } from './entities/export.entity';
import { RentalsService } from '../rentals/rentals.service';
import { IntegrityService } from '../integrity/integrity.service';
import { getQueueToken } from '@nestjs/bullmq';

const mockExport = {
    id: 'export-1',
    rental_id: 'rental-1',
    user_id: 'user-1',
    status: 'QUEUED',
    format: 'PDF',
};

describe('ExportsService', () => {
    let service: ExportsService;
    let exportsRepo: any;
    let pdfQueue: any;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ExportsService,
                {
                    provide: getRepositoryToken(Export),
                    useValue: {
                        create: jest.fn().mockImplementation((dto) => ({ ...dto, id: 'export-1' })),
                        save: jest.fn().mockResolvedValue(mockExport),
                        update: jest.fn(),
                        findOne: jest.fn(),
                    },
                },
                {
                    provide: RentalsService,
                    useValue: {
                        getRentalById: jest.fn(),
                        verifyAccess: jest.fn(),
                    },
                },
                {
                    provide: IntegrityService,
                    useValue: {
                        verifyRentalTimeline: jest.fn(),
                    },
                },
                {
                    provide: getQueueToken('pdf-exports'),
                    useValue: {
                        add: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<ExportsService>(ExportsService);
        exportsRepo = module.get(getRepositoryToken(Export));
        pdfQueue = module.get(getQueueToken('pdf-exports'));
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('createExport', () => {
        it('should create an export record and queue a job', async () => {
            const createDto = {
                rental_id: 'rental-1',
                format: 'PDF',
            };

            const result = await service.createExport(createDto, 'user-1');

            expect(exportsRepo.create).toHaveBeenCalled();
            expect(exportsRepo.save).toHaveBeenCalled();
            expect(pdfQueue.add).toHaveBeenCalledWith('generate-pdf', expect.anything());
            expect(result.id).toEqual('export-1');
        });
    });
});
