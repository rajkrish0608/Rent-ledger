import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeOrmConfig } from './config/typeorm.config';
import { AuthModule } from './auth/auth.module';
import { IntegrityModule } from './integrity/integrity.module';
import { RentalsModule } from './rentals/rentals.module';
import { EventsModule } from './events/events.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: '.env',
        }),
        TypeOrmModule.forRootAsync({
            useFactory: () => typeOrmConfig,
        }),
        AuthModule,
        IntegrityModule,
        RentalsModule,
        EventsModule,
    ],
    controllers: [],
    providers: [],
})
export class AppModule { }
