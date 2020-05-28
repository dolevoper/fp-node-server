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

let nextChecklistId = 1;
const checklistsById: Map<number, Checklist> = new Map();

let nextChecklistItemId = 1;
const checklistItemsById: Map<number, CheckListItem> = new Map();

export function fetchChecklists(): Task.Task<string, Checklist[]> {
    return Task.of(Array.from(checklistsById.values()));
}

export function createCheckList(title: string): Task.Task<string, Checklist> {
    const newChecklist: Checklist = {
        id: nextChecklistId++,
        title
    };

    checklistsById.set(newChecklist.id, newChecklist);

    return Task.of(newChecklist);
}

export function getItems(checklistId: number): Task.Task<string, Either.Either<string, CheckListItem[]>> {
    if (!checklistsById.has(checklistId)) return Task.of(Either.left(`Checklist ${checklistId} does not exist`));

    const items = Array.from(checklistItemsById.values()).filter(item => item.checklistId === checklistId);

    return Task.of(Either.right(items));
}

export function addItem(checklistId: number, content: string): Task.Task<string, Either.Either<string, CheckListItem>> {
    if (!checklistsById.has(checklistId)) return Task.of(Either.left(`Checklist ${checklistId} does not exist.`));

    const newChecklistItem: CheckListItem = {
        id: nextChecklistItemId++,
        checklistId,
        content,
        checked: false
    };

    checklistItemsById.set(newChecklistItem.id, newChecklistItem);

    return Task.of(Either.right(newChecklistItem));
}