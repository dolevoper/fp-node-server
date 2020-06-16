import { ParsedUrlQuery } from 'querystring';
import { FunctionN } from 'fp-ts/lib/function';
import { Option, some, none } from 'fp-ts/lib/Option';

export type Parser<T> = FunctionN<[ParsedUrlQuery], T>;

export function str(key: string): Parser<Option<string>> {
    return qs => {
        const value = qs[key];

        return typeof value === 'string' ? some(value) : none;
    };
}

export function bool(key: string): Parser<Option<boolean>> {
    return qs => {
        const value = qs[key];

        switch (value) {
            case 'true': return some(true);
            case 'false': return some(false);
            default: return none;
        }
    };
}