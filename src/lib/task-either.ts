import { Func } from './utils';
import { Either } from './either';
import { Task } from './task';
import * as E from './either';
import * as T from './task';

export interface TaskEither<T, U> {
    fork(f: Func<T, void>, g: Func<U, void>): void;
    fold<V>(f: Func<T, Task<V>>, g: Func<U, Task<V>>): Task<V>;
    map<V>(fn: Func<U, V>): TaskEither<T, V>;
    mapRejected<V>(fn: Func<T, V>): TaskEither<V, U>;
    chain<V>(fn: Func<U, TaskEither<T, V>>): TaskEither<T, V>;
    // chainRejected<V>(fn: Func<T, TaskEither<V, U>>): TaskEither<V, U>;
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
        map(fn) {
            return wrap(task.map(e => e.map(fn)));
        },
        mapRejected(fn) {
            return wrap(task.map(e => e.mapLeft(fn)));
        },
        chain<V>(fn: Func<U, TaskEither<T, V>>) {
            return wrap(fold(
                value => T.of(E.left<T, V>(value)),
                value => fn(value).fold(
                    value => T.of(E.left<T, V>(value)),
                    value => T.of(E.right<T, V>(value))
                )
            ));
        }
    };
}

export function taskEither<T, U>(run: Func<Func<Either<T, U>, void>, void>): TaskEither<T, U> {
    return wrap(T.task(run));
}

export function of<T, U>(value: U): TaskEither<T, U> {
    return taskEither(resolve => resolve(E.right(value)));
}

export function rejected<T, U>(value: T): TaskEither<T, U> {
    return taskEither(resolve => resolve(E.left(value)));
}