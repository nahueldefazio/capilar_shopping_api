"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const core_1 = require("@nestjs/core");
const typeorm_1 = require("@nestjs/typeorm");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const app_module_1 = require("../../app.module");
const product_entity_1 = require("../../modules/products/entities/product.entity");
const category_entity_1 = require("../../modules/categories/entities/category.entity");
const normalize_product_row_1 = require("./normalize-product-row");
const RAW_JSON_PATH = path.join(__dirname, 'imported-products.raw.json');
const PREVIEW_JSON_PATH = path.join(__dirname, 'imported-products.preview.json');
const DEFAULT_CATEGORY = 'Productos';
function buildLocalResults(rawRows) {
    const validRows = [];
    const errorRows = [];
    const manualReviewRows = [];
    for (const row of rawRows) {
        if (!row.rawPrice ||
            row.rawPrice.trim() === '' ||
            row.rawPrice.includes('#') ||
            row.rawPrice.toUpperCase() === 'CONSULTAR') {
            manualReviewRows.push({ row, reason: row.notes ?? `Precio no disponible: "${row.rawPrice}"` });
            continue;
        }
        const result = (0, normalize_product_row_1.normalizeProductRow)(row, DEFAULT_CATEGORY);
        if ('error' in result) {
            errorRows.push({ row, reason: result.error });
        }
        else {
            validRows.push(result.data);
        }
    }
    const slugCount = new Map();
    for (const p of validRows) {
        slugCount.set(p.slug, [...(slugCount.get(p.slug) ?? []), p.name]);
    }
    const internalDuplicates = [];
    const deduplicatedValid = [];
    const seenSlugs = new Set();
    for (const p of validRows) {
        const names = slugCount.get(p.slug);
        if (names.length > 1) {
            if (!seenSlugs.has(p.slug)) {
                internalDuplicates.push({ slug: p.slug, names });
                seenSlugs.add(p.slug);
            }
        }
        else {
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
    const rawRows = JSON.parse(fs.readFileSync(RAW_JSON_PATH, 'utf-8'));
    console.log(`\n📄 Filas leídas del JSON: ${rawRows.length}`);
    const { validRows, errorRows, manualReviewRows, internalDuplicates, deduplicatedValid } = buildLocalResults(rawRows);
    console.log(`  ✅ Válidos          : ${validRows.length}`);
    console.log(`  ❌ Con errores      : ${errorRows.length}`);
    console.log(`  ⚠️  Revisión manual : ${manualReviewRows.length}`);
    console.log(`  🔁 Duplicados int.  : ${internalDuplicates.length}`);
    let app = null;
    let productRepo = null;
    let categoryRepo = null;
    let dbAvailable = false;
    try {
        app = await Promise.race([
            core_1.NestFactory.createApplicationContext(app_module_1.AppModule, { logger: false }),
            new Promise((_, reject) => setTimeout(() => reject(new Error('DB connection timeout')), 10000)),
        ]);
        productRepo = app.get((0, typeorm_1.getRepositoryToken)(product_entity_1.Product));
        categoryRepo = app.get((0, typeorm_1.getRepositoryToken)(category_entity_1.Category));
        dbAvailable = true;
    }
    catch {
        console.log('\n  ℹ️  Base de datos no disponible — la verificación de duplicados en BD se omitirá.');
        console.log('     Configurá el archivo .env con las credenciales de Hostinger para activarla.\n');
    }
    const slugsToCheck = deduplicatedValid.map((p) => p.slug);
    const existingProducts = dbAvailable && productRepo && slugsToCheck.length
        ? await productRepo
            .createQueryBuilder('p')
            .select(['p.slug', 'p.name'])
            .where('p.slug IN (:...slugs)', { slugs: slugsToCheck })
            .getMany()
        : [];
    const existingSlugSet = new Set(existingProducts.map((p) => p.slug));
    const alreadyInDb = existingProducts.map((p) => ({ slug: p.slug, name: p.name }));
    const readyToImport = deduplicatedValid.filter((p) => !existingSlugSet.has(p.slug));
    const preview = {
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
        console.log(`  Ya existen en BD       : ${preview.summary.alreadyInDb}${!dbAvailable ? ' (sin verificar — BD no disponible)' : ''}`);
        console.log(`  Listos para importar   : ${preview.summary.readyToImport}`);
        console.log('=================================================\n');
        if (errorRows.length > 0) {
            console.log('❌ ERRORES:');
            for (const e of errorRows)
                console.log(`   - ${e.row.name}: ${e.reason}`);
        }
        if (manualReviewRows.length > 0) {
            console.log('\n⚠️  REVISIÓN MANUAL REQUERIDA:');
            for (const m of manualReviewRows)
                console.log(`   - [${m.row.brand}] ${m.row.name}: ${m.reason}`);
        }
        if (internalDuplicates.length > 0) {
            console.log('\n🔁 DUPLICADOS INTERNOS (no se importarán):');
            for (const d of internalDuplicates)
                console.log(`   - slug "${d.slug}" → ${d.names.join(' / ')}`);
        }
        if (alreadyInDb.length > 0) {
            console.log('\n🔍 YA EXISTEN EN BASE DE DATOS (se omitirán):');
            for (const d of alreadyInDb)
                console.log(`   - ${d.name} (slug: ${d.slug})`);
        }
        console.log(`\n📁 Vista previa guardada en:\n   ${PREVIEW_JSON_PATH}`);
        console.log('\n⚠️  ATENCIÓN: Esto fue solo una vista previa. NO se importó ningún producto.');
        console.log('Para importar ejecutá:\n   npm run import:products\n');
        if (app)
            await app.close();
        process.exit(0);
    }
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
    const categorySlug = (0, normalize_product_row_1.slugify)(DEFAULT_CATEGORY);
    let category = await categoryRepo.findOne({ where: { slug: categorySlug } });
    if (!category) {
        category = await categoryRepo.save(categoryRepo.create({ name: DEFAULT_CATEGORY, slug: categorySlug, isActive: true }));
        console.log(`  📂 Categoría creada: "${DEFAULT_CATEGORY}" (slug: ${categorySlug})`);
    }
    else {
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
        await productRepo.save(productRepo.create({
            name: p.name,
            slug: p.slug,
            price: p.price,
            stock: p.stock,
            saleType: p.saleType,
            isActive: p.isActive,
            featured: p.featured,
            imageUrl: p.imageUrl || undefined,
            categoryId: category.id,
        }));
        console.log(`  ✅ Importado: ${p.name} ($${p.price})`);
        imported++;
    }
    console.log(`\n🎉 Importación completada.`);
    console.log(`   Importados: ${imported} | Omitidos: ${skipped} | Errores/ManualReview: ${errorRows.length + manualReviewRows.length}`);
    await app.close();
}
run().catch((err) => {
    console.error('❌ Error en la importación:', err);
    process.exit(1);
});
//# sourceMappingURL=import-products-from-json.js.map