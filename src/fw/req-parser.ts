import { IncomingMessage } from 'http';
import qs from 'querystring';
import { identity, FunctionN } from 'fp-ts/lib/function';
import { Option, some, none } from 'fp-ts/lib/Option';
import * as Q from './query-parser';

interface ParsingState<T> {
    remainingPathParts: string[];
    method?: string;
    query: qs.ParsedUrlQuery;
    res: T;
}

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'OPTIONS' | 'DELETE';

export interface Parser<T, U> {
    run(state: ParsingState<T>): ParsingState<U>[];
    slash<V>(nextParser: Parser<U, V>): Parser<T, V>;
    q(queryParser: U extends FunctionN<[infer V], any> ? Q.Parser<V> : never): U extends FunctionN<[any], infer W> ? Parser<T, W> : never;
}

function parser<T, U>(run: FunctionN<[ParsingState<T>], ParsingState<U>[]>): Parser<T, U> {
    function slash<V>(nextParser: Parser<U, V>): Parser<T, V> {
        return parser(state => run(state).flatMap(nextParser.run));
    }

    return {
        run,
        slash,
        q(queryParser) {
            const nextParser: unknown = query(queryParser);

            return slash(nextParser as Parser<U, unknown>) as U extends FunctionN<[any], infer W> ? Parser<T, W> : never;
        }
    };
}

function query<T, U>(queryParser: Q.Parser<T>): Parser<FunctionN<[T], U>, U> {
    return parser(({ remainingPathParts, method, query, res }) => [{
        remainingPathParts,
        method,
        query,
        res: res(queryParser(query))
    }]);
}

export function str<T>(): Parser<FunctionN<[string], T>, T> {
    return parser(({ remainingPathParts, method, query, res }) => {
        if (!remainingPathParts.length) return [];

        const [next, ...rest] = remainingPathParts;

        return [{
            remainingPathParts: rest,
            method,
            query,
            res: res(next)
        }];
    });
}

export function int<T>(): Parser<FunctionN<[number], T>, T> {
    return parser(({ remainingPathParts, method, query, res }) => {
        if (!remainingPathParts.length) return [];

        const [next, ...rest] = remainingPathParts;

        const num = Number(next);

        return isNaN(num) ? [] : [{
            remainingPathParts: rest,
            method,
            query,
            res: res(num)
        }];
    });
}

export function s<T>(str: string): Parser<T, T> {
    return parser(({ remainingPathParts, method, query, res }) => {
        if (!remainingPathParts.length) return [];

        const [next, ...rest] = remainingPathParts;

        if (next !== str) return [];

        return [{
            remainingPathParts: rest,
            method,
            query,
            res
        }];
    });
}

export function rest<T>(): Parser<T, T> {
    return parser(({ method, query, res }) => [{
        remainingPathParts: [],
        method,
        query,
        res
    }]);
}

export function from<T>(value: T): Parser<any, T> {
    return parser(({ remainingPathParts, method, query }) => [({
        remainingPathParts,
        method,
        query,
        res: value
    })]);
}

export function method<T>(m: HttpMethod): Parser<T, T> {
    return parser(state => {
        if (state.method !== m) return [];

        return [state];
    });
}

export function get<T>(): Parser<T, T> {
    return method('GET');
}

export function post<T>(): Parser<T, T> {
    return method('POST');
}

export function put<T>(): Parser<T, T> {
    return method('PUT');
}

export function patch<T>(): Parser<T, T> {
    return method('PATCH');
}

export function del<T>(): Parser<T, T> {
    return method('DELETE');
}

export function options<T>(): Parser<T, T> {
    return method('OPTIONS');
}

export function oneOf<T, U>(parsers: Parser<T, U>[]): Parser<T, U> {
    return parser(state => parsers.flatMap(p => p.run(state)));
}

export function parse<T>(parser: Parser<typeof identity, T>, req: IncomingMessage): Option<T> {
    const [path, query] = (req.url || '').split('?');

    const initState: ParsingState<typeof identity> = {
        remainingPathParts: preparePath(path),
        method: req.method,
        query: qs.parse(query),
        res: identity
    };

    const possibleStates = parser.run(initState);
    const match = possibleStates.find(state => !state.remainingPathParts.length);

    return match ? some(match.res) : none;
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