import { Either as E, Task as T, TaskEither as TE, Func, constant, Maybe, identity, compose } from '@lib';
import { Response, BodyParser as B } from '@fw';
import * as AppRequest from './app-request';
import * as Repository from './repository';

const requireBody = <T>() => (maybeBody: Maybe.Maybe<T>) => maybeBody.fold<TE.TaskEither<string, T>>(() => TE.rejected('body must contain checklist title'), TE.of);

export const getCheckLists: Func<AppRequest.GetCheckLists, T.Task<Response.Response>> = () => Repository
    .fetchChecklists()
    .fold(
        constant(T.of(Response.text(500, 'oops, something went wrong...'))),
        res => T.of(Response.json(200, res))
    );

type CreateChecklistBody = { title: string };
export const createCheckList: Func<AppRequest.CreateCheckList, T.Task<Response.Response>> = appRequest => B
    .json<CreateChecklistBody>(appRequest.req)
    .chain(requireBody<CreateChecklistBody>())
    .fold(
        err => T.of(Response.text(400, err)),
        ({ title }) => Repository.createCheckList(title).fold(
            _ => T.of(Response.text(500, 'oops, something went wrong')),
            res => T.of(Response.json(200, res))
        )
    );

export const getItems: Func<AppRequest.GetItems, T.Task<Response.Response>> = appRequest => Repository
    .getItems(appRequest.checkListId)
    .fold(
        _ => T.of(Response.text(500, 'oops, something went wrong')),
        res => res.fold(
            err => T.of(Response.text(400, err)),
            items => T.of(Response.json(200, items))
        )
    );

type AddItemBody = { content: string };
export const addItem: Func<AppRequest.AddItem, T.Task<Response.Response>> = appRequest => B
    .json<AddItemBody>(appRequest.req)
    .chain(requireBody<AddItemBody>())
    .fold(
        err => T.of(Response.text(400, err)),
        ({ content }) => Repository.addItem(appRequest.checkListId, content).fold(
            _ => T.of(Response.text(500, 'oops, something went wrong')),
            res => res.fold(
                err => T.of(Response.text(400, err)),
                item => T.of(Response.json(200, item))
            )
        )
    );

type EditItemBody = { content: string, checked: boolean };
export const editItem: Func<AppRequest.EditItem, T.Task<Response.Response>> = appRequest => B
    .json<EditItemBody>(appRequest.req)
    .chain(requireBody<EditItemBody>())
    .fold(
        err => T.of(Response.text(400, err)),
        ({ content, checked }) => Repository.updateItem(appRequest.itemId, content, checked).fold(
            _ => T.of(Response.text(500, 'oops, something went wrong')),
            res => res.fold(
                err => T.of(Response.text(400, err)),
                item => T.of(Response.json(200, item))
            )
        )
    );

export const notFound: Func<AppRequest.NotFound, T.Task<Response.Response>> =
    () => T.of(Response.text(404, 'not found...'));

export const preflight: Func<AppRequest.Preflight, T.Task<Response.Response>> =
    appRequest => {
        const allowHeaders: [string, string][] = appRequest.req.headers['access-control-allow-headers'] ?
            [['Access-Control-Request-Headers', appRequest.req.headers['access-control-allow-headers']]] :
            [];

        return T.of({
            content: Maybe.empty(),
            status: 204,
            headers: new Map([
                ['Access-Control-Allow-Origin', '*'],
                ['Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE'],
                ['Access-Control-Allow-Credentials', 'true'],
                ...allowHeaders
            ])
        });
    };