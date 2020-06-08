ALTER TABLE `checklist_items`
    ADD CONSTRAINT `fk_checklist_items`
    FOREIGN KEY (`checklist_id`)
    REFERENCES `checklists`(`id`);