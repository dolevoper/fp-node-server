import { Func, Func2 } from './utils';

export interface Task<T, U> {
    fork<V>(f: Func<T, void>, g: Func<U, void>): void;
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
        chain(fn) {
            return task((reject, resolve) => run(reject, (p: U) => fn(p).fork(reject, resolve)));
        }
    }
}

export function of<T>(value: T): Task<never, T> {
    return task((_, resolve) => resolve(value));
}