-- Rename seed emails to @cupboard.test to avoid accidental sends to a real domain
UPDATE users SET email = 'ashley@cupboard.test' WHERE email = 'ashley@cupboard.io';
UPDATE users SET email = 'kai@cupboard.test'    WHERE email = 'kai@cupboard.io';
UPDATE users SET email = 'jamie@cupboard.test'  WHERE email = 'jamie@cupboard.io';

-- Fix password hashes — correct bcrypt hash for 'password123' (cost=10)
UPDATE users
SET password_hash = '$2a$10$2B/m47ueducyAaiFmRxs7eX4J72cPEqsmPe9v8vzwE4ZXreYPGNnO'
WHERE email IN ('ashley@cupboard.test', 'kai@cupboard.test', 'jamie@cupboard.test');
