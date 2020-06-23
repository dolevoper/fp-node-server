export type Func<A, B> = (p: A) => B;
export type Func2<A, B, C> = (p1: A, p2: B) => C;
export type Func3<A, B, C, D> = (p1: A, p2: B, p3: C) => D;
export type Func4<A, B, C, D, E> = (p1: A, p2: B, p3: C, p4: D) => E;
export type Func5<A, B, C, D, E, F> = (p1: A, p2: B, p3: C, p4: D, p5: E) => F;

export function identity<T>(p: T): T {
    return p;
}

export function constant<T>(p: T): Func<any, T> {
    return () => p;
}

export function lazy<T, U>(fn: Func<T, U>): Func<T, Func<void, U>> {
    return p => () => fn(p);
}