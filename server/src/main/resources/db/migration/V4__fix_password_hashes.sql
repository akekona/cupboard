-- Fix seed user password hashes — correct bcrypt hash for 'password123' (cost=10)
UPDATE users
SET password_hash = '$2a$10$2B/m47ueducyAaiFmRxs7eX4J72cPEqsmPe9v8vzwE4ZXreYPGNnO'
WHERE email IN (
    'ashley@cupboard.test',
    'kai@cupboard.test',
    'jamie@cupboard.test',
    'tiana@cupboard.test'
);
