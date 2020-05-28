import { ServerResponse } from 'http';
import { Func } from './utils';
import * as Maybe from './maybe';
import * as Either from './either';
import * as Task from './task';
import { toJson } from './json';

export interface Response {
    status: number;
    headers: Map<string, string | number | string[]>;
    content: Maybe.Maybe<string>;
}

type TextContentType = 'text/plain' | 'text/html' | 'text/css';

export function text(status: number): Func<string, Response>;
export function text(status: number, content: string): Response;
export function text(status: number, content: string, contentType: TextContentType): Response;
export function text(status: number, content?: string, contentType: TextContentType = 'text/plain'): Response | Func<string, Response> {
    const createResponse: Func<string, Response> = content => ({
        status,
        headers: new Map([
            ['Content-Type', contentType],
            ['Content-Length', content.length.toString()]
        ]),
        content: Maybe.of(content)
    });

    return content ? createResponse(content) : createResponse;
}

export function json<T>(status: number): Func<T, Either.Either<string, Response>>;
export function json<T>(status: number, content: T): Either.Either<string, Response>;
export function json<T>(status: number, content?: T): Either.Either<string, Response> | Func<T, Either.Either<string, Response>> {
    const createTask: Func<T, Either.Either<string, Response>> = content =>
        toJson(content).map(contentJson => ({
            status,
            headers: new Map([
                ['Content-Type', 'application/json'],
                ['Content-Length', contentJson.length.toString()]
            ]),
            content: Maybe.of(contentJson)
        }));

    return content ? createTask(content) : createTask;
}

export function createSender(res: ServerResponse): Func<Response, Task.Task<string, void>> {
    return response => {
        return Task.task((reject, resolve) => {
            res.statusCode = response.status;
    
            response.headers.forEach((value, key) => res.setHeader(key, value));
    
            try {
                response.content.fold(
                    content => res.write(content),
                    () => { }
                );
    
                res.end(resolve);
            } catch (err) {
                reject(err);
            }
        });
    }
}