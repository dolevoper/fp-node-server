import { Func } from './utils';
import * as Task from './task-either';

interface Left<T, U> {
    readonly type: 'left';
    fold<V>(f: Func<T, V>, g: Func<U, V>): V;
    map<V>(fn: Func<U, V>): Either<T, V>;
    mapLeft<V>(fn: Func<T, V>): Either<V, U>;
    chain<V>(fn: Func<U, Either<T, V>>): Either<T, V>;
}

interface Right<T, U> {
    readonly type: 'right';
    fold<V>(f: Func<T, V>, g: Func<U, V>): V;
    map<V>(fn: Func<U, V>): Either<T, V>;
    mapLeft<V>(fn: Func<T, V>): Either<V, U>;
    chain<V>(fn: Func<U, Either<T, V>>): Either<T, V>;
}

export type Either<T, U> = Left<T, U> | Right<T, U>;

export function left<T, U>(value: T): Either<T, U> {
    return {
        type: 'left',
        fold(f) {
            return f(value);
        },
        map() {
            return left(value);
        },
        mapLeft(fn) {
            return left(fn(value));
        },
        chain() {
            return left(value);
        }
    };
}

export function right<T, U>(value: U): Either<T, U> {
    return {
        type: 'right',
        fold(_, g) {
            return g(value);
        },
        map(fn) {
            return right(fn(value));
        },
        mapLeft() {
            return right(value);
        },
        chain(fn) {
            return fn(value);
        }
    };
}

export function toTask<T, U>(either: Either<T, U>): Task.TaskEither<T, U> {
    return either.fold(err => Task.rejected(err), res => Task.of(res));
}