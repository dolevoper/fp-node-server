import { Func, Func2 } from './utils';

export interface Task<T, U> {
    fork<V>(f: Func<T, void>, g: Func<U, void>): void;
    map<V>(fn: Func<U, V>): Task<T, V>;
    chain<V>(fn: Func<U, Task<T, V>>): Task<T, V>;
}

export function task<T, U>(run: Func2<Func<T, void>, Func<U, void>, void>): Task<T, U> {
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
        }
    }
}

export function of<T, U>(value: U): Task<T, U> {
    return task((_, resolve) => resolve(value));
}

export function rejected<T, U>(value: T): Task<T, U> {
    return task((reject) => reject(value));
}