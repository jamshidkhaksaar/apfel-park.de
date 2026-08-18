ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS admin_notification_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS admin_notification_claimed_at timestamptz,
  ADD COLUMN IF NOT EXISTS admin_notification_last_error text,
  ADD COLUMN IF NOT EXISTS admin_notification_attempts integer NOT NULL DEFAULT 0;

COMMENT ON COLUMN orders.admin_notification_sent_at IS
  'Last successful paid-order notification delivery to the shop inbox.';
COMMENT ON COLUMN orders.admin_notification_claimed_at IS
  'Short-lived delivery claim used to prevent duplicate paid-order emails.';
COMMENT ON COLUMN orders.admin_notification_last_error IS
  'Most recent paid-order notification failure, cleared after a successful send.';
