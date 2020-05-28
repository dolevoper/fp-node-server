import { Either } from '@lib';

export function fromJson<T>(json: string): Either.Either<string, T> {
    try {
        const res = JSON.parse(json);

        return Either.right(res);
    } catch (err) {
        return Either.left(err);
    }
}

export function toJson<T>(obj: T): Either.Either<string, string> {
    try {
        const res = JSON.stringify(obj);

        return Either.right(res);
    } catch (err) {
        return Either.left(err);
    }
}