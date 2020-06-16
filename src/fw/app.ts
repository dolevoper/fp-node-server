import { IncomingMessage, ServerResponse } from 'http';
import { pipe, FunctionN } from 'fp-ts/lib/function';
import * as E from 'fp-ts/lib/Either';
import { Task } from '@lib';
import * as Response from './response';

export function create(handle: FunctionN<[IncomingMessage], Task.Task<string, Response.Response>>): FunctionN<[IncomingMessage, ServerResponse], void> {
    return (req, res) => {
        const sendResponse = Response.createSender(res);

        handle(req)
            .map(sendResponse)
            .fork(
                err => {
                    console.error(err);
                    res.statusCode = 500;
                    res.write('something went wrong');
                    res.end();
                },
                send => pipe(
                    send(),
                    E.bimap(
                        err => {
                            console.error(err);
                            res.statusCode = 500;
                            res.write('something went wrong');
                            res.end();
                        },
                        () => console.log('handled request successfully')
                    )
                )
            );
    };
}