import * as MySql from 'mysql';
import * as E from 'fp-ts/lib/Either';
import * as T from 'fp-ts/lib/TaskEither';
import { FunctionN, pipe } from 'fp-ts/lib/function';
// import { Task } from '@lib';

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

const query = <T>(options: string | MySql.QueryOptions, values: any[] = []) => T.tryCatch<Error, T>(() => new Promise((resolve, reject) => {
    connectionPool.query(options, values, (err, results: T) => {
        if (err) return reject(err);

        resolve(results);
    });
}), E.toError);

export function fetchChecklists(): T.TaskEither<string, Checklist[]> {
    return pipe(
        query<Checklist[]>('SELECT id, title FROM Checklists'),
        T.mapLeft(err => err.message)
    );
}

export function createCheckList(title: string): T.TaskEither<string, Checklist> {
    return pipe(
        query<{ insertId: number }>('INSERT INTO Checklists (title) VALUES (?)', [title]),
        T.bimap(
            err => err.message,
            ({ insertId }) => ({ id: insertId, title })
        )
    );
}

export function getItems(checklistId: number): T.TaskEither<string, E.Either<string, CheckListItem[]>> {
    const q = `
    SELECT i.id, i.checklistId, i.content, i.checked
    FROM Checklists c
    LEFT JOIN ChecklistItems i ON i.checklistId = c.id
    WHERE c.id = ?`;

    return pipe(
        query<CheckListItem[]>(q, [checklistId]),
        T.bimap(
            err => err.message,
            items => {
                if (!items.length) return E.left<string, CheckListItem[]>(`Checklist ${checklistId} does not exist`);
                if (items[0].id == null) return E.right<string, CheckListItem[]>([]);
    
                return E.right<string, CheckListItem[]>(items);
            }
        )
    );
}

export function addItem(checklistId: number, content: string): T.TaskEither<string, E.Either<string, CheckListItem>> {
    return pipe(
        query<{ insertId: number }>('INSERT INTO ChecklistItems (checklistId, content, checked) VALUES (?, ?, false)', [checklistId, content]),
        T.map(({ insertId: id }) => E.right<string, CheckListItem>({
            id,
            checklistId,
            content,
            checked: false
        })),
        T.
    );
    return query<{ insertId: number }>('INSERT INTO ChecklistItems (checklistId, content, checked) VALUES (?, ?, false)', [checklistId, content])
        .map(({ insertId: id }) => E.right<string, CheckListItem>({
            id,
            checklistId,
            content,
            checked: false
        }))
        .chainRejected(err => err.code === 'ER_NO_REFERENCED_ROW_2'
            ? Task.of<MySql.MysqlError, E.Either<string, CheckListItem>>(E.left(`Checklist ${checklistId} does not exist`))
            : Task.rejected<MySql.MysqlError, E.Either<string, CheckListItem>>(err))
        .mapRejected(err => err.message);
}

export function updateItem(itemId: number, content: string, checked: boolean): T.TaskEither<string, E.Either<string, CheckListItem>> {
    return query<{ affectedRows: number }>('UPDATE ChecklistItems SET content = ?, checked = ? WHERE id = ?', [content, checked, itemId])
        .chain((res) => !res.affectedRows
            ? Task.of<MySql.MysqlError, E.Either<string, CheckListItem>>(E.left(`Item ${itemId} does not exist`))
            : query<CheckListItem[]>('SELECT id, checklistId, content, checked FROM ChecklistItems WHERE id = ?', [itemId])
                .map(([item]) => E.right<string, CheckListItem>(item))
        )
        .mapRejected(err => err.message);
}