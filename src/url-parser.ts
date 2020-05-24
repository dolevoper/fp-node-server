import { Func, constant, identity } from './utils';
import * as Maybe from './maybe';

interface ParsingState<T> {
    visited: string[];
    unvisited: string[];
    value: T;
}

interface Parser<T, U> {
    parser(state: ParsingState<T>): ParsingState<U>[];
    slash<V>(parser: Parser<U, V>): Parser<T, V>;
}

function parser<T, U>(p: Func<ParsingState<T>, ParsingState<U>[]>): Parser<T, U> {
    return {
        parser: p,
        slash(parserAfter) {
            return parser(state => p(state).flatMap(parserAfter.parser));
        }
    };
}

export function parse<T>(parser: Parser<Func<T, T>, T>, url: string): Maybe.Maybe<T> {
    const states = parser.parser({
        visited: [],
        unvisited: preparePath(url),
        value: identity
    });

    if (!states.length) return Maybe.empty();

    const firstMatch = states.find(state => !state.unvisited.length || state.unvisited.length === 1 && state.unvisited[0] === '');

    return firstMatch ? Maybe.of(firstMatch.value) : Maybe.empty();
}

function preparePath(path: string): string[] {
    const [first, ...rest] = path.split('/');

    return first === '' ? removeFinalEmpty(rest) : removeFinalEmpty([first, ...rest]);
}

function removeFinalEmpty(parts: string[]): string[] {
    if (!parts.length) return [];

    const [first, ...rest] = parts;

    if (first === '' && !rest.length) return [];

    return [first, ...removeFinalEmpty(rest)];
}

export const str = custom(Maybe.of);

export function s<T>(str: string): Parser<T, T> {
    return parser(({ visited, unvisited, value }) => {
        if (!unvisited.length) return [];

        const [next, ...rest] = unvisited;

        if (next !== str) return [];

        return [{
            visited: [next, ...visited],
            unvisited: rest,
            value
        }];
    });
}

function custom<T, U>(fn: Func<string, Maybe.Maybe<T>>): Parser<Func<T, U>, U> {
    return parser(({ visited, unvisited, value }) => {
        if (!unvisited.length) return [];

        const [next, ...rest] = unvisited;

        return fn(next).fold(
            nextValue => [{ visited: [next, ...visited], unvisited: rest, value: value(nextValue)}],
            constant([])
        );
    });
}