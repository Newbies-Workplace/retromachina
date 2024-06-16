-- DropForeignKey
ALTER TABLE `Task` DROP FOREIGN KEY `Task_owner_id_fkey`;

-- AlterTable
ALTER TABLE `Task` MODIFY `owner_id` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `Task` ADD CONSTRAINT `Task_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
