import { Func } from './utils';
import { compose } from './compose';

export interface State<T, U> {
    run(state: T): [U, T];
    map<V>(fn: Func<U, V>): State<T, V>;
    chain<V>(fn: Func<U, State<T, V>>): State<T, V>;
    evalWith(state: T): U;
    execWith(state: T): T;
}

function state<T, U>(run: Func<T, [U, T]>): State<T, U> {
    return {
        run,
        map(fn) {
            return state(s => {
                const [value, newState] = run(s);

                return [fn(value), newState];
            });
        },
        chain(fn) {
            return state(s => {
                const [value, newState] = run(s);

                return fn(value).run(newState);
            });
        },
        evalWith(s) {
            return run(s)[0];
        },
        execWith(s) {
            return run(s)[1];
        }
    };
}

export function of<T, U>(value: U): State<T, U> {
    return state(s => [value, s]);
}

export function get<T>(): State<T, T>;
export function get<T, U>(fn: Func<T, U>): State<T, U>;
export function get<T, U>(fn?: Func<T, U>): State<T, T> | State<T, U> {
    return fn ? state(s => [fn(s), s]) : state(s => [s, s]);
}

export function put<T>(newState: T): State<T, void> {
    return state(() => [, newState]);
}

export function modify<T>(fn: Func<T, T>): State<T, void> {
    return get<T>().chain(compose(put, fn));
}