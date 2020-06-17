import { Func } from './utils';

export interface Task<T> {
    fork(f: Func<T, void>): void;
    map<U>(fn: Func<T, U>): Task<U>;
    chain<U>(fn: Func<T, Task<U>>): Task<U>;
}

export function task<T>(run: Func<Func<T, void>, void>): Task<T> {
    return {
        fork(f) {
            run(f);
        },
        map(fn) {
            return task(resolve => run((p: T) => resolve(fn(p))));
        },
        chain(fn) {
            return task(resolve => run((p: T) => fn(p).fork(resolve)));
        }
    }
}

export function of(): Task<void>;
export function of<T>(value: T): Task<T>;
export function of<T>(value?: T): Task<T | void> {
    return task(resolve => resolve(value));
}