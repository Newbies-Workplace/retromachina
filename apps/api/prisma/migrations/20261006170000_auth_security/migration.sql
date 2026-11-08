-- CreateTable
CREATE TABLE `AuthSession` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `expires_at` DATETIME(3) NOT NULL,
    `revoked_at` DATETIME(3) NULL,

    INDEX `AuthSession_expires_at_idx`(`expires_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AuthRefreshToken` (
    `hash` VARCHAR(64) NOT NULL,
    `session_id` VARCHAR(191) NOT NULL,
    `used_at` DATETIME(3) NULL,

    INDEX `AuthRefreshToken_session_id_idx`(`session_id`),
    PRIMARY KEY (`hash`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `OAuthState` (
    `hash` VARCHAR(64) NOT NULL,
    `binding_hash` VARCHAR(64) NOT NULL,
    `expires_at` DATETIME(3) NOT NULL,

    INDEX `OAuthState_expires_at_idx`(`expires_at`),
    PRIMARY KEY (`hash`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `AuthSession` ADD CONSTRAINT `AuthSession_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AuthRefreshToken` ADD CONSTRAINT `AuthRefreshToken_session_id_fkey` FOREIGN KEY (`session_id`) REFERENCES `AuthSession`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

