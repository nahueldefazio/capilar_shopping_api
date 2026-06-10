ALTER TABLE categories
  ADD COLUMN parentId int NULL AFTER isActive;

ALTER TABLE categories
  ADD CONSTRAINT FK_categories_parent
  FOREIGN KEY (parentId) REFERENCES categories(id)
  ON DELETE SET NULL;

UPDATE categories SET name = 'Particulares', slug = 'particulares', parentId = NULL, isActive = 1 WHERE id = 1;
UPDATE categories SET name = 'Peluquerías', slug = 'peluquerias', parentId = NULL, isActive = 1 WHERE id = 3;
UPDATE categories SET name = 'Mayorista', slug = 'mayorista', parentId = NULL, isActive = 1 WHERE id = 4;

INSERT INTO categories (name, slug, isActive, parentId, createdAt, updatedAt)
SELECT 'Plasma', 'plasma', 1, 1, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'plasma');

UPDATE products
SET categoryId = (SELECT id FROM categories WHERE slug = 'plasma' LIMIT 1),
    saleType = 'retail'
WHERE saleType = 'retail';

UPDATE categories
SET isActive = 0
WHERE slug NOT IN ('particulares', 'peluquerias', 'mayorista', 'plasma');
