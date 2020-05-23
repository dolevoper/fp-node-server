import { Func } from './utils';
import * as Maybe from './maybe';
import * as State from './state';

type Parser<T> =  State.State<string[], Maybe.Maybe<T>>;

export function str(): Parser<string> {
    return State.get<string[]>().chain(parts => State
        .put(parts.slice(1))
        .chain(() => State.of(Maybe.fromNullable(parts[0]))));
}

export function s(expectedPart: string): Parser<void> {
    return State.get<string[]>().chain(parts => State
            .put(parts.slice(1))
            .chain(() => State.of(parts[0] === expectedPart ? Maybe.of(undefined) : Maybe.empty())));
}

export function slash<T, U>(parser: Parser<T>): Func<Maybe.Maybe<void>, Parser<T>>;
export function slash<T, U>(parser: Parser<T>): Func<Maybe.Maybe<U>, Parser<[U, T]>>;
export function slash<T, U>(parser: Parser<T>): Func<Maybe.Maybe<U | undefined>, Parser<[U, T] | T>> {
    return m1 => parser.map(m2 => m1.fold(
        v1 => m2.fold(v2 => Maybe.of<[U, T] | T>(v1 ? [v1, v2] : v2), Maybe.empty),
        Maybe.empty
    ));
}

export function parse<T>(path: string, parser: Parser<T>): Maybe.Maybe<T> {
    const withoutLeadingSlash = path.startsWith('/') ? path.substr(1) : path;
    const withoutTrailingSlash = withoutLeadingSlash.endsWith('/') ?
        withoutLeadingSlash.substr(0, withoutLeadingSlash.length - 1) :
        withoutLeadingSlash;
    const parts = withoutTrailingSlash.split('/');

    return parser.evalWith(parts);
}