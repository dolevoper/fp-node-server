import { IncomingMessage, ServerResponse } from 'http';
import { Func, Func2, Task as T, TaskEither as TE } from '@lib';
import * as Response from './response';

export function create(handle: Func<IncomingMessage, T.Task<Response.Response>>): Func2<IncomingMessage, ServerResponse, void> {
    return (req, res) => {
        const sendResponse = Response.createSender(res);

        handle(req)
            .chain(sendResponse)
            // .chain(TE.toTask(err => {
            //     console.error(err);

            //     res.statusCode = 500;
            //     res.write('something went wrong');
            //     res.end();

            //     return T.of();
            // }))
            .fork(
                () => console.log('finished handling request')
            );
    };
}