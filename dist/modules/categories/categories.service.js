"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoriesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const category_entity_1 = require("./entities/category.entity");
const slug_util_1 = require("../../common/utils/slug.util");
const CATEGORY_ORDER = ['particulares', 'peluquerias', 'mayorista', 'plasma'];
let CategoriesService = class CategoriesService {
    categoryRepo;
    constructor(categoryRepo) {
        this.categoryRepo = categoryRepo;
    }
    async findAll() {
        const categories = await this.categoryRepo.find({ where: { isActive: true } });
        return categories.sort((a, b) => {
            const parentSort = Number(a.parentId ?? 0) - Number(b.parentId ?? 0);
            if (parentSort !== 0)
                return parentSort;
            const aIndex = CATEGORY_ORDER.indexOf(a.slug);
            const bIndex = CATEGORY_ORDER.indexOf(b.slug);
            if (aIndex !== -1 || bIndex !== -1) {
                return (aIndex === -1 ? Number.MAX_SAFE_INTEGER : aIndex) -
                    (bIndex === -1 ? Number.MAX_SAFE_INTEGER : bIndex);
            }
            return a.name.localeCompare(b.name, 'es');
        });
    }
    async findOne(id) {
        const category = await this.categoryRepo.findOne({ where: { id } });
        if (!category)
            throw new common_1.NotFoundException(`Category #${id} not found`);
        return category;
    }
    async create(dto) {
        const slug = dto.slug ?? (0, slug_util_1.slugify)(dto.name);
        const exists = await this.categoryRepo.findOne({ where: { slug } });
        if (exists)
            throw new common_1.ConflictException(`Slug "${slug}" already exists`);
        if (dto.parentId)
            await this.findOne(dto.parentId);
        const category = this.categoryRepo.create({ ...dto, slug });
        return this.categoryRepo.save(category);
    }
    async update(id, dto) {
        const category = await this.findOne(id);
        if (dto.name && !dto.slug)
            dto.slug = (0, slug_util_1.slugify)(dto.name);
        if (dto.parentId) {
            if (dto.parentId === id)
                throw new common_1.ConflictException('A category cannot be its own parent');
            await this.findOne(dto.parentId);
        }
        Object.assign(category, dto);
        return this.categoryRepo.save(category);
    }
    async remove(id) {
        const category = await this.findOne(id);
        await this.categoryRepo.remove(category);
    }
};
exports.CategoriesService = CategoriesService;
exports.CategoriesService = CategoriesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(category_entity_1.Category)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], CategoriesService);
//# sourceMappingURL=categories.service.js.map