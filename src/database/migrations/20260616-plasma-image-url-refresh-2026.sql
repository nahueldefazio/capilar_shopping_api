UPDATE products
SET imageUrl = CASE slug
  WHEN 'curl-gel-liquido-antifrizz-con-aceite-de-coco-12x150ml' THEN 'https://plasmacosmeticos.com/tienda/imagenes/63-buckling-curl-gel-liquido-plasma.jpg'
  WHEN 'curl-refresh-spray-antifrizz-con-aceite-de-coco-12x150ml' THEN 'https://plasmacosmeticos.com/tienda/imagenes/64-buckling-curl-refresh-plasma.jpg'
  WHEN 'mask-recovery-reestructurante-con-acido-hialuronico-12x300ml' THEN 'https://plasmacosmeticos.com/tienda/imagenes/70-ionix-mascara-recovery-plasma.jpg'
  WHEN 'shampoo-recovery-reestructurante-con-acido-hialuronico-12x400ml' THEN 'https://plasmacosmeticos.com/tienda/imagenes/69-ionix-shampoo-recovery-plasma.jpg'
  WHEN 'shock-de-keratina-reestructurante-con-acido-hialuronico-12x150ml' THEN 'https://plasmacosmeticos.com/tienda/imagenes/65-ionix-shock-de-keratina-plasma.jpg'
  WHEN 'mascara-morocco-con-argan-12-x-300ml' THEN 'https://plasmacosmeticos.com/tienda/imagenes/61-power-color-morocco-mascara.jpg'
  WHEN 'mascara-platynum-cabello-blancos-y-grises-con-argan-12x300ml' THEN 'https://plasmacosmeticos.com/tienda/imagenes/68-power-color-mascara-platynum-plasma.jpg'
  WHEN 'mascara-silver-stop-yellow-con-argan-12-x-300ml' THEN 'https://plasmacosmeticos.com/tienda/imagenes/67-power-color-mascara-silver-stop-yellow-plasma.jpg'
  WHEN 'botox-capilar-estuche-12-x-15ml' THEN 'https://acdn-us.mitiendanube.com/stores/004/765/951/products/diseno-sin-titulo-2-04fbf5fed41c6665ce17473974375769-640-0.webp'
  WHEN 'choco-keratin-revitalizante-estuche-12-x-15ml' THEN 'https://acdn-us.mitiendanube.com/stores/004/765/951/products/diseno-sin-titulo-4-22456c44ad6ba31cae17474016349616-480-0.webp'
  WHEN 'tratamiento-elastic-estuche-12-x-6-x-2-x-15ml' THEN 'https://acdn-us.mitiendanube.com/stores/004/765/951/products/x_ampolla-caja-6-unid-elastic-keratina-ginseng-pelo-elastico-15ml-plasma-color-la-serena-coquimbo-santiago-bellassur7252-9305de1b8301adcbdc17473994897828-480-0.webp'
  ELSE imageUrl
END
WHERE slug IN (
  'curl-gel-liquido-antifrizz-con-aceite-de-coco-12x150ml',
  'curl-refresh-spray-antifrizz-con-aceite-de-coco-12x150ml',
  'mask-recovery-reestructurante-con-acido-hialuronico-12x300ml',
  'shampoo-recovery-reestructurante-con-acido-hialuronico-12x400ml',
  'shock-de-keratina-reestructurante-con-acido-hialuronico-12x150ml',
  'mascara-morocco-con-argan-12-x-300ml',
  'mascara-platynum-cabello-blancos-y-grises-con-argan-12x300ml',
  'mascara-silver-stop-yellow-con-argan-12-x-300ml',
  'botox-capilar-estuche-12-x-15ml',
  'choco-keratin-revitalizante-estuche-12-x-15ml',
  'tratamiento-elastic-estuche-12-x-6-x-2-x-15ml'
);
