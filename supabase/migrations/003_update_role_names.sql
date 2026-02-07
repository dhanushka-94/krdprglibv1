-- Update role names to new display format
-- Run if you already have roles from 002_users_roles.sql with old names

UPDATE roles SET name = 'Admin' WHERE name = 'admin';
UPDATE roles SET name = 'Programme Manager' WHERE name = 'editor';
UPDATE roles SET name = 'Viewer' WHERE name = 'viewer';
