-- DropForeignKey
ALTER TABLE `Team` DROP FOREIGN KEY IF EXISTS `Team_owner_id_fkey`;

-- DropIndex
DROP INDEX `Team_owner_id_fkey` ON `Team`;

-- AlterTable
ALTER TABLE `Invite` MODIFY `role` ENUM('ADMIN', 'USER', 'OWNER') NOT NULL DEFAULT 'USER';

-- AlterTable
ALTER TABLE `TeamUsers` MODIFY `role` ENUM('ADMIN', 'USER', 'OWNER') NOT NULL DEFAULT 'USER';

-- Preserve owner roles on TeamUsers
UPDATE `TeamUsers` tu
    JOIN `Team` t ON tu.`team_id` = t.`id` AND tu.`user_id` = t.`owner_id`
SET tu.`role` = 'OWNER';

-- AlterTable
ALTER TABLE `Team` DROP COLUMN `owner_id`;

ALTER TABLE `BoardColumn` DROP COLUMN `color`;
