import { createServer } from 'http';
import * as AppRequest from './app-request';
import * as App from './app';

const app = App.create(req => {
    const appRequest = AppRequest.fromRequest(req);

    return AppRequest.handle(appRequest, req);
});

const server = createServer(app);

server.listen(3000, () => console.log('server started'));