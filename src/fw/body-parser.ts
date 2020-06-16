import { IncomingMessage } from 'http';
import { Maybe, TaskEither as T } from '@lib';
import { fromJson } from './json';

export function json<T>(req: IncomingMessage): T.TaskEither<string, Maybe.Maybe<T>> {
    return T.task((reject, resolve) => {
        const { 'content-type': contentType, 'content-length': contentLengthHeader } = req.headers;

        if (!contentType || contentType !== 'application/json' || !contentLengthHeader) return resolve(Maybe.empty());

        const contentLength = Number(contentLengthHeader);

        if (isNaN(contentLength)) return resolve(Maybe.empty());

        function handleIncomingData(buffer: string) {
            return (chunk: string) => {
                const data = buffer + chunk;

                if (data.length === contentLength) {
                    return fromJson<T>(data).fold(
                        reject,
                        res => resolve(Maybe.of(res))
                    );
                }

                req.once('data', handleIncomingData(data));
            }
        }

        req.once('data', handleIncomingData(''));
    });
}