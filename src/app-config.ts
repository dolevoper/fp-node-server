import { Pool, createPool } from 'mysql';
import { Either as E } from '@lib';

export interface AppConfig {
    connectionPool: Pool;
}

function doBlock(fn: () => Generator<E.Either<string, string>, AppConfig, string>): E.Either<string, AppConfig> {
    const run = (gen: Generator<E.Either<string, string>, AppConfig, string>, next: string | null): E.Either<string, AppConfig> => {
        const it = next ? gen.next(next) : gen.next();

        if (it.done) return E.right(it.value);

        return it.value.fold(
            err => E.left(err),
            value => run(gen, value)
        );
    }

    return run(fn(), null);
}

export function fromEnv(env: NodeJS.ProcessEnv): E.Either<string, AppConfig> {
    return doBlock(function* () {
        const host = yield E.fromNullable('DB_HOST missing in environment variables', env.DB_HOST);
        const user = yield E.fromNullable('DB_USER missing in environment varaibles', env.DB_USER);
        const password = yield E.fromNullable('DB_PASSWORD missing in environment varaibles', env.DB_PASSWORD);
        const database = yield E.fromNullable('DB_SCHEMA_NAME missing in environment varaibles', env.DB_SCHEMA_NAME);

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