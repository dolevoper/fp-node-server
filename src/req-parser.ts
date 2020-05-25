import { Func, identity } from './utils';
import * as Maybe from './maybe';
import { IncomingMessage } from 'http';

interface ParsingState<T> {
    remainingPathParts: string[];
    res: T;
}

export interface Parser<T, U> {
    run(state: ParsingState<T>): ParsingState<U>[];
    // run(state: ParsingState<T>): T extends Func<any, infer V> ? ParsingState<V>[] : ParsingState<U>[];
    slash<V>(nextParser: T extends Func<any, infer W> ? Parser<W, V> : Parser<U, V>): Parser<T, V>;
    // slash<V>(
    //     nextParser: T extends Func<infer X, infer W> ? Parser<W, V> : Parser<U, V>
    // ): T extends Func<infer X, infer W> ? Parser<Func<T, W>, V> : Parser<T, V>;
    // slash<V>(
    //     nextParser: U extends Func<infer W, infer X> ? Parser<Func<W, X>, X> : Parser<U, V>
    // ): T extends Func<infer W, U> ? Parser<Func<W, U>, V> : Parser<T, V>;
}

function parser<T, U>(run: Func<ParsingState<T>, ParsingState<U>[]>): Parser<T, U> {
    return {
        run,
        slash(nextParser) {
            return parser(state => run(state).flatMap(s => nextParser.run(s)));
        }
    };
}

// export function slash<T, U, V>(parseBefore: Parser<T, U>, parseAfter: Parser<U, V>): Parser<T, V> {
export function slash<T, U, V>(
    parseBefore: Parser<Func<T, U>, U>,
    parseAfter: Parser<U, V>
): Parser<Func<T, U>, V> {
    return parser(state => parseBefore.run(state).flatMap(s => parseAfter.run(s)));
}

export function str<T>(): Parser<Func<string, T>, T> {
    return parser(({ remainingPathParts, res }) => {
        if (!remainingPathParts.length) return [];

        const [next, ...rest] = remainingPathParts;

        return [{
            remainingPathParts: rest,
            res: res(next)
        }];
    });
}

export function int<T>(): Parser<Func<number, T>, T> {
    return parser(({ remainingPathParts, res }) => {
        if (!remainingPathParts.length) return [];

        const [next, ...rest] = remainingPathParts;

        const num = Number(next);

        return isNaN(num) ? [] : [{
            remainingPathParts: rest,
            res: res(num)
        }];
    });
}

export function s<T>(str: string): Parser<T, T> {
    return parser(({ remainingPathParts, res }) => {
        if (!remainingPathParts.length) return [];

        const [next, ...rest] = remainingPathParts;

        if (next !== str) return [];

        return [{
            remainingPathParts: rest,
            res
        }];
    });
}

export function map<T, U>(
    val: T extends Func<infer W, U> ? Func<W, U> : T,
    nextParser: Parser<T extends Func<infer W, U> ? Func<W, U> : T, U>
): Parser<typeof identity, U> {
    return parser(({ remainingPathParts }) => nextParser.run({
        remainingPathParts,
        res: val
    }));
}

export function oneOf<T, U>(parsers: Parser<T, U>[]): Parser<T, U> {
    return parser(state => parsers.flatMap(p => p.run(state)));
}

export function parse<T, U>(parser: Parser<typeof identity, U>, req: IncomingMessage): Maybe.Maybe<U> {
    const initState: ParsingState<typeof identity> = {
        remainingPathParts: preparePath(req.url || ''),
        res: identity
    };

    const possibleStates = parser.run(initState);
    // console.log('possibleStates', possibleStates);
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