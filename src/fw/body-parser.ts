import { IncomingMessage } from 'http';
import { Maybe, Either as E, TaskEither as TE } from '@lib';
import { fromJson } from './json';

export function json<T>(req: IncomingMessage): TE.TaskEither<string, Maybe.Maybe<T>> {
    return TE.taskEither(resolve => {
        const { 'content-type': contentType, 'content-length': contentLengthHeader } = req.headers;

        if (!contentType || contentType !== 'application/json' || !contentLengthHeader) return resolve(E.right(Maybe.empty()));

        const contentLength = Number(contentLengthHeader);

        if (isNaN(contentLength)) return resolve(E.right(Maybe.empty()));

        function handleIncomingData(buffer: string) {
            return (chunk: string) => {
                const data = buffer + chunk;

                if (data.length === contentLength) {
                    return fromJson<T>(data).fold(
                        err => resolve(E.left(err)),
                        res => resolve(E.right(Maybe.of(res)))
                    );
                }

                req.once('data', handleIncomingData(data));
            }
        }

        req.once('data', handleIncomingData(''));
    });
}