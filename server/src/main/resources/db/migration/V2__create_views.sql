CREATE OR REPLACE VIEW client_summaries AS
SELECT
  c.id,
  c.name,
  c.account_status,
  c.contact_name,
  c.contact_email,
  c.deleted_at,
  COUNT(DISTINCT o.id) AS order_count,
  COALESCE(SUM(p.amount) FILTER (WHERE p.status = 'SUCCEEDED'), 0) AS total_spend,
  COALESCE(SUM(i.total_amount) FILTER (WHERE i.status IN ('SENT', 'OVERDUE')), 0) AS outstanding_balance
FROM clients c
LEFT JOIN orders o ON o.client_id = c.id
LEFT JOIN invoices i ON i.client_id = c.id
LEFT JOIN payments p ON p.invoice_id = i.id
WHERE c.deleted_at IS NULL
GROUP BY c.id, c.name, c.account_status, c.contact_name, c.contact_email, c.deleted_at;
