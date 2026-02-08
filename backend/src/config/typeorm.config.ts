import { DataSource, DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';
import { User } from '../users/entities/user.entity';
import { RefreshToken } from '../auth/entities/refresh-token.entity';

dotenv.config();

console.log(`📡 Database Config: Host=${process.env.DB_HOST} Port=${process.env.DB_PORT} User=${process.env.DB_USERNAME} DB=${process.env.DB_NAME} SSL=${process.env.NODE_ENV === 'production'}`);

// Explicitly construct the connection object to avoid any "url" parsing magic
const connectionOptions: DataSourceOptions = {
    type: 'postgres',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'postgres',
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    migrations: [__dirname + '/../migrations/*{.ts,.js}'],
    synchronize: false,
    migrationsRun: process.env.NODE_ENV === 'production',
    logging: true,
    // Supabase requires SSL, even for the pooler
    ssl: { rejectUnauthorized: false },
    extra: {
        family: 4, // Force IPv4
    }
};

export const typeOrmConfig = connectionOptions;

const dataSource = new DataSource(typeOrmConfig);
export default dataSource;
