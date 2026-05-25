"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.slugify = slugify;
exports.generateOrderNumber = generateOrderNumber;
function slugify(text) {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .replace(/-+/g, '-')
        .slice(0, 100);
}
function generateOrderNumber(sequence) {
    return `CAP-${String(sequence).padStart(4, '0')}`;
}
//# sourceMappingURL=slug.util.js.map