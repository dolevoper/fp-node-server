import { Func } from './utils';

interface Left<T, U> {
    readonly type: 'left';
    fold<V>(f: Func<T, V>, g: Func<U, V>): V;
    catch(onError: Func<T, U>): U;
    map<V>(fn: Func<U, V>): Either<T, V>;
    mapLeft<V>(fn: Func<T, V>): Either<V, U>;
    chain<V>(fn: Func<U, Either<T, V>>): Either<T, V>;
}

interface Right<T, U> {
    readonly type: 'right';
    fold<V>(f: Func<T, V>, g: Func<U, V>): V;
    catch(onError: Func<T, U>): U;
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
        catch(onError) {
            return onError(value);
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
        catch() {
            return value;
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