import { IncomingMessage } from 'http';
import { identity, constant, Func } from './utils';
import * as Either from './either';
import * as Task from './task';
import * as R from './req-parser';
import * as B from './body-parser';
import * as Response from './response';
import * as Repository from './repository';

export type AppRequest =
    | { readonly type: 'getCheckLists' }
    | { readonly type: 'createCheckList', req: IncomingMessage }
    | { readonly type: 'getItems', checkListId: number }
    | { readonly type: 'addItem', req: IncomingMessage, checkListId: number }
    | { readonly type: 'notFound' };

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
    return checkListId => {
        return {
            type: 'addItem',
            req,
            checkListId
        };
    }
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
            R.post(addItem(req), R.s('checklists').slash<AppRequest>(R.int()).slash(R.s('items')))
        ]);

    return R.parse(parser, req).fold(
        identity,
        notFound
    );
}

export function handle(appRequest: AppRequest): Task.Task<string, Response.Response> {
    switch (appRequest.type) {
        case 'getCheckLists': return Repository
            .fetchChecklists()
            .map(Response.json(200))
            .chain(Either.toTask);

        case 'createCheckList': return B
            .json<{ title: string }>(appRequest.req)
            .chain(body => body.fold(
                ({ title }) => Repository.createCheckList(title).map(Response.json(200)).chain(Either.toTask),
                constant(Task.of(Response.text(400, 'body must contain checklist title')))
            ));

        case 'getItems': return Repository
            .getItems(appRequest.checkListId)
            .map(res => res.fold<Either.Either<string, Response.Response>>(
                err => Either.right(Response.text(404, err)),
                Response.json(200)
            ))
            .chain(Either.toTask);

        case 'addItem': return B
            .json<{ content: string }>(appRequest.req)
            .chain(body => body.fold(
                ({ content }) => Repository.addItem(appRequest.checkListId, content)
                    .map(res => res.fold<Either.Either<string, Response.Response>>(
                        err => Either.right(Response.text(404, err)),
                        Response.json(200)
                    ))
                    .chain(Either.toTask),
                constant(Task.of(Response.text(400, 'body must contain item content')))
            ));

        case 'notFound': return Task.of(Response.text(404, 'not found...'));
    }
}