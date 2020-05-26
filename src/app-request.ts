import { IncomingMessage } from 'http';
import { identity } from './utils';
import * as R from './req-parser';
import * as Response from './response';

export type AppRequest =
    | { readonly type: 'getCheckLists' }
    | { readonly type: 'createCheckList' }
    | { readonly type: 'getItems', checkListId: number }
    | { readonly type: 'addItem', checkListId: number }
    | { readonly type: 'notFound' }

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

export function handle(req: AppRequest): Response.Response {
    switch (req.type) {
        case 'getCheckLists': return Response.text(200, 'checklists');
        case 'createCheckList': return Response.text(200, 'created new checklist');
        case 'getItems': return Response.text(200, `items of checlist ${req.checkListId}`);
        case 'addItem': return Response.text(200, `add item to checklist ${req.checkListId}`);
        case 'notFound': return Response.text(404, 'not found...');
    }
}