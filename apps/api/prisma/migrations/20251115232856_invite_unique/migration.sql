/*
  Warnings:

  - A unique constraint covering the columns `[team_id,email]` on the table `Invite` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `Invite_team_id_email_key` ON `Invite`(`team_id`, `email`);
