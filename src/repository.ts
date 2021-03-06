import * as MySql from 'mysql';
import { Either as E, TaskEither as TE, ReaderTaskEither as RTE } from '@lib';
import { AppError, dbError, userError } from './app-error';
import { AppConfig } from 'app-config';

export interface Checklist {
    id: number;
    title: string;
}

interface DbChecklistItem {
    id: number;
    checklistId: number;
    content: string;
    checked: 0 | 1;
}

export interface ChecklistItem {
    id: number;
    checklistId: number;
    content: string;
    checked: boolean;
}

const query = <T>(options: string | MySql.QueryOptions, values: any[] = []): RTE.ReaderTaskEither<AppConfig, MySql.MysqlError, T> =>
    RTE.readerTaskEither(({ connectionPool }) => TE.taskEither((reject, resolve) => {
        connectionPool.query(options, values, (err, results: T) => {
            if (err) return reject(err);
    
            resolve(results);
        });
    }));

const fromDbChecklistItem = (item: DbChecklistItem): ChecklistItem => ({
    ...item,
    checked: Boolean(item.checked)
});

export function fetchChecklists(): RTE.ReaderTaskEither<AppConfig, AppError, Checklist[]> {
    return query<Checklist[]>('SELECT id, title FROM Checklists')
        .mapRejected(dbError);
}

export function createChecklist(title: string): RTE.ReaderTaskEither<AppConfig, AppError, Checklist> {
    return query<{ insertId: number }>('INSERT INTO Checklists (title) VALUES (?)', [title])
        .bimap(
            dbError,
            ({ insertId }) => ({ id: insertId, title })
        );
}

export function getItems(checklistId: number): RTE.ReaderTaskEither<AppConfig, AppError, ChecklistItem[]> {
    const q = `
    SELECT i.id, i.checklistId, i.content, i.checked
    FROM Checklists c
    LEFT JOIN ChecklistItems i ON i.checklistId = c.id
    WHERE c.id = ?`;

    return query<DbChecklistItem[]>(q, [checklistId])
        .mapRejected(dbError)
        .chainEither(items => {
            if (!items.length) return E.left<AppError, ChecklistItem[]>(userError(`Checklist ${checklistId} does not exist`, 404));
            if (items[0].id == null) return E.right([]);

            return E.right(items.map(fromDbChecklistItem));
        });
}

export function addItem(checklistId: number, content: string): RTE.ReaderTaskEither<AppConfig, AppError, ChecklistItem> {
    const toAppError = (err: MySql.MysqlError): AppError => err.code === 'ER_NO_REFERENCED_ROW_2'
        ? userError(`Checklist ${checklistId} does not exist`)
        : dbError(err);

    return query<{ insertId: number }>('INSERT INTO ChecklistItems (checklistId, content, checked) VALUES (?, ?, false)', [checklistId, content])
        .bimap(
            toAppError,
            ({ insertId: id }) => ({
                id,
                checklistId,
                content,
                checked: false
            })
        );
}

export function updateItem(itemId: number, content: string, checked: boolean): RTE.ReaderTaskEither<AppConfig, AppError, ChecklistItem> {
    return query<{ affectedRows: number }>('UPDATE ChecklistItems SET content = ?, checked = ? WHERE id = ?', [content, checked, itemId])
        .mapRejected(dbError)
        .chainEither(({ affectedRows }) => !affectedRows ? E.left(userError(`Item ${itemId} does not exist`, 404)) : E.right({ affectedRows }))
        .chain(_ => query<DbChecklistItem[]>('SELECT id, checklistId, content, checked FROM ChecklistItems WHERE id = ?', [itemId])
        .bimap(
            dbError,
            ([item]) => fromDbChecklistItem(item)
        ));
}