-- DropForeignKey
ALTER TABLE `Invite` DROP FOREIGN KEY `Invite_team_id_fkey`;

-- DropForeignKey
ALTER TABLE `Retrospective` DROP FOREIGN KEY `Retrospective_team_id_fkey`;

-- DropForeignKey
ALTER TABLE `Task` DROP FOREIGN KEY `Task_team_id_fkey`;

-- DropForeignKey
ALTER TABLE `TeamUsers` DROP FOREIGN KEY `TeamUsers_team_id_fkey`;

-- AddForeignKey
ALTER TABLE `TeamUsers` ADD CONSTRAINT `TeamUsers_team_id_fkey` FOREIGN KEY (`team_id`) REFERENCES `Team`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Task` ADD CONSTRAINT `Task_team_id_fkey` FOREIGN KEY (`team_id`) REFERENCES `Team`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Retrospective` ADD CONSTRAINT `Retrospective_team_id_fkey` FOREIGN KEY (`team_id`) REFERENCES `Team`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Invite` ADD CONSTRAINT `Invite_team_id_fkey` FOREIGN KEY (`team_id`) REFERENCES `Team`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
