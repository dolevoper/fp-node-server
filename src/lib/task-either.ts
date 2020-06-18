import { Func, Func2 } from './utils';
import { Either } from './either';
import { Task } from './task';
import { compose } from './compose';
import * as E from './either';
import * as T from './task';

export interface TaskEither<T, U> {
    fork(f: Func<T, void>, g: Func<U, void>): void;
    fold<V>(f: Func<T, Task<V>>, g: Func<U, Task<V>>): Task<V>;
    getOrElse(onRejected: Func<T, T.Task<U>>): Task<U>;
    map<V>(fn: Func<U, V>): TaskEither<T, V>;
    mapRejected<V>(fn: Func<T, V>): TaskEither<V, U>;
    bimap<T2, U2>(f: Func<T, T2>, g: Func<U, U2>): TaskEither<T2, U2>;
    chain<V>(fn: Func<U, TaskEither<T, V>>): TaskEither<T, V>;
    chainEither<U2>(fn: Func<U, Either<T, U2>>): TaskEither<T, U2>;
}

function wrap<T, U>(task: Task<Either<T, U>>): TaskEither<T, U> {
    function fold<V>(f: Func<T, Task<V>>, g: Func<U, Task<V>>): Task<V> {
        return task.chain(e => e.fold(f, g));
    }

    return {
        fork(f, g) {
            task.fork(e => e.fold(f, g));
        },
        fold,
        getOrElse(onRejected) {
            return fold(
                onRejected,
                T.of
            );
        },
        map(fn) {
            return wrap(task.map(e => e.map(fn)));
        },
        mapRejected(fn) {
            return wrap(task.map(e => e.mapLeft(fn)));
        },
        bimap(f, g) {
            return wrap(task.map(e => e.bimap(f, g)));
        },
        chain<V>(fn: Func<U, TaskEither<T, V>>) {
            return wrap(fold(
                value => T.of(E.left<T, V>(value)),
                value => fn(value).fold(
                    value => T.of(E.left<T, V>(value)),
                    value => T.of(E.right<T, V>(value))
                )
            ));
        },
        chainEither(fn) {
            return wrap(task.map(e => e.chain(fn)));
        }
    };
}

export function taskEither<T, U>(run: Func2<Func<T, void>, Func<U, void>, void>): TaskEither<T, U> {
    return wrap(T.task(resolve => run(compose(resolve, E.left), compose(resolve, E.right))));
}

export function of<T, U>(value: U): TaskEither<T, U> {
    return taskEither((_, resolve) => resolve(value));
}

export function rejected<T, U>(value: T): TaskEither<T, U> {
    return taskEither(reject => reject(value));
}

export const toTask = <T, U>(onRejected: Func<T, Task<U>>) => (t: TaskEither<T, U>): Task<U> => t.fold<U>(
    onRejected,
    T.of
);