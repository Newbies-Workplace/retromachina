-- DropForeignKey
ALTER TABLE `Task` DROP FOREIGN KEY `Task_retro_id_fkey`;

-- AlterTable
ALTER TABLE `Task` MODIFY `retro_id` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `Task` ADD CONSTRAINT `Task_retro_id_fkey` FOREIGN KEY (`retro_id`) REFERENCES `Retrospective`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
