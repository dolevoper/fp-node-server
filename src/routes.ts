import { Either, Task, Func, constant } from '@lib';
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
    .map(res => res.fold<Either.Either<string, Response.Response>>(
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

export const notFound: Func<AppRequest.NotFound, Task.Task<string, Response.Response>> =
    () => Task.of(Response.text(404, 'not found...'));