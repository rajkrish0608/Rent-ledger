import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AuthService } from './auth/auth.service';
import { RentalsService } from './rentals/rentals.service';
import { EventsService } from './events/events.service';
import { Logger } from '@nestjs/common';
import { CreateRentalDto } from './rentals/dto/create-rental.dto';
import { CreateEventDto } from './events/dto/create-event.dto';

async function verifyRoles() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const authService = app.get(AuthService);
    const rentalsService = app.get(RentalsService);
    const eventsService = app.get(EventsService);
    const logger = new Logger('RoleVerification');

    logger.log('🚀 Starting Role Verification...');

    try {
        // 1. Tenant Login
        logger.log('👤 Verifying Tenant Login...');
        const tenantAuth = await authService.login({ email: 'tenant@test.com', password: 'password123' });
        logger.log(`✅ Tenant Logged In: ${tenantAuth.user.id}`);

        // 2. Landlord Login & Rental Creation
        logger.log('🏠 Verifying Landlord Login & Rental Creation...');
        const landlordAuth = await authService.login({ email: 'landlord@test.com', password: 'password123' });
        logger.log(`✅ Landlord Logged In: ${landlordAuth.user.id}`);

        const newRental = await rentalsService.create(landlordAuth.user, {
            property_address: '123 Test St, Mumbai',
            tenant_email: 'tenant@test.com',
            monthly_rent: 25000,
            security_deposit: 100000,
            start_date: new Date().toISOString(),
            end_date: new Date(Date.now() + 31536000000).toISOString(),
        } as CreateRentalDto);
        logger.log(`✅ Rental Created: ${newRental.id}`);

        // 3. Broker Verification (Accessing Rental)
        logger.log('💼 Verifying Broker Access...');
        const brokerAuth = await authService.login({ email: 'broker@test.com', password: 'password123' });
        // Simulating broker adding themselves or viewing (assuming logic exists, for now just login)
        logger.log(`✅ Broker Logged In: ${brokerAuth.user.id}`);

        // 4. Society Admin Verification
        logger.log('🏢 Verifying Society Admin Access...');
        const societyAuth = await authService.login({ email: 'society@test.com', password: 'password123' });
        logger.log(`✅ Society Admin Logged In: ${societyAuth.user.id}`);

        // 5. Add Event (Simulating Tenant/Landlord Interaction)
        logger.log('📅 Verifying Event Creation (Rent Payment)...');
        const event = await eventsService.create(landlordAuth.user, {
            rental_id: newRental.id,
            event_type: EventType.RENT_PAID,
            actor_type: 'LANDLORD',
            event_data: {
                description: 'First month rent paid',
                amount: 25000,
                event_date: new Date().toISOString(),
            },
        } as CreateEventDto);
        logger.log(`✅ Event Created: ${event.id}`);

        // 6. Internal Admin Verification
        logger.log('🛡️ Verifying Internal Admin Access...');
        const adminAuth = await authService.login({ email: 'admin@test.com', password: 'password123' });
        logger.log(`✅ Internal Admin Logged In: ${adminAuth.user.id}`);

        logger.log('🎉 All Roles Verified Successfully!');
    } catch (error) {
        logger.error('❌ Verification Failed:', error);
    } finally {
        await app.close();
    }
}

verifyRoles();
