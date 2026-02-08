import { DataSource, DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';
import { User } from '../users/entities/user.entity';
import { RefreshToken } from '../auth/entities/refresh-token.entity';

dotenv.config();

export const typeOrmConfig: DataSourceOptions = {
    type: 'postgres',
    url: process.env.DATABASE_URL,
    host: process.env.DATABASE_URL ? undefined : (process.env.DB_HOST || 'localhost'),
    port: process.env.DATABASE_URL ? undefined : parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DATABASE_URL ? undefined : (process.env.DB_USERNAME || 'rentledger_admin'),
    password: process.env.DATABASE_URL ? undefined : (process.env.DB_PASSWORD || 'dev_password'),
    database: process.env.DATABASE_URL ? undefined : (process.env.DB_NAME || 'rentledger_dev'),
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    migrations: [__dirname + '/../migrations/*{.ts,.js}'],
    synchronize: false, // Security: Never sync in prod/remotely
    logging: true, // Keep logging on for one more deploy to verify
    ssl: (process.env.DATABASE_URL?.includes('supabase.') || process.env.NODE_ENV === 'production')
        ? { rejectUnauthorized: false }
        : false,
    extra: {
        family: 4, // Force IPv4 (node-postgres) to prevent ENETUNREACH on Render
    }
};

const dataSource = new DataSource(typeOrmConfig);
export default dataSource;
