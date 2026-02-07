import { Controller, Post, Body, HttpCode, HttpStatus, Patch, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('register')
    async register(@Body() registerDto: RegisterDto): Promise<AuthResponseDto> {
        return this.authService.register(registerDto);
    }

    @Post('login')
    @HttpCode(HttpStatus.OK)
    async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
        return this.authService.login(loginDto);
    }

    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    async refresh(@Body('refreshToken') refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
        return this.authService.refreshTokens(refreshToken);
    }

    @Post('logout')
    @HttpCode(HttpStatus.OK)
    async logout(@Body('refreshToken') refreshToken: string): Promise<{ message: string }> {
        await this.authService.logout(refreshToken);
        return { message: 'Logged out successfully' };
    }

    @Patch('fcm-token')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    async updateFcmToken(@Body('fcmToken') fcmToken: string, @CurrentUser() user: User): Promise<{ message: string }> {
        await this.authService.updateFcmToken(user.id, fcmToken);
        return { message: 'FCM token updated successfully' };
    }
}
