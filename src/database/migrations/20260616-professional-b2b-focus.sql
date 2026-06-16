ALTER TABLE products
  MODIFY COLUMN saleType enum('retail','salon','wholesale') NOT NULL DEFAULT 'salon';

ALTER TABLE customers
  MODIFY COLUMN customerType enum('retail','salon','wholesale') NOT NULL DEFAULT 'salon';
