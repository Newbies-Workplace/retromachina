/*
  Warnings:

  - You are about to drop the column `state` on the `Task` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `Task` DROP COLUMN `state`,
    ADD COLUMN `column_id` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `Board` (
    `team_id` VARCHAR(191) NOT NULL,
    `default_column_id` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`team_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BoardColumn` (
    `id` VARCHAR(191) NOT NULL,
    `team_id` VARCHAR(191) NOT NULL,
    `order` INTEGER NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `color` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO Board (team_id, default_column_id)
    SELECT Team.id, 'a'
    FROM Team;

INSERT INTO BoardColumn (id, team_id, `order`, name, color)
    SELECT UUID(), Team.id, 0, 'Backlog', '#4848db'
    FROM Team;

UPDATE Board
    JOIN BoardColumn BC on Board.team_id = BC.team_id
    SET Board.default_column_id = BC.id;

UPDATE Task
    JOIN BoardColumn BC on Task.team_id = BC.team_id
    SET Task.column_id = BC.id;

-- AddForeignKey
ALTER TABLE `Board` ADD CONSTRAINT `Board_team_id_fkey` FOREIGN KEY (`team_id`) REFERENCES `Team`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BoardColumn` ADD CONSTRAINT `BoardColumn_team_id_fkey` FOREIGN KEY (`team_id`) REFERENCES `Board`(`team_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Task` ADD CONSTRAINT `Task_Board_team_id_fkey` FOREIGN KEY (`team_id`) REFERENCES `Board`(`team_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Task` ADD CONSTRAINT `Task_column_id_fkey` FOREIGN KEY (`column_id`) REFERENCES `BoardColumn`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
