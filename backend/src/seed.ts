import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AuthService } from './auth/auth.service';
import { Logger } from '@nestjs/common';
import { Repository } from 'typeorm';
import { User } from './users/entities/user.entity';
import { getRepositoryToken } from '@nestjs/typeorm';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const authService = app.get(AuthService);
    const usersRepository = app.get<Repository<User>>(getRepositoryToken(User));
    const logger = new Logger('Seeder');

    const testUsers = [
        {
            email: 'tenant@test.com',
            password: 'password123',
            name: 'Test Tenant',
            role: 'TENANT',
        },
        {
            email: 'landlord@test.com',
            password: 'password123',
            name: 'Test Landlord',
            role: 'LANDLORD',
        },
        {
            email: 'broker@test.com',
            password: 'password123',
            name: 'Test Broker',
            role: 'BROKER',
        },
        {
            email: 'society@test.com',
            password: 'password123',
            name: 'Test Society Admin',
            role: 'SOCIETY_ADMIN',
        },
        {
            email: 'admin@test.com',
            password: 'password123',
            name: 'Test Internal Admin',
            role: 'INTERNAL_ADMIN',
        },
    ];

    logger.log('Seeding test users...');

    for (const userData of testUsers) {
        const existingUser = await usersRepository.findOne({ where: { email: userData.email } });

        if (existingUser) {
            logger.log(`User ${userData.email} already exists. Skipping.`);
        } else {
            logger.log(`Creating user ${userData.email}...`);
            await authService.register({
                email: userData.email,
                password: userData.password,
                name: userData.name,
                role: userData.role as any, // Cast to any to bypass strict DTO check for INTERNAL_ADMIN
            });
            logger.log(`User ${userData.email} created successfully.`);
        }
    }

    logger.log('Seeding complete.');
    await app.close();
}

bootstrap();
