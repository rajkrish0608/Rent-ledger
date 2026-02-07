import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { LegalService } from './legal.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@Controller('legal')
export class LegalController {
    constructor(private readonly legalService: LegalService) { }

    @Get('terms')
    getTerms() {
        return { content: this.legalService.getTermsOfService() };
    }

    @Get('privacy')
    getPrivacy() {
        return { content: this.legalService.getPrivacyPolicy() };
    }

    @Get('65b-certificate')
    @UseGuards(JwtAuthGuard)
    getCertificate(@CurrentUser() user: User, @Query('documentId') documentId: string) {
        const certificate = this.legalService.generateSection65BStatement(
            user.name,
            documentId,
            new Date(),
        );
        return { certificate };
    }
}
