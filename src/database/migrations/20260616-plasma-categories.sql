UPDATE categories
SET name = 'Plasma', slug = 'plasma', parentId = NULL, isActive = 1
WHERE slug = 'plasma';

INSERT INTO categories (name, slug, isActive, parentId, createdAt, updatedAt)
SELECT 'Plasma', 'plasma', 1, NULL, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'plasma');

INSERT INTO categories (name, slug, isActive, parentId, createdAt, updatedAt)
SELECT category_name, category_slug, 1, plasma.id, NOW(), NOW()
FROM (
  SELECT 'Plasma Color' AS category_name, 'plasma-color' AS category_slug
  UNION ALL SELECT 'Power Color', 'power-color'
  UNION ALL SELECT 'Buckling', 'buckling'
  UNION ALL SELECT 'Ionix', 'ionix'
  UNION ALL SELECT 'Profesional', 'profesional'
  UNION ALL SELECT 'Decoloración Profesional', 'decoloracion-profesional'
  UNION ALL SELECT 'Coloración Semipermanente', 'coloracion-semipermanente'
  UNION ALL SELECT 'Tratamientos Plasma', 'tratamientos-plasma'
  UNION ALL SELECT 'Monodosis', 'monodosis'
) AS plasma_categories
JOIN categories plasma ON plasma.slug = 'plasma'
WHERE NOT EXISTS (
  SELECT 1 FROM categories existing WHERE existing.slug = plasma_categories.category_slug
);

UPDATE categories existing
JOIN categories plasma ON plasma.slug = 'plasma'
SET existing.parentId = plasma.id,
    existing.isActive = 1,
    existing.name = CASE existing.slug
      WHEN 'plasma-color' THEN 'Plasma Color'
      WHEN 'power-color' THEN 'Power Color'
      WHEN 'buckling' THEN 'Buckling'
      WHEN 'ionix' THEN 'Ionix'
      WHEN 'profesional' THEN 'Profesional'
      WHEN 'decoloracion-profesional' THEN 'Decoloración Profesional'
      WHEN 'coloracion-semipermanente' THEN 'Coloración Semipermanente'
      WHEN 'tratamientos-plasma' THEN 'Tratamientos Plasma'
      WHEN 'monodosis' THEN 'Monodosis'
      ELSE existing.name
    END
WHERE existing.slug IN (
  'plasma-color',
  'power-color',
  'buckling',
  'ionix',
  'profesional',
  'decoloracion-profesional',
  'coloracion-semipermanente',
  'tratamientos-plasma',
  'monodosis'
);

UPDATE products
SET saleType = 'salon'
WHERE categoryId IN (
  SELECT id FROM categories WHERE slug IN (
    'plasma',
    'plasma-color',
    'power-color',
    'buckling',
    'ionix',
    'profesional',
    'decoloracion-profesional',
    'coloracion-semipermanente',
    'tratamientos-plasma',
    'monodosis'
  )
);
