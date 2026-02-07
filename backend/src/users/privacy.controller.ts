import { Controller, Get, Delete, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from './entities/user.entity';

@Controller('privacy')
@UseGuards(JwtAuthGuard)
export class PrivacyController {
    constructor(private readonly usersService: UsersService) { }

    @Get('export')
    async exportData(@CurrentUser() user: User) {
        return this.usersService.exportUserData(user.id);
    }

    @Delete('delete-account')
    @HttpCode(HttpStatus.NO_CONTENT)
    async deleteAccount(@CurrentUser() user: User) {
        await this.usersService.deleteUser(user.id);
    }
}
