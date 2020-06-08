CREATE TABLE `checklists` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `title` VARCHAR(100) NOT NULL
);

CREATE TABLE `checklist_items` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `checklist_id` INT NOT NULL,
    `content` VARCHAR(500) NOT NULL,
    `checked` BOOLEAN NOT NULL
);