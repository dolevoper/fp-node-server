import { ServerResponse } from 'http';
import { FunctionN, pipe } from 'fp-ts/lib/function';
import * as O from 'fp-ts/lib/Option';
import * as E from 'fp-ts/lib/Either';
import * as IO from 'fp-ts/lib/IOEither';

export interface Response {
    status: number;
    headers: Map<string, string | number | string[]>;
    content: O.Option<string>;
}

type TextContentType = 'text/plain' | 'text/html' | 'text/css';

export function text(status: number): FunctionN<[string], Response>;
export function text(status: number, content: string): Response;
export function text(status: number, content: string, contentType: TextContentType): Response;
export function text(status: number, content?: string, contentType: TextContentType = 'text/plain'): Response | FunctionN<[string], Response> {
    const createResponse: FunctionN<[string], Response> = content => ({
        status,
        headers: new Map([
            ['Content-Type', contentType],
            ['Content-Length', content.length.toString()]
        ]),
        content: O.some(content)
    });

    return content ? createResponse(content) : createResponse;
}

export function json<T>(status: number): FunctionN<[T], E.Either<string, Response>>;
export function json<T>(status: number, content: T): E.Either<string, Response>;
export function json<T>(status: number, content?: T): E.Either<string, Response> | FunctionN<[T], E.Either<string, Response>> {
    const tryToStringify: FunctionN<[T], E.Either<string, Response>> = content =>
        pipe(
            E.stringifyJSON(content, E.toError),
            E.bimap(
                err => err.message,
                contentJson => ({
                    status,
                    headers: new Map([
                        ['Content-Type', 'application/json'],
                        ['Content-Length', contentJson.length.toString()]
                    ]),
                    content: O.some(contentJson)
                })
            )
        );

    return content ? tryToStringify(content) : tryToStringify;
}

export function createSender(res: ServerResponse): FunctionN<[Response], IO.IOEither<string, void>> {
    return response => pipe(
        IO.tryCatch<Error, void>(() => {
            res.statusCode = response.status;

            response.headers.forEach((value, key) => res.setHeader(key, value));

            O.fold(
                () => { },
                content => res.write(content)
            )(response.content);

            res.end();
        }, E.toError),
        IO.mapLeft(err => err.message)
    );
}