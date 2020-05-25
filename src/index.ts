import { createServer } from 'http';
import * as AppRequest from './app-request';
import * as R from './req-parser';
import { identity } from './utils';

const server = createServer((req, res) => {
    const appRequest = AppRequest.fromRequest(req);

    console.log(appRequest.type);

    // const foo = R.oneOf([
    //     R.s('checklists').slash(R.int()),
    //     R.s('items').slash(R.str())
    // ]);
    // const bar = R.parse(foo, req);

    // bar.fold(
    //     console.log,
    //     () => console.log('blat')
    // );

    res.statusCode = 201;
    res.write(appRequest.type);
    res.end();
});

server.listen(3000, () => console.log('server started'));