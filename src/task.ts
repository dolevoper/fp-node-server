import { Func, Func2 } from './utils';

export interface Task<T, U> {
    fork<V>(f: Func<T, void>, g: Func<U, void>): void;
}

export function task<T, U>(run: Func2<Func<T, void>, Func<U, void>, void>): Task<T, U> {
    return {
        fork(f, g) {
            run(
                p => setTimeout(f, 0, p),
                p => setTimeout(g, 0, p)
            );
        }
    }
}