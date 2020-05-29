import 'module-alias/register';

import { createServer } from 'http';
import { compose } from '@lib';
import { App } from '@fw';
import * as AppRequest from './app-request';

const app = App.create(compose(AppRequest.handle, AppRequest.fromRequest));

const server = createServer(app);

server.listen(3000, () => console.log('server started'));