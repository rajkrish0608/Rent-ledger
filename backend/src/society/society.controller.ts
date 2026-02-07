import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SocietyService } from './society.service';

@Controller('society')
@UseGuards(JwtAuthGuard)
export class SocietyController {
    constructor(private societyService: SocietyService) { }

    @Get('rentals')
    async getRentals(@Req() req: any) {
        // req.user added by JwtAuthGuard
        return this.societyService.getSocietyRentals(req.user.id);
    }
}
