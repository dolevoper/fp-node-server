import { Func } from './utils';

type CompositionResult<A, B, C, D, E, F> =
    | Func<A, F>
    | Func<B, F>
    | Func<C, F>
    | Func<D, F>
    | Func<E, F>;

export function compose<A, B, C>(fn1: Func<B, C>, fn2: Func<A, B>): Func<A, C>;
export function compose<A, B, C, D>(fn1: Func<C, D>, fn2: Func<B, C>, fn3: Func<A, B>): Func<A, D>;
export function compose<A, B, C, D, E>(fn1: Func<D, E>, fn2: Func<C, D>, fn3: Func<B, C>, fn4: Func<A, B>): Func<A, E>;
export function compose<A, B, C, D, E, F>(fn1: Func<E, F>, fn2: Func<D, E>, fn3: Func<C, D>, fn4: Func<B, C>, fn5: Func<A, B>): Func<A, F>;
export function compose<A, B, C, D, E, F>(fn1: Func<E, F>, fn2?: Func<D, E>, fn3?: Func<C, D>, fn4?: Func<B, C>, fn5?: Func<A, B>): CompositionResult<A, B, C, D, E, F> {
    if (fn2 && fn3 && fn4 && fn5) return compose5(fn1, fn2, fn3, fn4, fn5);
    if (fn2 && fn3 && fn4) return compose4(fn1, fn2, fn3, fn4);
    if (fn2 && fn3) return compose3(fn1, fn2, fn3);
    if (fn2) return compose2(fn1, fn2);

    return fn1;
}

function compose2<A, B, C>(fn1: Func<B, C>, fn2: Func<A, B>): Func<A, C> {
    return p => fn1(fn2(p));
}

function compose3<A, B, C, D>(fn1: Func<C, D>, fn2: Func<B, C>, fn3: Func<A, B>): Func<A, D> {
    return p => fn1(fn2(fn3(p)));
}

function compose4<A, B, C, D, E>(fn1: Func<D, E>, fn2: Func<C, D>, fn3: Func<B, C>, fn4: Func<A, B>): Func<A, E> {
    return p => fn1(fn2(fn3(fn4(p))));
}

function compose5<A, B, C, D, E, F>(fn1: Func<E, F>, fn2: Func<D, E>, fn3: Func<C, D>, fn4: Func<B, C>, fn5: Func<A, B>): Func<A, F> {
    return p => fn1(fn2(fn3(fn4(fn5(p)))));
}