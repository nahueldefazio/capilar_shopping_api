import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../modules/categories/entities/category.entity';
import { Product } from '../modules/products/entities/product.entity';
import { SaleType } from '../common/enums/sale-type.enum';

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const categoryRepo = app.get<Repository<Category>>(getRepositoryToken(Category));
  const productRepo = app.get<Repository<Product>>(getRepositoryToken(Product));

  console.log('🌱 Seeding database...');

  // Categories
  const categoriesData = [
    { name: 'Cuidado Capilar', slug: 'cuidado-capilar' },
    { name: 'Tratamientos', slug: 'tratamientos' },
    { name: 'Peluquerías', slug: 'peluquerias' },
    { name: 'Mayorista', slug: 'mayorista' },
    { name: 'Combos', slug: 'combos' },
  ];

  const categories: Category[] = [];
  for (const data of categoriesData) {
    const existing = await categoryRepo.findOne({ where: { slug: data.slug } });
    if (!existing) {
      categories.push(await categoryRepo.save(categoryRepo.create(data)));
      console.log(`  ✔ Category: ${data.name}`);
    } else {
      categories.push(existing);
    }
  }

  const [cuidado, tratamientos, peluquerias, mayorista, combos] = categories;

  // Products
  const productsData = [
    // Retail
    {
      name: 'Shampoo Reparador 300ml',
      slug: 'shampoo-reparador-300ml',
      description: 'Shampoo con keratina y proteínas del trigo. Repara el cabello dañado desde la primera aplicación.',
      price: 2800, stock: 50, saleType: SaleType.RETAIL,
      categoryId: cuidado.id, featured: true,
    },
    {
      name: 'Acondicionador Nutritivo 300ml',
      slug: 'acondicionador-nutritivo-300ml',
      description: 'Con aceite de argán y manteca de karité. Nutre y facilita el peinado.',
      price: 2600, stock: 45, saleType: SaleType.RETAIL,
      categoryId: cuidado.id, featured: true,
    },
    {
      name: 'Máscara Capilar Hidratante',
      slug: 'mascara-capilar-hidratante',
      description: 'Tratamiento intensivo con ácido hialurónico vegetal. Restaura humedad y aporta suavidad.',
      price: 3500, stock: 30, saleType: SaleType.RETAIL,
      categoryId: tratamientos.id, featured: true,
    },
    {
      name: 'Aceite Capilar Reparador',
      slug: 'aceite-capilar-reparador',
      description: 'Mezcla de aceites de argán, jojoba y rosa mosqueta. Sella puntas y aporta brillo.',
      price: 3200, stock: 25, saleType: SaleType.RETAIL,
      categoryId: tratamientos.id, featured: false,
    },
    // Salon
    {
      name: 'Pack Profesional Shampoo x6',
      slug: 'pack-profesional-shampoo-x6',
      description: 'Pack de 6 unidades de Shampoo Reparador 300ml. Precio especial para peluquerías.',
      price: 14400, stock: 20, saleType: SaleType.SALON,
      categoryId: peluquerias.id, featured: true,
    },
    {
      name: 'Pack Tratamiento Salón x6',
      slug: 'pack-tratamiento-salon-x6',
      description: 'Pack de 6 Máscaras Capilares para uso profesional en salones.',
      price: 18000, stock: 15, saleType: SaleType.SALON,
      categoryId: peluquerias.id, featured: false,
    },
    {
      name: 'Pack Acondicionador Salón x6',
      slug: 'pack-acondicionador-salon-x6',
      description: 'Pack de 6 Acondicionadores Nutritivos. Precio exclusivo para peluquerías.',
      price: 13200, stock: 18, saleType: SaleType.SALON,
      categoryId: peluquerias.id, featured: false,
    },
    // Wholesale
    {
      name: 'Caja Shampoo x12',
      slug: 'caja-shampoo-x12',
      description: 'Caja de 12 unidades. Precio mayorista para revendedores.',
      price: 26400, stock: 10, saleType: SaleType.WHOLESALE,
      categoryId: mayorista.id, featured: false,
    },
    {
      name: 'Caja Acondicionador x12',
      slug: 'caja-acondicionador-x12',
      description: 'Caja de 12 unidades de Acondicionador Nutritivo. Para distribuidores.',
      price: 24000, stock: 8, saleType: SaleType.WHOLESALE,
      categoryId: mayorista.id, featured: false,
    },
    {
      name: 'Caja Máscara Capilar x12',
      slug: 'caja-mascara-capilar-x12',
      description: 'Caja de 12 Máscaras Capilares. Mayor margen para revendedores.',
      price: 36000, stock: 6, saleType: SaleType.WHOLESALE,
      categoryId: mayorista.id, featured: false,
    },
    // Combos
    {
      name: 'Combo Peluquería Inicial',
      slug: 'combo-peluqueria-inicial',
      description: 'Kit inicial: 3 Shampoo + 3 Acondicionador + 2 Máscaras + 1 Aceite. Todo para arrancar tu salón.',
      price: 22000, stock: 12, saleType: SaleType.SALON,
      categoryId: combos.id, featured: true,
    },
    {
      name: 'Combo Revendedor Mayorista',
      slug: 'combo-revendedor-mayorista',
      description: 'Caja Shampoo x12 + Caja Acondicionador x12 + 6 Máscaras + 6 Aceites. El mejor precio para empezar.',
      price: 68000, stock: 5, saleType: SaleType.WHOLESALE,
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
