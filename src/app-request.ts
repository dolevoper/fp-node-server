import { IncomingMessage } from 'http';
import { identity } from './utils';
import * as Task from './task';
import * as R from './req-parser';
import * as B from './body-parser';
import * as Response from './response';
import * as Repository from './repository';

export type AppRequest =
    | { readonly type: 'getCheckLists' }
    | { readonly type: 'createCheckList' }
    | { readonly type: 'getItems', checkListId: number }
    | { readonly type: 'addItem', checkListId: number }
    | { readonly type: 'notFound' };

export function getCheckLists(): AppRequest {
    return { type: 'getCheckLists' };
}

export function createCheckList(): AppRequest {
    return { type: 'createCheckList' };
}

export function getItems(checkListId: number): AppRequest {
    return {
        type: 'getItems',
        checkListId
    };
}

export function addItem(checkListId: number): AppRequest {
    return {
        type: 'addItem',
        checkListId
    };
}

export function notFound(): AppRequest {
    return { type: 'notFound' };
}

export function fromRequest(req: IncomingMessage): AppRequest {
    const parser = R
        .oneOf([
            R.get(getCheckLists(), R.s('checklists')),
            R.post(createCheckList(), R.s('checklists')),
            R.get(getItems, R.s('checklists').slash<AppRequest>(R.int()).slash(R.s('items'))),
            R.post(addItem, R.s('checklists').slash<AppRequest>(R.int()).slash(R.s('items')))
        ]);

    return R.parse(parser, req).fold(
        identity,
        notFound
    );
}

export function handle(appRequest: AppRequest, req: IncomingMessage): Task.Task<string, Response.Response> {
    switch (appRequest.type) {
        case 'getCheckLists': return Repository
            .fetchChecklists()
            .chain(checklists => Response.json(200, checklists));

        case 'createCheckList': return B
            .json<{ title: string }>(req)
            .chain(body => body.fold(
                ({ title }) => Repository.createCheckList(title).chain(Response.json(200)),
                () => Task.of(Response.text(400, 'body must contain checklist title'))
            ));

        case 'getItems': return Repository
            .getItems(appRequest.checkListId)
            .chain(Response.json(200));

        case 'addItem': return Task.of(Response.text(200, `add items to checklist ${appRequest.checkListId}`));

        case 'notFound': return Task.of(Response.text(404, 'not found...'));
    }
}