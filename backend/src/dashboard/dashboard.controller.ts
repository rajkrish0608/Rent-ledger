import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
    constructor(private dashboardService: DashboardService) { }

    @Get('stats')
    async getStats(@Req() req: any) {
        // req.user added by JwtAuthGuard
        return this.dashboardService.getBrokerStats(req.user.id);
    }

    @Get('disputes')
    async getDisputes(@Req() req: any) {
        return this.dashboardService.getDisputeRentals(req.user.id);
    }
}
