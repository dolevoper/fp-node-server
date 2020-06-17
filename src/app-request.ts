import { IncomingMessage } from 'http';
import { identity, Func, Maybe, constant } from '@lib';
import { ReqParser as R, QueryParser as Q } from '@fw';

export type GetChecklists = { readonly type: 'getChecklists' };
export type CreateChecklist = { readonly type: 'createChecklist', req: IncomingMessage };
export type GetItems = { readonly type: 'getItems', checklistId: number, checked: Maybe.Maybe<boolean> };
export type AddItem = { readonly type: 'addItem', req: IncomingMessage, checklistId: number };
export type EditItem = { readonly type: 'editItem', req: IncomingMessage, itemId: number };
export type Preflight = { readonly type: 'preflight', req: IncomingMessage };
export type NotFound = { readonly type: 'notFound' };

export type AppRequest =
    | GetChecklists
    | CreateChecklist
    | GetItems
    | AddItem
    | EditItem
    | Preflight
    | NotFound;

const getChecklists: AppRequest = {
    type: 'getChecklists'
};

function createChecklist(req: IncomingMessage): AppRequest {
    return { type: 'createChecklist', req };
}

const getItems = (checklistId: number) => (checked: Maybe.Maybe<boolean>): AppRequest => ({
    type: 'getItems',
    checklistId,
    checked
});

const addItem = (req: IncomingMessage) => (checklistId: number): AppRequest => ({
    type: 'addItem',
    req,
    checklistId
});

const editItem = (req: IncomingMessage) => (itemId: number): AppRequest => ({
    type: 'editItem',
    req,
    itemId
});

const preflight = (req: IncomingMessage): AppRequest => ({ type: 'preflight', req });

const notFound: AppRequest = { type: 'notFound' };

export function fromRequest(req: IncomingMessage): AppRequest {
    const parser = R
        .oneOf([
            R.get().slash(R.from(getChecklists)).slash(R.s('checklists')),
            R.post().slash(R.from(createChecklist(req))).slash(R.s('checklists')),
            R.get().slash(R.from(getItems)).slash(R.s('checklists')).slash(R.int()).slash(R.s('items')).q(Q.bool('checked')),
            R.post().slash(R.from(addItem(req))).slash(R.s('checklists')).slash(R.int()).slash(R.s('items')),
            R.put().slash(R.from(editItem(req))).slash(R.s('items')).slash(R.int()),
            R.options().slash(R.from(preflight(req))).slash(R.rest())
        ]);

    return R.parse(parser, req).fold(
        constant(notFound),
        identity
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