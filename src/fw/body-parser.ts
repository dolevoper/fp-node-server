import { IncomingMessage } from 'http';
import * as O from 'fp-ts/lib/Option';
import { Task } from '@lib';
import { fromJson } from './json';

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
                    return fromJson<T>(data).fold(
                        reject,
                        res => resolve(O.some(res))
                    );
                }

                req.once('data', handleIncomingData(data));
            }
        }

        req.once('data', handleIncomingData(''));
    });
}