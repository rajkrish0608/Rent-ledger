import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeOrmConfig } from './config/typeorm.config';
import { AuthModule } from './auth/auth.module';
import { IntegrityModule } from './integrity/integrity.module';
import { RentalsModule } from './rentals/rentals.module';
import { EventsModule } from './events/events.module';
import { ExportsModule } from './exports/exports.module';
import { MediaModule } from './media/media.module';
import { DashboardModule } from './dashboard/dashboard.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: '.env',
        }),
        TypeOrmModule.forRootAsync({
            useFactory: () => ({
                ...typeOrmConfig,
                entities: [],
                autoLoadEntities: true,
            }),
        }),
        AuthModule,
        IntegrityModule,
        RentalsModule,
        EventsModule,
        ExportsModule,
        MediaModule,
        DashboardModule,
    ],
    controllers: [],
    providers: [],
})
export class AppModule { }
