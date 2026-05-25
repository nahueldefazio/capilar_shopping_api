export interface RawProductRow {
  name: string;
  rawPrice: string;
  brand: string;
  notes?: string;
}

export interface NormalizedProductRow {
  name: string;
  slug: string;
  price: number;
  categoryName: string;
  saleType: 'retail' | 'salon' | 'wholesale';
  stock: number;
  isActive: boolean;
  featured: boolean;
  imageUrl: string;
}

export interface ProductRowError {
  row: RawProductRow;
  reason: string;
}

export interface ImportPreview {
  summary: {
    totalRows: number;
    valid: number;
    errors: number;
    manualReview: number;
    internalDuplicates: number;
    alreadyInDb: number;
    readyToImport: number;
  };
  readyToImport: NormalizedProductRow[];
  errors: ProductRowError[];
  manualReview: ProductRowError[];
  internalDuplicates: { slug: string; names: string[] }[];
  alreadyInDb: { slug: string; name: string }[];
}
