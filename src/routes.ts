import { IncomingMessage } from 'http';
import * as MySql from 'mysql';
import { Task as T, TaskEither as TE, ReaderTask as RT, ReaderTaskEither as RTE, Func, Maybe as M, constant, compose } from '@lib';
import { Response as R, BodyParser as B } from '@fw';
import * as AppRequest from './app-request';
import * as Repository from './repository';
import * as E from './app-error';

const connectionPool = MySql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'checklists',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

const handleAppError = compose(RT.of, E.toResponse);
const validateBody = <T>(req: IncomingMessage): TE.TaskEither<E.AppError, T> => B
    .json<T>(req)
    .mapRejected(E.unknownError)
    .chain(maybeBody => maybeBody.fold<TE.TaskEither<E.AppError, T>>(() => TE.rejected(E.userError('body must contain checklist title')), TE.of));

export const getChecklists: Func<AppRequest.GetChecklists, T.Task<R.Response>> = () => Repository
    .fetchChecklists()
    .map(R.json(200))
    .getOrElse(handleAppError)
    .run({ connectionPool });

type CreateChecklistBody = { title: string };
export const createChecklist: Func<AppRequest.CreateChecklist, T.Task<R.Response>> = appRequest =>
    RTE.fromTaskEither(validateBody<CreateChecklistBody>(appRequest.req))
        .chain(({ title }) => Repository.createChecklist(title))
        .map(R.json(200))
        .getOrElse(handleAppError)
        .run({ connectionPool });

export const getItems: Func<AppRequest.GetItems, T.Task<R.Response>> = appRequest => Repository
    .getItems(appRequest.checklistId)
    .map(items => appRequest.checked.fold(
        constant(items),
        checked => items.filter(item => item.checked === checked)
    ))
    .map(R.json(200))
    .getOrElse(handleAppError)
    .run({ connectionPool });

type AddItemBody = { content: string };
export const addItem: Func<AppRequest.AddItem, T.Task<R.Response>> = appRequest =>
    RTE.fromTaskEither(validateBody<AddItemBody>(appRequest.req))
        .chain(({ content }) => Repository.addItem(appRequest.checklistId, content))
        .map(R.json(200))
        .getOrElse(handleAppError)
        .run({ connectionPool });

type EditItemBody = { content: string, checked: boolean };
export const editItem: Func<AppRequest.EditItem, T.Task<R.Response>> = appRequest =>
    RTE.fromTaskEither(validateBody<EditItemBody>(appRequest.req))
        .chain(({ content, checked }) => Repository.updateItem(appRequest.itemId, content, checked))
        .map(R.json(200))
        .getOrElse(handleAppError)
        .run({ connectionPool });

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