import { IncomingMessage } from 'http';
import { identity, constant } from './utils';
import * as Either from './either';
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
            .map(Response.json(200))
            .chain(Either.toTask);

        case 'createCheckList': return B
            .json<{ title: string }>(req)
            .chain(body => body.fold(
                ({ title }) => Repository.createCheckList(title).map(Response.json(200)).chain(Either.toTask),
                constant(Task.of(Response.text(400, 'body must contain checklist title')))
            ));

        case 'getItems': return Repository
            .getItems(appRequest.checkListId)
            .map(Response.json(200))
            .chain(Either.toTask);

        case 'addItem': return B
            .json<{ content: string }>(req)
            .chain(body => body.fold(
                ({ content }) => Repository.addItem(appRequest.checkListId, content).map(Response.json(200)).chain(Either.toTask),
                constant(Task.of(Response.text(400, 'body must contain item content')))
            ));

        case 'notFound': return Task.of(Response.text(404, 'not found...'));
    }
}