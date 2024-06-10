/*
  Warnings:

  - A unique constraint covering the columns `[invite_key]` on the table `Team` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `Team` ADD COLUMN `invite_key` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Team_invite_key_key` ON `Team`(`invite_key`);
