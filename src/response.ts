import { Func } from './utils';
import * as Maybe from './maybe';
import * as Task from './task';
import { toJson } from './json';

export interface Response {
    status: number;
    headers: Map<string, string | number | string[]>;
    content: Maybe.Maybe<string>;
}

type TextContentType = 'text/plain' | 'text/html' | 'text/css';

export function text(status: number, content: string, contentType: TextContentType = 'text/plain'): Response {
    return {
        status,
        headers: new Map([
            ['Content-Type', contentType],
            ['Content-Length', content.length.toString()]
        ]),
        content: Maybe.of(content)
    };
}

export function json<T>(status: number): Func<T, Task.Task<string, Response>>;
export function json<T>(status: number, content: T): Task.Task<string, Response>;
export function json<T>(status: number, content?: T): Task.Task<string, Response> | Func<T, Task.Task<string, Response>> {
    const createTask: Func<T, Task.Task<string, Response>> = content => Task.task((reject, resolve) => {
        toJson(content).fold(
            reject,
            contentJson => resolve({
                status,
                headers: new Map([
                    ['Content-Type', 'application/json'],
                    ['Content-Length', contentJson.length.toString()]
                ]),
                content: Maybe.of(contentJson)
            })
        );
    });

    return content ? createTask(content) : createTask;
}