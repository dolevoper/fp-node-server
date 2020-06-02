import { ParsedUrlQuery } from 'querystring';
import { Func, Maybe } from '@lib';

export type Parser<T> = Func<ParsedUrlQuery, T>;

export function str(key: string): Parser<Maybe.Maybe<string>> {
    return qs => {
        const value = qs[key];

        return typeof value === 'string' ? Maybe.of(value) : Maybe.empty();
    };
}

export function bool(key: string): Parser<Maybe.Maybe<boolean>> {
    return qs => {
        const value = qs[key];

        switch (value) {
            case 'true': return Maybe.of(true);
            case 'false': return Maybe.of(false);
            default: return Maybe.empty();
        }
    };
}