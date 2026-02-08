import { DataSource, DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';
import { User } from '../users/entities/user.entity';
import { RefreshToken } from '../auth/entities/refresh-token.entity';

dotenv.config();

export const typeOrmConfig: DataSourceOptions = {
    type: 'postgres',
    // Prioritize individual variables to avoid URL parsing issues with special characters (@ in password)
    host: process.env.DB_HOST || (process.env.DATABASE_URL ? undefined : 'localhost'),
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : (process.env.DATABASE_URL ? undefined : 5432),
    username: process.env.DB_USERNAME || (process.env.DATABASE_URL ? undefined : 'rentledger_admin'),
    password: process.env.DB_PASSWORD || (process.env.DATABASE_URL ? undefined : 'dev_password'),
    database: process.env.DB_NAME || (process.env.DATABASE_URL ? undefined : 'postgres'),
    url: (process.env.DB_HOST) ? undefined : process.env.DATABASE_URL,
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    migrations: [__dirname + '/../migrations/*{.ts,.js}'],
    synchronize: false, // Security: Never sync in prod/remotely
    logging: true, // Keep logging on for verification
    ssl: (process.env.DB_HOST?.includes('supabase.') || process.env.DATABASE_URL?.includes('supabase.') || process.env.NODE_ENV === 'production')
        ? { rejectUnauthorized: false }
        : false,
    extra: {
        family: 4, // Force IPv4 (node-postgres) to prevent ENETUNREACH on Render
    }
};

const dataSource = new DataSource(typeOrmConfig);
export default dataSource;
