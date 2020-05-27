import { IncomingMessage } from 'http';
import * as Maybe from './maybe';
import * as Task from './task';
import { safeParseJSON } from './json';

export function json<T>(req: IncomingMessage): Task.Task<string, Maybe.Maybe<T>> {
    return Task.task((reject, resolve) => {
        const { 'content-type': contentType, 'content-length': contentLengthHeader } = req.headers;

        if (!contentType || contentType !== 'application/json' || !contentLengthHeader) return resolve(Maybe.empty());

        const contentLength = Number(contentLengthHeader);

        if (isNaN(contentLength)) return resolve(Maybe.empty());

        function handleIncomingData(buffer: string) {
            return (chunk: string) => {
                const data = buffer + chunk;

                if (data.length === contentLength) {
                    return safeParseJSON<T>(data).fold(
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