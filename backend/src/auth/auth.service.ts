import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User)
        private usersRepository: Repository<User>,
        @InjectRepository(RefreshToken)
        private refreshTokensRepository: Repository<RefreshToken>,
        private jwtService: JwtService,
    ) { }

    async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
        // Check if user already exists
        const existingUser = await this.usersRepository.findOne({
            where: [
                { email: registerDto.email },
                ...(registerDto.phone ? [{ phone: registerDto.phone }] : []),
            ],
        });

        if (existingUser) {
            throw new ConflictException('User with this email or phone already exists');
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(registerDto.password, 10);

        // Create user
        const user = this.usersRepository.create({
            email: registerDto.email,
            password_hash: hashedPassword,
            name: registerDto.name,
            phone: registerDto.phone,
            role: registerDto.role,
        });

        await this.usersRepository.save(user);

        // Generate tokens
        const { accessToken, refreshToken } = await this.generateTokens(user);

        return new AuthResponseDto(user, accessToken, refreshToken);
    }

    async login(loginDto: LoginDto): Promise<AuthResponseDto> {
        // Find user
        const user = await this.usersRepository.findOne({
            where: { email: loginDto.email },
        });

        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(loginDto.password, user.password_hash);

        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid credentials');
        }

        // Update last login
        user.last_login = new Date();
        await this.usersRepository.save(user);

        // Generate tokens
        const { accessToken, refreshToken } = await this.generateTokens(user);

        return new AuthResponseDto(user, accessToken, refreshToken);
    }

    async refreshTokens(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
        // Find refresh token
        const tokenRecord = await this.refreshTokensRepository.findOne({
            where: { token: refreshToken },
            relations: ['user'],
        });

        if (!tokenRecord) {
            throw new UnauthorizedException('Invalid refresh token');
        }

        // Check if expired
        if (new Date() > tokenRecord.expires_at) {
            await this.refreshTokensRepository.remove(tokenRecord);
            throw new UnauthorizedException('Refresh token expired');
        }

        // Delete old token
        await this.refreshTokensRepository.remove(tokenRecord);

        // Generate new tokens
        const tokens = await this.generateTokens(tokenRecord.user);

        return tokens;
    }

    async logout(refreshToken: string): Promise<void> {
        await this.refreshTokensRepository.delete({ token: refreshToken });
    }

    private async generateTokens(user: User): Promise<{ accessToken: string; refreshToken: string }> {
        const payload = { sub: user.id, email: user.email, role: user.role };

        // Generate access token (15 min)
        const accessToken = this.jwtService.sign(payload, {
            secret: process.env.JWT_SECRET,
            expiresIn: '15m',
        });

        // Generate refresh token (7 days)
        const refreshToken = this.jwtService.sign(payload, {
            secret: process.env.JWT_REFRESH_SECRET,
            expiresIn: '7d',
        });

        // Save refresh token to database
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        const refreshTokenEntity = this.refreshTokensRepository.create({
            user,
            token: refreshToken,
            expires_at: expiresAt,
        });

        await this.refreshTokensRepository.save(refreshTokenEntity);

        return { accessToken, refreshToken };
    }

    async validateUser(userId: string): Promise<User> {
        const user = await this.usersRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new UnauthorizedException('User not found');
        }
        return user;
    }
}
