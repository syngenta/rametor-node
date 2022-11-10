CREATE TABLE `unittest_fk` (id INT(11) UNSIGNED NOT NULL PRIMARY KEY AUTO_INCREMENT);
ALTER TABLE `unittest_fk` ADD `unittest_id` INT  NULL  DEFAULT NULL  AFTER `id`;
ALTER TABLE `unittest_fk` CHANGE `unittest_id` `unittest_id` INT  UNSIGNED  NOT NULL;
ALTER TABLE `unittest_fk` ADD CONSTRAINT `unittest_fk_id` FOREIGN KEY (`unittest_id`) REFERENCES `unittest`.`unittest` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION;
