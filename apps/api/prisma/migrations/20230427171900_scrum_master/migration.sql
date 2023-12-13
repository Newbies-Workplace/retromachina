-- DropForeignKey
ALTER TABLE `Invite` DROP FOREIGN KEY `Invite_from_scrum_id_fkey`;

-- DropForeignKey
ALTER TABLE `Team` DROP FOREIGN KEY `Team_scrum_master_id_fkey`;

-- AlterTable
ALTER TABLE `Invite`
    RENAME COLUMN `from_scrum_id` TO `from`,
    ADD COLUMN `role` ENUM('USER', 'ADMIN') NOT NULL DEFAULT 'USER';

-- AlterTable
ALTER TABLE `Team`
    RENAME COLUMN `scrum_master_id` TO `owner_id`;

-- AlterTable
ALTER TABLE `TeamUsers` ADD COLUMN `role` ENUM('USER', 'ADMIN') NOT NULL DEFAULT 'USER';

UPDATE `TeamUsers`
    SET `role` = 'ADMIN'
    WHERE id IN (
        SELECT `TeamUsers`.`id` FROM `TeamUsers`
            JOIN `Team` ON `Team`.`id` = `TeamUsers`.`team_id`
            JOIN `User` ON `User`.`id` = `Team`.`owner_id`
            WHERE `TeamUsers`.`user_id` = `User`.`id`
    );

-- AlterTable
ALTER TABLE `User` DROP COLUMN `user_type`;

-- AddForeignKey
ALTER TABLE `Team` ADD CONSTRAINT `Team_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Invite` ADD CONSTRAINT `Invite_from_fkey` FOREIGN KEY (`from`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `TeamUsers` DROP PRIMARY KEY, DROP COLUMN `id`;
CREATE UNIQUE INDEX `TeamUsers_team_id_user_id_key` ON `TeamUsers`(`team_id`, `user_id`);
