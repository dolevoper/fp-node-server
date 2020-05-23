import { IncomingMessage } from 'http';

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
    if (req.url?.match(/^\/checklists\/?$/i)) {
        switch (req.method) {
            case 'GET': return getCheckLists();
            case 'POST': return createCheckList();
        }
    }

    const itemsMatch = req.url?.match(/^\/checklists\/(\d+)\/items\/?/i);

    if (itemsMatch) {
        switch (req.method) {
            case 'GET': return getItems(parseInt(itemsMatch[1]));
            case 'POST': return addItem(parseInt(itemsMatch[1]));
        }
    }

    return notFound();
}