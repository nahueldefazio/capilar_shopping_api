import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { AppModule } from '../../app.module';
import { Product } from '../../modules/products/entities/product.entity';
import { Category } from '../../modules/categories/entities/category.entity';
import { SaleType } from '../../common/enums/sale-type.enum';
import { normalizeProductRow, slugify } from './normalize-product-row';
import type {
  RawProductRow,
  NormalizedProductRow,
  ImportPreview,
} from './product-import.types';

const RAW_JSON_PATH = path.join(__dirname, 'imported-products.raw.json');
const PREVIEW_JSON_PATH = path.join(__dirname, 'imported-products.preview.json');
const DEFAULT_CATEGORY = 'Productos';

function buildLocalResults(rawRows: RawProductRow[]) {
  const validRows: NormalizedProductRow[] = [];
  const errorRows: { row: RawProductRow; reason: string }[] = [];
  const manualReviewRows: { row: RawProductRow; reason: string }[] = [];

  for (const row of rawRows) {
    if (
      !row.rawPrice ||
      row.rawPrice.trim() === '' ||
      row.rawPrice.includes('#') ||
      row.rawPrice.toUpperCase() === 'CONSULTAR'
    ) {
      manualReviewRows.push({ row, reason: row.notes ?? `Precio no disponible: "${row.rawPrice}"` });
      continue;
    }
    const result = normalizeProductRow(row, DEFAULT_CATEGORY);
    if ('error' in result) {
      errorRows.push({ row, reason: result.error });
    } else {
      validRows.push(result.data);
    }
  }

  const slugCount = new Map<string, string[]>();
  for (const p of validRows) {
    slugCount.set(p.slug, [...(slugCount.get(p.slug) ?? []), p.name]);
  }

  const internalDuplicates: { slug: string; names: string[] }[] = [];
  const deduplicatedValid: NormalizedProductRow[] = [];
  const seenSlugs = new Set<string>();
  for (const p of validRows) {
    const names = slugCount.get(p.slug)!;
    if (names.length > 1) {
      if (!seenSlugs.has(p.slug)) {
        internalDuplicates.push({ slug: p.slug, names });
        seenSlugs.add(p.slug);
      }
    } else {
      deduplicatedValid.push(p);
    }
  }

  return { validRows, errorRows, manualReviewRows, internalDuplicates, deduplicatedValid };
}

