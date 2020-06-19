import { TaskEither } from './task-either';
import { Func } from './utils';
import { reader, Reader } from './reader';
import { Either } from './either';
import { ReaderTask } from './reader-task';
import * as RT from './reader-task';

export interface ReaderTaskEither<T, U, V> {
    run(config: T): TaskEither<U, V>;
    fold<W>(f: Func<U, ReaderTask<T, W>>, g: Func<V, ReaderTask<T, W>>): ReaderTask<T, W>;
    getOrElse(onRejected: Func<U, ReaderTask<T, V>>): ReaderTask<T, V>;
    map<V2>(fn: Func<V, V2>): ReaderTaskEither<T, U, V2>;
    mapRejected<U2>(fn: Func<U, U2>): ReaderTaskEither<T, U2, V>;
    bimap<U2, V2>(f: Func<U, U2>, g: Func<V, V2>): ReaderTaskEither<T, U2, V2>;
    chain<V2>(fn: Func<V, ReaderTaskEither<T, U, V2>>): ReaderTaskEither<T, U, V2>;
    chainEither<V2>(fn: Func<V, Either<U, V2>>): ReaderTaskEither<T, U, V2>;
}

function wrap<T, U, V>(rte: Reader<T, TaskEither<U, V>>): ReaderTaskEither<T, U, V> {
    function fold<W>(f: Func<U, ReaderTask<T, W>>, g: Func<V, ReaderTask<T, W>>): ReaderTask<T, W> {
        return RT.readerTask(config => rte.run(config).fold(x => f(x).run(config), x => g(x).run(config)));
    }

    return {
        run: rte.run,
        fold,
        getOrElse(onRejected) {
            return fold(onRejected, RT.of);
        },
        map(fn) {
            return wrap(rte.map(te => te.map(fn)));
        },
        mapRejected(fn) {
            return wrap(rte.map(te => te.mapRejected(fn)));
        },
        bimap(f, g) {
            return wrap(rte.map(te => te.bimap(f, g)));
        },
        chain(fn) {
            return wrap(reader(config => rte.run(config).chain(x => fn(x).run(config))));
        },
        chainEither(fn) {
            return wrap(rte.map(te => te.chainEither(fn)));
        }
    }
}

export function readerTaskEither<T, U, V>(run: Func<T, TaskEither<U, V>>): ReaderTaskEither<T, U, V> {
    return wrap(reader(run));
}

export function fromTaskEither<T, U, V>(te: TaskEither<U, V>): ReaderTaskEither<T, U, V> {
    return wrap(reader(_ => te));
}