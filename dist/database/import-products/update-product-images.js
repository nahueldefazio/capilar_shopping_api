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
const typeorm_1 = require("typeorm");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const product_entity_1 = require("../../modules/products/entities/product.entity");
const category_entity_1 = require("../../modules/categories/entities/category.entity");
const normalize_product_row_1 = require("./normalize-product-row");
const RAW_JSON_PATH = path.join(__dirname, 'imported-products.raw.json');
async function run() {
    const rawRows = JSON.parse(fs.readFileSync(RAW_JSON_PATH, 'utf-8'));
    const withImage = rawRows.filter((r) => r.imageUrl && r.imageUrl.trim() !== '');
    console.log(`\n📄 Productos con imagen en JSON: ${withImage.length} de ${rawRows.length}`);
    const ds = new typeorm_1.DataSource({
        type: 'mysql',
        host: process.env.DB_HOST ?? '127.0.0.1',
        port: parseInt(process.env.DB_PORT ?? '3306', 10),
        username: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE,
        entities: [product_entity_1.Product, category_entity_1.Category],
        synchronize: false,
        logging: false,
        charset: 'utf8mb4',
    });
    try {
        await ds.initialize();
        console.log('  🔌 Conectado a la base de datos\n');
    }
    catch (err) {
        console.error('❌ No se pudo conectar a la BD:', err.message);
        process.exit(1);
    }
    const productRepo = ds.getRepository(product_entity_1.Product);
    let updated = 0;
    let notFound = 0;
    let skipped = 0;
    for (const row of withImage) {
        const result = (0, normalize_product_row_1.normalizeProductRow)(row, 'Productos');
        if ('error' in result) {
            skipped++;
            continue;
        }
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
//# sourceMappingURL=update-product-images.js.map