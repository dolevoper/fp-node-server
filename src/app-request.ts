import { IncomingMessage } from 'http';
import { identity, Func, Maybe } from '@lib';
import { ReqParser as R, QueryParser as Q } from '@fw';

export type GetCheckLists = { readonly type: 'getCheckLists' };
export type CreateCheckList = { readonly type: 'createCheckList', req: IncomingMessage };
export type GetItems = { readonly type: 'getItems', checkListId: number, checked: Maybe.Maybe<boolean> };
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

const getItems = (checkListId: number) => (checked: Maybe.Maybe<boolean>): AppRequest => ({
    type: 'getItems',
    checkListId,
    checked
});

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
            R.get().slash(R.from(getCheckLists())).slash(R.s('checklists')),
            R.post().slash(R.from(createCheckList(req))).slash(R.s('checklists')),
            R.get().slash(R.from(getItems)).slash(R.s('checklists')).slash(R.int()).slash(R.s('items')).slash(R.query(Q.bool('checked'))),
            R.post().slash(R.from(addItem(req))).slash(R.s('checklists')).slash(R.int()).slash(R.s('items')),
            R.put().slash(R.from(editItem(req))).slash(R.s('items')).slash(R.int())
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