CREATE TABLE `PokerDeck` (
    `id` VARCHAR(191) NOT NULL,
    `team_id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `cards` JSON NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `PokerDeck_team_id_idx`(`team_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `PokerDeck`
    ADD CONSTRAINT `PokerDeck_team_id_fkey`
    FOREIGN KEY (`team_id`) REFERENCES `Team`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;
