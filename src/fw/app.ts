import { IncomingMessage, ServerResponse } from 'http';
import { Func, Func2, Task as T, ReaderTask as RT } from '@lib';
import * as Response from './response';

export function create(handle: Func<IncomingMessage, T.Task<Response.Response>>): Func2<IncomingMessage, ServerResponse, void> {
    return (req, res) => {
        const sendResponse = Response.createSender(res);

        handle(req)
            .chain(sendResponse)
            .fork(
                () => console.log('finished handling request')
            );
    };
}