import { Func } from './utils';
import { compose } from './compose';

export interface Reader<T, U> {
    run(config: T): U;
    map<V>(fn: Func<U, V>): Reader<T, V>;
    chain<V>(fn: Func<U, Reader<T, V>>): Reader<T, V>;
}

export function reader<T, U>(run: Func<T, U>): Reader<T, U> {
    return {
        run,
        map(fn) {
            return reader(compose(fn, run));
        },
        chain(fn) {
            return reader(config => fn(run(config)).run(config));
        }
    };
}