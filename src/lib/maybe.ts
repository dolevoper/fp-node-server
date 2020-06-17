import { Func } from './utils';

interface Just<T> {
    readonly type: 'just';
    fold<U>(f: Func<void, U>, g: Func<T, U>): U;
    map<U>(fn: Func<T, U>): Maybe<U>;
}

interface Nothing<T> {
    readonly type: 'nothing';
    fold<U>(f: Func<void, U>, g: Func<T, U>): U;
    map<U>(fn: Func<T, U>): Maybe<U>;
}

export type Maybe<T> = Just<T> | Nothing<T>;

export function of<T>(value: T): Maybe<T> {
    return {
        type: 'just',
        fold(_, g) {
            return g(value);
        },
        map(fn) {
            return of(fn(value));
        }
    };
}

export function empty(): Maybe<never> {
    return {
        type: 'nothing',
        fold(f) {
            return f();
        },
        map() {
            return empty();
        }
    };
}

export function fromNullable<T>(value: T | null | undefined): Maybe<T> {
    return value == null ? empty() : of(value);
}