async function run() {
  const args = process.argv.slice(2);
  const isPreview = args.includes('--preview');
  const isImport = args.includes('--import');

  if (!isPreview && !isImport) {
    console.error('Uso: npm run import:products:preview | npm run import:products');
    process.exit(1);
  }

  const rawRows: RawProductRow[] = JSON.parse(fs.readFileSync(RAW_JSON_PATH, 'utf-8'));
  console.log(`\n📄 Filas leídas del JSON: ${rawRows.length}`);

  const { validRows, errorRows, manualReviewRows, internalDuplicates, deduplicatedValid } =
    buildLocalResults(rawRows);

  console.log(`  ✅ Válidos          : ${validRows.length}`);
  console.log(`  ❌ Con errores      : ${errorRows.length}`);
  console.log(`  ⚠️  Revisión manual : ${manualReviewRows.length}`);
  console.log(`  🔁 Duplicados int.  : ${internalDuplicates.length}`);

  // --- Try DB connection ---
  let app: Awaited<ReturnType<typeof NestFactory.createApplicationContext>> | null = null;
  let productRepo: Repository<Product> | null = null;
  let categoryRepo: Repository<Category> | null = null;
  let dbAvailable = false;

  try {
    app = await Promise.race([
      NestFactory.createApplicationContext(AppModule, { logger: false }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('DB connection timeout')), 10000),
      ),
    ]);
    productRepo = app.get<Repository<Product>>(getRepositoryToken(Product));
    categoryRepo = app.get<Repository<Category>>(getRepositoryToken(Category));
    dbAvailable = true;
  } catch {
    console.log('\n  ℹ️  Base de datos no disponible — la verificación de duplicados en BD se omitirá.');
    console.log('     Configurá el archivo .env con las credenciales de Hostinger para activarla.\n');
  }

  // Check which slugs already exist in DB
  const slugsToCheck = deduplicatedValid.map((p) => p.slug);
  const existingProducts =
    dbAvailable && productRepo && slugsToCheck.length
      ? await productRepo
          .createQueryBuilder('p')
          .select(['p.slug', 'p.name'])
          .where('p.slug IN (:...slugs)', { slugs: slugsToCheck })
          .getMany()
      : [];
  const existingSlugSet = new Set(existingProducts.map((p) => p.slug));
  const alreadyInDb = existingProducts.map((p) => ({ slug: p.slug, name: p.name }));
  const readyToImport = deduplicatedValid.filter((p) => !existingSlugSet.has(p.slug));

  const preview: ImportPreview = {
    summary: {
      totalRows: rawRows.length,
      valid: validRows.length,
      errors: errorRows.length,
      manualReview: manualReviewRows.length,
      internalDuplicates: internalDuplicates.length,
      alreadyInDb: alreadyInDb.length,
      readyToImport: readyToImport.length,
    },
    readyToImport,
    errors: errorRows,
    manualReview: manualReviewRows,
    internalDuplicates,
    alreadyInDb,
  };

  if (isPreview) {
    fs.writeFileSync(PREVIEW_JSON_PATH, JSON.stringify(preview, null, 2), 'utf-8');

    console.log('========== VISTA PREVIA DE IMPORTACIÓN ==========');
    console.log(`  Total de filas leídas  : ${preview.summary.totalRows}`);
    console.log(`  Productos válidos      : ${preview.summary.valid}`);
    console.log(`  Con errores            : ${preview.summary.errors}`);
    console.log(`  Revisión manual        : ${preview.summary.manualReview}`);
    console.log(`  Duplicados internos    : ${preview.summary.internalDuplicates}`);
    console.log(
      `  Ya existen en BD       : ${preview.summary.alreadyInDb}${!dbAvailable ? ' (sin verificar — BD no disponible)' : ''}`,
    );
    console.log(`  Listos para importar   : ${preview.summary.readyToImport}`);
    console.log('=================================================\n');

    if (errorRows.length > 0) {
      console.log('❌ ERRORES:');
      for (const e of errorRows) console.log(`   - ${e.row.name}: ${e.reason}`);
    }

    if (manualReviewRows.length > 0) {
      console.log('\n⚠️  REVISIÓN MANUAL REQUERIDA:');
      for (const m of manualReviewRows) console.log(`   - [${m.row.brand}] ${m.row.name}: ${m.reason}`);
    }

    if (internalDuplicates.length > 0) {
      console.log('\n🔁 DUPLICADOS INTERNOS (no se importarán):');
      for (const d of internalDuplicates) console.log(`   - slug "${d.slug}" → ${d.names.join(' / ')}`);
    }

    if (alreadyInDb.length > 0) {
      console.log('\n🔍 YA EXISTEN EN BASE DE DATOS (se omitirán):');
      for (const d of alreadyInDb) console.log(`   - ${d.name} (slug: ${d.slug})`);
    }

    console.log(`\n📁 Vista previa guardada en:\n   ${PREVIEW_JSON_PATH}`);
    console.log('\n⚠️  ATENCIÓN: Esto fue solo una vista previa. NO se importó ningún producto.');
    console.log('Para importar ejecutá:\n   npm run import:products\n');

    if (app) await app.close();
    process.exit(0);
  }

  // --- IMPORT MODE ---
  if (!dbAvailable || !productRepo || !categoryRepo || !app) {
    console.error('\n❌ No se puede importar: la base de datos no está disponible.');
    console.error('   Configurá el archivo .env con las credenciales de Hostinger e intentá nuevamente.');
    process.exit(1);
  }

  if (readyToImport.length === 0) {
    console.log('\n✅ No hay productos nuevos para importar (todos ya existen o tienen errores).');
    await app.close();
    return;
  }

  console.log(`\n⚠️  ATENCIÓN: Se van a insertar ${readyToImport.length} productos nuevos en la base de datos.`);
  console.log('   NO se eliminarán ni modificarán productos existentes.');
  console.log('   Comenzando importación...\n');

  const categorySlug = slugify(DEFAULT_CATEGORY);
  let category = await categoryRepo.findOne({ where: { slug: categorySlug } });
  if (!category) {
    category = await categoryRepo.save(
      categoryRepo.create({ name: DEFAULT_CATEGORY, slug: categorySlug, isActive: true }),
    );
    console.log(`  📂 Categoría creada: "${DEFAULT_CATEGORY}" (slug: ${categorySlug})`);
  } else {
    console.log(`  📂 Categoría existente reutilizada: "${category.name}" (id: ${category.id})`);
  }

  let imported = 0;
  let skipped = 0;
  for (const p of readyToImport) {
    const doubleCheck = await productRepo.findOne({ where: { slug: p.slug } });
    if (doubleCheck) {
      console.log(`  ⏭️  Omitido (ya existe): ${p.name}`);
      skipped++;
      continue;
    }
    await productRepo.save(
      productRepo.create({
        name: p.name,
        slug: p.slug,
        price: p.price,
        stock: p.stock,
        saleType: p.saleType as SaleType,
        isActive: p.isActive,
        featured: p.featured,
        imageUrl: p.imageUrl || undefined,
        categoryId: category!.id,
      }),
    );
    console.log(`  ✅ Importado: ${p.name} ($${p.price})`);
    imported++;
  }

  console.log(`\n🎉 Importación completada.`);
  console.log(
    `   Importados: ${imported} | Omitidos: ${skipped} | Errores/ManualReview: ${errorRows.length + manualReviewRows.length}`,
  );

  await app.close();
}

run().catch((err) => {
  console.error('❌ Error en la importación:', err);
  process.exit(1);
});
