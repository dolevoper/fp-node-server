import { IncomingMessage } from 'http';
import { identity, Func, constant } from './utils';
import * as R from './req-parser';

type GetCheckLists = { readonly type: 'getCheckLists' };
type GetItems = { readonly type: 'getItems', checkListId: number };

export type AppRequest =
    | GetCheckLists
    | { readonly type: 'createCheckList' }
    | GetItems
    // | { readonly type: 'addItem', checkListId: number }
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

// export function addItem(checkListId: number): AppRequest {
//     return {
//         type: 'addItem',
//         checkListId
//     };
// }

export function notFound(): AppRequest {
    return { type: 'notFound' };
}

export function fromRequest(req: IncomingMessage): AppRequest {
    // if (req.url?.match(/^\/checklists\/?$/i)) {
    //     switch (req.method) {
    //         case 'GET': return getCheckLists();
    //         case 'POST': return createCheckList();
    //     }
    // }

    // const itemsMatch = req.url?.match(/^\/checklists\/(\d+)\/items\/?/i);

    // if (itemsMatch) {
    //     switch (req.method) {
    //         case 'GET': return getItems(parseInt(itemsMatch[1]));
    //         case 'POST': return addItem(parseInt(itemsMatch[1]));
    //     }
    // }

    // return notFound();
    const parser = R
        .oneOf([
            R.map(getCheckLists(), R.s('checklists')),
            // R.map(getItems, R.s('checklists').slash(R.int())),
            // R.map(getItems, R.s('checklists').slash(R.int()).slash(R.s('items'))),
            R.map(getItems, R.slash(R.s('checklists').slash(R.int()), R.s('items'))),
            // R.map(getItems, R.s('checklists').slash(R.int()).slash(R.str())),
        ]);

    return R.parse(parser, req).fold(
        identity,
        notFound
    );
}