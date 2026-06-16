UPDATE products p
JOIN categories c ON c.slug = CASE
  WHEN UPPER(p.name) REGEXP '(^| )ATM|CRAZY GUM' THEN 'coloracion-semipermanente'
  WHEN UPPER(p.name) REGEXP 'CAREPLEX|CAUTERIZADO|RECOVERY|OIL CONTROL|GENESIS|THERMO VITAL|SHOCK DE KERATINA|ANTI AGE' THEN 'ionix'
  WHEN UPPER(p.name) REGEXP 'DECO|DECOLORANTE|BLONDIE|SIL 10' THEN 'decoloracion-profesional'
  WHEN UPPER(p.name) REGEXP 'BUCKLING|LOW-POO|CURL|ULTRA MASK|GLACYS|ACTIVADOR' THEN 'buckling'
  WHEN UPPER(p.name) REGEXP 'BLUE|SILVER|MOROCCO|NUTRI PLEX|COOL PLEX|PLATYNUM' THEN 'power-color'
  WHEN UPPER(p.name) REGEXP 'BOTOX|CHOCO KERATIN|MIX TRIAMINICO|SHOT DE LINO|MAGICA|MONODOSIS' THEN 'monodosis'
  WHEN UPPER(p.name) REGEXP 'CR-|CREMA [0-9]+VOL|TUBO CREMA' THEN 'plasma-color'
  WHEN UPPER(p.name) REGEXP 'PH BALANCE|POST TECNIC|ONDULADORA|NEUTRALIZANTE|HAIRSPRAY' THEN 'profesional'
  ELSE 'tratamientos-plasma'
END
SET p.categoryId = c.id,
    p.saleType = 'salon'
WHERE p.categoryId IN (
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
