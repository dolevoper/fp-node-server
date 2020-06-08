import * as MySql from 'mysql';
import { Either, Task } from '@lib';

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

export function fetchChecklists(): Task.Task<string, Checklist[]> {
    return Task.task((reject, resolve) => {
        connectionPool.query('SELECT id, title FROM Checklists', (err, results: Checklist[]) => {
            if (err) return reject(err.message);

            resolve(results);
        });
    });
}

export function createCheckList(title: string): Task.Task<string, Checklist> {
    return Task.task((reject, resolve) => {
        connectionPool.query('INSERT INTO Checklists (title) VALUES (?)', [title], (err, { insertId }: { insertId: number }) => {
            if (err) return reject(err.message);

            resolve({
                id: insertId,
                title
            });
        });
    });
}

export function getItems(checklistId: number): Task.Task<string, Either.Either<string, CheckListItem[]>> {
    return Task.task((reject, resolve) => {
        connectionPool.query('SELECT id FROM Checklists WHERE id = ?', [checklistId], (err, results) => {
            if (err) return reject(err.message);

            if (!results.length) return resolve(Either.left(`Checklist ${checklistId} does not exist`));

            connectionPool.query('SELECT id, checklistId, content, checked FROM ChecklistItems WHERE checklistId = ?', [checklistId], (err, results: CheckListItem[]) => {
                if (err) return reject(err.message);

                resolve(Either.right(results));
            });
        });
    });
}

export function addItem(checklistId: number, content: string): Task.Task<string, Either.Either<string, CheckListItem>> {
    return Task.task((reject, resolve) => {
        connectionPool.query('SELECT id FROM Checklists WHERE id = ?', [checklistId], (err, results) => {
            if (err) return reject(err.message);

            if (!results.length) return resolve(Either.left(`Checklist ${checklistId} does not exist`));

            connectionPool.query('INSERT INTO ChecklistItems (checklistId, content, checked) VALUES (?, ?, false)', [checklistId, content], (err, { insertId }: { insertId: number }) => {
                if (err) return reject(err.message);

                resolve(Either.right({
                    id: insertId,
                    checklistId,
                    content,
                    checked: false
                }));
            });
        });
    });
}

export function updateItem(itemId: number, content: string, checked: boolean): Task.Task<string, Either.Either<string, CheckListItem>> {
    return Task.task((reject, resolve) => {
        connectionPool.query('UPDATE ChecklistItems SET content = ?, checked = ? WHERE id = ?', [content, checked, itemId], (err, { affectedRows }: { affectedRows: number }) => {
            if (err) return reject(err.message);

            if (!affectedRows) return resolve(Either.left(`Item ${itemId} does not exist`));

            resolve(Either.right({
                id: itemId,
                checklistId: 1,
                content,
                checked
            }));
        });
    });
}