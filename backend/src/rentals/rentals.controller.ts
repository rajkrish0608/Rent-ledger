import { Controller, Post, Get, Body, Param, Query, UseGuards, Request, Inject, forwardRef } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RentalsService } from './rentals.service';
import { CreateRentalDto } from './dto/create-rental.dto';
import { IntegrityService } from '../integrity/integrity.service';
import { EventsService } from '../events/events.service';

@Controller('rentals')
@UseGuards(JwtAuthGuard)
export class RentalsController {
    constructor(
        private readonly rentalsService: RentalsService,
        private readonly integrityService: IntegrityService,
        @Inject(forwardRef(() => EventsService))
        private readonly eventsService: EventsService,
    ) { }

    @Post()
    async createRental(@Body() createDto: CreateRentalDto, @Request() req: any) {
        return this.rentalsService.createRental(createDto, req.user.id);
    }

    @Get()
    async getMyRentals(@Request() req: any) {
        return this.rentalsService.getRentalsByUser(req.user.id);
    }

    @Get(':id')
    async getRental(@Param('id') id: string, @Request() req: any) {
        return this.rentalsService.getRentalById(id, req.user.id);
    }

    @Post(':id/close')
    async closeRental(@Param('id') id: string, @Request() req: any) {
        return this.rentalsService.closeRental(id, req.user.id);
    }

    @Get(':id/verify')
    async verifyIntegrity(@Param('id') id: string, @Request() req: any) {
        // Verify user has access first
        await this.rentalsService.verifyAccess(id, req.user.id);
        return this.integrityService.verifyEventChain(id);
    }

    @Get(':id/search')
    async searchTimeline(@Param('id') id: string, @Query('q') query: string, @Request() req: any) {
        return this.eventsService.searchTimeline(id, req.user.id, query);
    }
}
