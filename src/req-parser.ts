import { IncomingMessage } from 'http';
import { Func, identity } from './utils';
import * as Maybe from './maybe';

interface ParsingState<T> {
    remainingPathParts: string[];
    method?: string;
    res: T;
}

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'OPTIONS' | 'DELETE';

export interface Parser<T, U> {
    run(state: ParsingState<T>): ParsingState<U>[];
    slash<V>(nextParser: Parser<U, V>): Parser<T, V>;
}

function parser<T, U>(run: Func<ParsingState<T>, ParsingState<U>[]>): Parser<T, U> {
    return {
        run,
        slash(nextParser) {
            return parser(state => run(state).flatMap(nextParser.run));
        }
    };
}

export function str<T>(): Parser<Func<string, T>, T> {
    return parser(({ remainingPathParts, method, res }) => {
        if (!remainingPathParts.length) return [];

        const [next, ...rest] = remainingPathParts;

        return [{
            remainingPathParts: rest,
            method,
            res: res(next)
        }];
    });
}

export function int<T>(): Parser<Func<number, T>, T> {
    return parser(({ remainingPathParts, method, res }) => {
        if (!remainingPathParts.length) return [];

        const [next, ...rest] = remainingPathParts;

        const num = Number(next);

        return isNaN(num) ? [] : [{
            remainingPathParts: rest,
            method,
            res: res(num)
        }];
    });
}

export function s<T>(str: string): Parser<T, T> {
    return parser(({ remainingPathParts, method, res }) => {
        if (!remainingPathParts.length) return [];

        const [next, ...rest] = remainingPathParts;

        if (next !== str) return [];

        return [{
            remainingPathParts: rest,
            method,
            res
        }];
    });
}

export function all<T, U>(
    val: T extends Func<infer W, U> ? Func<W, U> : T,
    nextParser: Parser<T extends Func<infer W, U> ? Func<W, U> : T, U>
): Parser<typeof identity, U> {
    return parser(({ remainingPathParts, method }) => nextParser.run({
        remainingPathParts,
        method,
        res: val
    }));
}

function method<T>(m: HttpMethod): Parser<T, T> {
    return parser(({ remainingPathParts, method, res }) => {
        if (method !== m) return [];

        return [{
            remainingPathParts,
            method,
            res
        }];
    });
}

export function get<T, U>(
    val: T extends Func<infer W, U> ? Func<W, U> : T,
    nextParser: Parser<T extends Func<infer W, U> ? Func<W, U> : T, U>
): Parser<typeof identity, U> {
    return all(val, method('GET').slash(nextParser));
}

export function post<T, U>(
    val: T extends Func<infer W, U> ? Func<W, U> : T,
    nextParser: Parser<T extends Func<infer W, U> ? Func<W, U> : T, U>
): Parser<typeof identity, U> {
    return all(val, method('POST').slash(nextParser));
}

export function put<T, U>(
    val: T extends Func<infer W, U> ? Func<W, U> : T,
    nextParser: Parser<T extends Func<infer W, U> ? Func<W, U> : T, U>
): Parser<typeof identity, U> {
    return all(val, method('PUT').slash(nextParser));
}

export function patch<T, U>(
    val: T extends Func<infer W, U> ? Func<W, U> : T,
    nextParser: Parser<T extends Func<infer W, U> ? Func<W, U> : T, U>
): Parser<typeof identity, U> {
    return all(val, method('PATCH').slash(nextParser));
}

export function del<T, U>(
    val: T extends Func<infer W, U> ? Func<W, U> : T,
    nextParser: Parser<T extends Func<infer W, U> ? Func<W, U> : T, U>
): Parser<typeof identity, U> {
    return all(val, method('DELETE').slash(nextParser));
}

export function options<T, U>(
    val: T extends Func<infer W, U> ? Func<W, U> : T,
    nextParser: Parser<T extends Func<infer W, U> ? Func<W, U> : T, U>
): Parser<typeof identity, U> {
    return all(val, method('OPTIONS').slash(nextParser));
}

export function oneOf<T, U>(parsers: Parser<T, U>[]): Parser<T, U> {
    return parser(state => parsers.flatMap(p => p.run(state)));
}

export function parse<T, U>(parser: Parser<typeof identity, U>, req: IncomingMessage): Maybe.Maybe<U> {
    const initState: ParsingState<typeof identity> = {
        remainingPathParts: preparePath(req.url || ''),
        method: req.method,
        res: identity
    };

    const possibleStates = parser.run(initState);
    const match = possibleStates.find(state => !state.remainingPathParts.length);

    return match ? Maybe.of(match.res) : Maybe.empty();
}

function preparePath(path: string): string[] {
    const [first, ...rest] = path.split('/');

    return first === '' ?
        removeTailIfEmpty(rest) :
        removeTailIfEmpty([first, ...rest]);
}

function removeTailIfEmpty(parts: string[]): string[] {
    return parts[parts.length - 1] === '' ? parts.slice(0, parts.length - 1) : parts;
}