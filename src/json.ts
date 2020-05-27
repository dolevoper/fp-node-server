import * as Either from './either';

export function safeParseJSON<T>(json: string): Either.Either<string, T> {
    try {
        const res = JSON.parse(json);

        return Either.right(res);
    } catch (err) {
        return Either.left(err);
    }
}