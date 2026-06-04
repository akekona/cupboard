-- ── Roles (IDs 1–7) ──────────────────────────────────────────────────────────
INSERT INTO roles (name, description) VALUES
  ('ADMIN',      'Full platform access and user management'),
  ('STAFF',      'General operations and order management'),
  ('ACCOUNTING', 'Invoices, payments and financial reporting'),
  ('DRIVER',     'Delivery and fulfillment tasks'),
  ('SALES',      'Client management and sales pipeline'),
  ('INVENTORY',  'Product catalog and stock management'),
  ('DEVELOPER',  'System configuration and technical access');

-- ── Users (IDs 1–3) ───────────────────────────────────────────────────────────
-- password_hash = bcrypt('password123', cost=10)
INSERT INTO users (email, first_name, last_name, password_hash, is_active, created_at, updated_at) VALUES
  ('ashley@cupboard.io', 'Ashley', 'Kekona', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lh1y', true, '2026-01-01 09:00:00', '2026-01-01 09:00:00'),
  ('kai@cupboard.io',    'Kai',    'Mauga',  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lh1y', true, '2026-01-02 09:00:00', '2026-01-02 09:00:00'),
  ('jamie@cupboard.io',  'Jamie',  'Lum',    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lh1y', true, '2026-01-03 09:00:00', '2026-01-03 09:00:00');

-- ── User Auth Providers ───────────────────────────────────────────────────────
INSERT INTO user_auth_providers (user_id, provider, provider_id) VALUES
  (1, 'LOCAL', NULL),
  (2, 'LOCAL', NULL),
  (3, 'LOCAL', NULL);

-- ── User Roles ────────────────────────────────────────────────────────────────
-- Ashley (1): ADMIN (1) + DEVELOPER (7)
-- Kai (2):    STAFF (2)
-- Jamie (3):  STAFF (2) + ACCOUNTING (3)
INSERT INTO user_roles (user_id, role_id) VALUES
  (1, 1),
  (1, 7),
  (2, 2),
  (3, 2),
  (3, 3);

-- ── Suppliers (IDs 1–4) ───────────────────────────────────────────────────────
INSERT INTO suppliers (name, contact_name, contact_email, contact_phone, address, notes) VALUES
  ('Oahu Roasters',      'Kimo Akana',  'kimo@oahuroasters.com',     '(808) 555-0101', '1234 Kapiolani Blvd, Honolulu, HI 96814', 'Specialty coffee roaster, direct-trade sourcing'),
  ('Pacific Foods Co.',  'Lena Higa',   'lena@pacificfoods.co',      '(503) 555-0202', '567 Morrison St, Portland, OR 97201',      'Dairy and alternative milk distributor'),
  ('EcoPack Hawaii',     'Maka Souza',  'maka@ecopackhawaii.com',    '(808) 555-0303', '88 Hamakua Dr, Kailua, HI 96734',          'Sustainable disposables, dishware and furniture'),
  ('Island Fresh Farms', 'Hana Kahale', 'hana@islandfreshfarms.com', '(808) 555-0404', '320 Kahekili Hwy, Kaneohe, HI 96744',     'Local produce and perishables, farm-to-cafe');

-- ── Products (IDs 1–12) ───────────────────────────────────────────────────────
-- unit_price in cents (USD). Low stock: Ethiopian (qty 14, threshold 50). OOS: espresso machine.
INSERT INTO products (sku, name, description, category, unit_price, unit, stock_quantity, reorder_threshold) VALUES
  ('COF-ETH-1KG',   'Ethiopian Single Origin 1kg',    'Light roast, floral and citrus notes, Yirgacheffe region',   'COFFEE',      2800, 'bag',      14,  50),
  ('COF-COL-1KG',   'Colombia Blend 1kg',              'Medium roast, caramel and nutty profile',                    'COFFEE',      2400, 'bag',     120,  30),
  ('DAI-OAT-C12',   'Oat Milk case/12',                'Barista-grade oat milk, 1L cartons',                         'DAIRY',       4200, 'case',     48,  12),
  ('DAI-WHL-C12',   'Whole Milk case/12',              'Full-cream fresh whole milk, 1L cartons',                    'DAIRY',       3600, 'case',     60,  15),
  ('FOOD-EGG-F30',  'Free Range Eggs flat/30',         'Locally sourced free-range eggs, Grade A',                   'FOOD',        1400, 'flat',     35,  10),
  ('FOOD-PMX-5KG',  'Pastry Mix 5kg',                  'All-purpose cafe pastry and muffin mix',                     'FOOD',        2200, 'bag',      28,   8),
  ('DISP-CUP-8S',   'Paper Cups 8oz sleeve/50',        'Single-wall hot cups, eco-certified',                        'DISPOSABLES',  950, 'sleeve',  200,  50),
  ('DISP-LID-8S',   'Lids 8oz sleeve/50',              'Sip-through lids to fit 8oz hot cups',                       'DISPOSABLES',  600, 'sleeve',  180,  50),
  ('DISH-MUG-CER',  'Ceramic Mugs',                    'Classic 8oz ceramic mugs, dishwasher safe',                  'DISHWARE',     800, 'unit',     75,  20),
  ('EQUIP-ESP-BDB', 'Espresso Machine Breville Dual',  'Breville Dual Boiler, commercial-grade espresso machine',    'EQUIPMENT', 120000, 'unit',      0,   2),
  ('FURN-TBL-RND',  'Cafe Table Round',                'Round cafe table, 75cm diameter, powder-coated steel base',  'FURNITURE',  18000, 'unit',      8,   3),
  ('CLN-APC-C6',    'All-Purpose Cleaner case/6',      'Food-safe all-purpose cleaning spray, 750ml bottles',        'CLEANING',    2400, 'case',     30,  10);

-- ── Product Suppliers ─────────────────────────────────────────────────────────
-- Colombia blend (2) has two suppliers to demonstrate multi-supplier support:
--   Oahu Roasters (preferred) and Pacific Foods Co. (non-preferred, longer lead time)
INSERT INTO product_suppliers (product_id, supplier_id, supplier_sku, cost_price, lead_time_days, is_preferred) VALUES
  (1,  1, 'OR-ETH-1KG',    2100,  3, true),
  (2,  1, 'OR-COL-1KG',    1800,  3, true),
  (2,  2, 'PF-COL-1KG',    1950,  5, false),
  (3,  2, 'PF-OAT-C12',    3200,  2, true),
  (4,  2, 'PF-WHL-C12',    2700,  2, true),
  (5,  4, 'IFF-EGG-F30',   1000,  1, true),
  (6,  4, 'IFF-PMX-5KG',   1600,  2, true),
  (7,  3, 'EP-CUP-8S',      700,  3, true),
  (8,  3, 'EP-LID-8S',      450,  3, true),
  (9,  3, 'EP-MUG-CER',     600,  5, true),
  (10, 1, 'OR-ESP-BDB',   95000, 14, true),
  (11, 3, 'EP-TBL-RND',   14000, 10, true),
  (12, 3, 'EP-APC-C6',     1800,  3, true);

-- ── Clients (IDs 1–4) ────────────────────────────────────────────────────────
INSERT INTO clients (name, contact_name, contact_email, contact_phone, address, account_status) VALUES
  ('Blue Bottle Kailua',     'T. Nakamura', 't.nakamura@bluebottle.com',  '(808) 555-1001', '315 Uluniu St, Kailua, HI 96734',            'ACTIVE'),
  ('Ritual Coffee Roasters', 'S. Park',     's.park@ritualcoffee.com',    '(415) 555-1002', '1026 Valencia St, San Francisco, CA 94110',  'ACTIVE'),
  ('Verve Coffee',           'A. Torres',   'a.torres@vervecoffee.com',   '(831) 555-1003', '104 Aptos St, Santa Cruz, CA 95060',         'ACTIVE'),
  ('Stumptown Honolulu',     'M. Wong',     'm.wong@stumptowncoffee.com', '(808) 555-1004', '1200 Ala Moana Blvd, Honolulu, HI 96814',   'SUSPENDED');

-- ── Orders (IDs 1–5) ─────────────────────────────────────────────────────────
INSERT INTO orders (client_id, created_by, status, currency, need_by, notes, created_at, updated_at) VALUES
  (1, 1, 'FULFILLED', 'USD', '2026-01-18', 'Rush order for weekend events',    '2026-01-15 10:00:00', '2026-01-20 14:00:00'),
  (2, 2, 'SHIPPED',   'USD', '2026-02-25',  NULL,                              '2026-02-20 11:00:00', '2026-02-23 09:00:00'),
  (3, 1, 'CONFIRMED', 'USD', '2026-03-20', 'Confirm mug qty with client',      '2026-03-10 09:00:00', '2026-03-11 10:00:00'),
  (1, 2, 'DRAFT',     'USD',  NULL,        'Pending client approval on qty',   '2026-05-28 14:00:00', '2026-05-28 14:00:00'),
  (3, 1, 'FULFILLED', 'USD', '2026-04-10', 'New equipment installation order', '2026-04-05 08:00:00', '2026-04-12 16:00:00');

-- ── Order Items ───────────────────────────────────────────────────────────────
INSERT INTO order_items (order_id, product_id, quantity, unit_price, currency) VALUES
  -- Order 1 (FULFILLED, Blue Bottle Kailua): total = 5×2800 + 2×4200 + 10×950 = 31900
  (1,  1,  5,  2800, 'USD'),
  (1,  3,  2,  4200, 'USD'),
  (1,  7, 10,   950, 'USD'),
  -- Order 2 (SHIPPED, Ritual Coffee):       total = 8×2400 + 3×3600 + 8×600  = 34800
  (2,  2,  8,  2400, 'USD'),
  (2,  4,  3,  3600, 'USD'),
  (2,  8,  8,   600, 'USD'),
  -- Order 3 (CONFIRMED, Verve Coffee):      total = 3×2800 + 4×1400 + 12×800 = 23600
  (3,  1,  3,  2800, 'USD'),
  (3,  5,  4,  1400, 'USD'),
  (3,  9, 12,   800, 'USD'),
  -- Order 4 (DRAFT, Blue Bottle Kailua):    total = 10×2400 + 6×2200 = 37200
  (4,  2, 10,  2400, 'USD'),
  (4,  6,  6,  2200, 'USD'),
  -- Order 5 (FULFILLED, Verve Coffee):      total = 1×120000 + 2×2400 = 124800
  (5, 10,  1, 120000, 'USD'),
  (5, 12,  2,   2400, 'USD');

-- ── Invoices (IDs 1–4, non-DRAFT orders only) ────────────────────────────────
INSERT INTO invoices (order_id, client_id, invoice_number, total_amount, currency, status, due_date, sent_at, paid_at, created_at, updated_at) VALUES
  (1, 1, 'INV-0001',  31900, 'USD', 'PAID',      '2026-02-14', '2026-01-17 09:00:00', '2026-01-30 11:00:00', '2026-01-17 09:00:00', '2026-01-30 11:00:00'),
  (2, 2, 'INV-0002',  34800, 'USD', 'SENT',      '2026-03-22', '2026-02-22 10:00:00',  NULL,                 '2026-02-22 10:00:00', '2026-02-22 10:00:00'),
  (3, 3, 'INV-0003',  23600, 'USD', 'FINALIZED', '2026-04-10',  NULL,                  NULL,                 '2026-03-11 10:00:00', '2026-03-11 10:00:00'),
  (5, 3, 'INV-0004', 124800, 'USD', 'PAID',      '2026-05-05', '2026-04-07 08:00:00', '2026-04-20 15:00:00', '2026-04-07 08:00:00', '2026-04-20 15:00:00');

-- ── Payments (PAID invoices only: invoice IDs 1 and 4) ───────────────────────
INSERT INTO payments (invoice_id, stripe_payment_id, amount, currency, payment_method, status, created_at) VALUES
  (1, 'pi_test_001',  31900, 'USD', 'STRIPE_CARD', 'SUCCEEDED', '2026-01-30 11:00:00'),
  (4, 'pi_test_002', 124800, 'USD', 'STRIPE_CARD', 'SUCCEEDED', '2026-04-20 15:00:00');
