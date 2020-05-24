import { createServer } from 'http';
import * as AppRequest from './app-request';
import * as U from './url-parser';

const server = createServer((req, res) => {
    const appRequest = AppRequest.fromRequest(req);

    console.log(appRequest.type);

    const baz = (x: string) => (y: string) => [x, y];
    const foo = U.map(baz, U.s('checklists').slash(U.str).slash(U.s('items')).slash(U.str));
    const bar = U.parse(foo, req.url || '');

    bar.fold(
        console.log,
        () => console.log('blat')
    );

    res.statusCode = 201;
    res.write(appRequest.type);
    res.end();
});

server.listen(3000, () => console.log('server started'));