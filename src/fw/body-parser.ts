import { IncomingMessage } from 'http';
import { pipe } from 'fp-ts/lib/function';
import * as O from 'fp-ts/lib/Option';
import * as E from 'fp-ts/lib/Either';
import * as T from 'fp-ts/lib/TaskEither';
// import { Task } from '@lib';

export function json<T>(req: IncomingMessage): T.TaskEither<string, O.Option<T>> {
    return T.tryCatch(() => new Promise((resolve, reject) => {
        const { 'content-type': contentType, 'content-length': contentLengthHeader } = req.headers;

        if (!contentType || contentType !== 'application/json' || !contentLengthHeader) return resolve(O.none);

        const contentLength = Number(contentLengthHeader);

        if (isNaN(contentLength)) return resolve(O.none);

        function handleIncomingData(buffer: string) {
            return (chunk: string) => {
                const data = buffer + chunk;

                if (data.length === contentLength) {
                    return pipe(
                        E.parseJSON(data, String) as E.Either<string, T>,
                        E.map(O.some),
                        E.fold(reject, resolve)
                    );
                }

                req.once('data', handleIncomingData(data));
            }
        }

        req.once('data', handleIncomingData(''));
    }), String);
}