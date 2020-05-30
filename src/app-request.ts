import { IncomingMessage } from 'http';
import { identity, Func } from '@lib';
import { ReqParser as R } from '@fw';

export type GetCheckLists = { readonly type: 'getCheckLists' };
export type CreateCheckList = { readonly type: 'createCheckList', req: IncomingMessage };
export type GetItems = { readonly type: 'getItems', checkListId: number };
export type AddItem = { readonly type: 'addItem', req: IncomingMessage, checkListId: number };
export type EditItem = { readonly type: 'editItem', req: IncomingMessage, itemId: number };
export type NotFound = { readonly type: 'notFound' };

export type AppRequest =
    | GetCheckLists
    | CreateCheckList
    | GetItems
    | AddItem
    | EditItem
    | NotFound;

function getCheckLists(): AppRequest {
    return { type: 'getCheckLists' };
}

function createCheckList(req: IncomingMessage): AppRequest {
    return { type: 'createCheckList', req };
}

function getItems(checkListId: number): AppRequest {
    return {
        type: 'getItems',
        checkListId
    };
}

function addItem(req: IncomingMessage): Func<number, AppRequest> {
    return checkListId => ({
        type: 'addItem',
        req,
        checkListId
    });
}

function editItem(req: IncomingMessage): Func<number, AppRequest> {
    return itemId => ({
        type: 'editItem',
        req,
        itemId
    });
}

function notFound(): AppRequest {
    return { type: 'notFound' };
}

export function fromRequest(req: IncomingMessage): AppRequest {
    const parser = R
        .oneOf([
            R.get(getCheckLists(), R.s('checklists')),
            R.post(createCheckList(req), R.s('checklists')),
            R.get(getItems, R.s('checklists').slash<AppRequest>(R.int()).slash(R.s('items'))),
            R.post(addItem(req), R.s('checklists').slash<AppRequest>(R.int()).slash(R.s('items'))),
            R.put(editItem(req), R.s('items').slash(R.int()))
        ]);

    return R.parse(parser, req).fold(
        identity,
        notFound
    );
}

type AppRequestCtor<T, U> = T extends { type: U } ? T : never;
type AppRequestFunc<T, U> = Func<AppRequestCtor<AppRequest, T>, U>;
type AppRequestActions<T> = { [K in AppRequest['type']]: AppRequestFunc<K, T> };

export function fold<T>(action: AppRequestActions<T>): Func<AppRequest, T> {
    return value => {
        const fn = action[value.type] as AppRequestFunc<typeof value.type, T>;

        return fn(value);
    };
}