ALTER TABLE `Team` ADD COLUMN `slug` VARCHAR(100) NULL;
UPDATE `Team` SET `slug` = TRIM(BOTH '-' FROM LEFT(TRIM(BOTH '-' FROM REGEXP_REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(LOWER(`name`), 'ą', 'a'), 'ć', 'c'), 'ę', 'e'), 'ł', 'l'), 'ń', 'n'), 'ó', 'o'), 'ś', 's'), 'ź', 'z'), 'ż', 'z'), 'á', 'a'), 'à', 'a'), 'ä', 'a'), 'â', 'a'), 'é', 'e'), 'è', 'e'), 'ë', 'e'), 'ê', 'e'), 'í', 'i'), 'ï', 'i'), 'î', 'i'), 'ö', 'o'), 'ô', 'o'), 'ú', 'u'), 'ü', 'u'), 'û', 'u'), 'ñ', 'n'), 'ç', 'c'), '[^a-z0-9]+', '-')), 80));
UPDATE `Team` SET `slug` = 'team' WHERE `slug` = '';
UPDATE `Team` SET `slug` = CONCAT(`slug`, '-team') WHERE `slug` IN ('api', 'www', 'admin', 'mail', 'app', 'assets', 'static', 'cdn', 'hero', 'signin', 'loading', 'privacy', 'team', 'retro', 'invitation', 'organizations', 'gramophone', '404');
ALTER TABLE `Team` MODIFY `slug` VARCHAR(100) NOT NULL;
CREATE UNIQUE INDEX `Team_organization_id_slug_key` ON `Team` (`organization_id`, `slug`);
