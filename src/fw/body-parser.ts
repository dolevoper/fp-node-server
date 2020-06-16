import { IncomingMessage } from 'http';
import { pipe } from 'fp-ts/lib/function';
import * as O from 'fp-ts/lib/Option';
import * as E from 'fp-ts/lib/Either';
import { Task } from '@lib';

export function json<T>(req: IncomingMessage): Task.Task<string, O.Option<T>> {
    return Task.task((reject, resolve) => {
        const { 'content-type': contentType, 'content-length': contentLengthHeader } = req.headers;

        if (!contentType || contentType !== 'application/json' || !contentLengthHeader) return resolve(O.none);

        const contentLength = Number(contentLengthHeader);

        if (isNaN(contentLength)) return resolve(O.none);

        function handleIncomingData(buffer: string) {
            return (chunk: string) => {
                const data = buffer + chunk;

                if (data.length === contentLength) {
                    return pipe(
                        E.parseJSON(data, E.toError) as E.Either<Error, T>,
                        E.bimap(err => err.message, O.some),
                        E.fold(reject, resolve)
                    );
                }

                req.once('data', handleIncomingData(data));
            }
        }

        req.once('data', handleIncomingData(''));
    });
}