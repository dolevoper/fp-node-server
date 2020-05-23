import { createServer } from 'http';
import * as AppRequest from './app-request';
import * as U from './url-parser';

const server = createServer((req, res) => {
    const appRequest = AppRequest.fromRequest(req);

    console.log(appRequest.type);
    const parser = U.s('checklists')
        .chain(U.slash(U.str()));
    U.parse(req.url || '', parser).fold(
        console.log,
        () => console.log('parsing failed')
    );

    res.statusCode = 201;
    res.write(appRequest.type);
    res.end();
});

server.listen(3000, () => console.log('server started'));