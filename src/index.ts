import { createServer } from 'http';
import { compose } from '@lib';
import { App } from '@fw';
import * as AppRequest from './app-request';
import * as Routes from './routes';

const app = App.create(compose(AppRequest.fold({
    getCheckLists: Routes.getCheckLists,
    createCheckList: Routes.createCheckList,
    getItems: Routes.getItems,
    addItem: Routes.addItem,
    editItem: Routes.editItem,
    notFound: Routes.notFound
}), AppRequest.fromRequest));

const server = createServer(app);

server.listen(3000, () => console.log('server started'));