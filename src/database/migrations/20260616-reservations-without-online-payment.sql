ALTER TABLE orders
  MODIFY COLUMN status enum('created','reserved','pending_payment','paid','preparing','shipped','delivered','cancelled') NOT NULL DEFAULT 'created',
  MODIFY COLUMN paymentMethod enum('reservation','mercadopago','transfer','cash') NOT NULL DEFAULT 'reservation';
