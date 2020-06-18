import { Task as T, TaskEither as TE, Func, Maybe as M, constant, compose } from '@lib';
import { Response as R, BodyParser as B } from '@fw';
import * as AppRequest from './app-request';
import * as Repository from './repository';
import * as E from './app-error';

const requireBody = <T>() => (maybeBody: M.Maybe<T>) => maybeBody.fold<TE.TaskEither<E.AppError, T>>(() => TE.rejected(E.userError(400)('body must contain checklist title')), TE.of);
const handleAppError = compose(T.of, E.toResponse);

export const getChecklists: Func<AppRequest.GetChecklists, T.Task<R.Response>> = () => Repository
    .fetchChecklists()
    .map(R.json(200))
    .getOrElse(handleAppError);

type CreateChecklistBody = { title: string };
export const createChecklist: Func<AppRequest.CreateChecklist, T.Task<R.Response>> = appRequest => B
    .json<CreateChecklistBody>(appRequest.req)
    .mapRejected(E.unknownError)
    .chain(requireBody<CreateChecklistBody>())
    .chain(({ title }) => Repository.createChecklist(title))
    .map(R.json(200))
    .getOrElse(handleAppError);

export const getItems: Func<AppRequest.GetItems, T.Task<R.Response>> = appRequest => Repository
    .getItems(appRequest.checklistId)
    .map(items => appRequest.checked.fold(
        constant(items),
        checked => items.filter(item => item.checked === checked)
    ))
    .map(R.json(200))
    .getOrElse(handleAppError);

type AddItemBody = { content: string };
export const addItem: Func<AppRequest.AddItem, T.Task<R.Response>> = appRequest => B
    .json<AddItemBody>(appRequest.req)
    .mapRejected(E.unknownError)
    .chain(requireBody<AddItemBody>())
    .chain(({ content }) => Repository.addItem(appRequest.checklistId, content))
    .map(R.json(200))
    .getOrElse(handleAppError);

type EditItemBody = { content: string, checked: boolean };
export const editItem: Func<AppRequest.EditItem, T.Task<R.Response>> = appRequest => B
    .json<EditItemBody>(appRequest.req)
    .mapRejected(E.unknownError)
    .chain(requireBody<EditItemBody>())
    .chain(({ content, checked }) => Repository.updateItem(appRequest.itemId, content, checked))
    .map(R.json(200))
    .getOrElse(handleAppError);

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