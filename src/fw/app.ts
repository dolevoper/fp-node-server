import { IncomingMessage, ServerResponse } from 'http';
import { Func, Func2, Task } from '@lib';
import * as Response from './response';

export function create(handle: Func<IncomingMessage, Task.Task<string, Response.Response>>): Func2<IncomingMessage, ServerResponse, void> {
    return (req, res) => {
        const sendResponse = Response.createSender(res);

        handle(req)
            .chain(sendResponse)
            .fork(
                err => {
                    console.error(err);
                    res.statusCode = 500;
                    res.write('something went wrong');
                    res.end();
                },
                () => console.log('handled request successfully')
            );
    };
}