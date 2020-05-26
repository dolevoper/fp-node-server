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

export function fetchChecklists(): Task.Task<string, Checklist[]> {
    return Task.of([]);
}