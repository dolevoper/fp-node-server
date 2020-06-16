import { FunctionN } from 'fp-ts/lib/function';
import * as O from 'fp-ts/lib/Option';
import * as E from 'fp-ts/lib/Either';
import { Task } from '@lib';
import { Response, BodyParser as B } from '@fw';
import * as AppRequest from './app-request';
import * as Repository from './repository';

const toTask = E.fold<string, Response.Response, Task.Task<string, Response.Response>>(
    Task.rejected,
    Task.of
);

export const getCheckLists: FunctionN<[AppRequest.GetCheckLists], Task.Task<string, Response.Response>> = () => Repository
    .fetchChecklists()
    .map(Response.json(200))
    .chain(toTask);

export const createCheckList: FunctionN<[AppRequest.CreateCheckList], Task.Task<string, Response.Response>> = appRequest => B
    .json<{ title: string }>(appRequest.req)
    .chain(O.fold(
        () => Task.of(Response.text(400, 'body must contain checklist title')),
        ({ title }) => Repository.createCheckList(title).map(Response.json(200)).chain(toTask),
    ));

export const getItems: FunctionN<[AppRequest.GetItems], Task.Task<string, Response.Response>> = appRequest => Repository
    .getItems(appRequest.checkListId)
    .map(res => res
        .map(items => O.fold(
            () => items,
            checked => items.filter(item => item.checked === checked),
        )(appRequest.checked))
        .fold(
            err => E.right(Response.text(404, err)),
            Response.json(200)
        ))
    .chain(toTask);

export const addItem: FunctionN<[AppRequest.AddItem], Task.Task<string, Response.Response>> = appRequest => B
    .json<{ content: string }>(appRequest.req)
    .chain(O.fold(
        () => Task.of(Response.text(400, 'body must contain item content')),
        ({ content }) => Repository.addItem(appRequest.checkListId, content)
            .map(res => res.fold(
                err => E.right(Response.text(404, err)),
                Response.json(200)
            ))
            .chain(toTask)
    ));

export const editItem: FunctionN<[AppRequest.EditItem], Task.Task<string, Response.Response>> = appRequest => B
    .json<{ content: string, checked: boolean }>(appRequest.req)
    .chain(O.fold(
        () => Task.of(Response.text(400, 'body must container item data')),
        ({ content, checked }) => Repository.updateItem(appRequest.itemId, content, checked)
            .map(res => res.fold(
                err => E.right(Response.text(404, err)),
                Response.json(200)
            ))
            .chain(toTask),
    ));

export const notFound: FunctionN<[AppRequest.NotFound], Task.Task<string, Response.Response>> =
    () => Task.of(Response.text(404, 'not found...'));

export const preflight: FunctionN<[AppRequest.Preflight], Task.Task<string, Response.Response>> =
    appRequest => {
        const allowHeaders: [string, string][] = appRequest.req.headers['access-control-allow-headers'] ?
            [['Access-Control-Request-Headers', appRequest.req.headers['access-control-allow-headers']]] :
            [];

        return Task.of({
            content: O.none,
            status: 204,
            headers: new Map([
                ['Access-Control-Allow-Origin', '*'],
                ['Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE'],
                ['Access-Control-Allow-Credentials', 'true'],
                ...allowHeaders
            ])
        });
    };