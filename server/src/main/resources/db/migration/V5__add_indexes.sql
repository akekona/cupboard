-- ── orders ───────────────────────────────────────────────────────────────────
-- FK columns (PostgreSQL does not auto-index these)
CREATE INDEX idx_orders_client_id   ON orders(client_id);
CREATE INDEX idx_orders_created_by  ON orders(created_by);
-- Common filter and sort columns
CREATE INDEX idx_orders_status      ON orders(status);
CREATE INDEX idx_orders_created_at  ON orders(created_at DESC);

-- ── invoices ─────────────────────────────────────────────────────────────────
CREATE INDEX idx_invoices_client_id         ON invoices(client_id);
CREATE INDEX idx_invoices_status            ON invoices(status);
CREATE INDEX idx_invoices_stripe_invoice_id ON invoices(stripe_invoice_id);
CREATE INDEX idx_invoices_created_at        ON invoices(created_at DESC);
-- Used by getTotalPaidSince and stats queries
CREATE INDEX idx_invoices_paid_at           ON invoices(paid_at);

-- ── payments ─────────────────────────────────────────────────────────────────
CREATE INDEX idx_payments_invoice_id        ON payments(invoice_id);
CREATE INDEX idx_payments_status            ON payments(status);
CREATE INDEX idx_payments_stripe_payment_id ON payments(stripe_payment_id);
-- Used by date-range filter and monthly stats
CREATE INDEX idx_payments_created_at        ON payments(created_at DESC);

-- ── products ─────────────────────────────────────────────────────────────────
-- Every product query filters deleted_at IS NULL
CREATE INDEX idx_products_deleted_at ON products(deleted_at);
-- Category filter on listing page
CREATE INDEX idx_products_category   ON products(category) WHERE deleted_at IS NULL;

-- ── product_suppliers ─────────────────────────────────────────────────────────
-- Joined on every product detail and listing load
CREATE INDEX idx_product_suppliers_product_id  ON product_suppliers(product_id);
CREATE INDEX idx_product_suppliers_supplier_id ON product_suppliers(supplier_id);
