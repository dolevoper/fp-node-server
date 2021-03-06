import './env';

import { createServer } from 'http';
import { compose, ReaderTask as RT, lazy } from '@lib';
import { App } from '@fw';
import * as AppConfig from './app-config';
import * as AppRequest from './app-request';
import * as Routes from './routes';

const program = AppConfig
    .fromEnv(process.env)
    .fold(
        lazy(console.error),
        lazy(config => {
            const app = App.create(compose(
                RT.evalWith(config),
                AppRequest.fold({
                    getChecklists: Routes.getChecklists,
                    createChecklist: Routes.createChecklist,
                    getItems: Routes.getItems,
                    addItem: Routes.addItem,
                    editItem: Routes.editItem,
                    notFound: Routes.notFound,
                    preflight: Routes.preflight
                }),
                AppRequest.fromRequest
            ));

            const server = createServer(app);

            server.listen(3000, () => console.log('server started'));
        })
    );

program();