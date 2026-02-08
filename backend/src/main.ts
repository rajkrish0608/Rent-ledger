import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import helmet from 'helmet';
import * as dns from 'dns';

// AGGRESSIVE FIX: Force IPv4 for all network connections
// This is necessary because Render's network doesn't support IPv6 routes to Supabase
const originalLookup = dns.lookup;
// @ts-ignore
dns.lookup = (hostname, options, callback) => {
    if (typeof options === 'function') {
        callback = options;
        options = { family: 4 };
    } else if (typeof options === 'number') {
        options = { family: options };
    } else {
        options = options || {};
    }
    options.family = 4;
    return originalLookup(hostname, options, callback);
};

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    // Security Headers
    app.use(helmet());

    // Global validation pipe
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
        }),
    );

    // CORS
    app.enableCors({
        origin: true,
        credentials: true,
    });

    // Global prefix
    app.setGlobalPrefix('api');

    const port = process.env.PORT || 3000;
    await app.listen(port);

    console.log(`🚀 RentLedger Backend running on: http://localhost:${port}/api`);
}

bootstrap();
