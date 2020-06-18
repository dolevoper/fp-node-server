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

interface UnknownError {
    readonly type: 'unknownError';
    message: string;
}

export type AppError =
    | DbError
    | UnknownError
    | UserError;

export const dbError = (error: MysqlError): AppError => ({
    type: 'dbError',
    error
});

export const unknownError = (message: string): AppError => ({
    type: 'unknownError',
    message
});

export const userError = (message: string, status = 400): AppError => ({
    type: 'userError',
    message,
    status
});


function fold<T>(onDbError: Func<DbError, T>, onUnknownError: Func<UnknownError, T>, onUserError: Func<UserError, T>): Func<AppError, T>;
function fold<T>(onDbError: Func<DbError, T>, onUnknownError: Func<UnknownError, T>, onUserError: Func<UserError, T>, error: AppError): T;
function fold<T>(onDbError: Func<DbError, T>, onUnknownError: Func<UnknownError, T>, onUserError: Func<UserError, T>, error?: AppError): T | Func<AppError, T> {
    const innerFold: Func<AppError, T> = error => {
        switch (error.type) {
            case 'dbError': return onDbError(error);
            case 'unknownError': return onUnknownError(error);
            case 'userError': return onUserError(error);
        }
    };

    return error ? innerFold(error) : innerFold;
}

export const toResponse = fold(
    _ => Response.text(500, 'oops, something went wrong'),
    _ => Response.text(500, 'oops, something went wrong'),
    err => Response.text(err.status, err.message)
);