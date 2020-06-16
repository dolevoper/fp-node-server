import * as MySql from 'mysql';
import { Either, TaskEither as T } from '@lib';

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

const query = <T>(options: string | MySql.QueryOptions, values: any[] = []): T.TaskEither<MySql.MysqlError, T> => T.task((reject, resolve) => {
    connectionPool.query(options, values, (err, results: T) => {
        if (err) return reject(err);

        resolve(results);
    });
});

export function fetchChecklists(): T.TaskEither<string, Checklist[]> {
    return query<Checklist[]>('SELECT id, title FROM Checklists')
        .mapRejected(err => err.message);
}

export function createCheckList(title: string): T.TaskEither<string, Checklist> {
    return query<{ insertId: number }>('INSERT INTO Checklists (title) VALUES (?)', [title])
        .map(({ insertId }) => ({ id: insertId, title }))
        .mapRejected(err => err.message);
}

export function getItems(checklistId: number): T.TaskEither<string, Either.Either<string, CheckListItem[]>> {
    const q = `
    SELECT i.id, i.checklistId, i.content, i.checked
    FROM Checklists c
    LEFT JOIN ChecklistItems i ON i.checklistId = c.id
    WHERE c.id = ?`;

    return query<CheckListItem[]>(q, [checklistId])
        .map(items => {
            if (!items.length) return Either.left<string, CheckListItem[]>(`Checklist ${checklistId} does not exist`);
            if (items[0].id == null) return Either.right<string, CheckListItem[]>([]);

            return Either.right<string, CheckListItem[]>(items);
        })
        .mapRejected(err => err.message);
}

export function addItem(checklistId: number, content: string): T.TaskEither<string, Either.Either<string, CheckListItem>> {
    return query<{ insertId: number }>('INSERT INTO ChecklistItems (checklistId, content, checked) VALUES (?, ?, false)', [checklistId, content])
        .map(({ insertId: id }) => Either.right<string, CheckListItem>({
            id,
            checklistId,
            content,
            checked: false
        }))
        .chainRejected(err => err.code === 'ER_NO_REFERENCED_ROW_2'
            ? T.of<MySql.MysqlError, Either.Either<string, CheckListItem>>(Either.left(`Checklist ${checklistId} does not exist`))
            : T.rejected<MySql.MysqlError, Either.Either<string, CheckListItem>>(err))
        .mapRejected(err => err.message);
}

export function updateItem(itemId: number, content: string, checked: boolean): T.TaskEither<string, Either.Either<string, CheckListItem>> {
    return query<{ affectedRows: number }>('UPDATE ChecklistItems SET content = ?, checked = ? WHERE id = ?', [content, checked, itemId])
        .chain((res) => !res.affectedRows
            ? T.of<MySql.MysqlError, Either.Either<string, CheckListItem>>(Either.left(`Item ${itemId} does not exist`))
            : query<CheckListItem[]>('SELECT id, checklistId, content, checked FROM ChecklistItems WHERE id = ?', [itemId])
                .map(([item]) => Either.right<string, CheckListItem>(item))
            )
        .mapRejected(err => err.message);
}