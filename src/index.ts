import { createServer } from 'http';
import * as Task from './task';
import * as Response from './response';
import * as AppRequest from './app-request';

const server = createServer((req, res) => {
    function sendResponse(response: Response.Response): Task.Task<string, void> {
        return Task.task((reject, resolve) => {
            res.statusCode = response.status;

            response.headers.forEach((value, key) => res.setHeader(key, value));

            try {
                response.content.fold(
                    content => res.write(content),
                    () => { }
                );

                res.end(resolve);
            } catch (err) {
                reject(err);
            }
        });
    }

    const appRequest = AppRequest.fromRequest(req);
    
    AppRequest
        .handle(appRequest, req)
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
});

server.listen(3000, () => console.log('server started'));