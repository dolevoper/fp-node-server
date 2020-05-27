import { Func } from './utils';

interface Left<T, U> {
    readonly type: 'left';
    fold<V>(f: Func<T, V>, g: Func<U, V>): V;
}

interface Right<T, U> {
    readonly type: 'right';
    fold<V>(f: Func<T, V>, g: Func<U, V>): V;
}

export type Either<T, U> = Left<T, U> | Right<T, U>;

export function left<T, U>(value: T): Left<T, U> {
    return {
        type: 'left',
        fold(f) {
            return f(value);
        }
    };
}

export function right<T, U>(value: U): Right<T, U> {
    return {
        type: 'right',
        fold(_, g) {
            return g(value);
        }
    };
}