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

export function createWithConfig<T>(config: T, handle: Func<IncomingMessage, RT.ReaderTask<T, Response.Response>>): Func2<IncomingMessage, ServerResponse, void> {
    return create(req => handle(req).run(config));
}