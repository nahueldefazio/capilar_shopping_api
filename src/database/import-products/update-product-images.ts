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

  const app = await NestFactory.createApplicationContext(AppModule, { logger: false });
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
      console.log(`  ⚠️  No encontrado en BD: ${row.name} (slug: ${slug})`);
      notFound++;
      continue;
    }

    if (product.imageUrl === imageUrl) {
      skipped++;
      continue;
    }

    await productRepo.update(product.id, { imageUrl });
    console.log(`  ✅ Actualizado: ${product.name}`);
    updated++;
  }

  console.log(`\n🎉 Listo. Actualizados: ${updated} | No encontrados: ${notFound} | Sin cambios: ${skipped}`);
  await app.close();
}

run().catch((err) => {
  console.error('❌ Error:', err);
  process.exit(1);
});
