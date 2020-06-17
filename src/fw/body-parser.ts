import { IncomingMessage } from 'http';
import { Maybe as M, TaskEither as TE, compose } from '@lib';
import { fromJson } from './json';

export function json<T>(req: IncomingMessage): TE.TaskEither<string, M.Maybe<T>> {
    return TE.taskEither((reject, resolve) => {
        const { 'content-type': contentType, 'content-length': contentLengthHeader } = req.headers;

        if (!contentType || contentType !== 'application/json' || !contentLengthHeader) return resolve(M.empty());

        const contentLength = Number(contentLengthHeader);

        if (isNaN(contentLength)) return resolve(M.empty());

        function handleIncomingData(buffer: string) {
            return (chunk: string) => {
                const data = buffer + chunk;

                if (data.length === contentLength) {
                    return fromJson<T>(data).fold(
                        reject,
                        compose(resolve, M.of)
                    );
                }

                req.once('data', handleIncomingData(data));
            }
        }

        req.once('data', handleIncomingData(''));
    });
}