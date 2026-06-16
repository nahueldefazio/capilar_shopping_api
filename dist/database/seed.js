"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("../app.module");
const typeorm_1 = require("@nestjs/typeorm");
const category_entity_1 = require("../modules/categories/entities/category.entity");
const product_entity_1 = require("../modules/products/entities/product.entity");
const sale_type_enum_1 = require("../common/enums/sale-type.enum");
async function seed() {
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule);
    const categoryRepo = app.get((0, typeorm_1.getRepositoryToken)(category_entity_1.Category));
    const productRepo = app.get((0, typeorm_1.getRepositoryToken)(product_entity_1.Product));
    console.log('🌱 Seeding database...');
    const categoriesData = [
        { name: 'Cuidado Capilar', slug: 'cuidado-capilar' },
        { name: 'Tratamientos', slug: 'tratamientos' },
        { name: 'Peluquerías', slug: 'peluquerias' },
        { name: 'Mayorista', slug: 'mayorista' },
        { name: 'Plasma', slug: 'plasma' },
        { name: 'Combos', slug: 'combos' },
    ];
    const categories = [];
    for (const data of categoriesData) {
        const existing = await categoryRepo.findOne({ where: { slug: data.slug } });
        if (!existing) {
            categories.push(await categoryRepo.save(categoryRepo.create(data)));
            console.log(`  ✔ Category: ${data.name}`);
        }
        else {
            categories.push(existing);
        }
    }
    const [cuidado, tratamientos, peluquerias, mayorista, plasma, combos] = categories;
    const plasmaCategoriesData = [
        { name: 'Plasma Color', slug: 'plasma-color' },
        { name: 'Power Color', slug: 'power-color' },
        { name: 'Buckling', slug: 'buckling' },
        { name: 'Ionix', slug: 'ionix' },
        { name: 'Profesional', slug: 'profesional' },
        { name: 'Decoloración Profesional', slug: 'decoloracion-profesional' },
        { name: 'Coloración Semipermanente', slug: 'coloracion-semipermanente' },
        { name: 'Tratamientos Plasma', slug: 'tratamientos-plasma' },
        { name: 'Monodosis', slug: 'monodosis' },
    ];
    for (const data of plasmaCategoriesData) {
        const existing = await categoryRepo.findOne({ where: { slug: data.slug } });
        if (!existing) {
            await categoryRepo.save(categoryRepo.create({ ...data, parentId: plasma.id }));
            console.log(`  ✔ Category: Plasma / ${data.name}`);
        }
        else if (existing.parentId !== plasma.id) {
            existing.parentId = plasma.id;
            existing.isActive = true;
            await categoryRepo.save(existing);
        }
    }
    const productsData = [
        {
            name: 'Shampoo Reparador 300ml',
            slug: 'shampoo-reparador-300ml',
            description: 'Shampoo con keratina y proteínas del trigo. Repara el cabello dañado desde la primera aplicación.',
            price: 2800, stock: 50, saleType: sale_type_enum_1.SaleType.RETAIL,
            categoryId: cuidado.id, featured: true,
        },
        {
            name: 'Acondicionador Nutritivo 300ml',
            slug: 'acondicionador-nutritivo-300ml',
            description: 'Con aceite de argán y manteca de karité. Nutre y facilita el peinado.',
            price: 2600, stock: 45, saleType: sale_type_enum_1.SaleType.RETAIL,
            categoryId: cuidado.id, featured: true,
        },
        {
            name: 'Máscara Capilar Hidratante',
            slug: 'mascara-capilar-hidratante',
            description: 'Tratamiento intensivo con ácido hialurónico vegetal. Restaura humedad y aporta suavidad.',
            price: 3500, stock: 30, saleType: sale_type_enum_1.SaleType.RETAIL,
            categoryId: tratamientos.id, featured: true,
        },
        {
            name: 'Aceite Capilar Reparador',
            slug: 'aceite-capilar-reparador',
            description: 'Mezcla de aceites de argán, jojoba y rosa mosqueta. Sella puntas y aporta brillo.',
            price: 3200, stock: 25, saleType: sale_type_enum_1.SaleType.RETAIL,
            categoryId: tratamientos.id, featured: false,
        },
        {
            name: 'Pack Profesional Shampoo x6',
            slug: 'pack-profesional-shampoo-x6',
            description: 'Pack de 6 unidades de Shampoo Reparador 300ml. Precio especial para peluquerías.',
            price: 14400, stock: 20, saleType: sale_type_enum_1.SaleType.SALON,
            categoryId: peluquerias.id, featured: true,
        },
        {
            name: 'Pack Tratamiento Salón x6',
            slug: 'pack-tratamiento-salon-x6',
            description: 'Pack de 6 Máscaras Capilares para uso profesional en salones.',
            price: 18000, stock: 15, saleType: sale_type_enum_1.SaleType.SALON,
            categoryId: peluquerias.id, featured: false,
        },
        {
            name: 'Pack Acondicionador Salón x6',
            slug: 'pack-acondicionador-salon-x6',
            description: 'Pack de 6 Acondicionadores Nutritivos. Precio exclusivo para peluquerías.',
            price: 13200, stock: 18, saleType: sale_type_enum_1.SaleType.SALON,
            categoryId: peluquerias.id, featured: false,
        },
        {
            name: 'Caja Shampoo x12',
            slug: 'caja-shampoo-x12',
            description: 'Caja de 12 unidades. Precio mayorista para revendedores.',
            price: 26400, stock: 10, saleType: sale_type_enum_1.SaleType.WHOLESALE,
            categoryId: mayorista.id, featured: false,
        },
        {
            name: 'Caja Acondicionador x12',
            slug: 'caja-acondicionador-x12',
            description: 'Caja de 12 unidades de Acondicionador Nutritivo. Para distribuidores.',
            price: 24000, stock: 8, saleType: sale_type_enum_1.SaleType.WHOLESALE,
            categoryId: mayorista.id, featured: false,
        },
        {
            name: 'Caja Máscara Capilar x12',
            slug: 'caja-mascara-capilar-x12',
            description: 'Caja de 12 Máscaras Capilares. Mayor margen para revendedores.',
            price: 36000, stock: 6, saleType: sale_type_enum_1.SaleType.WHOLESALE,
            categoryId: mayorista.id, featured: false,
        },
        {
            name: 'Combo Peluquería Inicial',
            slug: 'combo-peluqueria-inicial',
            description: 'Kit inicial: 3 Shampoo + 3 Acondicionador + 2 Máscaras + 1 Aceite. Todo para arrancar tu salón.',
            price: 22000, stock: 12, saleType: sale_type_enum_1.SaleType.SALON,
            categoryId: combos.id, featured: true,
        },
        {
            name: 'Combo Revendedor Mayorista',
            slug: 'combo-revendedor-mayorista',
            description: 'Caja Shampoo x12 + Caja Acondicionador x12 + 6 Máscaras + 6 Aceites. El mejor precio para empezar.',
            price: 68000, stock: 5, saleType: sale_type_enum_1.SaleType.WHOLESALE,
            categoryId: combos.id, featured: true,
        },
    ];
    for (const data of productsData) {
        const existing = await productRepo.findOne({ where: { slug: data.slug } });
        if (!existing) {
            await productRepo.save(productRepo.create({ ...data, isActive: true }));
            console.log(`  ✔ Product: ${data.name}`);
        }
    }
    console.log('✅ Seed completed.');
    await app.close();
}
seed().catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
});
//# sourceMappingURL=seed.js.map