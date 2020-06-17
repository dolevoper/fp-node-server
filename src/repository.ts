import * as MySql from 'mysql';
import { Either as E, TaskEither as TE } from '@lib';
import { AppError, dbError, userError } from './app-error';

export interface Checklist {
    id: number;
    title: string;
}

export interface CheckListItem {
    id: number;
    checklistId: number;
    content: string;
    checked: boolean;
}

const connectionPool = MySql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'checklists',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

const query = <T>(options: string | MySql.QueryOptions, values: any[] = []): TE.TaskEither<MySql.MysqlError, T> => TE.taskEither((reject, resolve) => {
    connectionPool.query(options, values, (err, results: T) => {
        if (err) return reject(err);

        resolve(results);
    });
});

export function fetchChecklists(): TE.TaskEither<AppError, Checklist[]> {
    return query<Checklist[]>('SELECT id, title FROM Checklists')
        .mapRejected(dbError);
}

export function createCheckList(title: string): TE.TaskEither<AppError, Checklist> {
    return query<{ insertId: number }>('INSERT INTO Checklists (title) VALUES (?)', [title])
        .map(({ insertId }) => ({ id: insertId, title }))
        .mapRejected(dbError);
}

export function getItems(checklistId: number): TE.TaskEither<AppError, CheckListItem[]> {
    const q = `
    SELECT i.id, i.checklistId, i.content, i.checked
    FROM Checklists c
    LEFT JOIN ChecklistItems i ON i.checklistId = c.id
    WHERE c.id = ?`;

    return query<CheckListItem[]>(q, [checklistId])
        .mapRejected(dbError)
        .chain(items => {
            if (!items.length) return TE.rejected(userError(404)(`Checklist ${checklistId} does not exist`));
            if (items[0].id == null) return TE.of([]);

            return TE.of(items);
        });
}

export function addItem(checklistId: number, content: string): TE.TaskEither<AppError, CheckListItem> {
    return query<{ insertId: number }>('INSERT INTO ChecklistItems (checklistId, content, checked) VALUES (?, ?, false)', [checklistId, content])
        .map(({ insertId: id }) => ({
            id,
            checklistId,
            content,
            checked: false
        }))
        .mapRejected(err => err.code === 'ER_NO_REFERENCED_ROW_2'
            ? userError(400)(`Checklist ${checklistId} does not exist`)
            : dbError(err));
}

export function updateItem(itemId: number, content: string, checked: boolean): TE.TaskEither<AppError, CheckListItem> {
    return query<{ affectedRows: number }>('UPDATE ChecklistItems SET content = ?, checked = ? WHERE id = ?', [content, checked, itemId])
        .mapRejected(dbError)
        .chain((res) => !res.affectedRows
            ? TE.rejected(userError(404)(`Item ${itemId} does not exist`))
            : query<CheckListItem[]>('SELECT id, checklistId, content, checked FROM ChecklistItems WHERE id = ?', [itemId])
                .map(([item]) => item)
                .mapRejected(dbError)
        );
}