-- users: replace is_active with account_status
ALTER TABLE users ADD COLUMN account_status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE';
UPDATE users SET account_status = CASE WHEN is_active THEN 'ACTIVE' ELSE 'SUSPENDED' END;
ALTER TABLE users DROP COLUMN is_active;

-- suppliers: drop is_active — deleted_at IS NULL is the sole active check
ALTER TABLE suppliers DROP COLUMN is_active;

-- products: drop is_active — deleted_at IS NULL is the sole active check
ALTER TABLE products DROP COLUMN is_active;
