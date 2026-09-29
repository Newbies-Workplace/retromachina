CREATE TABLE `WarmupLink` (
    `id` VARCHAR(191) NOT NULL,
    `team_id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `url` TEXT NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `WarmupLink`
    ADD CONSTRAINT `WarmupLink_team_id_fkey`
    FOREIGN KEY (`team_id`) REFERENCES `Team`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;
