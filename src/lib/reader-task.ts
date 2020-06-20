import { Task } from './task';
import { Reader, reader } from './reader';
import { Func } from './utils';
import * as T from './task';

export interface ReaderTask<T, U> {
    run(config: T): Task<U>;
    map<V>(fn: Func<U, V>): ReaderTask<T, V>;
    chainTask<V>(fn: Func<U, Task<V>>): ReaderTask<T, V>;
    chain<V>(fn: Func<U, ReaderTask<T, V>>): ReaderTask<T, V>;
}

function wrap<T, U>(readerTask: Reader<T, Task<U>>): ReaderTask<T, U> {
    return {
        run: readerTask.run,
        map(fn) {
            return wrap(readerTask.map(t => t.map(fn)));
        },
        chainTask(fn) {
            return wrap(readerTask.map(t => t.chain(fn)));
        },
        chain(fn) {
            return wrap(reader(config => readerTask.run(config).chain(x => fn(x).run(config))));
        }
    };
}

export function readerTask<T, U>(run: Func<T, Task<U>>): ReaderTask<T, U> {
    return wrap(reader(run));
}

export function of<T, U>(value: U): ReaderTask<T, U> {
    return readerTask(_ => T.of(value));
}

export const evalWith = <T>(config: T) => <U>(r: ReaderTask<T, U>) => r.run(config);