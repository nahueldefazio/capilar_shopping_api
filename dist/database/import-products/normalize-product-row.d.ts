import type { RawProductRow, NormalizedProductRow } from './product-import.types';
export declare function slugify(text: string): string;
export declare function normalizeProductRow(row: RawProductRow, categoryName: string): {
    data: NormalizedProductRow;
} | {
    error: string;
};
