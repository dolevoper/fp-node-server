import { Func, Func2 } from './utils';

export interface TaskEither<T, U> {
    fork<V>(f: Func<T, V>, g: Func<U, V>): void;
    map<V>(fn: Func<U, V>): TaskEither<T, V>;
    chain<V>(fn: Func<U, TaskEither<T, V>>): TaskEither<T, V>;
    mapRejected<V>(fn: Func<T, V>): TaskEither<V, U>;
    chainRejected<V>(fn: Func<T, TaskEither<V, U>>): TaskEither<V, U>;
}

export function task<T, U>(run: Func2<Func<T, void>, Func<U, void>, void>): TaskEither<T, U> {
    return {
        fork(f, g) {
            run(
                p => setTimeout(f, 0, p),
                p => setTimeout(g, 0, p)
            );
        },
        map(fn) {
            return task((reject, resolve) => run(reject, (p: U) => resolve(fn(p))));
        },
        chain(fn) {
            return task((reject, resolve) => run(reject, (p: U) => fn(p).fork(reject, resolve)));
        },
        mapRejected(fn) {
            return task((reject, resolve) => run((p: T) => reject(fn(p)), resolve));
        },
        chainRejected(fn) {
            return task((reject, resolve) => run((p: T) => fn(p).fork(reject, resolve), resolve));
        }
    }
}

export function of<T, U>(value: U): TaskEither<T, U> {
    return task((_, resolve) => resolve(value));
}

export function rejected<T, U>(value: T): TaskEither<T, U> {
    return task((reject) => reject(value));
}