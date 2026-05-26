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
const normalize_product_row_1 = require("./normalize-product-row");
const RAW_JSON_PATH = path.join(__dirname, 'imported-products.raw.json');
async function run() {
    const rawRows = JSON.parse(fs.readFileSync(RAW_JSON_PATH, 'utf-8'));
    const withImage = rawRows.filter((r) => r.imageUrl && r.imageUrl.trim() !== '');
    console.log(`\n📄 Productos con imagen en JSON: ${withImage.length} de ${rawRows.length}`);
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule, { logger: false });
    const productRepo = app.get((0, typeorm_1.getRepositoryToken)(product_entity_1.Product));
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
//# sourceMappingURL=update-product-images.js.map