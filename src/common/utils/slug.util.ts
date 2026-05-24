export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .slice(0, 100);
}

export function generateOrderNumber(sequence: number): string {
  return `CAP-${String(sequence).padStart(4, '0')}`;
}
