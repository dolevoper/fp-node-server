import { IncomingMessage } from 'http';
import { TaskEither as TE, ReaderTask as RT, ReaderTaskEither as RTE, Func, Maybe as M, constant, compose } from '@lib';
import { Response as R, BodyParser as B } from '@fw';
import { AppConfig } from 'app-config';
import * as AppRequest from './app-request';
import * as Repository from './repository';
import * as E from './app-error';

const handleAppError = compose(RT.of, E.toResponse);
const validateBody = <T>(req: IncomingMessage): TE.TaskEither<E.AppError, T> => B
    .json<T>(req)
    .mapRejected(E.unknownError)
    .chain(maybeBody => maybeBody.fold<TE.TaskEither<E.AppError, T>>(() => TE.rejected(E.userError('body must contain checklist title')), TE.of));

export const getChecklists: Func<AppRequest.GetChecklists, RT.ReaderTask<AppConfig, R.Response>> = () => Repository
    .fetchChecklists()
    .map(R.json(200))
    .getOrElse(handleAppError);

type CreateChecklistBody = { title: string };
export const createChecklist: Func<AppRequest.CreateChecklist, RT.ReaderTask<AppConfig, R.Response>> = appRequest =>
    RTE.fromTaskEither(validateBody<CreateChecklistBody>(appRequest.req))
        .chain(({ title }) => Repository.createChecklist(title))
        .map(R.json(200))
        .getOrElse(handleAppError);

export const getItems: Func<AppRequest.GetItems, RT.ReaderTask<AppConfig, R.Response>> = appRequest => Repository
    .getItems(appRequest.checklistId)
    .map(items => appRequest.checked.fold(
        constant(items),
        checked => items.filter(item => item.checked === checked)
    ))
    .map(R.json(200))
    .getOrElse(handleAppError);

type AddItemBody = { content: string };
export const addItem: Func<AppRequest.AddItem, RT.ReaderTask<AppConfig, R.Response>> = appRequest =>
    RTE.fromTaskEither(validateBody<AddItemBody>(appRequest.req))
        .chain(({ content }) => Repository.addItem(appRequest.checklistId, content))
        .map(R.json(200))
        .getOrElse(handleAppError);

type EditItemBody = { content: string, checked: boolean };
export const editItem: Func<AppRequest.EditItem, RT.ReaderTask<AppConfig, R.Response>> = appRequest =>
    RTE.fromTaskEither(validateBody<EditItemBody>(appRequest.req))
        .chain(({ content, checked }) => Repository.updateItem(appRequest.itemId, content, checked))
        .map(R.json(200))
        .getOrElse(handleAppError);

export const notFound: Func<AppRequest.NotFound, RT.ReaderTask<AppConfig, R.Response>> =
    () => RT.of(R.text(404, 'not found...'));

export const preflight: Func<AppRequest.Preflight, RT.ReaderTask<AppConfig, R.Response>> =
    appRequest => {
        const allowHeaders: [string, string][] = appRequest.req.headers['access-control-allow-headers'] ?
            [['Access-Control-Request-Headers', appRequest.req.headers['access-control-allow-headers']]] :
            [];

        return RT.of({
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