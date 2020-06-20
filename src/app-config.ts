import { Pool, createPool } from 'mysql';
import { Either as E } from '@lib';

export interface AppConfig {
    connectionPool: Pool;
}

export function fromEnv(env: NodeJS.ProcessEnv): E.Either<string, AppConfig> {
    return E.right<string, {}>({})
        .chain(E.assign('host', E.fromNullable('DB_HOST missing in environment variables', env.DB_HOST)))
        .chain(E.assign('user', E.fromNullable('DB_USER missing in environment varaibles', env.DB_USER)))
        .chain(E.assign('password', E.fromNullable('DB_PASSWORD missing in environment varaibles', env.DB_PASSWORD)))
        .chain(E.assign('database', E.fromNullable('DB_SCHEMA_NAME missing in environment varaibles', env.DB_SCHEMA_NAME)))
        .map(({ host, user, password, database }) => {
            const connectionPool = createPool({
                host,
                user,
                password,
                database,
                waitForConnections: true,
                connectionLimit: 10,
                queueLimit: 0
            });
        
            return { connectionPool };
        });
}