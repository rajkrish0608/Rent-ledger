import { Controller, Post, Get, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';

@Controller('events')
@UseGuards(JwtAuthGuard)
export class EventsController {
    constructor(private readonly eventsService: EventsService) { }

    @Post()
    async createEvent(@Body() createDto: CreateEventDto, @Request() req: any) {
        return this.eventsService.createEvent(createDto, req.user.id);
    }

    @Get('rental/:rentalId')
    async getEventsByRental(
        @Param('rentalId') rentalId: string,
        @Query('page') page: number = 1,
        @Query('limit') limit: number = 20,
        @Request() req: any,
    ) {
        return this.eventsService.getEventsByRental(rentalId, req.user.id, page, limit);
    }

    @Get(':id')
    async getEvent(@Param('id') id: string, @Request() req: any) {
        return this.eventsService.getEventById(id, req.user.id);
    }
}
