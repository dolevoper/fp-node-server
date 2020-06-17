import { ServerResponse } from 'http';
import { Func, Maybe as M, Either as E, TaskEither as TE, Task as T } from '@lib';
import { toJson } from './json';

export interface Response {
    status: number;
    headers: Map<string, string | number | string[]>;
    content: M.Maybe<string>;
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
        content: M.of(content)
    });

    return content ? createResponse(content) : createResponse;
}

export function json<T>(status: number): Func<T, Response>;
export function json<T>(status: number, content: T): Response;
export function json<T>(status: number, content?: T): Response | Func<T, Response> {
    const createTask: Func<T, Response> = content => toJson(content)
        .fold(
            err => text(500, 'oops, something went wrong'),
            contentJson => ({
                status,
                headers: new Map([
                    ['Content-Type', 'application/json'],
                    ['Content-Length', contentJson.length.toString()]
                ]),
                content: M.of(contentJson)
            })
        );

    return content ? createTask(content) : createTask;
}

export function createSender(res: ServerResponse): Func<Response, T.Task<void>> {
    return response => {
        return T.task(resolve => {
            res.statusCode = response.status;
    
            response.headers.forEach((value, key) => res.setHeader(key, value));
    
            try {
                response.content.fold(
                    () => { },
                    content => res.write(content)
                );
    
                res.end(resolve);
            } catch (err) {
                console.error('failed to send response');
                resolve();
            }
        });
    }
}