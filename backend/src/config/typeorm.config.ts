import { DataSource, DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';
import { User } from '../users/entities/user.entity';
import { RefreshToken } from '../auth/entities/refresh-token.entity';

dotenv.config();

console.log(`📡 Database Attempt: ${process.env.DB_HOST || 'Local/URL'}:${process.env.DB_PORT || '5432'} (SSL: ${process.env.NODE_ENV === 'production' || !!process.env.DB_HOST})`);

export const typeOrmConfig: DataSourceOptions = {
    type: 'postgres',
    // Prioritize individual variables to avoid URL parsing issues with special characters (@ in password)
    ...(process.env.DB_HOST ? {
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT || '5432'),
        username: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME || 'postgres',
    } : {
        url: process.env.DATABASE_URL,
        host: 'localhost',
        port: 5433,
        username: 'rentledger_admin',
        password: 'dev_password',
        database: 'rentledger_dev',
    }),
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    migrations: [__dirname + '/../migrations/*{.ts,.js}'],
    synchronize: false,
    logging: true,
    ssl: (process.env.DB_HOST?.includes('supabase.') || process.env.DATABASE_URL?.includes('supabase.') || process.env.NODE_ENV === 'production')
        ? { rejectUnauthorized: false }
        : false,
    extra: {
        family: 4, // Force IPv4 (node-postgres)
    }
};

const dataSource = new DataSource(typeOrmConfig);
export default dataSource;
