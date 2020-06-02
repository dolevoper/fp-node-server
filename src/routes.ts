import { Either, Task, Func, constant, Maybe } from '@lib';
import { Response, BodyParser as B } from '@fw';
import * as AppRequest from './app-request';
import * as Repository from './repository';

export const getCheckLists: Func<AppRequest.GetCheckLists, Task.Task<string, Response.Response>> = () => Repository
    .fetchChecklists()
    .map(Response.json(200))
    .chain(Either.toTask);

export const createCheckList: Func<AppRequest.CreateCheckList, Task.Task<string, Response.Response>> = appRequest => B
    .json<{ title: string }>(appRequest.req)
    .chain(body => body.fold(
        ({ title }) => Repository.createCheckList(title).map(Response.json(200)).chain(Either.toTask),
        constant(Task.of(Response.text(400, 'body must contain checklist title')))
    ));

export const getItems: Func<AppRequest.GetItems, Task.Task<string, Response.Response>> = appRequest => Repository
    .getItems(appRequest.checkListId)
    .map(res => res
        .map(items => appRequest.checked.fold(
            checked => items.filter(item => item.checked === checked),
            constant(items)
        ))
        .fold<Either.Either<string, Response.Response>>(
            err => Either.right(Response.text(404, err)),
            Response.json(200)
        ))
    .chain(Either.toTask);

export const addItem: Func<AppRequest.AddItem, Task.Task<string, Response.Response>> = appRequest => B
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

export const editItem: Func<AppRequest.EditItem, Task.Task<string, Response.Response>> = appRequest => B
    .json<{ content: string, checked: boolean }>(appRequest.req)
    .chain(body => body.fold(
        ({ content, checked }) => Repository.updateItem(appRequest.itemId, content, checked)
            .map(res => res.fold<Either.Either<string, Response.Response>>(
                err => Either.right(Response.text(404, err)),
                Response.json(200)
            ))
            .chain(Either.toTask),
        constant(Task.of(Response.text(400, 'body must container item data')))
    ));

export const notFound: Func<AppRequest.NotFound, Task.Task<string, Response.Response>> =
    () => Task.of(Response.text(404, 'not found...'));

export const preflight: Func<AppRequest.Preflight, Task.Task<string, Response.Response>> =
    appRequest => {
        const allowHeaders: [string, string][] = appRequest.req.headers['access-control-allow-headers'] ?
            [['Access-Control-Request-Headers', appRequest.req.headers['access-control-allow-headers']]] :
            [];

        return Task.of({
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