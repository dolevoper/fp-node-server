import * as Task from './task';

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

let nextChecklistId = 1;
const checklistsById: Map<number, Checklist> = new Map();

let nextChecklistItemId = 1;
const checklistItemsById: Map<number, CheckListItem> = new Map();

export function fetchChecklists(): Task.Task<string, Checklist[]> {
    return Task.of(Array.from(checklistsById.values()));
}

export function createCheckList(title: string): Task.Task<string, Checklist> {
    return Task.task((_, resolve) => {
        const newChecklist: Checklist = {
            id: nextChecklistId++,
            title
        };

        checklistsById.set(newChecklist.id, newChecklist);

        resolve(newChecklist);
    });
}

export function getItems(checklistId: number): Task.Task<string, CheckListItem[]> {
    return Task.of(Array.from(checklistItemsById.values()).filter(item => item.checklistId === checklistId));
}

export function addItem(checklistId: number, content: string): Task.Task<string, CheckListItem> {
    return Task.task((reject, resolve) => {
        if (!checklistsById.has(checklistId)) return reject(`Checklist ${checklistId} does not exist.`);

        const newChecklistItem: CheckListItem = {
            id: nextChecklistItemId++,
            checklistId,
            content,
            checked: false
        };

        checklistItemsById.set(newChecklistItem.id, newChecklistItem);

        resolve(newChecklistItem);
    });
}