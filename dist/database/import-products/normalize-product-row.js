"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.slugify = slugify;
exports.normalizeProductRow = normalizeProductRow;
function slugify(text) {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 100);
}
function parseArgentinePrice(raw) {
    if (!raw || raw.trim() === '' || raw.includes('#'))
        return null;
    let cleaned = raw.trim().replace(/^\$\s*/, '');
    if (/^\d{1,3}(\.\d{3})+(,\d{1,2})?$/.test(cleaned)) {
        cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    }
    else if (/^\d+(,\d{1,2})$/.test(cleaned)) {
        cleaned = cleaned.replace(',', '.');
    }
    else {
        cleaned = cleaned.replace(/[^\d.]/g, '');
    }
    const parsed = parseFloat(cleaned);
    if (isNaN(parsed) || parsed <= 0)
        return null;
    return Math.round(parsed);
}
function normalizeProductRow(row, categoryName) {
    const name = row.name.trim();
    if (!name)
        return { error: 'Nombre vacío' };
    const price = parseArgentinePrice(row.rawPrice);
    if (price === null) {
        return { error: `Precio inválido o ilegible: "${row.rawPrice}"` };
    }
    const slug = slugify(name);
    if (!slug)
        return { error: 'No se pudo generar slug desde el nombre' };
    return {
        data: {
            name,
            slug,
            price,
            categoryName,
            saleType: 'salon',
            stock: 0,
            isActive: true,
            featured: false,
            imageUrl: row.imageUrl?.trim() ?? '',
        },
    };
}
//# sourceMappingURL=normalize-product-row.js.map