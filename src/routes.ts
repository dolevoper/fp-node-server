import { Task as T, TaskEither as TE, Func, Maybe as M } from '@lib';
import { Response as R, BodyParser as B } from '@fw';
import * as AppRequest from './app-request';
import * as Repository from './repository';
import * as E from './app-error';

const requireBody = <T>() => (maybeBody: M.Maybe<T>) => maybeBody.fold<TE.TaskEither<string, T>>(() => TE.rejected('body must contain checklist title'), TE.of);

export const getCheckLists: Func<AppRequest.GetCheckLists, T.Task<R.Response>> = () => Repository
    .fetchChecklists()
    .fold(
        err => T.of(E.toResponse(err)),
        res => T.of(R.json(200, res))
    );

type CreateChecklistBody = { title: string };
export const createCheckList: Func<AppRequest.CreateCheckList, T.Task<R.Response>> = appRequest => B
    .json<CreateChecklistBody>(appRequest.req)
    .chain(requireBody<CreateChecklistBody>())
    .fold(
        err => T.of(R.text(400, err)),
        ({ title }) => Repository.createCheckList(title).fold(
            err => T.of(E.toResponse(err)),
            res => T.of(R.json(200, res))
        )
    );

export const getItems: Func<AppRequest.GetItems, T.Task<R.Response>> = appRequest => Repository
    .getItems(appRequest.checkListId)
    .fold(
        err => T.of(E.toResponse(err)),
        items => T.of(R.json(200, items))
    );

type AddItemBody = { content: string };
export const addItem: Func<AppRequest.AddItem, T.Task<R.Response>> = appRequest => B
    .json<AddItemBody>(appRequest.req)
    .chain(requireBody<AddItemBody>())
    .fold(
        err => T.of(R.text(400, err)),
        ({ content }) => Repository.addItem(appRequest.checkListId, content).fold(
            err => T.of(E.toResponse(err)),
            item => T.of(R.json(200, item))
        )
    );

type EditItemBody = { content: string, checked: boolean };
export const editItem: Func<AppRequest.EditItem, T.Task<R.Response>> = appRequest => B
    .json<EditItemBody>(appRequest.req)
    .chain(requireBody<EditItemBody>())
    .fold(
        err => T.of(R.text(400, err)),
        ({ content, checked }) => Repository.updateItem(appRequest.itemId, content, checked).fold(
            err => T.of(E.toResponse(err)),
            item => T.of(R.json(200, item))
        )
    );

export const notFound: Func<AppRequest.NotFound, T.Task<R.Response>> =
    () => T.of(R.text(404, 'not found...'));

export const preflight: Func<AppRequest.Preflight, T.Task<R.Response>> =
    appRequest => {
        const allowHeaders: [string, string][] = appRequest.req.headers['access-control-allow-headers'] ?
            [['Access-Control-Request-Headers', appRequest.req.headers['access-control-allow-headers']]] :
            [];

        return T.of({
            content: M.empty(),
            status: 204,
            headers: new Map([
                ['Access-Control-Allow-Origin', '*'],
                ['Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE'],
                ['Access-Control-Allow-Credentials', 'true'],
                ...allowHeaders
            ])
        });
    };