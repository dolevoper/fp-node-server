import { MysqlError } from 'mysql';
import { Func } from '@lib';
import { Response } from '@fw';

interface DbError {
    readonly type: 'dbError';
    error: MysqlError;
}

interface UserError {
    readonly type: 'userError';
    message: string;
    status: number;
}

export type AppError =
    | DbError
    | UserError;

export const dbError = (error: MysqlError): AppError => ({
    type: 'dbError',
    error
});

export const userError = (status: number) => (message: string): AppError => ({
    type: 'userError',
    message,
    status
});


function fold<T>(onDbError: Func<DbError, T>, onUserError: Func<UserError, T>): Func<AppError, T>;
function fold<T>(onDbError: Func<DbError, T>, onUserError: Func<UserError, T>, error: AppError): T;
function fold<T>(onDbError: Func<DbError, T>, onUserError: Func<UserError, T>, error?: AppError): T | Func<AppError, T> {
    const innerFold: Func<AppError, T> = error => {
        switch (error.type) {
            case 'dbError': return onDbError(error);
            case 'userError': return onUserError(error);
        }
    };

    return error ? innerFold(error) : innerFold;
}

export const message = fold(
    err => err.error.message,
    err => err.message,
);

export const status = fold(
    _ => 500,
    err => err.status
);

export const toResponse = fold(
    _ => Response.text(500, 'oops, something went wrong'),
    err => Response.text(err.status, err.message)
);