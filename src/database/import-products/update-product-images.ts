import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { Product } from '../../modules/products/entities/product.entity';
import { Category } from '../../modules/categories/entities/category.entity';
import { normalizeProductRow } from './normalize-product-row';
import type { RawProductRow } from './product-import.types';

const RAW_JSON_PATH = path.join(__dirname, 'imported-products.raw.json');

async function run() {
  const rawRows: RawProductRow[] = JSON.parse(fs.readFileSync(RAW_JSON_PATH, 'utf-8'));
  const withImage = rawRows.filter((r) => r.imageUrl && r.imageUrl.trim() !== '');
  console.log(`\n📄 Productos con imagen en JSON: ${withImage.length} de ${rawRows.length}`);

  const ds = new DataSource({
    type: 'mysql',
    host: process.env.DB_HOST ?? '127.0.0.1',
    port: parseInt(process.env.DB_PORT ?? '3306', 10),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    entities: [Product, Category],
    synchronize: false,
    logging: false,
    charset: 'utf8mb4',
  });

  try {
    await ds.initialize();
    console.log('  🔌 Conectado a la base de datos\n');
  } catch (err) {
    console.error('❌ No se pudo conectar a la BD:', (err as Error).message);
    process.exit(1);
  }

  const productRepo = ds.getRepository(Product);
  let updated = 0;
  let notFound = 0;
  let skipped = 0;

  for (const row of withImage) {
    const result = normalizeProductRow(row, 'Productos');
    if ('error' in result) { skipped++; continue; }

    const { slug, imageUrl } = result.data;
    const product = await productRepo.findOne({ where: { slug } });

    if (!product) {
      console.log(`  ⚠️  No encontrado: ${row.name}`);
      notFound++;
      continue;
    }

    if (product.imageUrl === imageUrl) {
      skipped++;
      continue;
    }

    await productRepo.update(product.id, { imageUrl });
    console.log(`  ✅ ${product.name}`);
    updated++;
  }

  console.log(`\n🎉 Listo. Actualizados: ${updated} | No encontrados: ${notFound} | Sin cambios: ${skipped}`);
  await ds.destroy();
  process.exit(0);
}

run().catch((err) => {
  console.error('❌ Error inesperado:', err);
  process.exit(1);
});
