import * as Maybe from './maybe';

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