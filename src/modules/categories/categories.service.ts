import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { slugify } from '../../common/utils/slug.util';

const CATEGORY_ORDER = ['particulares', 'peluquerias', 'mayorista', 'plasma'];

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
  ) {}

  async findAll(): Promise<Category[]> {
    const categories = await this.categoryRepo.find({ where: { isActive: true } });
    return categories.sort((a, b) => {
      const parentSort = Number(a.parentId ?? 0) - Number(b.parentId ?? 0);
      if (parentSort !== 0) return parentSort;

      const aIndex = CATEGORY_ORDER.indexOf(a.slug);
      const bIndex = CATEGORY_ORDER.indexOf(b.slug);
      if (aIndex !== -1 || bIndex !== -1) {
        return (aIndex === -1 ? Number.MAX_SAFE_INTEGER : aIndex) -
          (bIndex === -1 ? Number.MAX_SAFE_INTEGER : bIndex);
      }

      return a.name.localeCompare(b.name, 'es');
    });
  }

  async findOne(id: number): Promise<Category> {
    const category = await this.categoryRepo.findOne({ where: { id } });
    if (!category) throw new NotFoundException(`Category #${id} not found`);
    return category;
  }

  async create(dto: CreateCategoryDto): Promise<Category> {
    const slug = dto.slug ?? slugify(dto.name);
    const exists = await this.categoryRepo.findOne({ where: { slug } });
    if (exists) throw new ConflictException(`Slug "${slug}" already exists`);
    if (dto.parentId) await this.findOne(dto.parentId);
    const category = this.categoryRepo.create({ ...dto, slug });
    return this.categoryRepo.save(category);
  }

  async update(id: number, dto: UpdateCategoryDto): Promise<Category> {
    const category = await this.findOne(id);
    if (dto.name && !dto.slug) dto.slug = slugify(dto.name);
    if (dto.parentId) {
      if (dto.parentId === id) throw new ConflictException('A category cannot be its own parent');
      await this.findOne(dto.parentId);
    }
    Object.assign(category, dto);
    return this.categoryRepo.save(category);
  }

  async remove(id: number): Promise<void> {
    const category = await this.findOne(id);
    await this.categoryRepo.remove(category);
  }
}
