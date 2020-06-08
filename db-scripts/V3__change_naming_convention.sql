ALTER TABLE `checklist_items` RENAME COLUMN `checklist_id` TO `checklistId`;

RENAME TABLE `checklists` TO `Checklists`, `checklist_items` TO `ChecklistItems`;