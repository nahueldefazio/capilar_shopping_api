import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { AppModule } from '../../app.module';
import { Product } from '../../modules/products/entities/product.entity';
import { normalizeProductRow } from './normalize-product-row';
import type { RawProductRow } from './product-import.types';

const RAW_JSON_PATH = path.join(__dirname, 'imported-products.raw.json');

async function run() {
  const rawRows: RawProductRow[] = JSON.parse(fs.readFileSync(RAW_JSON_PATH, 'utf-8'));
  const withImage = rawRows.filter((r) => r.imageUrl && r.imageUrl.trim() !== '');
  console.log(`\n📄 Productos con imagen en JSON: ${withImage.length} de ${rawRows.length}`);

  let app: Awaited<ReturnType<typeof NestFactory.createApplicationContext>> | null = null;

  try {
    app = await Promise.race([
      NestFactory.createApplicationContext(AppModule, { logger: false }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('DB connection timeout after 10s')), 10000),
      ),
    ]);
  } catch (err) {
    console.error('\n❌ No se pudo conectar a la base de datos:', (err as Error).message);
    console.error('   Verificá que el archivo .env exista con las credenciales correctas.');
    process.exit(1);
  }

  const productRepo = app.get<Repository<Product>>(getRepositoryToken(Product));

  let updated = 0;
  let notFound = 0;
  let skipped = 0;

  for (const row of withImage) {
    const result = normalizeProductRow(row, 'Productos');
    if ('error' in result) { skipped++; continue; }

    const { slug, imageUrl } = result.data;
    const product = await productRepo.findOne({ where: { slug } });

    if (!product) {
      console.log(`  ⚠️  No encontrado en BD: ${row.name}`);
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
  await app.close();
  process.exit(0);
}

run().catch((err) => {
  console.error('❌ Error inesperado:', err);
  process.exit(1);
});
