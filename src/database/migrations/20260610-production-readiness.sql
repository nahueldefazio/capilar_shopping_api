ALTER TABLE orders
  ADD COLUMN publicToken varchar(64) NULL AFTER orderNumber,
  ADD COLUMN stockDeducted tinyint(1) NOT NULL DEFAULT 1 AFTER paymentStatus;

UPDATE orders
SET publicToken = SHA2(CONCAT(id, '-', orderNumber), 256)
WHERE publicToken IS NULL;

ALTER TABLE orders
  MODIFY publicToken varchar(64) NOT NULL,
  ALTER stockDeducted SET DEFAULT 0;

CREATE UNIQUE INDEX IDX_orders_publicToken ON orders (publicToken);
