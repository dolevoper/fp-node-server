import { Pool } from 'mysql';

export interface AppConfig {
    connectionPool: Pool;
}