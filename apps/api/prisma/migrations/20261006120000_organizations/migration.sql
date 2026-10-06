CREATE TABLE `Organization` (
  `id` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `slug` VARCHAR(63) NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `Organization_slug_key` (`slug`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `OrganizationUsers` (
  `organization_id` VARCHAR(191) NOT NULL,
  `user_id` VARCHAR(191) NOT NULL,
  `role` ENUM('ADMIN', 'USER', 'OWNER') NOT NULL DEFAULT 'USER',
  INDEX `OrganizationUsers_user_id_idx` (`user_id`),
  PRIMARY KEY (`organization_id`, `user_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `Team` ADD COLUMN `organization_id` VARCHAR(191) NULL;
ALTER TABLE `Team` ADD CONSTRAINT `Team_organization_id_fkey`
  FOREIGN KEY (`organization_id`) REFERENCES `Organization` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `OrganizationUsers` ADD CONSTRAINT `OrganizationUsers_organization_id_fkey`
  FOREIGN KEY (`organization_id`) REFERENCES `Organization` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `OrganizationUsers` ADD CONSTRAINT `OrganizationUsers_user_id_fkey`
  FOREIGN KEY (`user_id`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
